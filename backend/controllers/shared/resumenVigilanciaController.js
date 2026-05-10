// Controlador del resumen de vigilancia.
// Cuenta registros del día para alimentar el tablero del vigilante.
const admin = require("../../config/firebaseAdmin");
const { toDate } = require("../../utils/firestoreDates");
const { normalizeText } = require("../../utils/text");
const { readVigilanciaConfig, vigilanciaConfigDoc } = require("../../utils/vigilanciaConfig");

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

const parsePositiveNumber = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsedValue = Number(String(value || "").replace(",", ".").trim());
  return Number.isFinite(parsedValue) ? parsedValue : NaN;
};

const sincronizarTarifaVigilantes = async (tarifaHoraVigilante) => {
  const snapshot = await admin.firestore().collection("users").where("rol", "==", "Vigilante").get();

  if (snapshot.empty) {
    return;
  }

  const batch = admin.firestore().batch();
  snapshot.docs.forEach((docSnapshot) => {
    batch.update(docSnapshot.ref, {
      tarifaHora: tarifaHoraVigilante,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
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

const obtenerConfiguracionVigilancia = async (req, res) => {
  try {
    const configuracion = await readVigilanciaConfig();

    return res.status(200).json(configuracion);
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const actualizarConfiguracionVigilancia = async (req, res) => {
  const tarifaHoraVigilante = parsePositiveNumber(req.body?.tarifaHoraVigilante);

  if (!Number.isFinite(tarifaHoraVigilante) || tarifaHoraVigilante <= 0) {
    return res.status(400).json({
      mensaje: "La tarifa por hora de vigilancia debe ser mayor a 0.",
    });
  }

  try {
    const updatedByUid = normalizeText(req.body?.updatedByUid);
    const updatedByName = normalizeText(req.body?.updatedByName) || "Administracion";

    await Promise.all([
      vigilanciaConfigDoc().set(
        {
          tarifaHoraVigilante,
          updatedByUid,
          updatedByName,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      ),
      sincronizarTarifaVigilantes(tarifaHoraVigilante),
    ]);

    return res.status(200).json({
      mensaje: "La tarifa de vigilancia se actualizó correctamente.",
      configuracion: {
        tarifaHoraVigilante,
        updatedByUid,
        updatedByName,
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  actualizarConfiguracionVigilancia,
  obtenerConfiguracionVigilancia,
  obtenerResumenVigilancia,
};
