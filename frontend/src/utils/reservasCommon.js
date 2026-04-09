// =====================================================
// UTILIDADES COMPARTIDAS DEL MÓDULO DE RESERVAS
// =====================================================
// Contiene constantes, formatos de fecha/hora, y lógica
// usada en componentes del calendario de reservas.
// Esta lógica se replica en el backend para validar en servidor.

// Horarios de operación de zonas comunes
export const OPENING_HOUR = 7;     // 7 AM
export const CLOSING_HOUR = 22;    // 10 PM
// Límite de residentes simultáneos en zonas de capacidad compartida
export const MAX_SHARED_ZONE_RESIDENTS = 10;

// Lista de zonas comunes disponibles para reservar
// Cada zona tiene reglas de duración máxima y un color para el calendario
export const RESERVA_ZONAS = [
  {
    key: "piscina",
    label: "Piscina",
    maxHours: 1,        // Máximo 1 hora por residente
    colorToken: "pool", // Color en la UI
  },
  {
    key: "zona_bbq",
    label: "Zona BBQ",
    maxHours: 5,
    colorToken: "bbq",
  },
  {
    key: "cancha_futbol",
    label: "Cancha de Fútbol",
    maxHours: 2,
    colorToken: "field",
  },
  {
    key: "salon_comunal",
    label: "Salón Comunal",
    maxHours: 5,
    colorToken: "hall",
  },
  {
    key: "gimnasio",
    label: "Gimnasio",
    maxHours: 3,
    colorToken: "gym",
  },
];

// Nombres de días para el calendario completo y mini calendarios
export const CALENDAR_DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sab"];
export const MINI_CALENDAR_DAY_NAMES = ["D", "L", "M", "X", "J", "V", "S"];

// Zonas donde múltiples residentes pueden estar simultáneamente
// Las otras zonas son de uso exclusivo (solo un grupo por horario)
const SHARED_CAPACITY_ZONE_KEYS = new Set(["piscina", "gimnasio"]);

// Formateadores de fecha en español (colombiano)
const monthFormatter = new Intl.DateTimeFormat("es-CO", {
  month: "short",
  year: "numeric",
});

const fullDateFormatter = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// ======== UTILIDADES DE FECHA ========

// Rellena números con cero a la izquierda (1 -> "01")
const padNumber = (value) => String(value).padStart(2, "0");

// Convierte una Date a formato string "YYYY-MM-DD" (clave de reserva)
export const formatDateKey = (date) =>
  `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;

// Convierte un string "YYYY-MM-DD" de vuelta a Date
export const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

// Obtiene el nombre del mes con el año (Ej: "abr. 2026")
export const getMonthLabel = (date) => {
  const formatted = monthFormatter.format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

// Obtiene la fecha completa legible (Ej: "Miércoles, 8 de abril de 2026")
export const getFullDateLabel = (dateKey) => {
  const formatted = fullDateFormatter.format(parseDateKey(dateKey));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

// Retorna el primer día del mes
export const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

// Suma meses a una fecha
export const addMonths = (date, amount) =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

// Calcula la cantidad de días en un mes
export const getDaysInMonth = (year, monthIndex) =>
  new Date(year, monthIndex + 1, 0).getDate();

// Obtiene los metadatos de una zona (label, colores, reglas)
export const getZoneMeta = (zoneKey) =>
  RESERVA_ZONAS.find((zone) => zone.key === zoneKey) || null;

// Verifica si una zona permite múltiples residentes simultáneamente
export const isSharedCapacityZone = (zoneKey) => SHARED_CAPACITY_ZONE_KEYS.has(zoneKey);

// ======== UTILIDADES DE HORA ========

// Formatea una hora en formato 12 horas (Ej: 14 -> "2:00 PM")
export const formatHourLabel = (hour) => {
  const normalizedHour = hour % 12 || 12;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${normalizedHour}:00 ${suffix}`;
};

// Formatea un rango de horas (Ej: "2:00 PM - 3:00 PM")
export const formatReservationRange = (startHour, endHour) =>
  `${formatHourLabel(startHour)} - ${formatHourLabel(endHour)}`;

