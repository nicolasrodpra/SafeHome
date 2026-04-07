// Controlador del asistente virtual.
// Construye contexto segun el rol, intenta consultar un modelo externo
// y si falla usa respuestas locales guiadas por modulo.
const fs = require("fs");
const https = require("https");
const path = require("path");
const admin = require("../../config/firebaseAdmin");
const { normalizeComparableText, normalizeText } = require("../../utils/text");

const MAX_ITEMS_PER_COLLECTION = 6;
const manualMetadataPath = path.join(__dirname, "..", "..", "data", "manualConvivencia.json");
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const collection = (name) => admin.firestore().collection(name);

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  const date = toDate(value);

  if (!date) {
    return "";
  }

  return date.toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const sortByTimestampDesc = (firstItem, secondItem, fieldNames = []) => {
  const getTime = (item) => {
    const fieldValue = fieldNames
      .map((fieldName) => item[fieldName])
      .find((currentValue) => currentValue !== undefined && currentValue !== null);

    return toDate(fieldValue)?.getTime?.() || 0;
  };

  return getTime(secondItem) - getTime(firstItem);
};

const summarizeCollection = async (collectionName, mapper, sortFields) => {
  const snapshot = await collection(collectionName).get();

  return snapshot.docs
    .map((docSnapshot) => mapper(docSnapshot.id, docSnapshot.data()))
    .sort((firstItem, secondItem) => sortByTimestampDesc(firstItem, secondItem, sortFields))
    .slice(0, MAX_ITEMS_PER_COLLECTION);
};

const countTodayFromField = async (collectionName, fieldName = "fecha") => {
  const snapshot = await collection(collectionName).get();
  const now = new Date();

  return snapshot.docs.filter((docSnapshot) => {
    const dateValue = toDate(docSnapshot.data()?.[fieldName]);

    if (!dateValue) {
      return false;
    }

    return (
      dateValue.getFullYear() === now.getFullYear() &&
      dateValue.getMonth() === now.getMonth() &&
      dateValue.getDate() === now.getDate()
    );
  }).length;
};

const readManualMetadata = () => {
  try {
    if (!fs.existsSync(manualMetadataPath)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(manualMetadataPath, "utf8"));
  } catch (error) {
    return null;
  }
};

const buildManualContext = () => {
  const metadata = readManualMetadata();

  if (!metadata) {
    return {
      disponible: false,
      nota: "No hay un manual de convivencia publicado en este momento.",
    };
  }

  return {
    disponible: true,
    archivo: metadata.fileName,
    actualizadoPor: metadata.updatedBy || "Administrador",
    actualizadoEn: metadata.updatedAt || "",
    nota:
      "El sistema solo tiene acceso al PDF y a sus metadatos. Para reglas exactas del manual debes consultar el documento publicado.",
  };
};

const mapComunicado = (id, data = {}) => ({
  id,
  asunto: normalizeText(data.asunto) || "Sin asunto",
  mensaje: normalizeText(data.mensaje) || "Sin mensaje",
  fecha: formatDateTime(data.createdAt || data.fecha),
  createdAt: data.createdAt || data.fecha || null,
});

const mapMensaje = (id, data = {}) => ({
  id,
  tipo: normalizeText(data.type || data.tipo) || "Queja",
  asunto: normalizeText(data.subject || data.asunto) || "Sin asunto",
  estado: normalizeText(data.status || data.estado) || "Pendiente",
  residente: normalizeText(data.residentName || data.nombreResidente || data.nombre) || "Residente",
  respuesta: normalizeText(data.response || data.respuesta),
  fecha: formatDateTime(data.createdAt || data.fecha),
  createdAt: data.createdAt || data.fecha || null,
  residentId: normalizeText(data.residentId),
});

const mapReserva = (id, data = {}) => ({
  id,
  zona: normalizeText(data.zoneLabel) || "Zona comun",
  fecha: normalizeText(data.dateKey),
  inicio: Number(data.startHour) || 0,
  fin: Number(data.endHour) || 0,
  residente: normalizeText(data.residentName),
  userId: normalizeText(data.userId),
  createdAt: data.createdAt || data.updatedAt || null,
});

