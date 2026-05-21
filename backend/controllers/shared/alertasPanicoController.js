const admin = require("../../config/firebaseAdmin");
const fs = require("fs");
const path = require("path");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates");
const { normalizeText } = require("../../utils/text");

const ALERTAS_COLLECTION = "alertasPanico";
const EMERGENCIAS_COLLECTION = "emergenciasPanico";
const USERS_COLLECTION = "users";
const ESTADO_ACTIVA = "Activa";
const ESTADO_EN_CAMINO = "En camino";
const ESTADO_ATENDIDA = "Atendida";
const ESTADO_NO_ATENDIDA = "No atendida";
const PANIC_AUDIO_DIR = path.join(__dirname, "../../uploads/panic-audios");

const alertasCollection = () => admin.firestore().collection(ALERTAS_COLLECTION);
const emergenciasCollection = () => admin.firestore().collection(EMERGENCIAS_COLLECTION);
const usersCollection = () => admin.firestore().collection(USERS_COLLECTION);

const ensurePanicAudioDir = () => {
  if (!fs.existsSync(PANIC_AUDIO_DIR)) {
    fs.mkdirSync(PANIC_AUDIO_DIR, { recursive: true });
  }
};

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
    status: normalizeText(data.status) || ESTADO_ACTIVA,
    source: normalizeText(data.source) || "mobile",
    createdAtIso: createdAt?.toISOString?.() || null,
    createdDateLabel: formatDateLabel(createdAt) || "Sin fecha",
    createdTimeLabel: formatTimeLabel(createdAt) || "Sin hora",
    resolvedAtIso: resolvedAt?.toISOString?.() || null,
    resolvedDateLabel: formatDateLabel(resolvedAt) || "",
    resolvedTimeLabel: formatTimeLabel(resolvedAt) || "",
    resolvedById: normalizeText(data.resolvedById),
    resolvedByName: normalizeText(data.resolvedByName),
    responderId: normalizeText(data.responderId),
    responderName: normalizeText(data.responderName),
    residentAudio:
      typeof data.residentAudio === "object" && data.residentAudio ? data.residentAudio : null,
    residentClosedBy: normalizeText(data.residentClosedBy),
    residentCloseNote: normalizeText(data.residentCloseNote),
    userSnapshot,
    createdAt,
  };
};

