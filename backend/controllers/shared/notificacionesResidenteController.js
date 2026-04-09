const admin = require("../../config/firebaseAdmin");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates");
const { normalizeText } = require("../../utils/text");

const NOTIFICACIONES_COLLECTION = "notificacionesResidente";
const TIPO_CORRESPONDENCIA = "Correspondencia";

const notificationsCollection = () => admin.firestore().collection(NOTIFICACIONES_COLLECTION);

const mapNotification = (snapshotDoc) => {
  const data = snapshotDoc.data() || {};
  const createdAt = toDate(data.createdAt || data.fecha);

  return {
    id: snapshotDoc.id,
    residentId: normalizeText(data.residentId),
    residentName: normalizeText(data.residentName),
    documento: normalizeText(data.documento),
    type: normalizeText(data.type) || TIPO_CORRESPONDENCIA,
    title: normalizeText(data.title) || "Nueva notificacion",
    message: normalizeText(data.message) || "Sin detalle disponible.",
    torre: normalizeText(data.torre),
    apartamento: normalizeText(data.apartamento),
    correspondenciaId: normalizeText(data.correspondenciaId),
    read: Boolean(data.read),
    dateLabel: formatDateLabel(createdAt) || "Sin fecha",
    timeLabel: formatTimeLabel(createdAt) || "Sin hora",
    createdAtIso: createdAt?.toISOString?.() || null,
  };
};

const sortByCreatedAtDesc = (firstItem, secondItem) => {
  const firstDate = new Date(firstItem.createdAtIso || 0).getTime() || 0;
  const secondDate = new Date(secondItem.createdAtIso || 0).getTime() || 0;

  return secondDate - firstDate;
};

const crearNotificacionCorrespondencia = async ({
  residentId,
  residentName,
  documento,
  torre,
  apartamento,
  correspondenciaId,
  tipoEntrega,
  remitente,
}) => {
  if (!normalizeText(residentId)) {
    return null;
  }

  const deliveryType = normalizeText(tipoEntrega).toLowerCase() || "correspondencia";
  const sender = normalizeText(remitente) || "No especificado";

  const ref = await notificationsCollection().add({
    residentId: normalizeText(residentId),
    residentName: normalizeText(residentName) || "Residente",
    documento: normalizeText(documento),
    type: TIPO_CORRESPONDENCIA,
    title: "Nueva correspondencia recibida",
    message: `Llego ${deliveryType} para tu apartamento. Remitente: ${sender}.`,
    torre: normalizeText(torre),
    apartamento: normalizeText(apartamento),
    correspondenciaId: normalizeText(correspondenciaId),
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return ref.id;
};

const listarNotificacionesResidente = async (req, res) => {
  const residentId = normalizeText(req.params?.residentId || req.query?.residentId);

  if (!residentId) {
    return res.status(400).json({ mensaje: "Debes indicar el residente a consultar." });
  }

  try {
    const snapshot = await notificationsCollection().where("residentId", "==", residentId).get();
    const notifications = snapshot.docs.map(mapNotification).sort(sortByCreatedAtDesc);

    return res.status(200).json(notifications);
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const marcarNotificacionesComoVistas = async (req, res) => {
  const residentId = normalizeText(req.params?.residentId || req.body?.residentId);

  if (!residentId) {
    return res.status(400).json({ mensaje: "Debes indicar el residente a actualizar." });
  }

  try {
    const snapshot = await notificationsCollection()
      .where("residentId", "==", residentId)
      .where("read", "==", false)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({ mensaje: "No habia notificaciones pendientes.", updated: 0 });
    }

    const batch = admin.firestore().batch();

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        read: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    return res.status(200).json({
      mensaje: "Notificaciones marcadas como vistas.",
      updated: snapshot.size,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  crearNotificacionCorrespondencia,
  listarNotificacionesResidente,
  marcarNotificacionesComoVistas,
};