const mapVisitor = (id, data = {}) => ({
  id,
  nombre: normalizeText(data.nombre),
  residente: normalizeText(data.residente),
  torre: normalizeText(data.torre),
  apartamento: normalizeText(data.apartamento),
  motivo: normalizeText(data.motivo),
  fecha: formatDateTime(data.fecha),
  rawDate: data.fecha || null,
});

const mapVehiculo = (id, data = {}) => ({
  id,
  propietario: normalizeText(data.propietario),
  placa: normalizeText(data.placa),
  tipo: normalizeText(data.tipo),
  torre: normalizeText(data.torre),
  apartamento: normalizeText(data.apartamento),
  fecha: formatDateTime(data.fecha),
  rawDate: data.fecha || null,
});

const mapCorrespondencia = (id, data = {}) => ({
  id,
  residente: normalizeText(data.residente),
  remitente: normalizeText(data.remitente),
  tipoEntrega: normalizeText(data.tipoEntrega),
  observacion: normalizeText(data.observacion),
  fecha: formatDateTime(data.fecha),
  rawDate: data.fecha || null,
});

const buildAdminContext = async () => {
  const [comunicados, mensajes, reservas, residentesSnapshot, visitantesHoy, vehiculosHoy, correspondenciaHoy] =
    await Promise.all([
      summarizeCollection("comunicados", mapComunicado, ["createdAt", "fecha"]),
      summarizeCollection("pqrAdministracion", mapMensaje, ["createdAt", "fecha"]),
      summarizeCollection("reservasZonasComunes", mapReserva, ["createdAt", "updatedAt"]),
      collection("users").where("rol", "==", "Residente").get(),
      countTodayFromField("visitantes"),
      countTodayFromField("vehiculos"),
      countTodayFromField("correspondencia"),
    ]);

  const mensajesPendientes = mensajes.filter(
    (item) => normalizeComparableText(item.estado) === "pendiente"
  ).length;

  return {
    modulo: "administracion",
    resumen: {
      totalResidentes: residentesSnapshot.size,
      mensajesPendientes,
      reservasRegistradas: reservas.length,
      visitantesHoy,
      vehiculosHoy,
      correspondenciaHoy,
    },
    comunicados,
    mensajes,
    reservas,
  };
};

const buildResidentContext = async (session) => {
  const [comunicados, mensajes, reservas] = await Promise.all([
    summarizeCollection("comunicados", mapComunicado, ["createdAt", "fecha"]),
    summarizeCollection("pqrAdministracion", mapMensaje, ["createdAt", "fecha"]),
    summarizeCollection("reservasZonasComunes", mapReserva, ["createdAt", "updatedAt"]),
  ]);

  return {
    modulo: "residente",
    perfil: {
      nombre: session.nombre,
      torre: session.torre,
      apartamento: session.apartamento,
      email: session.email,
    },
    manual: buildManualContext(),
    comunicados,
    mensajes: mensajes.filter((item) => item.residentId === session.uid),
    reservas: reservas.filter((item) => item.userId === session.uid),
  };
};

const buildGuardContext = async () => {
  const [visitantes, vehiculos, correspondencia, visitantesHoy, vehiculosHoy, correspondenciaHoy] =
    await Promise.all([
      summarizeCollection("visitantes", mapVisitor, ["rawDate"]),
      summarizeCollection("vehiculos", mapVehiculo, ["rawDate"]),
      summarizeCollection("correspondencia", mapCorrespondencia, ["rawDate"]),
      countTodayFromField("visitantes"),
      countTodayFromField("vehiculos"),
      countTodayFromField("correspondencia"),
    ]);

  return {
    modulo: "vigilancia",
    resumen: {
      visitantesHoy,
      vehiculosHoy,
      correspondenciaHoy,
    },
    visitantes,
    vehiculos,
    correspondencia,
  };
};

const buildContextForRole = async (session) => {
  if (session.rol === "Administrador") {
    return buildAdminContext();
  }

  if (session.rol === "Residente") {
    return buildResidentContext(session);
  }

  if (session.rol === "Vigilante") {
    return buildGuardContext();
  }

  return {
    modulo: "general",
  };
};

