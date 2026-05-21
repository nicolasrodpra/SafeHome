// Controlador del resumen de vigilancia.
// Cuenta registros del día para alimentar el tablero del vigilante.
const admin = require("../../config/firebaseAdmin");
const { toDate } = require("../../utils/firestoreDates");
const { normalizeText } = require("../../utils/text");
const {
  normalizeDailyChargeFlags,
  normalizeDailyRates,
  readVigilanciaConfig,
  vigilanciaConfigDoc,
  WEEK_DAY_KEYS,
} = require("../../utils/vigilanciaConfig");
const { parsePositiveInteger } = require("../../utils/validation");

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
  return parsePositiveInteger(value);
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
  const recibioCantidadParqueaderos = req.body?.cantidadParqueaderos !== undefined;
  const cantidadParqueaderosInput = recibioCantidadParqueaderos
    ? parsePositiveInteger(req.body?.cantidadParqueaderos)
    : NaN;
  const tarifasPorDiaBase = normalizeDailyRates(req.body?.tarifasPorDia);
  const cobroPorDia = normalizeDailyChargeFlags(req.body?.cobroPorDia, req.body?.tarifasPorDia);

  if (!Number.isFinite(tarifaHoraVigilante) || tarifaHoraVigilante <= 0) {
    return res.status(400).json({
      mensaje: "La tarifa por hora de vigilancia debe ser mayor a 0.",
    });
  }

  if (
    recibioCantidadParqueaderos &&
    (!Number.isFinite(cantidadParqueaderosInput) || cantidadParqueaderosInput <= 0)
  ) {
    return res.status(400).json({
      mensaje: "La cantidad de parqueaderos debe ser un entero mayor a 0.",
    });
  }

  const tarifasPorDia = WEEK_DAY_KEYS.reduce((rates, dayKey) => {
    rates[dayKey] =
      Number.isFinite(tarifasPorDiaBase[dayKey]) && tarifasPorDiaBase[dayKey] > 0
        ? tarifasPorDiaBase[dayKey]
        : cobroPorDia[dayKey]
          ? tarifaHoraVigilante
          : 0;
    return rates;
  }, {});

  const hasInvalidDailyRate = WEEK_DAY_KEYS.some(
    (dayKey) =>
      cobroPorDia[dayKey] &&
      (!Number.isFinite(tarifasPorDia[dayKey]) || tarifasPorDia[dayKey] <= 0)
  );

  if (hasInvalidDailyRate) {
    return res.status(400).json({
      mensaje: "Todas las tarifas por dia deben ser mayores a 0.",
    });
  }

  try {
    const updatedByUid = normalizeText(req.body?.updatedByUid);
    const updatedByName = normalizeText(req.body?.updatedByName) || "Administracion";
    const currentConfig = await readVigilanciaConfig();
    const cantidadParqueaderos = recibioCantidadParqueaderos
      ? cantidadParqueaderosInput
      : Number(currentConfig?.cantidadParqueaderos) || 0;
    const currentCarParkings = Number(currentConfig?.cantidadParqueaderosCarro);
    const currentMotoParkings = Number(currentConfig?.cantidadParqueaderosMoto);
    const cantidadParqueaderosCarro = Number.isFinite(currentCarParkings)
      ? currentCarParkings
      : recibioCantidadParqueaderos
        ? cantidadParqueaderosInput
        : cantidadParqueaderos;
    const cantidadParqueaderosMoto = Number.isFinite(currentMotoParkings)
      ? currentMotoParkings
      : 0;

    await Promise.all([
      vigilanciaConfigDoc().set(
        {
          tarifaHoraVigilante,
          cantidadParqueaderos,
          cantidadParqueaderosCarro,
          cantidadParqueaderosMoto,
          tarifasPorDia,
          cobroPorDia,
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
        cantidadParqueaderos,
        cantidadParqueaderosCarro,
        cantidadParqueaderosMoto,
        tarifasPorDia,
        cobroPorDia,
        updatedByUid,
        updatedByName,
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const actualizarParqueaderosVigilancia = async (req, res) => {
  const cantidadParqueaderosLegacy = parsePositiveInteger(req.body?.cantidadParqueaderos);
  const cantidadParqueaderosCarro = parsePositiveInteger(
    req.body?.cantidadParqueaderosCarro ?? req.body?.parqueaderosCarro
  );
  const cantidadParqueaderosMoto = parsePositiveInteger(
    req.body?.cantidadParqueaderosMoto ?? req.body?.parqueaderosMoto
  );
  const nextCarParkings = Number.isFinite(cantidadParqueaderosCarro)
    ? cantidadParqueaderosCarro
    : Number.isFinite(cantidadParqueaderosLegacy)
      ? cantidadParqueaderosLegacy
      : 0;
  const nextMotoParkings = Number.isFinite(cantidadParqueaderosMoto)
    ? cantidadParqueaderosMoto
    : 0;
  const cantidadParqueaderos = nextCarParkings + nextMotoParkings;

  if (cantidadParqueaderos <= 0) {
    return res.status(400).json({
      mensaje: "Debes configurar al menos un parqueadero para carro o moto.",
    });
  }

  try {
    const updatedByUid = normalizeText(req.body?.updatedByUid);
    const updatedByName = normalizeText(req.body?.updatedByName) || "Administracion";

    await vigilanciaConfigDoc().set(
      {
        cantidadParqueaderos,
        cantidadParqueaderosCarro: nextCarParkings,
        cantidadParqueaderosMoto: nextMotoParkings,
        updatedByUid,
        updatedByName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const configuracion = await readVigilanciaConfig();

    return res.status(200).json({
      mensaje: "La cantidad de parqueaderos se actualizo correctamente.",
      configuracion: {
        ...configuracion,
        cantidadParqueaderos,
        cantidadParqueaderosCarro: nextCarParkings,
        cantidadParqueaderosMoto: nextMotoParkings,
        updatedByUid,
        updatedByName,
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  actualizarParqueaderosVigilancia,
  actualizarConfiguracionVigilancia,
  obtenerConfiguracionVigilancia,
  obtenerResumenVigilancia,
};
