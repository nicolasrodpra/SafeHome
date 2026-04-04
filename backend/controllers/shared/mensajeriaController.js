const admin = require("../../config/firebaseAdmin");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates");
const { normalizeComparableText, normalizeText } = require("../../utils/text");

// Conservamos el nombre antiguo de la colección para no perder compatibilidad
// con los registros que ya existen en Firebase.
const MENSAJERIA_COLLECTION = "pqrAdministracion";
const ESTADO_PENDIENTE = "Pendiente";

const mensajeriaCollection = () => admin.firestore().collection(MENSAJERIA_COLLECTION);

// Ordenamos del más reciente al más antiguo para mostrar primero
// los casos nuevos o recién actualizados.
const sortByCreatedAtDesc = (firstItem, secondItem) => {
  const firstDate = firstItem.createdAt?.getTime?.() || 0;
  const secondDate = secondItem.createdAt?.getTime?.() || 0;

  return secondDate - firstDate;
};

// Según el tipo de registro definimos si requiere respuesta
// o si se marca de una vez como solo informativo/registrado.
const getStatusByType = (type) =>
  normalizeComparableText(type) === normalizeComparableText("Autorización")
    ? "Registrada"
    : ESTADO_PENDIENTE;

// Esta función convierte los datos viejos y nuevos del módulo en un solo formato.
// Así el frontend siempre recibe la misma estructura aunque los documentos cambien.
const mapMensaje = (snapshotDoc) => {
  const data = snapshotDoc.data();
  const createdAt = toDate(data.createdAt || data.fecha);
  const respondedAt = toDate(data.respondedAt);
  const torre = normalizeText(data.torre);
  const apartamento = normalizeText(data.apartamento);
  const residentInfo = [
    torre ? `Torre: ${torre}` : null,
    apartamento ? `Apto: ${apartamento}` : null,
  ]
    .filter(Boolean)
    .join("  ");

  return {
    id: snapshotDoc.id,
    residentId: normalizeText(data.residentId),
    residentName:
      normalizeText(data.residentName || data.nombreResidente || data.nombre) || "Residente",
    residentEmail: normalizeText(data.residentEmail || data.email || data.correo),
    residentInfo: residentInfo || "Sin ubicación registrada",
    torre,
    apartamento,
    type: normalizeText(data.type || data.tipo) || "Queja",
    subject: normalizeText(data.subject || data.asunto) || "Sin asunto",
    message: normalizeText(data.message || data.mensaje) || "Sin mensaje",
    status: normalizeText(data.status || data.estado) || ESTADO_PENDIENTE,
    response: normalizeText(data.response || data.respuesta),
    respondedById: normalizeText(data.respondedById),
    respondedByName: normalizeText(data.respondedByName || data.respondioPor),
    dateLabel: formatDateLabel(createdAt) || "Sin fecha",
    timeLabel: formatTimeLabel(createdAt) || "Sin hora",
    respondedDateLabel: formatDateLabel(respondedAt) || "Sin fecha",
    respondedTimeLabel: formatTimeLabel(respondedAt) || "Sin hora",
    createdAtIso: createdAt?.toISOString?.() || null,
    createdAt,
  };
};

// Lista toda la mensajería y entrega una estructura homogénea al frontend.
const listarMensajeria = async (req, res) => {
  try {
    const snapshot = await mensajeriaCollection().get();
    const mensajes = snapshot.docs.map(mapMensaje).sort(sortByCreatedAtDesc);

    return res.status(200).json(
      mensajes.map(({ createdAt, ...mensaje }) => mensaje)
    );
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

// Registra un mensaje nuevo desde la vista del residente.
const crearMensaje = async (req, res) => {
  const payload = {
    residentId: normalizeText(req.body?.residentId),
    residentName: normalizeText(req.body?.residentName),
    residentEmail: normalizeText(req.body?.residentEmail),
    torre: normalizeText(req.body?.torre),
    apartamento: normalizeText(req.body?.apartamento),
    type: normalizeText(req.body?.type) || "Queja",
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

// Guarda la respuesta administrativa sobre un mensaje existente.
const responderMensaje = async (req, res) => {
  const { id } = req.params;
  const response = normalizeText(req.body?.response);
  const respondedById = normalizeText(req.body?.respondedById);
  const respondedByName = normalizeText(req.body?.respondedByName) || "Administración";

  if (!response) {
    return res.status(400).json({
      mensaje: "Debes escribir una respuesta antes de guardarla.",
    });
  }

  try {
    await mensajeriaCollection().doc(id).update({
      response,
      status: "Respondida",
      respondedAt: admin.firestore.FieldValue.serverTimestamp(),
      respondedById,
      respondedByName,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      mensaje: "Respuesta guardada correctamente.",
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  crearMensaje,
  listarMensajeria,
  responderMensaje,
};
