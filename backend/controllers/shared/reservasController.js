// =====================================================
// CONTROLADOR DE RESERVAS DE ZONAS COMUNES
// =====================================================
// Aquí viven todas las validaciones del backend para crear, editar,
// listar y eliminar reservas de forma consistente.
// Las zonas comunes (piscina, gimnasio, salón, etc.) tienen reglas
// específicas de horario, duración y capacidad que se validan aquí.

const admin = require("../../config/firebaseAdmin");
const { normalizeText } = require("../../utils/text");

// Horas de operación de zonas comunes (7 AM a 10 PM)
const OPENING_HOUR = 7;
const CLOSING_HOUR = 22;

// Límite de residentes simultaneos en zonas de capacidad compartida (piscina, gimnasio)
const MAX_SHARED_ZONE_RESIDENTS = 10;

// Reglas específicas por zona: duración máxima permitida por residente
const ZONE_RULES = {
  // La piscina solo se puede reservar por 1 hora máximo
  piscina: {
    label: "Piscina",
    maxHours: 1,
  },
  // Zona BBQ permite hasta 5 horas (ideal para reuniones)
  zona_bbq: {
    label: "Zona BBQ",
    maxHours: 5,
  },
  // Cancha de fútbol: máximo 2 horas (un partido + descanso)
  cancha_futbol: {
    label: "Cancha de Fútbol",
    maxHours: 2,
  },
  // Salón comunal: hasta 5 horas para eventos
  salon_comunal: {
    label: "Salón Comunal",
    maxHours: 5,
  },
  // Gimnasio: máximo 3 horas por residente
  gimnasio: {
    label: "Gimnasio",
    maxHours: 3,
  },
};

// Zonas donde múltiples residentes pueden estar al mismo tiempo (capacidad compartida)
// Las otras zonas (BBQ, cancha, salón) son exclusivas por horario
const SHARED_CAPACITY_ZONE_KEYS = new Set(["piscina", "gimnasio"]);

// ======== FUNCIONES AUXILIARES ========

// Acceso a la colección de Firestore donde se guardan todas las reservas
const reservasCollection = () => admin.firestore().collection("reservasZonasComunes");

// Convierte un valor a número de forma segura
const toNumber = (value) => Number(value);

// Obtiene las reglas (duración máxima) de una zona según su clave
const getZoneRule = (zoneKey) => ZONE_RULES[normalizeText(zoneKey)] || null;

// Verifica si una zona permite múltiples residentes en el mismo horario
const isSharedCapacityZone = (zoneKey) => SHARED_CAPACITY_ZONE_KEYS.has(normalizeText(zoneKey));

// Rellena con cero a la izquierda para usar en fechas (ej: 1 -> "01")
const padNumber = (value) => String(value).padStart(2, "0");

