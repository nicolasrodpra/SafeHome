const admin = require("../../config/firebaseAdmin");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates");
const { normalizeText } = require("../../utils/text");

const comunicadosCollection = () => admin.firestore().collection("comunicados");

const sortByFechaDesc = (firstItem, secondItem) => {
  const firstDate = firstItem.createdAt?.getTime?.() || 0;
  const secondDate = secondItem.createdAt?.getTime?.() || 0;

  return secondDate - firstDate;
};

// Esta función transforma el documento de Firestore a un formato amigable
// para que el frontend ya reciba fechas y textos listos para mostrar.
const mapComunicado = (snapshotDoc) => {
  const data = snapshotDoc.data();
  const createdAt = toDate(data.fecha || data.createdAt);

  return {
    id: snapshotDoc.id,
    asunto: normalizeText(data.asunto) || "Sin asunto",
    mensaje: normalizeText(data.mensaje) || "Sin mensaje",
    fecha: formatDateLabel(createdAt),
    hora: formatTimeLabel(createdAt),
    fechaCompleta: createdAt?.toISOString?.() || null,
    createdAt,
  };
};

// Obtiene todos los comunicados y los ordena del más reciente al más antiguo.
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

// Crea un comunicado nuevo después de validar que los campos importantes existan.
const crearComunicado = async (req, res) => {
  const asunto = normalizeText(req.body?.asunto);
  const mensaje = normalizeText(req.body?.mensaje);

  if (!asunto || !mensaje) {
    return res.status(400).json({
      mensaje: "Debes completar el asunto y el mensaje del comunicado.",
    });
  }

  try {
    const comunicado = {
      asunto,
      mensaje,
      fecha: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await comunicadosCollection().add(comunicado);

    return res.status(201).json({
      mensaje: "Comunicado guardado correctamente.",
      comunicado: {
        id: ref.id,
        asunto,
        mensaje,
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

// Actualiza un comunicado existente sin cambiar su identificador.
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

// Elimina el comunicado completo de la colección.
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
