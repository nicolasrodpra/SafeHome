// Controlador de visitantes.
// Guarda ingresos del dia, permite actualizarlos y elimina automaticamente
// los registros de dias anteriores para mantener limpio el modulo.
const admin = require("../../config/firebaseAdmin");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates");

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

const crearVisitante = async (req, res) => {
  const { nombre, documento, residente, torre, apartamento, motivo, telefono } = req.body;

  if (!nombre || !documento || !residente || !torre || !apartamento || !motivo || !telefono) {
    return res.status(400).json({ mensaje: "Completa todos los campos" });
  }

  try {
    const visitante = {
      nombre,
      documento,
      residente,
      torre,
      apartamento,
      motivo,
      telefono,
    };

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
  const { nombre, documento, residente, torre, apartamento, motivo, telefono } = req.body;

  if (!nombre || !documento || !residente || !torre || !apartamento || !motivo || !telefono) {
    return res.status(400).json({ mensaje: "Completa todos los campos" });
  }

  try {
    const visitante = {
      nombre,
      documento,
      residente,
      torre,
      apartamento,
      motivo,
      telefono,
    };

    await visitantesCollection().doc(id).update({
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
    await visitantesCollection().doc(id).delete();
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
