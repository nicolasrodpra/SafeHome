const admin = require("../../config/firebaseAdmin");
const { normalizeText } = require("../../utils/text");

const reservasCollection = () => admin.firestore().collection("reservasZonasComunes");

const toNumber = (value) => Number(value);

// Ordenamos primero por fecha y luego por hora para que el calendario
// pueda renderizar las reservas en el orden natural.
const sortReservas = (firstReservation, secondReservation) => {
  if (firstReservation.dateKey !== secondReservation.dateKey) {
    return firstReservation.dateKey.localeCompare(secondReservation.dateKey);
  }

  return firstReservation.startHour - secondReservation.startHour;
};

// Aquí dejamos todos los datos de una reserva en el tipo correcto
// para que el frontend no tenga que adivinar si algo llegó como texto.
const mapReserva = (snapshotDoc) => {
  const data = snapshotDoc.data();

  return {
    id: snapshotDoc.id,
    dateKey: normalizeText(data.dateKey),
    zoneKey: normalizeText(data.zoneKey),
    zoneLabel: normalizeText(data.zoneLabel),
    startHour: toNumber(data.startHour),
    endHour: toNumber(data.endHour),
    duration: toNumber(data.duration),
    userId: normalizeText(data.userId),
    residentName: normalizeText(data.residentName),
    residentEmail: normalizeText(data.residentEmail),
    cedula: normalizeText(data.cedula),
    torre: normalizeText(data.torre),
    apartamento: normalizeText(data.apartamento),
  };
};

// Consulta todas las reservas existentes para alimentar el calendario del frontend.
const listarReservas = async (req, res) => {
  try {
    const snapshot = await reservasCollection().get();
    const reservas = snapshot.docs.map(mapReserva).sort(sortReservas);

    return res.status(200).json(reservas);
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

// Valida y guarda una nueva reserva de zona común.
const crearReserva = async (req, res) => {
  const reserva = {
    dateKey: normalizeText(req.body?.dateKey),
    zoneKey: normalizeText(req.body?.zoneKey),
    zoneLabel: normalizeText(req.body?.zoneLabel),
    startHour: toNumber(req.body?.startHour),
    endHour: toNumber(req.body?.endHour),
    duration: toNumber(req.body?.duration),
    userId: normalizeText(req.body?.userId),
    residentName: normalizeText(req.body?.residentName),
    residentEmail: normalizeText(req.body?.residentEmail),
    cedula: normalizeText(req.body?.cedula),
    torre: normalizeText(req.body?.torre),
    apartamento: normalizeText(req.body?.apartamento),
  };

  if (
    !reserva.dateKey ||
    !reserva.zoneKey ||
    !reserva.zoneLabel ||
    !Number.isFinite(reserva.startHour) ||
    !Number.isFinite(reserva.endHour) ||
    !Number.isFinite(reserva.duration) ||
    !reserva.userId
  ) {
    return res.status(400).json({
      mensaje: "Faltan datos obligatorios para registrar la reserva.",
    });
  }

  try {
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

// Elimina la reserva indicada por su id.
const eliminarReserva = async (req, res) => {
  const { id } = req.params;

  try {
    await reservasCollection().doc(id).delete();
    return res.status(200).json({ mensaje: "Reserva eliminada correctamente." });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  crearReserva,
  eliminarReserva,
  listarReservas,
};
