// Controlador de usuarios.
// Expone lectura de perfil, actualización segura y listado ordenado de residentes.
const admin = require("../../config/firebaseAdmin");
const { buildUserProfile } = require("../../utils/userProfile");
const { normalizeText } = require("../../utils/text");
const { readVigilanciaConfig } = require("../../utils/vigilanciaConfig");

// Helpers de orden y transformación.
const RESIDENT_LOCATION_COLLECTION = "residentLocations";
const usersCollection = () => admin.firestore().collection("users");
const residentLocationsCollection = () =>
  admin.firestore().collection(RESIDENT_LOCATION_COLLECTION);

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

const normalizeLocationValue = (value) => {
  const normalizedValue = normalizeText(value).toUpperCase().replace(/\s+/g, "");

  if (!normalizedValue) {
    return "";
  }

  return /^\d+$/.test(normalizedValue)
    ? String(Number.parseInt(normalizedValue, 10))
    : normalizedValue;
};

const getResidentLocationKey = (torre, apartamento) => `${torre}__${apartamento}`;

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText(value));

const isNumericDocument = (value) => /^\d+$/.test(normalizeText(value));

const deleteCollectionDocsByField = async (collectionName, fieldName, fieldValue) => {
  const normalizedValue = normalizeText(fieldValue);

  if (!normalizedValue) {
    return;
  }

  const snapshot = await admin
    .firestore()
    .collection(collectionName)
    .where(fieldName, "==", normalizedValue)
    .get();

  if (snapshot.empty) {
    return;
  }

  const batch = admin.firestore().batch();
  snapshot.docs.forEach((docSnapshot) => batch.delete(docSnapshot.ref));
  await batch.commit();
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

const buildResidentAdminUpdatePayload = ({
  currentProfile,
  nombres,
  apellidos,
  nombreCompleto,
  cedula,
  email,
  torre,
  apartamento,
}) => ({
  nombre: nombreCompleto,
  nombres,
  apellidos,
  cedula,
  correo: email,
  email,
  rol: currentProfile.rol,
  torre,
  apartamento,
  residentLocationKey: getResidentLocationKey(torre, apartamento),
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
    let tarifaHora = currentProfile.tarifaHora;
    const cantidadParqueaderos = resolveEditableNumberField(
      currentProfile.cantidadParqueaderos,
      req.body?.cantidadParqueaderos
    );

    if (currentProfile.rol === "Vigilante") {
      const vigilanciaConfig = await readVigilanciaConfig();
      tarifaHora =
        Number(vigilanciaConfig?.tarifaHoraVigilante) ||
        Number(currentProfile.tarifaHora) ||
        0;
    }

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

const actualizarResidenteDesdeAdmin = async (req, res) => {
  const { uid } = req.params;

  try {
    const residentDoc = await usersCollection().doc(uid).get();

    if (!residentDoc.exists) {
      return res.status(404).json({ mensaje: "No se encontró el residente solicitado." });
    }

    const currentProfile = buildUserProfile(residentDoc.id, residentDoc.data());

    if (currentProfile.rol !== "Residente") {
      return res.status(400).json({ mensaje: "Solo puedes editar usuarios con rol Residente." });
    }

    const nombres = normalizeText(req.body?.nombres);
    const apellidos = normalizeText(req.body?.apellidos);
    const cedula = normalizeText(req.body?.cedula);
    const email = normalizeText(req.body?.email).toLowerCase();
    const torre = normalizeLocationValue(req.body?.torre);
    const apartamento = normalizeLocationValue(req.body?.apartamento);
    const nombreCompleto = [nombres, apellidos].filter(Boolean).join(" ").trim();

    if (!nombres || !apellidos || !cedula || !email || !torre || !apartamento) {
      return res.status(400).json({
        mensaje: "Debes completar nombres, apellidos, cédula, correo, torre y apartamento.",
      });
    }

    if (!isNumericDocument(cedula)) {
      return res.status(400).json({ mensaje: "La cédula solo puede contener números." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ mensaje: "Ingresa un correo electrónico válido." });
    }

    const residentsSnapshot = await usersCollection().where("rol", "==", "Residente").get();
    const residentExistsInLocation = residentsSnapshot.docs.some((docSnapshot) => {
      if (docSnapshot.id === uid) {
        return false;
      }

      const data = docSnapshot.data() || {};

      return (
        normalizeLocationValue(data.torre) === torre &&
        normalizeLocationValue(data.apartamento) === apartamento
      );
    });

    if (residentExistsInLocation) {
      return res.status(400).json({
        mensaje: `Ya existe un residente registrado en la torre ${torre} apartamento ${apartamento}.`,
      });
    }

    const previousLocationKey =
      currentProfile.torre && currentProfile.apartamento
        ? getResidentLocationKey(currentProfile.torre, currentProfile.apartamento)
        : "";
    const nextLocationKey = getResidentLocationKey(torre, apartamento);
    const locationBatch = admin.firestore().batch();

    if (previousLocationKey && previousLocationKey !== nextLocationKey) {
      locationBatch.delete(residentLocationsCollection().doc(previousLocationKey));
    }

    locationBatch.set(
      residentLocationsCollection().doc(nextLocationKey),
      {
        torre,
        apartamento,
        email,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await Promise.all([
      usersCollection()
        .doc(uid)
        .set(
          buildResidentAdminUpdatePayload({
            currentProfile,
            nombres,
            apellidos,
            nombreCompleto,
            cedula,
            email,
            torre,
            apartamento,
          }),
          { merge: true }
        ),
      admin.auth().updateUser(uid, {
        displayName: nombreCompleto,
        email,
      }),
      locationBatch.commit(),
    ]);

    const nextProfile = await getProfileSnapshot(uid);

    return res.status(200).json({
      mensaje: "Residente actualizado correctamente.",
      residente: nextProfile,
    });
  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({ mensaje: "Ese correo ya está registrado." });
    }

    if (error.code === "auth/invalid-email") {
      return res.status(400).json({ mensaje: "El correo no tiene un formato válido." });
    }

    return res.status(500).json({ mensaje: error.message });
  }
};

const eliminarResidenteDesdeAdmin = async (req, res) => {
  const { uid } = req.params;

  try {
    const residentDoc = await usersCollection().doc(uid).get();

    if (!residentDoc.exists) {
      return res.status(404).json({ mensaje: "No se encontró el residente solicitado." });
    }

    const currentProfile = buildUserProfile(residentDoc.id, residentDoc.data());

    if (currentProfile.rol !== "Residente") {
      return res.status(400).json({ mensaje: "Solo puedes eliminar usuarios con rol Residente." });
    }

    try {
      await admin.auth().deleteUser(uid);
    } catch (error) {
      if (error.code !== "auth/user-not-found") {
        throw error;
      }
    }

    const cleanupTasks = [
      usersCollection().doc(uid).delete(),
      deleteCollectionDocsByField("reservasZonasComunes", "userId", uid),
      deleteCollectionDocsByField("notificacionesResidente", "residentId", uid),
    ];

    if (currentProfile.torre && currentProfile.apartamento) {
      cleanupTasks.push(
        residentLocationsCollection()
          .doc(getResidentLocationKey(currentProfile.torre, currentProfile.apartamento))
          .delete()
      );
    }

    await Promise.all(cleanupTasks);

    return res.status(200).json({ mensaje: "Residente eliminado correctamente." });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  actualizarPerfilUsuario,
  actualizarResidenteDesdeAdmin,
  eliminarResidenteDesdeAdmin,
  listarResidentes,
  obtenerPerfilUsuario,
};
