// Controlador de mensajería o PQRS.
// Permite listar mensajes, registrar nuevos casos
// y gestionar respuestas o decisiones administrativas.
const admin = require("../../config/firebaseAdmin");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates");
const { normalizeComparableText, normalizeText } = require("../../utils/text");
const { normalizeAllowedValue } = require("../../utils/validation");

const MENSAJERIA_COLLECTION = "pqrAdministracion";
const ESTADO_PENDIENTE = "Pendiente";
const ESTADO_RESPONDIDA = "Respondida";
const ESTADO_ACEPTADA = "Aceptada";
const ESTADO_RECHAZADA = "Rechazada";
const ACCION_RESPONDER = "responder";
const ACCION_ACEPTAR = "aceptar";
const ACCION_RECHAZAR = "rechazar";
const MESSAGE_TYPES = ["Queja", "Solicitud", "Autorización"];

const mensajeriaCollection = () => admin.firestore().collection(MENSAJERIA_COLLECTION);

const isLegacyCorrespondenciaNotification = (mensaje = {}) =>
  normalizeComparableText(mensaje.subject) ===
    normalizeComparableText("Nueva correspondencia recibida") &&
  normalizeComparableText(mensaje.type) === normalizeComparableText("Solicitud");

const isAuthorizationType = (type) =>
  normalizeComparableText(type) === normalizeComparableText("Autorización");

const sortByCreatedAtDesc = (firstItem, secondItem) => {
  const firstDate = firstItem.createdAt?.getTime?.() || 0;
  const secondDate = secondItem.createdAt?.getTime?.() || 0;

  return secondDate - firstDate;
};

const getStatusByType = () => ESTADO_PENDIENTE;

const normalizeMessageStatus = (status, type) => {
  const normalizedStatus = normalizeComparableText(status);

  if (!normalizedStatus || normalizedStatus === "registrada") {
    return ESTADO_PENDIENTE;
  }

  if (normalizedStatus === "pendiente") {
    return ESTADO_PENDIENTE;
  }

  if (normalizedStatus === "respondida") {
    return ESTADO_RESPONDIDA;
  }

  if (normalizedStatus === "aceptada" || normalizedStatus === "aprobada") {
    return ESTADO_ACEPTADA;
  }

  if (normalizedStatus === "rechazada") {
    return ESTADO_RECHAZADA;
  }

  if (isAuthorizationType(type) && normalizedStatus === "registrada") {
    return ESTADO_PENDIENTE;
  }

  return normalizeText(status) || ESTADO_PENDIENTE;
};

const getActionStatus = (action) => {
  const normalizedAction = normalizeComparableText(action);

  if (normalizedAction === ACCION_ACEPTAR) {
    return ESTADO_ACEPTADA;
  }

  if (normalizedAction === ACCION_RECHAZAR) {
    return ESTADO_RECHAZADA;
  }

  return ESTADO_RESPONDIDA;
};

const getUpdatedDate = (data = {}) =>
  toDate(data.updatedAt || data.respondedAt || data.createdAt || data.fecha);

const mapMensaje = (snapshotDoc) => {
  const data = snapshotDoc.data() || {};
  const createdAt = toDate(data.createdAt || data.fecha);
  const respondedAt = toDate(data.respondedAt);
  const updatedAt = getUpdatedDate(data);
  const torre = normalizeText(data.torre);
  const apartamento = normalizeText(data.apartamento);
  const residentInfo = [
    torre ? `Torre: ${torre}` : null,
    apartamento ? `Apto: ${apartamento}` : null,
  ]
    .filter(Boolean)
    .join("  ");
  const type = normalizeText(data.type || data.tipo) || "Queja";

  return {
    id: snapshotDoc.id,
    residentId: normalizeText(data.residentId),
    residentName:
      normalizeText(data.residentName || data.nombreResidente || data.nombre) || "Residente",
    residentEmail: normalizeText(data.residentEmail || data.email || data.correo),
    residentInfo: residentInfo || "Sin ubicación registrada",
    torre,
    apartamento,
    type,
    subject: normalizeText(data.subject || data.asunto) || "Sin asunto",
    message: normalizeText(data.message || data.mensaje) || "Sin mensaje",
    status: normalizeMessageStatus(data.status || data.estado, type),
    response: normalizeText(data.response || data.respuesta),
    respondedById: normalizeText(data.respondedById),
    respondedByName: normalizeText(data.respondedByName || data.respondioPor),
    dateLabel: formatDateLabel(createdAt) || "Sin fecha",
    timeLabel: formatTimeLabel(createdAt) || "Sin hora",
    respondedDateLabel: formatDateLabel(respondedAt) || "Sin fecha",
    respondedTimeLabel: formatTimeLabel(respondedAt) || "Sin hora",
    createdAtIso: createdAt?.toISOString?.() || null,
    respondedAtIso: respondedAt?.toISOString?.() || null,
    updatedAtIso: updatedAt?.toISOString?.() || null,
    createdAt,
    respondedAt,
    updatedAt,
  };
};

