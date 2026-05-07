const admin = require("../../config/firebaseAdmin");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates");
const { normalizeText } = require("../../utils/text");

const EMERGENCIAS_COLLECTION = "emergenciasPanico";
const ESTADO_ACTIVA = "Activa";
const ESTADO_ATENDIDA = "Atendida";

const emergenciasCollection = () => admin.firestore().collection(EMERGENCIAS_COLLECTION);

const sortByCreatedAtDesc = (firstItem, secondItem) => {
  const firstDate = firstItem.createdAt?.getTime?.() || 0;
  const secondDate = secondItem.createdAt?.getTime?.() || 0;

  return secondDate - firstDate;
};

const mapEmergencia = (snapshotDoc) => {
  const data = snapshotDoc.data();
  const createdAt = toDate(data.createdAt);
  const attendedAt = toDate(data.attendedAt);

  return {
    id: snapshotDoc.id,
    residentId: normalizeText(data.residentId),
    residentName: normalizeText(data.residentName) || "Residente",
    residentEmail: normalizeText(data.residentEmail),
    torre: normalizeText(data.torre),
    apartamento: normalizeText(data.apartamento),
    status: normalizeText(data.status) || ESTADO_ACTIVA,
    createdAt,
    createdAtIso: createdAt?.toISOString?.() || null,
    createdDateLabel: formatDateLabel(createdAt) || "Sin fecha",
    createdTimeLabel: formatTimeLabel(createdAt) || "Sin hora",
    attendedById: normalizeText(data.attendedById),
    attendedByName: normalizeText(data.attendedByName),
    attendedAtIso: attendedAt?.toISOString?.() || null,
    attendedDateLabel: formatDateLabel(attendedAt) || "",
    attendedTimeLabel: formatTimeLabel(attendedAt) || "",
  };
};

const listarEmergenciasActivas = async (req, res) => {
  try {
    const snapshot = await emergenciasCollection().where("status", "==", ESTADO_ACTIVA).get();
    const emergencias = snapshot.docs
      .map(mapEmergencia)
      .sort(sortByCreatedAtDesc)
      .map(({ createdAt, ...emergencia }) => emergencia);

    return res.status(200).json(emergencias);
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const crearEmergencia = async (req, res) => {
  const payload = {
    residentId: normalizeText(req.body?.residentId),
    residentName: normalizeText(req.body?.residentName),
    residentEmail: normalizeText(req.body?.residentEmail),
    torre: normalizeText(req.body?.torre),
    apartamento: normalizeText(req.body?.apartamento),
  };

  if (!payload.residentId || !payload.residentName || !payload.torre || !payload.apartamento) {
    return res.status(400).json({
      mensaje: "Debes tener torre y apartamento registrados para activar la alerta de panico.",
    });
  }

  try {
    const ref = await emergenciasCollection().add({
      ...payload,
      status: ESTADO_ACTIVA,
      attendedById: "",
      attendedByName: "",
      attendedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      mensaje: "Alerta de panico enviada correctamente.",
      emergencia: {
        id: ref.id,
        ...payload,
        status: ESTADO_ACTIVA,
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const atenderEmergencia = async (req, res) => {
  const { id } = req.params;
  const attendedById = normalizeText(req.body?.attendedById);
  const attendedByName = normalizeText(req.body?.attendedByName) || "Vigilancia";

  try {
    await emergenciasCollection().doc(id).update({
      status: ESTADO_ATENDIDA,
      attendedById,
      attendedByName,
      attendedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      mensaje: "Emergencia marcada como atendida.",
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  atenderEmergencia,
  crearEmergencia,
  listarEmergenciasActivas,
};