// Ordena reservas por fecha y luego por hora de inicio
export const sortReservationsByTime = (reservationA, reservationB) => {
  if (reservationA.dateKey !== reservationB.dateKey) {
    return reservationA.dateKey.localeCompare(reservationB.dateKey);
  }

  if (reservationA.startHour !== reservationB.startHour) {
    return reservationA.startHour - reservationB.startHour;
  }

  return reservationA.zoneLabel.localeCompare(reservationB.zoneLabel, "es");
};

// ======== UTILIDADES DE CALENDARIO ========

// Construye todas las celdas de un mes para renderizar en un grid
// Incluye espacios vacíos del mes anterior y siguiente para mantener una grilla rectangular
export const buildMonthCells = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  // Día de la semana en que empieza el mes (0 = domingo, 6 = sábado)
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  // Total de celdas para un grid rectangular (múltiplo de 7)
  const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - firstDayOfMonth + 1;

    // null para espacios vacíos (días del mes anterior/siguiente)
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return null;
    }

    const cellDate = new Date(year, month, dayNumber);

    return {
      dayNumber,
      date: cellDate,
      dateKey: formatDateKey(cellDate),
    };
  });
};

// Construye los días del mes para un mini calendario (sin espacios vacíos)
export const buildMiniCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);

  return Array.from({ length: firstDayOfMonth + daysInMonth }, (_, index) => {
    const dayNumber = index - firstDayOfMonth + 1;

    // Retornar null para los días antes del primer día del mes
    if (index < firstDayOfMonth) {
      return null;
    }

    const dayDate = new Date(year, month, dayNumber);

    return {
      dayNumber,
      date: dayDate,
      dateKey: formatDateKey(dayDate),
    };
  });
};

// Verifica si una fecha pertenece al mes especificado
export const isDateKeyInMonth = (dateKey, monthDate) => {
  const date = parseDateKey(dateKey);

  return (
    date.getFullYear() === monthDate.getFullYear() &&
    date.getMonth() === monthDate.getMonth()
  );
};

// Verifica si una fecha en formato "YYYY-MM-DD" ya pasó
export const isPastDateKey = (dateKey, baseDate = new Date()) => {
  const reservationDate = parseDateKey(dateKey);
  const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

  return reservationDate < today;
};

// Calcula la próxima hora completa reservable
// Si es en medio de una hora, devuelve la siguiente hora completa
export const getCurrentBookableHour = (baseDate = new Date()) => {
  const currentHour = baseDate.getHours();
  const needsNextHour =
    baseDate.getMinutes() > 0 || baseDate.getSeconds() > 0 || baseDate.getMilliseconds() > 0;

  return currentHour + (needsNextHour ? 1 : 0);
};

// ======== UTILIDADES DE DISPONIBILIDAD ========

// Calcula las horas disponibles para iniciar una reserva
// Para hoy, excluye las horas que ya pasaron
// Para fechas futuras, devuelve todas las horas de operación
export const getAvailableStartHours = (dateKey, baseDate = new Date()) => {
  // Si no hay fecha o la fecha ya pasó, no hay horas disponibles.
  if (!dateKey || isPastDateKey(dateKey, baseDate)) {
    return [];
  }

  const hours = [];
  // Verifica si la fecha corresponde al día actual.
  const isToday = dateKey === formatDateKey(baseDate);
  // Para hoy, la hora mínima es la siguiente hora disponible.
  // Para fechas futuras, usamos la hora de apertura.
  const minimumHour = isToday
    ? Math.max(OPENING_HOUR, getCurrentBookableHour(baseDate))
    : OPENING_HOUR;

  // Acumula todas las horas disponibles desde el mínimo hasta el cierre.
  for (let hour = minimumHour; hour < CLOSING_HOUR; hour += 1) {
    hours.push(hour);
  }

  return hours;
};

export const getAvailableDurations = (zoneKey, startHour) => {
  const zone = getZoneMeta(zoneKey);

  if (!zone || !Number.isFinite(startHour)) {
    return [];
  }

  const maxDuration = Math.min(zone.maxHours, CLOSING_HOUR - startHour);

  return Array.from({ length: Math.max(maxDuration, 0) }, (_, index) => index + 1);
};

export const canManageReservation = (reservation, userId, baseDate = new Date()) => {
  if (!reservation || reservation.userId !== userId) {
    return false;
  }

  if (isPastDateKey(reservation.dateKey, baseDate)) {
    return false;
  }

  if (reservation.dateKey !== formatDateKey(baseDate)) {
    return true;
  }

  return reservation.startHour >= getCurrentBookableHour(baseDate);
};