const serializeMensaje = (mensaje) => {
  const { createdAt, respondedAt, updatedAt, ...rest } = mensaje;
  return rest;
};

const listarMensajeria = async (req, res) => {
  try {
    const snapshot = await mensajeriaCollection().get();
    const mensajes = snapshot.docs
      .map(mapMensaje)
      .filter((mensaje) => !isLegacyCorrespondenciaNotification(mensaje))
      .sort(sortByCreatedAtDesc);

    return res.status(200).json(mensajes.map(serializeMensaje));
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const crearMensaje = async (req, res) => {
  const rawType = normalizeText(req.body?.type) || "Queja";
  const type = normalizeAllowedValue(rawType, MESSAGE_TYPES);

  if (!type) {
    return res.status(400).json({ mensaje: "Selecciona un tipo de mensaje valido." });
  }

  const payload = {
    residentId: normalizeText(req.body?.residentId),
    residentName: normalizeText(req.body?.residentName),
    residentEmail: normalizeText(req.body?.residentEmail),
    torre: normalizeText(req.body?.torre),
    apartamento: normalizeText(req.body?.apartamento),
    type,
    subject: normalizeText(req.body?.subject),
    message: normalizeText(req.body?.message),
  };

  if (!payload.residentId || !payload.subject || !payload.message) {
    return res.status(400).json({
      mensaje: "Debes completar el asunto y el mensaje antes de enviar el registro.",
    });
  }

  try {
    const ref = await mensajeriaCollection().add({
      ...payload,
      status: getStatusByType(payload.type),
      response: "",
      respondedAt: null,
      respondedById: "",
      respondedByName: "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      mensaje: "Mensaje registrado correctamente.",
      mensajeria: {
        id: ref.id,
        ...payload,
        status: getStatusByType(payload.type),
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const gestionarMensaje = async (req, res) => {
  const { id } = req.params;
  const action = normalizeComparableText(req.body?.action || ACCION_RESPONDER);
  const response = normalizeText(req.body?.response);
  const respondedById = normalizeText(req.body?.respondedById);
  const respondedByName = normalizeText(req.body?.respondedByName) || "Administración";

  if (action === ACCION_RESPONDER && !response) {
    return res.status(400).json({
      mensaje: "Debes escribir una respuesta antes de guardarla.",
    });
  }

  try {
    const docRef = mensajeriaCollection().doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return res.status(404).json({
        mensaje: "El mensaje que intentas gestionar ya no existe.",
      });
    }

    const currentMessage = mapMensaje(snapshot);
    const isAuthorization = isAuthorizationType(currentMessage.type);

    if (
      action !== ACCION_RESPONDER &&
      (!isAuthorization || (action !== ACCION_ACEPTAR && action !== ACCION_RECHAZAR))
    ) {
      return res.status(400).json({
        mensaje: "La acción solicitada no está permitida para este tipo de mensaje.",
      });
    }

    const nextResponse = response || currentMessage.response || "";

    await docRef.update({
      response: nextResponse,
      status: getActionStatus(action),
      respondedAt: admin.firestore.FieldValue.serverTimestamp(),
      respondedById,
      respondedByName,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const nextSnapshot = await docRef.get();

    return res.status(200).json({
      mensaje: "El mensaje fue gestionado correctamente.",
      mensajeria: serializeMensaje(mapMensaje(nextSnapshot)),
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  crearMensaje,
  gestionarMensaje,
  listarMensajeria,
};