const validateSession = (session = {}) => {
  const rol = normalizeText(session.rol);
  const uid = normalizeText(session.uid);

  if (!uid || !rol) {
    return null;
  }

  return {
    uid,
    rol,
    nombre: normalizeText(session.nombre) || "Usuario",
    email: normalizeText(session.email),
    torre: normalizeText(session.torre),
    apartamento: normalizeText(session.apartamento),
    zonaVigilancia: normalizeText(session.zonaVigilancia),
  };
};

const includesAny = (text, terms) => terms.some((term) => text.includes(term));

const formatSteps = (title, steps = []) =>
  [title, "", ...steps.map((step, index) => `${index + 1}. ${step}`)].join("\n");

const matchesTopic = (text, terms = [], stems = []) =>
  includesAny(text, terms) || stems.some((stem) => text.includes(stem));

const rolePromptByName = {
  Administrador:
    "Eres el asistente virtual de SafeHome para administradores. Tu funcion es guiar paso a paso dentro del sistema y responder de forma clara, corta y util.",
  Residente:
    "Eres el asistente virtual de SafeHome para residentes. Debes orientar sobre como usar el sistema, con respuestas amables, practicas y concretas.",
  Vigilante:
    "Eres el asistente virtual de SafeHome para vigilancia. Debes explicar procesos operativos del sistema con orden, claridad y enfoque practico.",
};

const buildRoleContextSummary = (session, context) => {
  if (session.rol === "Administrador") {
    return [
      `Rol actual: ${session.rol}.`,
      "Modulos disponibles: comunicados, mensajeria o PQRS, reservas, usuarios o residentes, vigilancia.",
      "Debes responder como guia de uso del sistema, no como chatbot general.",
    ].join(" ");
  }

  if (session.rol === "Residente") {
    return [
      `Rol actual: ${session.rol}.`,
      "Modulos disponibles: reservas, mensajeria o PQRS, comunicados, perfil y manual de convivencia.",
      context.manual?.disponible
        ? `Hay un manual publicado con nombre ${context.manual.archivo}.`
        : "No hay un manual publicado en este momento.",
      "Debes orientar sobre acciones que el residente puede hacer dentro de su panel.",
    ].join(" ");
  }

  if (session.rol === "Vigilante") {
    return [
      `Rol actual: ${session.rol}.`,
      "Modulos disponibles: visitantes, vehiculos, correspondencia y resumen operativo.",
      "Debes explicar procedimientos del sistema y uso del panel de vigilancia.",
    ].join(" ");
  }

  return `Rol actual: ${session.rol}. Debes orientar sobre el uso del sistema segun ese rol.`;
};

const buildGroqMessages = (session, question, context) => {
  const systemPrompt = [
    rolePromptByName[session.rol] ||
      "Eres el asistente virtual de SafeHome. Ayuda al usuario a usar el sistema segun su rol.",
    "Reglas de respuesta:",
    "- Responde siempre en espanol.",
    "- Prioriza guias paso a paso y ayuda practica.",
    "- No inventes modulos ni funciones que no existan en el sistema.",
    "- No des informacion de otros roles si el usuario no tiene permiso.",
    "- Si la pregunta es confusa, interpreta la intencion y responde la accion mas cercana.",
    "- Usa formato legible: una frase inicial corta y luego pasos numerados si aplica.",
    buildRoleContextSummary(session, context),
  ].join("\n");

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: question },
  ];
};

const callGroqChat = (messages) =>
  new Promise((resolve, reject) => {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      reject(new Error("No se encontró la configuración de GROQ_API_KEY en el backend."));
      return;
    }

    const payload = JSON.stringify({
      model: DEFAULT_GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 500,
      messages,
    });

    const request = https.request(
      GROQ_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (response) => {
        let rawData = "";

        response.on("data", (chunk) => {
          rawData += chunk;
        });

        response.on("end", () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : {};

            if (response.statusCode >= 400) {
              reject(
                new Error(
                  parsed?.error?.message ||
                    "No se pudo obtener respuesta del modelo de IA."
                )
              );
              return;
            }

            const answer = normalizeText(parsed?.choices?.[0]?.message?.content);
            resolve(answer || null);
          } catch (error) {
            reject(new Error("La respuesta del proveedor de IA no se pudo procesar."));
          }
        });
      }
    );

    request.on("error", () => {
      reject(new Error("No se pudo conectar con el proveedor de IA."));
    });

    request.write(payload);
    request.end();
  });