export const isUpcomingReservation = (reservation, baseDate = new Date()) => {
  if (isPastDateKey(reservation.dateKey, baseDate)) {
    return false;
  }

  if (reservation.dateKey !== formatDateKey(baseDate)) {
    return true;
  }

  return reservation.endHour > baseDate.getHours();
};

const hasReservationOverlap = (reservation, { dateKey, zoneKey, startHour, endHour }) =>
  reservation.dateKey === dateKey &&
  reservation.zoneKey === zoneKey &&
  startHour < reservation.endHour &&
  endHour > reservation.startHour;

// Aquí reunimos las reglas del negocio para avisarle al usuario, paso a paso,
// por qué una reserva es válida o qué condición le falta cumplir.
export const getReservationValidation = ({
  reservations,
  dateKey,
  zoneKey,
  startHour,
  duration,
  userId,
  reservationId,
  baseDate = new Date(),
}) => {
  if (!dateKey) {
    return { valid: false, message: "Selecciona una fecha para reservar." };
  }

  if (!zoneKey) {
    return { valid: false, message: "Selecciona una zona común." };
  }

  if (!Number.isFinite(startHour) || !Number.isFinite(duration) || duration <= 0) {
    return { valid: false, message: "Selecciona una hora de inicio y una duración válidas." };
  }

  if (isPastDateKey(dateKey, baseDate)) {
    return { valid: false, message: "No puedes reservar días anteriores." };
  }

  const zone = getZoneMeta(zoneKey);

  if (!zone) {
    return { valid: false, message: "La zona seleccionada no existe." };
  }

  if (startHour < OPENING_HOUR || startHour >= CLOSING_HOUR) {
    return {
      valid: false,
      message: "Las reservas solo se permiten entre las 7:00 AM y las 10:00 PM.",
    };
  }

  const endHour = startHour + duration;

  if (endHour > CLOSING_HOUR) {
    return {
      valid: false,
      message: "La reserva debe terminar a más tardar a las 10:00 PM.",
    };
  }

  if (duration > zone.maxHours) {
    return {
      valid: false,
      message: `La zona ${zone.label} solo permite ${zone.maxHours} hora(s) por residente.`,
    };
  }

  if (
    dateKey === formatDateKey(baseDate) &&
    startHour < Math.max(OPENING_HOUR, getCurrentBookableHour(baseDate))
  ) {
    return {
      valid: false,
      message: "No puedes reservar horas que ya pasaron en el día de hoy.",
    };
  }

  const comparableReservations = reservations.filter(
    (reservation) => reservation.id !== reservationId
  );

  const overlappingReservations = comparableReservations.filter((reservation) =>
    hasReservationOverlap(reservation, { dateKey, zoneKey, startHour, endHour })
  );

  if (isSharedCapacityZone(zoneKey)) {
    const overlappingUsers = new Set(
      overlappingReservations.map((reservation) => reservation.userId).filter(Boolean)
    );

    if (!overlappingUsers.has(userId) && overlappingUsers.size >= MAX_SHARED_ZONE_RESIDENTS) {
      return {
        valid: false,
        message: `La ${zone.label.toLowerCase()} ya alcanzó el límite de ${MAX_SHARED_ZONE_RESIDENTS} residentes en ese horario.`,
      };
    }
  } else if (overlappingReservations.length > 0) {
    return {
      valid: false,
      message: "Esa zona ya está reservada en ese horario. Elige otra hora.",
    };
  }

  const ownReservationsForZoneAndDay = comparableReservations.filter(
    (reservation) =>
      reservation.userId === userId &&
      reservation.dateKey === dateKey &&
      reservation.zoneKey === zoneKey
  );

  if (ownReservationsForZoneAndDay.length > 0) {
    return {
      valid: false,
      message:
        "Solo puedes tener una reserva por zona en el mismo día. Si necesitas otro horario, edita la actual o cancélala y crea una nueva.",
    };
  }

  const currentReservedHours = ownReservationsForZoneAndDay.reduce(
    (total, reservation) => total + reservation.duration,
    0
  );

  if (currentReservedHours + duration > zone.maxHours) {
    return {
      valid: false,
      message: `No puedes superar ${zone.maxHours} hora(s) en ${zone.label} durante el mismo día.`,
    };
  }

  return { valid: true, message: "" };
};
