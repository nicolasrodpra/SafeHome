// Controlador de comunicados.
// Implementa el CRUD de avisos institucionales publicados por administración.
const admin = require("../../config/firebaseAdmin");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates");
const { normalizeText } = require("../../utils/text");

const comunicadosCollection = () => admin.firestore().collection("comunicados");

const sortByFechaDesc = (firstItem, secondItem) => { // Ordenamos del más reciente al más antiguo según la fecha de creación del comunicado.
  const firstDate = firstItem.createdAt?.getTime?.() || 0; 
  const secondDate = secondItem.createdAt?.getTime?.() || 0; 

  return secondDate - firstDate; // Si secondDate es más reciente, aparecerá antes en la lista.
};

// Firebase no guarda las fechas como objetos Date, sino como Timestamps, así que convertimos y formateamos
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
    fechaCompleta: createdAt?.toISOString?.() || null, // Además de la fecha formateada para mostrar, también incluimos la fecha completa en ISO para que el frontend pueda usarla si necesita ordenarla o mostrarla de otra forma.
    createdAt,
  };
};

// Obtiene todos los comunicados y los ordena del más reciente al más antiguo.
const listarComunicados = async (req, res) => {
  try {
    const snapshot = await comunicadosCollection().get(); // Obtenemos todos los comunicados de la colección
    const comunicados = snapshot.docs.map(mapComunicado).sort(sortByFechaDesc); // Ordenamos los comunicados por fecha de creación, del más reciente al más antiguo

    return res.status(200).json(
      comunicados.map(({ createdAt, ...comunicado }) => comunicado) // map para eliminar el campo createdAt de la respuesta, ya que el frontend no lo necesita directamente y así evitamos enviar datos innecesarios.
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

    const ref = await comunicadosCollection().add(comunicado); // Agregamos el nuevo comunicado a la colección y obtenemos la referencia del documento creado.

    return res.status(201).json({
      mensaje: "Comunicado guardado correctamente.",
      comunicado: {
        id: ref.id, // Incluimos el ID generado por Firestore para que el frontend pueda identificar el comunicado recién creado.
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
  const { id } = req.params; // El ID del comunicado a actualizar se recibe como parámetro 
  const asunto = normalizeText(req.body?.asunto); // normalizeText para evitar problemas con espacios o caracteres extraños en el texto.
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
