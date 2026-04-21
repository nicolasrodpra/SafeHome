const admin = require("../../config/firebaseAdmin");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates");
const { normalizeText } = require("../../utils/text");

const ALERTAS_COLLECTION = "alertasPanico";
const USERS_COLLECTION = "users";

const alertasCollection = () => admin.firestore().collection(ALERTAS_COLLECTION);
const usersCollection = () => admin.firestore().collection(USERS_COLLECTION);

const sortByCreatedAtDesc = (firstItem, secondItem) => {
  const firstDate = firstItem.createdAt?.getTime?.() || 0;
  const secondDate = secondItem.createdAt?.getTime?.() || 0;
  return secondDate - firstDate;
};

const mapAlertaPanico = (snapshotDoc) => {
  const data = snapshotDoc.data();
  const createdAt = toDate(data.createdAt);
  const resolvedAt = toDate(data.resolvedAt);
  const userSnapshot = typeof data.userSnapshot === "object" && data.userSnapshot ? data.userSnapshot : {};

  return {
    id: snapshotDoc.id,
    residentId: normalizeText(data.residentId),
    residentName: normalizeText(data.residentName) || "Residente",
    residentEmail: normalizeText(data.residentEmail),
    torre: normalizeText(data.torre),
    apartamento: normalizeText(data.apartamento),
    cedula: normalizeText(data.cedula),
    telefono: normalizeText(data.telefono),
    celular: normalizeText(data.celular),
    bloque: normalizeText(data.bloque),
    piso: normalizeText(data.piso),
    rol: normalizeText(data.rol),
    status: normalizeText(data.status) || "Activa",
    source: normalizeText(data.source) || "mobile",
    createdAtIso: createdAt?.toISOString?.() || null,
    createdDateLabel: formatDateLabel(createdAt) || "Sin fecha",
    createdTimeLabel: formatTimeLabel(createdAt) || "Sin hora",
    resolvedAtIso: resolvedAt?.toISOString?.() || null,
    resolvedDateLabel: formatDateLabel(resolvedAt) || "",
    resolvedTimeLabel: formatTimeLabel(resolvedAt) || "",
    resolvedById: normalizeText(data.resolvedById),
    resolvedByName: normalizeText(data.resolvedByName),
    userSnapshot,
    createdAt,
  };
};

const safeSnapshot = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const keys = [
    "uid",
    "nombre",
    "email",
    "telefono",
    "celular",
    "torre",
    "apartamento",
    "cedula",
    "bloque",
    "piso",
    "rol",
  ];

  return keys.reduce((acc, key) => {
    const cleaned = normalizeText(value[key]);
    if (cleaned) {
      acc[key] = cleaned;
    }
    return acc;
  }, {});
};

const getResidentSnapshot = async (residentId) => {
  if (!residentId) {
    return {};
  }

  try {
    const snapshot = await usersCollection().doc(residentId).get();
    if (!snapshot.exists) {
      return {};
    }

    return safeSnapshot({ uid: residentId, ...snapshot.data() });
  } catch (error) {
    return {};
  }
};

const crearAlertaPanico = async (req, res) => {
  const residentId = normalizeText(req.body?.residentId || req.body?.uid || req.body?.userId);
  const bodySnapshot = safeSnapshot(req.body?.userSnapshot);
  const dbSnapshot = await getResidentSnapshot(residentId);
  const residentSnapshot = {
    ...dbSnapshot,
    ...bodySnapshot,
    uid: residentId || dbSnapshot.uid || bodySnapshot.uid || "",
  };

  const payload = {
    residentId,
    residentName:
      normalizeText(req.body?.residentName) || residentSnapshot.nombre || "Residente",
    residentEmail:
      normalizeText(req.body?.residentEmail) || residentSnapshot.email || "",
    torre: normalizeText(req.body?.torre) || residentSnapshot.torre || "",
    apartamento: normalizeText(req.body?.apartamento) || residentSnapshot.apartamento || "",
    cedula: normalizeText(req.body?.cedula) || residentSnapshot.cedula || "",
    telefono: normalizeText(req.body?.telefono) || residentSnapshot.telefono || "",
    celular: normalizeText(req.body?.celular) || residentSnapshot.celular || "",
    bloque: normalizeText(req.body?.bloque) || residentSnapshot.bloque || "",
    piso: normalizeText(req.body?.piso) || residentSnapshot.piso || "",
    rol: normalizeText(req.body?.rol) || residentSnapshot.rol || "Residente",
    source: normalizeText(req.body?.source) || "mobile",
  };

  if (!payload.residentId || !payload.residentName) {
    return res.status(400).json({
      mensaje: "No se pudo identificar al residente para activar la alerta de panico.",
    });
  }

  try {
    const ref = await alertasCollection().add({
      ...payload,
      userSnapshot: residentSnapshot,
      status: "Activa",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      resolvedAt: null,
      resolvedById: "",
      resolvedByName: "",
    });

    return res.status(201).json({
      mensaje: "Alerta de panico activada. El equipo de vigilancia fue notificado.",
      alerta: {
        id: ref.id,
        ...payload,
        userSnapshot: residentSnapshot,
        status: "Activa",
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const listarAlertasPanico = async (req, res) => {
  try {
    const snapshot = await alertasCollection().get();
    const alertas = snapshot.docs.map(mapAlertaPanico).sort(sortByCreatedAtDesc);
    return res.status(200).json(alertas.map(({ createdAt, ...alerta }) => alerta));
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const resolverAlertaPanico = async (req, res) => {
  const { id } = req.params;
  const resolvedById = normalizeText(req.body?.resolvedById);
  const resolvedByName = normalizeText(req.body?.resolvedByName) || "Vigilante";

  try {
    const alertaRef = alertasCollection().doc(id);
    const snapshot = await alertaRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({ mensaje: "No se encontro la alerta de panico." });
    }

    const currentData = snapshot.data();

    if (normalizeText(currentData?.status) === "Atendida") {
      return res.status(200).json({ mensaje: "La alerta ya estaba marcada como atendida." });
    }

    await alertaRef.update({
      status: "Atendida",
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
      resolvedById,
      resolvedByName,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ mensaje: "Alerta de panico marcada como atendida." });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  crearAlertaPanico,
  listarAlertasPanico,
  resolverAlertaPanico,
};
