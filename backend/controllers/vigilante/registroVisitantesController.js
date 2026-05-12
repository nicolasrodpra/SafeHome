// Controlador de visitantes.
// Guarda ingresos del día, permite actualizarlos y elimina automáticamente
// los registros de días anteriores para mantener limpio el módulo.
const admin = require("../../config/firebaseAdmin");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates");
const { normalizeText } = require("../../utils/text");
const { isNumericText, normalizeLocationValue } = require("../../utils/validation");

const visitantesCollection = () => admin.firestore().collection("visitantes");
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const obtenerFechaVisitante = (data = {}) => toDate(data.createdAt || data.fecha);

const obtenerInicioDia = (dateValue = new Date()) => {
  const nextDate = new Date(dateValue);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const mapVisitante = (snapshotDoc) => {
  const data = snapshotDoc.data();
  const fechaVisitante = obtenerFechaVisitante(data);

  return {
    id: snapshotDoc.id,
    ...data,
    fecha: formatDateLabel(fechaVisitante) || "",
    hora: formatTimeLabel(fechaVisitante) || "",
  };
};

const limpiarVisitantesAntiguos = async () => {
  const snapshot = await visitantesCollection().get();
  const inicioHoy = obtenerInicioDia(new Date()).getTime();

  const docsToDelete = snapshot.docs.filter((snapshotDoc) => {
    const fechaVisitante = obtenerFechaVisitante(snapshotDoc.data());

    if (!fechaVisitante) {
      return false;
    }

    const diferencia = inicioHoy - obtenerInicioDia(fechaVisitante).getTime();
    return diferencia >= MILLISECONDS_PER_DAY;
  });

  if (!docsToDelete.length) {
    return;
  }

  const batch = admin.firestore().batch();
  docsToDelete.forEach((snapshotDoc) => batch.delete(snapshotDoc.ref));
  await batch.commit();
};

const obtenerVisitantes = async (req, res) => {
  try {
    await limpiarVisitantesAntiguos();

    const snapshot = await visitantesCollection().get();
    const visitantes = snapshot.docs.map(mapVisitante);

    return res.status(200).json(visitantes);
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const normalizarVisitante = (payload = {}) => ({
  nombre: normalizeText(payload.nombre),
  documento: normalizeText(payload.documento),
  residente: normalizeText(payload.residente),
  torre: normalizeLocationValue(payload.torre),
  apartamento: normalizeLocationValue(payload.apartamento),
  motivo: normalizeText(payload.motivo),
  telefono: normalizeText(payload.telefono),
});

const validarVisitante = (visitante) => {
  const camposFaltantes = Object.entries(visitante)
    .filter(([, value]) => !value)
    .map(([field]) => field);

  if (camposFaltantes.length > 0) {
    return `Completa estos campos: ${camposFaltantes.join(", ")}.`;
  }

  if (!isNumericText(visitante.documento)) {
    return "El documento del visitante solo puede contener numeros.";
  }

  if (!isNumericText(visitante.telefono)) {
    return "El telefono del visitante solo puede contener numeros.";
  }

  return "";
};

const crearVisitante = async (req, res) => {
  const visitante = normalizarVisitante(req.body);
  const mensajeValidacion = validarVisitante(visitante);

  if (mensajeValidacion) {
    return res.status(400).json({ mensaje: mensajeValidacion });
  }

  try {
    const ref = await visitantesCollection().add({
      ...visitante,
      fecha: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      mensaje: "Visitante registrado",
      visitante: { id: ref.id, ...visitante },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const actualizarVisitante = async (req, res) => {
  const { id } = req.params;
  const visitante = normalizarVisitante(req.body);
  const mensajeValidacion = validarVisitante(visitante);

  if (mensajeValidacion) {
    return res.status(400).json({ mensaje: mensajeValidacion });
  }

  try {
    const docRef = visitantesCollection().doc(id);
    const currentDoc = await docRef.get();

    if (!currentDoc.exists) {
      return res.status(404).json({ mensaje: "No se encontro el visitante." });
    }

    await docRef.update({
      ...visitante,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      mensaje: "Visitante actualizado",
      visitante: { id, ...visitante },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const eliminarVisitante = async (req, res) => {
  const { id } = req.params;

  try {
    const docRef = visitantesCollection().doc(id);
    const currentDoc = await docRef.get();

    if (!currentDoc.exists) {
      return res.status(404).json({ mensaje: "No se encontro el visitante." });
    }

    await docRef.delete();
    return res.status(200).json({ mensaje: "Visitante eliminado" });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  obtenerVisitantes,
  crearVisitante,
  actualizarVisitante,
  eliminarVisitante,
  limpiarVisitantesAntiguos,
};
