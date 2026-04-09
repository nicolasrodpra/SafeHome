// Controlador de usuarios.
// Permite consultar perfil, actualizarlo y listar residentes para otros módulos.
const admin = require("../../config/firebaseAdmin");
const { buildUserProfile } = require("../../utils/userProfile");
const { normalizeText } = require("../../utils/text");

const usersCollection = () => admin.firestore().collection("users");

const compareByText = (firstValue = "", secondValue = "") =>
  firstValue.localeCompare(secondValue, "es", {
    numeric: true,
    sensitivity: "base",
  });

const parsePositiveNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const normalizedValue = normalizeText(value).replace(",", ".");
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : NaN;
};

const hasProvidedNumberValue = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return normalizeText(value) !== "";
};

const getSortableNumber = (value) => {
  const normalizedValue = normalizeText(value);
  const match = normalizedValue.match(/\d+/);

  return match ? Number.parseInt(match[0], 10) : Number.POSITIVE_INFINITY;
};

const compareSortableNumbers = (firstValue, secondValue) => {
  if (firstValue === secondValue) {
    return 0;
  }

  if (!Number.isFinite(firstValue)) {
    return 1;
  }

  if (!Number.isFinite(secondValue)) {
    return -1;
  }

  return firstValue - secondValue;
};

const compareResidentsByLocation = (firstResident, secondResident) => {
  const towerDiff = compareSortableNumbers(
    getSortableNumber(firstResident.torre),
    getSortableNumber(secondResident.torre)
  );

  if (towerDiff !== 0) {
    return towerDiff;
  }

  const apartmentDiff = compareSortableNumbers(
    getSortableNumber(firstResident.apartamento),
    getSortableNumber(secondResident.apartamento)
  );

  if (apartmentDiff !== 0) {
    return apartmentDiff;
  }

  const towerTextDiff = compareByText(firstResident.torre, secondResident.torre);

  if (towerTextDiff !== 0) {
    return towerTextDiff;
  }

  const apartmentTextDiff = compareByText(
    firstResident.apartamento,
    secondResident.apartamento
  );

  if (apartmentTextDiff !== 0) {
    return apartmentTextDiff;
  }

  const nameDiff = compareByText(firstResident.nombre, secondResident.nombre);

  if (nameDiff !== 0) {
    return nameDiff;
  }

  return compareByText(firstResident.uid, secondResident.uid);
};

// Esta función lee el documento del usuario y lo transforma
// al formato estable que usa todo el frontend.
const getProfileSnapshot = async (uid) => {
  const snapshot = await usersCollection().doc(uid).get();

  if (!snapshot.exists) {
    return null;
  }

  return buildUserProfile(snapshot.id, snapshot.data());
};

// Devuelve el perfil listo para pintar la vista de "Mi perfil".
const obtenerPerfilUsuario = async (req, res) => {
  const { uid } = req.params;

  try {
    const profile = await getProfileSnapshot(uid);

    if (!profile) {
      return res.status(404).json({ mensaje: "No se encontró la información del usuario." });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

// Esta función actualiza solo los campos editables del perfil,
// conserva el rol original y vuelve a consultar el documento guardado.
const actualizarPerfilUsuario = async (req, res) => {
  const { uid } = req.params;

  try {
    const currentProfile = await getProfileSnapshot(uid);

    if (!currentProfile) {
      return res.status(404).json({ mensaje: "No se encontró la información del usuario." });
    }

    const nombres = normalizeText(req.body?.nombres);
    const apellidos = normalizeText(req.body?.apellidos);
    const nombreCompleto =
      [nombres, apellidos].filter(Boolean).join(" ").trim() || currentProfile.nombre;
    const tarifaHoraValue = req.body?.tarifaHora;
    const cantidadParqueaderosValue = req.body?.cantidadParqueaderos;
    const tarifaHora =
      currentProfile.rol === "Vigilante"
        ? tarifaHoraValue === undefined || !hasProvidedNumberValue(tarifaHoraValue)
          ? currentProfile.tarifaHora
          : parsePositiveNumber(tarifaHoraValue)
        : currentProfile.tarifaHora;
    const cantidadParqueaderos =
      currentProfile.rol === "Vigilante"
        ? cantidadParqueaderosValue === undefined ||
          !hasProvidedNumberValue(cantidadParqueaderosValue)
          ? currentProfile.cantidadParqueaderos
          : parsePositiveNumber(cantidadParqueaderosValue)
        : currentProfile.cantidadParqueaderos;

    if (currentProfile.rol === "Vigilante" && (!Number.isFinite(tarifaHora) || tarifaHora <= 0)) {
      return res.status(400).json({
        mensaje: "La tarifa por hora del vigilante debe ser mayor a 0.",
      });
    }

    if (
      currentProfile.rol === "Vigilante" &&
      (!Number.isFinite(cantidadParqueaderos) || cantidadParqueaderos <= 0)
    ) {
      return res.status(400).json({
        mensaje: "La cantidad de parqueaderos del vigilante debe ser mayor a 0.",
      });
    }

    const payload = {
      nombre: nombreCompleto,
      nombres,
      apellidos,
      cedula: normalizeText(req.body?.cedula),
      rol: currentProfile.rol,
      torre: normalizeText(req.body?.torre),
      apartamento: normalizeText(req.body?.apartamento),
      zonaVigilancia: normalizeText(req.body?.zonaVigilancia),
      tipoSangre: normalizeText(req.body?.tipoSangre),
      tarifaHora: currentProfile.rol === "Vigilante" ? tarifaHora : 0,
      cantidadParqueaderos: currentProfile.rol === "Vigilante" ? cantidadParqueaderos : 0,
      correo: currentProfile.email,
      email: currentProfile.email,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await usersCollection().doc(uid).set(payload, { merge: true });
    await admin.auth().updateUser(uid, { displayName: nombreCompleto });

    const nextProfile = await getProfileSnapshot(uid);

    return res.status(200).json({
      mensaje: "Perfil actualizado correctamente.",
      profile: nextProfile,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

// Aquí listamos solo a los residentes para reutilizar la misma consulta
// en módulos como reservas o mensajería administrativa.
const listarResidentes = async (req, res) => {
  try {
    const snapshot = await usersCollection().where("rol", "==", "Residente").get();
    const residentes = snapshot.docs
      .map((docSnapshot) => buildUserProfile(docSnapshot.id, docSnapshot.data()))
      .sort(compareResidentsByLocation);

    return res.status(200).json(residentes);
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  actualizarPerfilUsuario,
  listarResidentes,
  obtenerPerfilUsuario,
};