const answerAdminQuestion = (question, context) => {
  const normalizedQuestion = normalizeComparableText(question);

  if (matchesTopic(normalizedQuestion, ["comunicado", "comunicados", "aviso", "avisos", "publicar"], ["comunic", "avis", "public"])) {
    return formatSteps("Para publicar un comunicado como administrador:", [
      "Entra al módulo de comunicados desde tu panel principal.",
      "Presiona el botón para crear o publicar un nuevo comunicado.",
      "Escribe un asunto claro y el mensaje completo.",
      "Revisa el contenido antes de enviarlo.",
      "Guarda o publica el comunicado para que quede visible a los residentes.",
    ]);
  }

  if (matchesTopic(normalizedQuestion, ["mensaje", "mensajeria", "pqr", "solicitud", "queja", "autorizacion", "responder"], ["mensaj", "solic", "quej", "autoriz", "respond", "pqr"])) {
    return formatSteps("Para responder solicitudes o mensajes de administración:", [
      "Abre el módulo de mensajería o PQRS.",
      "Busca el mensaje que quieras gestionar.",
      "Revisa el asunto, el tipo y el contenido del caso.",
      "Escribe la respuesta en el campo correspondiente.",
      "Actualiza el estado si aplica y guarda la respuesta.",
    ]);
  }

  if (matchesTopic(normalizedQuestion, ["reserva", "reservas", "zona comun", "zona comunal"], ["reserv", "zona com"])) {
    return formatSteps("Para revisar o gestionar reservas:", [
      "Entra al módulo de reservas de zonas comunes.",
      "Consulta la lista o el calendario de reservas registradas.",
      "Ubica la reserva por fecha, zona o residente.",
      "Si necesitas gestionarla, abre el registro correspondiente.",
      "Verifica horarios y estado antes de hacer cualquier ajuste.",
    ]);
  }

  if (matchesTopic(normalizedQuestion, ["residente", "residentes", "usuario", "usuarios", "registrar usuario", "crear usuario"], ["resident", "usuari", "registrar usu", "crear usu"])) {
    return formatSteps("Para registrar o revisar usuarios del sistema:", [
      "Ve al módulo de usuarios o residentes.",
      "Selecciona la opción para crear un nuevo registro o revisar los existentes.",
      "Completa los datos personales, el rol y la información del apartamento si aplica.",
      "Valida que no haya campos vacíos o datos repetidos.",
      "Guarda el registro y confirma que aparezca en la lista.",
    ]);
  }

  if (matchesTopic(normalizedQuestion, ["vigilancia", "visitante", "vehiculo", "correspondencia"], ["vigil", "visit", "vehic", "correspond"])) {
    return formatSteps("Para revisar el apoyo del área de vigilancia:", [
      "Entra al módulo de vigilancia o al panel relacionado.",
      "Selecciona si quieres revisar visitantes, vehículos o correspondencia.",
      "Usa los registros recientes para validar el movimiento del día.",
      "Si necesitas más detalle, abre el registro específico.",
      "Vuelve al panel principal para cambiar de módulo cuando termines.",
    ]);
  }

  return "Puedo guiarte paso a paso para publicar comunicados, responder mensajería, revisar reservas, gestionar usuarios y ubicar módulos de administración.";
};