// Convierte una Date a formato string "YYYY-MM-DD" para uso como clave en reservas
const formatDateKey = (date) =>
  `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;

// Convierte un string de fecha "YYYY-MM-DD" de vuelta a un objeto Date
const parseDateKey = (dateKey) => {
  const [year, month, day] = normalizeText(dateKey).split("-").map(Number);
  return new Date(year, month - 1, day);
};

// Verifica si una fecha en formato "YYYY-MM-DD" ya pasó
const isPastDateKey = (dateKey, baseDate = new Date()) => {
  const reservationDate = parseDateKey(dateKey);
  const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

  return reservationDate < today;
};

// Calcula la siguiente hora reservable considerando los minutos y segundos actuales
// Si es en medio de una hora, devuelve la próxima hora completa
const getCurrentBookableHour = (baseDate = new Date()) => {
  const currentHour = baseDate.getHours();
  const needsNextHour =
    baseDate.getMinutes() > 0 || baseDate.getSeconds() > 0 || baseDate.getMilliseconds() > 0;

  return currentHour + (needsNextHour ? 1 : 0);
};

// ======== ORDENAMIENTO Y TRANSFORMACIÓN DE DATOS ========

// Ordena reservas primero por fecha y luego por hora de inicio
// Esto permite que el calendario del frontend renderice las reservas en order cronológico
const sortReservas = (firstReservation, secondReservation) => {
  if (firstReservation.dateKey !== secondReservation.dateKey) {
    return firstReservation.dateKey.localeCompare(secondReservation.dateKey);
  }

  return firstReservation.startHour - secondReservation.startHour;
};

// Transforma un documento de Firestore en una reserva normalizada
// Asegura que todos los datos tengan el tipo correcto (números, strings, etc.)
// Esto evita problemas en el frontend donde números podrían llegar como strings
const mapReserva = (snapshotDoc) => {
  const data = snapshotDoc.data() || {};

  return {
    id: snapshotDoc.id,
    dateKey: normalizeText(data.dateKey),        // Ej: "2026-04-08"
    zoneKey: normalizeText(data.zoneKey),        // Ej: "piscina"
    zoneLabel: normalizeText(data.zoneLabel),    // Ej: "Piscina"
    startHour: toNumber(data.startHour),         // Ej: 14 (2 PM)
    endHour: toNumber(data.endHour),             // Ej: 15 (3 PM)
    duration: toNumber(data.duration),           // Ej: 1 (hora)
    userId: normalizeText(data.userId),          // ID del residente
    residentName: normalizeText(data.residentName),
    residentEmail: normalizeText(data.residentEmail),
    cedula: normalizeText(data.cedula),          // Cédula del residente
    torre: normalizeText(data.torre),            // Torre del edificio
    apartamento: normalizeText(data.apartamento), // Número del apartamento
  };
};

// Prepara los datos de la reserva desde el request del frontend
// Normaliza tipos y calcula la hora de fin si es necesario
const buildReservaPayload = (body = {}) => {
  const startHour = toNumber(body.startHour);
  const duration = toNumber(body.duration);
  
  // Si tenemos hora inicio y duración, calculamos la hora fin
  // De lo contrario usamos la hora fin que envió el frontend
  const computedEndHour =
    Number.isFinite(startHour) && Number.isFinite(duration)
      ? startHour + duration
      : toNumber(body.endHour);

  return {
    dateKey: normalizeText(body.dateKey),
    zoneKey: normalizeText(body.zoneKey),
    zoneLabel: normalizeText(body.zoneLabel),
    startHour,
    endHour: computedEndHour,
    duration,
    userId: normalizeText(body.userId),
    residentName: normalizeText(body.residentName),
    residentEmail: normalizeText(body.residentEmail),
    cedula: normalizeText(body.cedula),
    torre: normalizeText(body.torre),
    apartamento: normalizeText(body.apartamento),
  };
};

// Valida que una reserva tenga todos los campos obligatorios
// Antes de intentar guardarla en la base de datos
const hasRequiredReservaFields = (reserva) =>
  reserva.dateKey &&
  reserva.zoneKey &&
  reserva.zoneLabel &&
  Number.isFinite(reserva.startHour) &&
  Number.isFinite(reserva.endHour) &&
  Number.isFinite(reserva.duration) &&
  reserva.userId;

// Verifica si dos reservas se solapan en tiempo y zona
// Dos reservas se superponen si:
//   - Son del mismo día
//   - Son de la misma zona
//   - Los horarios se intersectan
const hasReservationOverlap = (existingReservation, nextReservation) =>
  existingReservation.dateKey === nextReservation.dateKey &&
  existingReservation.zoneKey === nextReservation.zoneKey &&
  nextReservation.startHour < existingReservation.endHour &&
  nextReservation.endHour > existingReservation.startHour;

// ======== VALIDACIONES PRINCIPALES ========

// Realiza todas las validaciones de negocio para una reserva
// Retorna { valid: bool, message: string }
// Si valid es false, message explica por qué no es válida la reserva
const getReservationValidation = ({ reservas, reserva, reservationId }) => {
  const zoneRule = getZoneRule(reserva.zoneKey);
  const now = new Date();

  // Validación 1: La zona existe y tiene reglas definidas
  if (!zoneRule) {
    return { valid: false, message: "La zona seleccionada no existe." };
  }

  // Validación 2: Se proporciona una fecha
  if (!reserva.dateKey) {
    return { valid: false, message: "Debes indicar la fecha de la reserva." };
  }

  // Validación 3: No se pueden reservar fechas pasadas
  if (isPastDateKey(reserva.dateKey, now)) {
    return { valid: false, message: "No puedes reservar días anteriores." };
  }

  // Validación 4: Duración válida y mayor a 0
  if (!Number.isFinite(reserva.duration) || reserva.duration <= 0) {
    return { valid: false, message: "La duración de la reserva no es válida." };
  }

  // Validación 5: Hora de inicio dentro del horario permitido (7 AM a 10 PM)
  if (reserva.startHour < OPENING_HOUR || reserva.startHour >= CLOSING_HOUR) {
    return {
      valid: false,
      message: "Las reservas solo se permiten entre las 7:00 AM y las 10:00 PM.",
    };
  }

  // Validación 6: Hora de fin no puede exceder las 10 PM
  if (reserva.endHour > CLOSING_HOUR) {
    return {
      valid: false,
      message: "La reserva debe terminar a más tardar a las 10:00 PM.",
    };
  }

  // Validación 7: Duración no excede el máximo permitido para la zona
  if (reserva.duration > zoneRule.maxHours) {
    return {
      valid: false,
      message: `La zona ${zoneRule.label} solo permite ${zoneRule.maxHours} hora(s) por residente.`,
    };
  }

  // Validación 8: No se pueden reservar horas que ya pasaron hoy
  if (
    reserva.dateKey === formatDateKey(now) &&
    reserva.startHour < Math.max(OPENING_HOUR, getCurrentBookableHour(now))
  ) {
    return {
      valid: false,
      message: "No puedes reservar horas que ya pasaron en el día de hoy.",
    };
  }

  // Obtener reservas existentes (excluyendo esta si se está editando)
  const comparableReservas = reservas.filter((existingReservation) => existingReservation.id !== reservationId);
  
  // Encontrar reservas que se superponen con la nueva
  const overlappingReservations = comparableReservas.filter((existingReservation) =>
    hasReservationOverlap(existingReservation, reserva)
  );

  // Validación 9: Chequear capacidad o exclusividad según el tipo de zona
  if (isSharedCapacityZone(reserva.zoneKey)) {
    // ZONAS DE CAPACIDAD COMPARTIDA (piscina, gimnasio):
    // Múltiples residentes pueden estar simultáneamente, pero hay un límite
    // Contar cuántos residentes diferentes tienen reservas superpuestas
    const overlappingUsers = new Set(
      overlappingReservations.map((existingReservation) => existingReservation.userId).filter(Boolean)
    );

    // Si el residente actual no está en el conjunto Y ya hay máximo de residentes, rechazar
    if (!overlappingUsers.has(reserva.userId) && overlappingUsers.size >= MAX_SHARED_ZONE_RESIDENTS) {
      return {
        valid: false,
        message: `La ${zoneRule.label.toLowerCase()} ya alcanzó el límite de ${MAX_SHARED_ZONE_RESIDENTS} residentes en ese horario.`,
      };
    }
  } else if (overlappingReservations.length > 0) {
    // ZONAS EXCLUSIVAS (BBQ, cancha, salón):
    // Solo un residente (o grupo de residentes) puede usar la zona en un horario dado
    return {
      valid: false,
      message: "Esa zona ya está reservada en ese horario. Elige otra hora.",
    };
  }

  // Validación 10: Un residente no puede tener múltiples reservas en la misma zona el mismo día
  const ownReservationsForZoneAndDay = comparableReservas.filter(
    (existingReservation) =>
      existingReservation.userId === reserva.userId &&
      existingReservation.dateKey === reserva.dateKey &&
      existingReservation.zoneKey === reserva.zoneKey
  );

  if (ownReservationsForZoneAndDay.length > 0) {
    return {
      valid: false,
      message:
        "Solo puedes tener una reserva por zona en el mismo día. Si necesitas otro horario, edita la actual o elimínala y crea una nueva.",
    };
  }

  // Validación 11: Total de horas reservadas por el residente no excede el máximo del día
  const currentReservedHours = ownReservationsForZoneAndDay.reduce(
    (total, existingReservation) => total + existingReservation.duration,
    0
  );

  if (currentReservedHours + reserva.duration > zoneRule.maxHours) {
    return {
      valid: false,
      message: `No puedes superar ${zoneRule.maxHours} hora(s) en ${zoneRule.label} durante el mismo día.`,
    };
  }

  // ¡Todas las validaciones pasaron!
  return { valid: true, message: "" };
};

// Obtiene TODAS las reservas de la base de datos
const getAllReservas = async () => {
  const snapshot = await reservasCollection().get();
  return snapshot.docs.map(mapReserva).sort(sortReservas);
};

// ======== ENDPOINTS API ========

// GET /api/reservas
// Consulta todas las reservas existentes para alimentar el calendario del frontend.
const listarReservas = async (req, res) => {
  try {
    const reservas = await getAllReservas();
    return res.status(200).json(reservas);
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

// POST /api/reservas
// Valida todos los campos y reglas de negocio, luego guarda una nueva reserva.
const crearReserva = async (req, res) => {
  const reserva = buildReservaPayload(req.body);

  if (!hasRequiredReservaFields(reserva)) {
    return res.status(400).json({
      mensaje: "Faltan datos obligatorios para registrar la reserva.",
    });
  }

  try {
    // Obtener todas las reservas para validar conflictos
    const reservas = await getAllReservas();
    const validation = getReservationValidation({ reservas, reserva });

    // Si alguna validación falló, rechazar la solicitud
    if (!validation.valid) {
      return res.status(400).json({ mensaje: validation.message });
    }

    // ¡Validaciones OK! Guardar en Firestore
    const ref = await reservasCollection().add({
      ...reserva,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      mensaje: "Reserva registrada correctamente.",
      reserva: {
        id: ref.id,
        ...reserva,
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

// PUT /api/reservas/:id
// Actualiza una reserva existente sin permitir cambiar el residente propietario.
const actualizarReserva = async (req, res) => {
  const { id } = req.params;
  // Normalizar datos del request
  const reserva = buildReservaPayload(req.body);

  // Validar que tenemos todos los campos obligatorios
  if (!hasRequiredReservaFields(reserva)) {
    return res.status(400).json({
      mensaje: "Faltan datos obligatorios para actualizar la reserva.",
    });
  }

  try {
    // Obtener la reserva actual de Firestore
    const docRef = reservasCollection().doc(id);
    const snapshot = await docRef.get();

    // Verificar que la reserva existe
    if (!snapshot.exists) {
      return res.status(404).json({ mensaje: "La reserva que intentas editar no existe." });
    }

    // Mapear datos de la reserva existente
    const existingReservation = mapReserva(snapshot);

    // SEGURIDAD: No permitir cambiar el propietario (userId) de una reserva
    if (
      existingReservation.userId &&
      reserva.userId &&
      existingReservation.userId !== reserva.userId
    ) {
      return res.status(403).json({
        mensaje: "No puedes cambiar el residente asociado a la reserva.",
      });
    }

    // Validar la nueva configuración de la reserva
    const reservas = await getAllReservas();
    const validation = getReservationValidation({ reservas, reserva, reservationId: id });

    if (!validation.valid) {
      return res.status(400).json({ mensaje: validation.message });
    }

    // ¡Validaciones OK! Actualizar la reserva
    await docRef.update({
      ...reserva,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      mensaje: "Reserva actualizada correctamente.",
      reserva: {
        id,
        ...reserva,
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

// DELETE /api/reservas/:id
// Elimina una reserva de la base de datos.
const eliminarReserva = async (req, res) => {
  const { id } = req.params;

  try {
    // Eliminar documento de Firestore
    await reservasCollection().doc(id).delete();
    return res.status(200).json({ mensaje: "Reserva eliminada correctamente." });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

// ======== EXPORTAR CONTROLADOR ========

module.exports = {
  actualizarReserva,
  crearReserva,
  eliminarReserva,
  listarReservas,
};
