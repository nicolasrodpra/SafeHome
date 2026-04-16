// Controlador de usuarios.
// Expone lectura de perfil, actualización segura y listado ordenado de residentes.
const admin = require("../../config/firebaseAdmin");
const { buildUserProfile } = require("../../utils/userProfile");
const { normalizeText } = require("../../utils/text");

// Helpers de orden y transformación.
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

const resolveEditableNumberField = (currentValue, rawValue) => {
  if (rawValue === undefined || !hasProvidedNumberValue(rawValue)) {
    return currentValue;
  }

  return parsePositiveNumber(rawValue);
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

const getProfileSnapshot = async (uid) => {
  const snapshot = await usersCollection().doc(uid).get();

  if (!snapshot.exists) {
    return null;
  }

  return buildUserProfile(snapshot.id, snapshot.data());
};

const buildProfileUpdatePayload = ({
  currentProfile,
  nombres,
  apellidos,
  nombreCompleto,
  zonaVigilancia,
  tipoSangre,
  tarifaHora,
  cantidadParqueaderos,
}) => ({
  nombre: nombreCompleto,
  nombres,
  apellidos,
  cedula: currentProfile.cedula,
  rol: currentProfile.rol,
  torre: currentProfile.torre,
  apartamento: currentProfile.apartamento,
  zonaVigilancia: currentProfile.rol === "Vigilante" ? zonaVigilancia : currentProfile.zonaVigilancia,
  tipoSangre: currentProfile.rol === "Vigilante" ? tipoSangre : currentProfile.tipoSangre,
  tarifaHora: currentProfile.rol === "Vigilante" ? tarifaHora : currentProfile.tarifaHora,
  cantidadParqueaderos:
    currentProfile.rol === "Vigilante"
      ? cantidadParqueaderos
      : currentProfile.cantidadParqueaderos,
  correo: currentProfile.email,
  email: currentProfile.email,
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

// Endpoints de perfil.
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
    const zonaVigilancia = normalizeText(req.body?.zonaVigilancia);
    const tipoSangre = normalizeText(req.body?.tipoSangre);
    const tarifaHora = resolveEditableNumberField(currentProfile.tarifaHora, req.body?.tarifaHora);
    const cantidadParqueaderos = resolveEditableNumberField(
      currentProfile.cantidadParqueaderos,
      req.body?.cantidadParqueaderos
    );

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

    await usersCollection()
      .doc(uid)
      .set(
        buildProfileUpdatePayload({
          currentProfile,
          nombres,
          apellidos,
          nombreCompleto,
          zonaVigilancia,
          tipoSangre,
          tarifaHora,
          cantidadParqueaderos,
        }),
        { merge: true }
      );

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

// Listado reutilizable de residentes para otros módulos.
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
