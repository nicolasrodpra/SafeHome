// Controlador de mensajeria o PQRS.
// Permite listar mensajes, registrar nuevos casos y guardar respuestas administrativas.
const admin = require("../../config/firebaseAdmin");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates"); // Funciones para convertir y formatear fechas de Firestore a formatos legibles.
const { normalizeComparableText, normalizeText } = require("../../utils/text");

const MENSAJERIA_COLLECTION = "pqrAdministracion";
const ESTADO_PENDIENTE = "Pendiente";

const mensajeriaCollection = () => admin.firestore().collection(MENSAJERIA_COLLECTION); // Función para obtener la referencia a la colección de mensajería en Firestore, lo que nos permite hacer consultas y modificaciones sobre esa colección.

const isLegacyCorrespondenciaNotification = (mensaje = {}) =>
  normalizeComparableText(mensaje.subject) ===
    normalizeComparableText("Nueva correspondencia recibida") &&
  normalizeComparableText(mensaje.type) === normalizeComparableText("Solicitud");

// Ordenamos del más reciente al más antiguo para mostrar primero
const sortByCreatedAtDesc = (firstItem, secondItem) => {
  const firstDate = firstItem.createdAt?.getTime?.() || 0;
  const secondDate = secondItem.createdAt?.getTime?.() || 0;

  return secondDate - firstDate; // Si secondDate es más reciente, aparecerá antes en la lista.
};

// Según el tipo de registro definimos si requiere respuesta
// o si se marca de una vez como solo informativo/registrado.
const getStatusByType = (type) =>
  normalizeComparableText(type) === normalizeComparableText("Autorización") // Si es Autorizacion se marca Registrada para que el residente sepa que no necesita esperar respuesta, solo que su solicitud fue recibida y anotada. Cualquier otro tipo de mensaje queda como Pendiente para que el residente espere una respuesta administrativa.
    ? "Registrada"
    : ESTADO_PENDIENTE;

// Se toman datos del Firebase y se formatean para que el frontend reciba todo listo para mostrar sin tener que adivinar formatos o campos.
const mapMensaje = (snapshotDoc) => { 
  const data = snapshotDoc.data();
  const createdAt = toDate(data.createdAt || data.fecha); 
  const respondedAt = toDate(data.respondedAt);
  const torre = normalizeText(data.torre);
  const apartamento = normalizeText(data.apartamento);
  const residentInfo = [
    torre ? `Torre: ${torre}` : null, // Si no tiene valor de torre o apartamento, no incluimos esa parte en la información para evitar mostrar datos vacíos.
    apartamento ? `Apto: ${apartamento}` : null, 
  ]
    .filter(Boolean) // Filtramos los valores nulos para que solo se unan los datos que existen, evitando así mostrar Torre o Apto sin información.
    .join("  "); 

  return {
    id: snapshotDoc.id, // Incluimos el ID del documento para que el frontend pueda identificar cada mensaje de forma única.
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
    createdAtIso: createdAt?.toISOString?.() || null, // ISO completa para que el frontend pueda usarla si necesita ordenarla o mostrarla de otra forma. 
    createdAt,
  };
};

// Lista toda la mensajería y entrega una estructura homogénea al frontend.
const listarMensajeria = async (req, res) => {
  try {
    const snapshot = await mensajeriaCollection().get();
    const mensajes = snapshot.docs
      .map(mapMensaje)
      .filter((mensaje) => !isLegacyCorrespondenciaNotification(mensaje))
      .sort(sortByCreatedAtDesc); // Ordenamos los mensajes para que el más reciente aparezca primero en la lista.

    return res.status(200).json(
      mensajes.map(({ createdAt, ...mensaje }) => mensaje) // map para eliminar el campo createdAt de la respuesta, ya que el frontend no lo necesita y así evitamos enviar datos innecesarios.
    );
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

// Registra un mensaje nuevo desde la vista del residente.
const crearMensaje = async (req, res) => {  // async porque vamos a hacer una actualización en la base de datos que requiere esperar a que se complete para enviar la respuesta al frontend.
  const payload = { // Informacion que esperamos recibir del frontend para crear un nuevo mensaje, con normalización de texto para evitar problemas de formato o caracteres extraños. 
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
      status: getStatusByType(payload.type), // Según el tipo de mensaje, definimos si queda como Pendiente o Registrada desde el inicio.
      response: "", // Vacio al crear el mensaje, se llenará cuando el administrador responda.
      respondedAt: null,
      respondedById: "", // Vacio al crear el mensaje, se llenará con el ID del administrador que responda.
      respondedByName: "", // Vacio al crear el mensaje, se llenará con el nombre del administrador que responda.
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
const responderMensaje = async (req, res) => { // async porque vamos a hacer una actualización en la base de datos que requiere esperar a que se complete para enviar la respuesta al frontend.
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
    await mensajeriaCollection().doc(id).update({ // awit para esperar a que se complete la actualización del mensaje con la respuesta administrativa antes de enviar la respuesta al frontend.
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