const answerResidentQuestion = (question, context) => {
  const normalizedQuestion = normalizeComparableText(question);

  if (matchesTopic(normalizedQuestion, ["reserva", "reservas", "piscina", "bbq", "gimnasio", "salon", "zona comun"], ["reserv", "piscin", "bbq", "gimnasi", "salon", "zona com"])) {
    return formatSteps("Para reservar una zona común como residente:", [
      "Entra al módulo de reservas desde el menú principal.",
      "Selecciona la zona que quieras apartar, como piscina o BBQ.",
      "Elige la fecha y el horario disponible.",
      "Verifica que los datos estén correctos antes de confirmar.",
      "Guarda la reserva y revisa después el listado de tus reservas para confirmar.",
    ]);
  }

  if (matchesTopic(normalizedQuestion, ["mensaje", "mensajeria", "solicitud", "queja", "autorizacion", "pqrs"], ["mensaj", "solic", "quej", "autoriz", "pqrs"])) {
    return formatSteps("Para enviar una solicitud, queja o autorización:", [
      "Abre el módulo de mensajería o PQRS.",
      "Selecciona el tipo de mensaje que vas a registrar.",
      "Escribe un asunto claro y explica tu caso con detalle.",
      "Revisa la información antes de enviarla.",
      "Guarda el mensaje y luego consulta su estado desde el mismo módulo.",
    ]);
  }

  if (matchesTopic(normalizedQuestion, ["comunicado", "comunicados", "aviso", "avisos"], ["comunic", "avis"])) {
    return formatSteps("Para revisar los comunicados publicados:", [
      "Entra al módulo de comunicados desde tu panel.",
      "Busca el comunicado más reciente en la lista.",
      "Abre el que quieras consultar para leerlo completo.",
      "Si necesitas volver a verlo, regresa al listado general.",
    ]);
  }

  if (matchesTopic(normalizedQuestion, ["perfil", "actualizar", "editar datos", "mis datos"], ["perfil", "actualiz", "editar", "mis dato"])) {
    return formatSteps("Para revisar o actualizar tu información personal:", [
      "Ve a la sección de perfil o datos personales.",
      "Abre la opción para editar tu información.",
      "Actualiza los campos permitidos dentro del sistema.",
      "Guarda los cambios y confirma que hayan quedado aplicados.",
    ]);
  }

  if (matchesTopic(normalizedQuestion, ["manual", "convivencia", "regla", "reglas", "ruido", "mascota"], ["manual", "conviv", "regl", "ruid", "mascot"])) {
    if (!context.manual.disponible) {
      return "En este momento no hay un manual de convivencia publicado. Cuando esté disponible, podrás verlo desde el módulo correspondiente.";
    }

    return formatSteps("Para consultar el manual de convivencia:", [
      "Entra al apartado donde se publica el manual dentro de la plataforma.",
      `Ubica el archivo ${context.manual.archivo}.`,
      "Abre el documento PDF para leer las reglas completas.",
      "Si tienes una duda puntual, usa el chat para ubicar el módulo correcto, pero consulta el PDF para la norma exacta.",
    ]);
  }

  return "Puedo guiarte para reservar zonas comunes, enviar solicitudes, revisar comunicados, ubicar el manual y usar mejor tu panel de residente.";
};

const answerGuardQuestion = (question, context) => {
  const normalizedQuestion = normalizeComparableText(question);

  if (matchesTopic(normalizedQuestion, ["visitante", "visitantes"], ["visit", "ingres"])) {
    return formatSteps("Para registrar un visitante:", [
      "Entra al módulo de visitantes desde tu panel de vigilancia.",
      "Presiona la opción para crear un nuevo registro.",
      "Completa los datos del visitante y del residente que autoriza el ingreso.",
      "Verifica torre, apartamento y motivo de la visita.",
      "Guarda el registro para que quede disponible en el control del día.",
    ]);
  }

  if (matchesTopic(normalizedQuestion, ["vehiculo", "vehiculos", "placa"], ["vehic", "plac", "carro", "moto"])) {
    return formatSteps("Para registrar un vehículo:", [
      "Abre el módulo de vehículos.",
      "Selecciona la opción para registrar un nuevo ingreso.",
      "Ingresa placa, propietario, tipo de vehículo y ubicación asociada.",
      "Revisa que la placa y los datos del residente estén correctos.",
      "Guarda el registro para dejarlo visible en el control vehicular.",
    ]);
  }

  if (matchesTopic(normalizedQuestion, ["correspondencia", "paquete", "entrega"], ["correspond", "paquet", "entreg"])) {
    return formatSteps("Para registrar correspondencia:", [
      "Entra al módulo de correspondencia.",
      "Presiona la opción para crear un nuevo registro.",
      "Escribe el nombre del residente, remitente y tipo de entrega.",
      "Agrega una observación si hace falta.",
      "Guarda el registro para que quede pendiente de entrega o consulta.",
    ]);
  }

  if (matchesTopic(normalizedQuestion, ["editar", "actualizar", "modificar", "eliminar"], ["edit", "actualiz", "modific", "elimin"])) {
    return formatSteps("Para editar un registro en vigilancia:", [
      "Busca el registro en el módulo correspondiente.",
      "Abre el detalle del visitante, vehículo o correspondencia.",
      "Selecciona la opción de editar si está disponible.",
      "Haz los cambios necesarios y guarda nuevamente.",
      "Si necesitas eliminarlo, verifica primero que no afecte el control del día.",
    ]);
  }

  if (matchesTopic(normalizedQuestion, ["resumen", "hoy", "dia", "vigilancia"], ["resumen", "hoy", "dia", "vigil"])) {
    return formatSteps("Para revisar el resumen operativo del día:", [
      "Ve al panel principal de vigilancia.",
      "Ubica los módulos de visitantes, vehículos y correspondencia.",
      "Revisa los registros recientes en cada sección.",
      "Si necesitas detalle, entra al módulo específico desde ese resumen.",
    ]);
  }

  return "Puedo orientarte paso a paso para registrar visitantes, vehículos, correspondencia y revisar el flujo operativo de vigilancia.";
};