const mapEmergenciaAsAlertaPanico = (snapshotDoc) => {
  const data = snapshotDoc.data();
  const createdAt = toDate(data.createdAt);
  const enCaminoAt = toDate(data.enCaminoAt);
  const attendedAt = toDate(data.attendedAt);

  return {
    id: snapshotDoc.id,
    residentId: normalizeText(data.residentId),
    residentName: normalizeText(data.residentName) || "Residente",
    residentEmail: normalizeText(data.residentEmail),
    torre: normalizeText(data.torre),
    apartamento: normalizeText(data.apartamento),
    cedula: "",
    telefono: "",
    celular: "",
    bloque: "",
    piso: "",
    rol: "Residente",
    status: normalizeText(data.status) || ESTADO_ACTIVA,
    source: "emergencias",
    createdAtIso: createdAt?.toISOString?.() || null,
    createdDateLabel: formatDateLabel(createdAt) || "Sin fecha",
    createdTimeLabel: formatTimeLabel(createdAt) || "Sin hora",
    enCaminoAtIso: enCaminoAt?.toISOString?.() || null,
    enCaminoDateLabel: formatDateLabel(enCaminoAt) || "",
    enCaminoTimeLabel: formatTimeLabel(enCaminoAt) || "",
    responderId: normalizeText(data.responderId),
    responderName: normalizeText(data.responderName),
    resolvedAtIso: attendedAt?.toISOString?.() || null,
    resolvedDateLabel: formatDateLabel(attendedAt) || "",
    resolvedTimeLabel: formatTimeLabel(attendedAt) || "",
    resolvedById: normalizeText(data.attendedById),
    resolvedByName: normalizeText(data.attendedByName),
    responderId: normalizeText(data.responderId),
    responderName: normalizeText(data.responderName),
    residentAudio:
      typeof data.residentAudio === "object" && data.residentAudio ? data.residentAudio : null,
    residentClosedBy: normalizeText(data.residentClosedBy),
    residentCloseNote: normalizeText(data.residentCloseNote),
    userSnapshot: {},
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
      status: ESTADO_ACTIVA,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      resolvedAt: null,
      resolvedById: "",
      resolvedByName: "",
    });

    await emergenciasCollection().doc(ref.id).set({
      residentId: payload.residentId,
      residentName: payload.residentName,
      residentEmail: payload.residentEmail,
      torre: payload.torre,
      apartamento: payload.apartamento,
      status: ESTADO_ACTIVA,
      attendedById: "",
      attendedByName: "",
      attendedAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      mensaje: "Alerta de panico activada. El equipo de vigilancia fue notificado.",
      alerta: {
        id: ref.id,
        ...payload,
        userSnapshot: residentSnapshot,
        status: ESTADO_ACTIVA,
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const listarAlertasPanico = async (req, res) => {
  try {
    const [alertasSnapshot, emergenciasActivasSnapshot, emergenciasEnCaminoSnapshot] =
      await Promise.all([
        alertasCollection().get(),
        emergenciasCollection().where("status", "==", ESTADO_ACTIVA).get(),
        emergenciasCollection().where("status", "==", ESTADO_EN_CAMINO).get(),
      ]);

    const alertasById = new Map();

    alertasSnapshot.docs.forEach((doc) => {
      const alerta = mapAlertaPanico(doc);
      alertasById.set(alerta.id, alerta);
    });

    [...emergenciasActivasSnapshot.docs, ...emergenciasEnCaminoSnapshot.docs].forEach((doc) => {
      const emergencia = mapEmergenciaAsAlertaPanico(doc);
      const existing = alertasById.get(emergencia.id);

      if (!existing || existing.status === ESTADO_ATENDIDA) {
        alertasById.set(emergencia.id, {
          ...existing,
          ...emergencia,
          userSnapshot: existing?.userSnapshot || emergencia.userSnapshot,
        });
      }
    });

    const alertas = Array.from(alertasById.values()).sort(sortByCreatedAtDesc);
    return res.status(200).json(alertas.map(({ createdAt, ...alerta }) => alerta));
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const obtenerAlertaPanicoActivaResidente = async (req, res) => {
  const residentId = normalizeText(req.params.residentId);

  if (!residentId) {
    return res.status(400).json({ mensaje: "No se pudo identificar al residente." });
  }

  try {
    const [alertasSnapshot, emergenciasSnapshot] = await Promise.all([
      alertasCollection().where("residentId", "==", residentId).get(),
      emergenciasCollection().where("residentId", "==", residentId).get(),
    ]);

    const candidates = [
      ...alertasSnapshot.docs.map(mapAlertaPanico),
      ...emergenciasSnapshot.docs.map(mapEmergenciaAsAlertaPanico),
    ]
      .filter((item) => [ESTADO_ACTIVA, ESTADO_EN_CAMINO].includes(item.status))
      .sort(sortByCreatedAtDesc);

    const alerta = candidates[0] || null;

    if (!alerta) {
      return res.status(200).json({ alerta: null });
    }

    const { createdAt, ...payload } = alerta;
    return res.status(200).json({ alerta: payload });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const marcarAlertaPanicoEnCamino = async (req, res) => {
  const { id } = req.params;
  const responderId = normalizeText(req.body?.responderId);
  const responderName = normalizeText(req.body?.responderName) || "Vigilancia";

  try {
    const alertaRef = alertasCollection().doc(id);
    const snapshot = await alertaRef.get();

    if (!snapshot.exists) {
      const emergenciaSnapshot = await emergenciasCollection().doc(id).get();

      if (!emergenciaSnapshot.exists) {
        return res.status(404).json({ mensaje: "No se encontro la alerta de panico." });
      }

      const emergencia = mapEmergenciaAsAlertaPanico(emergenciaSnapshot);

      await alertaRef.set({
        residentId: emergencia.residentId,
        residentName: emergencia.residentName,
        residentEmail: emergencia.residentEmail,
        torre: emergencia.torre,
        apartamento: emergencia.apartamento,
        status: ESTADO_ACTIVA,
        source: "emergencias",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        resolvedAt: null,
        resolvedById: "",
        resolvedByName: "",
      });
    } else if (normalizeText(snapshot.data()?.status) === ESTADO_ATENDIDA) {
      return res.status(400).json({ mensaje: "Esta alerta ya fue atendida." });
    }

    await alertaRef.update({
      status: ESTADO_EN_CAMINO,
      responderId,
      responderName,
      enCaminoAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await emergenciasCollection().doc(id).set(
      {
        status: ESTADO_EN_CAMINO,
        responderId,
        responderName,
        enCaminoAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({ mensaje: "Alerta marcada como en camino." });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const guardarAudioAlertaPanico = async (req, res) => {
  const { id } = req.params;
  const audioBase64 = normalizeText(req.body?.audioBase64);
  const mimeType = normalizeText(req.body?.mimeType) || "audio/m4a";
  const durationMillis = Number(req.body?.durationMillis) || 0;

  if (!audioBase64) {
    return res.status(400).json({ mensaje: "Debes enviar un audio para adjuntarlo." });
  }

  try {
    ensurePanicAudioDir();

    const extension = mimeType.includes("webm") ? "webm" : mimeType.includes("wav") ? "wav" : "m4a";
    const filename = `${id}-${Date.now()}.${extension}`;
    const filePath = path.join(PANIC_AUDIO_DIR, filename);
    const fileBuffer = Buffer.from(audioBase64, "base64");
    fs.writeFileSync(filePath, fileBuffer);

    const audioPayload = {
      mimeType,
      durationMillis,
      filename,
      url: `/uploads/panic-audios/${filename}`,
      sizeBytes: fileBuffer.length,
      createdAtIso: new Date().toISOString(),
    };

    await alertasCollection().doc(id).set(
      {
        residentAudio: audioPayload,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await emergenciasCollection().doc(id).set(
      {
        residentAudio: audioPayload,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({ mensaje: "Audio enviado a vigilancia.", audio: audioPayload });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const cerrarAlertaPanicoPorResidente = async (req, res) => {
  const { id } = req.params;
  const residentId = normalizeText(req.body?.residentId);
  const attended = Boolean(req.body?.attended);
  const residentCloseNote = normalizeText(req.body?.residentCloseNote);
  const nextStatus = attended ? ESTADO_ATENDIDA : ESTADO_NO_ATENDIDA;

  try {
    const closePayload = {
      status: nextStatus,
      residentClosedBy: residentId,
      residentCloseNote,
      residentClosedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await alertasCollection().doc(id).set(
      {
        ...closePayload,
        resolvedAt: attended ? admin.firestore.FieldValue.serverTimestamp() : null,
        resolvedById: residentId,
        resolvedByName: "Residente",
      },
      { merge: true }
    );

    await emergenciasCollection().doc(id).set(
      {
        ...closePayload,
        attendedAt: attended ? admin.firestore.FieldValue.serverTimestamp() : null,
        attendedById: residentId,
        attendedByName: "Residente",
      },
      { merge: true }
    );

    return res.status(200).json({
      mensaje: attended ? "Emergencia marcada como atendida." : "Emergencia marcada como no atendida.",
      status: nextStatus,
    });
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

    if (normalizeText(currentData?.status) === ESTADO_ATENDIDA) {
      return res.status(200).json({ mensaje: "La alerta ya estaba marcada como atendida." });
    }

    await alertaRef.update({
      status: ESTADO_ATENDIDA,
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
      resolvedById,
      resolvedByName,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await emergenciasCollection().doc(id).set(
      {
        status: ESTADO_ATENDIDA,
        attendedAt: admin.firestore.FieldValue.serverTimestamp(),
        attendedById: resolvedById,
        attendedByName: resolvedByName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return res.status(200).json({ mensaje: "Alerta de panico marcada como atendida." });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  cerrarAlertaPanicoPorResidente,
  crearAlertaPanico,
  guardarAudioAlertaPanico,
  listarAlertasPanico,
  marcarAlertaPanicoEnCamino,
  obtenerAlertaPanicoActivaResidente,
  resolverAlertaPanico,
};
