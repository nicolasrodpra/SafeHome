export const OPENING_HOUR = 7;
export const CLOSING_HOUR = 22;

export const RESERVA_ZONAS = [
  {
    key: "piscina",
    label: "Piscina",
    maxHours: 1,
    colorToken: "pool",
  },
  {
    key: "zona_bbq",
    label: "Zona BBQ",
    maxHours: 5,
    colorToken: "bbq",
  },
  {
    key: "cancha_futbol",
    label: "Cancha de Futbol",
    maxHours: 2,
    colorToken: "field",
  },
  {
    key: "salon_comunal",
    label: "Salon Comunal",
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

export const CALENDAR_DAY_NAMES = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
export const MINI_CALENDAR_DAY_NAMES = ["D", "L", "M", "X", "J", "V", "S"];

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

const padNumber = (value) => String(value).padStart(2, "0");

export const formatDateKey = (date) =>
  `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`;

export const parseDateKey = (dateKey) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const getMonthLabel = (date) => {
  const formatted = monthFormatter.format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const getFullDateLabel = (dateKey) => {
  const formatted = fullDateFormatter.format(parseDateKey(dateKey));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

export const addMonths = (date, amount) =>
  new Date(date.getFullYear(), date.getMonth() + amount, 1);

export const getDaysInMonth = (year, monthIndex) =>
  new Date(year, monthIndex + 1, 0).getDate();

export const getZoneMeta = (zoneKey) =>
  RESERVA_ZONAS.find((zone) => zone.key === zoneKey) || null;

export const formatHourLabel = (hour) => {
  const normalizedHour = hour % 12 || 12;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${normalizedHour}:00 ${suffix}`;
};

export const formatReservationRange = (startHour, endHour) =>
  `${formatHourLabel(startHour)} - ${formatHourLabel(endHour)}`;

export const sortReservationsByTime = (reservationA, reservationB) => {
  if (reservationA.dateKey !== reservationB.dateKey) {
    return reservationA.dateKey.localeCompare(reservationB.dateKey);
  }

  if (reservationA.startHour !== reservationB.startHour) {
    return reservationA.startHour - reservationB.startHour;
  }

  return reservationA.zoneLabel.localeCompare(reservationB.zoneLabel, "es");
};

export const buildMonthCells = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const dayNumber = index - firstDayOfMonth + 1;

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

export const buildMiniCalendarDays = (monthDate) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);

  return Array.from({ length: firstDayOfMonth + daysInMonth }, (_, index) => {
    const dayNumber = index - firstDayOfMonth + 1;

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

export const isDateKeyInMonth = (dateKey, monthDate) => {
  const date = parseDateKey(dateKey);

  return (
    date.getFullYear() === monthDate.getFullYear() &&
    date.getMonth() === monthDate.getMonth()
  );
};

export const isPastDateKey = (dateKey, baseDate = new Date()) => {
  const reservationDate = parseDateKey(dateKey);
  const today = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());

  return reservationDate < today;
};

export const getCurrentBookableHour = (baseDate = new Date()) => {
  const currentHour = baseDate.getHours();
  const needsNextHour =
    baseDate.getMinutes() > 0 || baseDate.getSeconds() > 0 || baseDate.getMilliseconds() > 0;

  return currentHour + (needsNextHour ? 1 : 0);
};

export const getAvailableStartHours = (dateKey, baseDate = new Date()) => {
  if (!dateKey || isPastDateKey(dateKey, baseDate)) {
    return [];
  }

  const hours = [];
  const isToday = dateKey === formatDateKey(baseDate);
  const minimumHour = isToday
    ? Math.max(OPENING_HOUR, getCurrentBookableHour(baseDate))
    : OPENING_HOUR;

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

export const getReservationValidation = ({
  reservations,
  dateKey,
  zoneKey,
  startHour,
  duration,
  userId,
  baseDate = new Date(),
}) => {
  if (!dateKey) {
    return { valid: false, message: "Selecciona una fecha para reservar." };
  }

  if (!zoneKey) {
    return { valid: false, message: "Selecciona una zona comun." };
  }

  if (!Number.isFinite(startHour) || !Number.isFinite(duration)) {
    return { valid: false, message: "Selecciona una hora de inicio y una duracion validas." };
  }

  if (isPastDateKey(dateKey, baseDate)) {
    return { valid: false, message: "No puedes reservar dias anteriores." };
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
      message: "La reserva debe terminar a mas tardar a las 10:00 PM.",
    };
  }

  if (duration > zone.maxHours) {
    return {
      valid: false,
      message: `La zona ${zone.label} solo permite ${zone.maxHours} hora(s) por usuario.`,
    };
  }

  if (
    dateKey === formatDateKey(baseDate) &&
    startHour < Math.max(OPENING_HOUR, getCurrentBookableHour(baseDate))
  ) {
    return {
      valid: false,
      message: "No puedes reservar horas que ya pasaron en el dia de hoy.",
    };
  }

  const conflictingReservation = reservations.find(
    (reservation) =>
      reservation.dateKey === dateKey &&
      reservation.zoneKey === zoneKey &&
      startHour < reservation.endHour &&
      endHour > reservation.startHour
  );

  if (conflictingReservation) {
    return {
      valid: false,
      message: "Esa zona ya esta reservada en ese horario. Elige otra hora.",
    };
  }

  const ownReservationsForZoneAndDay = reservations.filter(
    (reservation) =>
      reservation.userId === userId &&
      reservation.dateKey === dateKey &&
      reservation.zoneKey === zoneKey
  );

  if (ownReservationsForZoneAndDay.length > 0) {
    return {
      valid: false,
      message:
        "Solo puedes tener una reserva por zona en el mismo dia. Si necesitas otro horario, cancela la actual y crea una nueva.",
    };
  }

  const currentReservedHours = ownReservationsForZoneAndDay.reduce(
    (total, reservation) => total + reservation.duration,
    0
  );

  if (currentReservedHours + duration > zone.maxHours) {
    return {
      valid: false,
      message: `No puedes superar ${zone.maxHours} hora(s) en ${zone.label} para el mismo dia.`,
    };
  }

  return { valid: true, message: "" };
};