const answerByRole = (session, question, context) => {
  if (session.rol === "Administrador") {
    return answerAdminQuestion(question, context);
  }

  if (session.rol === "Residente") {
    return answerResidentQuestion(question, context);
  }

  if (session.rol === "Vigilante") {
    return answerGuardQuestion(question, context);
  }

  return "No tengo respuestas configuradas para este rol.";
};

const buildFallbackContext = (session) => {
  if (session.rol === "Administrador") {
    return {
      modulo: "administracion",
      resumen: {
        totalResidentes: 0,
        mensajesPendientes: 0,
        reservasRegistradas: 0,
        visitantesHoy: 0,
        vehiculosHoy: 0,
        correspondenciaHoy: 0,
      },
      comunicados: [],
      mensajes: [],
      reservas: [],
    };
  }

  if (session.rol === "Residente") {
    return {
      modulo: "residente",
      manual: {
        disponible: false,
      },
      comunicados: [],
      mensajes: [],
      reservas: [],
    };
  }

  if (session.rol === "Vigilante") {
    return {
      modulo: "vigilancia",
      resumen: {
        visitantesHoy: 0,
        vehiculosHoy: 0,
        correspondenciaHoy: 0,
      },
      visitantes: [],
      vehiculos: [],
      correspondencia: [],
    };
  }

  return {
    modulo: "general",
  };
};

const chatWithAssistant = async (req, res) => {
  const message = normalizeText(req.body?.message);
  const session = validateSession(req.body?.session);

  if (!message) {
    return res.status(400).json({ mensaje: "Escribe una pregunta para continuar." });
  }

  if (!session) {
    return res.status(400).json({ mensaje: "No se pudo identificar la sesión del usuario." });
  }

  let context = buildFallbackContext(session);

  try {
    context = await buildContextForRole(session);
  } catch (error) {
    console.error("Asistente: no se pudo construir el contexto dinamico.", error.message);
  }

  try {
    const groqMessages = buildGroqMessages(session, message, context);
    const answer = await callGroqChat(groqMessages);

    return res.status(200).json({
      answer,
      model: DEFAULT_GROQ_MODEL,
      source: "groq",
    });
  } catch (error) {
    console.error("Asistente: respuesta IA no disponible, usando fallback local.", error.message);

    try {
      const fallbackAnswer = answerByRole(session, message, context);

      return res.status(200).json({
        answer: fallbackAnswer,
        model: "local-fallback",
        source: "fallback",
      });
    } catch (fallbackError) {
      return res.status(500).json({
        mensaje: "No se pudo responder en este momento desde el asistente virtual.",
      });
    }

    return res.status(500).json({
      mensaje: error.message || "Ocurrió un error al consultar el asistente virtual.",
    });
  }
};

module.exports = {
  chatWithAssistant,
};
