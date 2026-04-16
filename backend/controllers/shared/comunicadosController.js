// Controlador de comunicados.
// Mantiene el CRUD y deja la respuesta lista para que el frontend la pinte sin transformar más.
const admin = require("../../config/firebaseAdmin");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates");
const { normalizeComparableText, normalizeText } = require("../../utils/text");

// Helpers de acceso y presentación.
const comunicadosCollection = () => admin.firestore().collection("comunicados");

const resolveSenderRole = (value) =>
  normalizeComparableText(value) === normalizeComparableText("Vigilante")
    ? "Vigilante"
    : "Administrador";

const getSenderLabel = (role) =>
  resolveSenderRole(role) === "Vigilante" ? "Vigilancia" : "Administracion";

const sortByFechaDesc = (firstItem, secondItem) => {
  const firstDate = firstItem.createdAt?.getTime?.() || 0;
  const secondDate = secondItem.createdAt?.getTime?.() || 0;

  return secondDate - firstDate;
};

const mapComunicado = (snapshotDoc) => {
  const data = snapshotDoc.data();
  const createdAt = toDate(data.fecha || data.createdAt);

  return {
    id: snapshotDoc.id,
    asunto: normalizeText(data.asunto) || "Sin asunto",
    mensaje: normalizeText(data.mensaje) || "Sin mensaje",
    senderRole: resolveSenderRole(data.senderRole || data.rol),
    senderLabel: normalizeText(data.senderLabel) || getSenderLabel(data.senderRole || data.rol),
    fecha: formatDateLabel(createdAt),
    hora: formatTimeLabel(createdAt),
    fechaCompleta: createdAt?.toISOString?.() || null,
    createdAt,
  };
};

const buildComunicadoPayload = ({ asunto, mensaje, senderRole, senderLabel }) => ({
  asunto,
  mensaje,
  senderRole,
  senderLabel,
  fecha: admin.firestore.FieldValue.serverTimestamp(),
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
});

// Lectura principal del módulo.
const listarComunicados = async (req, res) => {
  try {
    const snapshot = await comunicadosCollection().get();
    const comunicados = snapshot.docs.map(mapComunicado).sort(sortByFechaDesc);

    return res.status(200).json(
      comunicados.map(({ createdAt, ...comunicado }) => comunicado)
    );
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

// Escrituras del módulo.
const crearComunicado = async (req, res) => {
  const asunto = normalizeText(req.body?.asunto);
  const mensaje = normalizeText(req.body?.mensaje);
  const senderRole = resolveSenderRole(req.body?.senderRole || req.body?.rol);
  const senderLabel = getSenderLabel(senderRole);

  if (!asunto || !mensaje) {
    return res.status(400).json({
      mensaje: "Debes completar el asunto y el mensaje del comunicado.",
    });
  }

  try {
    const ref = await comunicadosCollection().add(
      buildComunicadoPayload({
        asunto,
        mensaje,
        senderRole,
        senderLabel,
      })
    );

    return res.status(201).json({
      mensaje: "Comunicado guardado correctamente.",
      comunicado: {
        id: ref.id,
        asunto,
        mensaje,
        senderRole,
        senderLabel,
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const actualizarComunicado = async (req, res) => {
  const { id } = req.params;
  const asunto = normalizeText(req.body?.asunto);
  const mensaje = normalizeText(req.body?.mensaje);

  if (!asunto || !mensaje) {
    return res.status(400).json({
      mensaje: "Debes completar el asunto y el mensaje del comunicado.",
    });
  }

  try {
    await comunicadosCollection().doc(id).update({
      asunto,
      mensaje,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      mensaje: "Comunicado actualizado correctamente.",
      comunicado: {
        id,
        asunto,
        mensaje,
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const eliminarComunicado = async (req, res) => {
  const { id } = req.params;

  try {
    await comunicadosCollection().doc(id).delete();
    return res.status(200).json({ mensaje: "Comunicado eliminado correctamente." });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  actualizarComunicado,
  crearComunicado,
  eliminarComunicado,
  listarComunicados,
};
