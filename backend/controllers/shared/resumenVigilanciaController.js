// Controlador del resumen de vigilancia.
// Cuenta registros del día para alimentar el tablero del vigilante.
const admin = require("../../config/firebaseAdmin");
const { toDate } = require("../../utils/firestoreDates");

// Esta comparación revisa si una fecha pertenece al día actual.
// La usamos para contar solo los registros de hoy.
const isToday = (timestamp) => {
  const dateValue = toDate(timestamp);

  if (!dateValue) {
    return false;
  }

  const now = new Date();

  return (
    dateValue.getFullYear() === now.getFullYear() &&
    dateValue.getMonth() === now.getMonth() &&
    dateValue.getDate() === now.getDate()
  );
};

// Cuenta cuántos documentos de una colección tienen fecha del día actual.
const countTodayRecords = async (collectionName) => {
  const snapshot = await admin.firestore().collection(collectionName).get();

  return snapshot.docs.filter((snapshotDoc) => isToday(snapshotDoc.data().fecha)).length;
};

// Devuelve un resumen rápido para el tablero de vigilancia.
const obtenerResumenVigilancia = async (req, res) => {
  try {
    const [vehiculosHoy, correspondenciaHoy, visitantesHoy] = await Promise.all([
      countTodayRecords("vehiculos"),
      countTodayRecords("correspondencia"),
      countTodayRecords("visitantes"),
    ]);

    return res.status(200).json({
      vehiculosHoy,
      correspondenciaHoy,
      visitantesHoy,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  obtenerResumenVigilancia,
};
