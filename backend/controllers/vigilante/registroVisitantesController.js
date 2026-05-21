// Controlador de visitantes.
// Guarda ingresos del día, permite actualizarlos y elimina automáticamente
// los registros de días anteriores para mantener limpio el módulo.
const admin = require("../../config/firebaseAdmin");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates");
const { normalizeText } = require("../../utils/text");
const { isNumericText, normalizeLocationValue } = require("../../utils/validation");

const visitantesCollection = () => admin.firestore().collection("visitantes");
const vehiculosCollection = () => admin.firestore().collection("vehiculos");
const usersCollection = () => admin.firestore().collection("users");
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const ESTADO_PENDIENTE = "Pendiente";
const ESTADO_INGRESO = "Ingreso";

const obtenerFechaVisitante = (data = {}) => toDate(data.createdAt || data.fecha);

const obtenerInicioDia = (dateValue = new Date()) => {
  const nextDate = new Date(dateValue);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const mapVisitante = (snapshotDoc) => {
  const data = snapshotDoc.data();
  const fechaVisitante = toDate(data.horaIngreso || data.horaEntrada || data.createdAt || data.fecha);

  return {
    id: snapshotDoc.id,
    ...data,
    estado: data.estado || data.status || ESTADO_PENDIENTE,
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
    const estadoFiltro = normalizeText(req.query.estado || req.query.status);
    const visitantes = snapshot.docs
      .map(mapVisitante)
      .filter((visitante) => {
        if (!estadoFiltro) return true;
        return normalizeText(visitante.estado).toLowerCase() === estadoFiltro.toLowerCase();
      });

    return res.status(200).json(visitantes);
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const normalizarVisitante = (payload = {}) => ({
  nombre: normalizeText(payload.nombre || payload.nombreCompleto),
  documento: normalizeText(payload.documento || payload.identificacion),
  residente: normalizeText(payload.residente || payload.residenteNombre),
  residenteId: normalizeText(payload.residenteId || payload.residenteLookupId || payload.uid),
  residenteEmail: normalizeText(payload.residenteEmail),
  residenteCedula: normalizeText(payload.residenteCedula),
  residenteTelefono: normalizeText(payload.residenteTelefono),
  torre: normalizeLocationValue(payload.torre || payload.residenteTorre),
  apartamento: normalizeLocationValue(payload.apartamento || payload.residenteApartamento),
  motivo: normalizeText(payload.motivo),
  telefono: normalizeText(payload.telefono),
  horaEntradaProgramada: normalizeText(payload.horaEntrada || payload.horaEntradaProgramada),
  conVehiculo: Boolean(payload.conVehiculo),
  tipoVehiculo: normalizeText(payload.tipoVehiculo || payload.tipo || "Moto"),
  placa: payload.conVehiculo ? normalizeText(payload.placa).toUpperCase() : "",
  parqueadero: payload.conVehiculo ? normalizeText(payload.parqueadero || payload.parqueaderoVehiculo) : "",
  codigoAcceso: normalizeText(payload.codigoAcceso),
  estado: normalizeText(payload.estado || payload.status || ESTADO_PENDIENTE) || ESTADO_PENDIENTE,
  source: normalizeText(payload.source),
  residenteDatosCompletos:
    payload.residenteDatosCompletos && typeof payload.residenteDatosCompletos === "object"
      ? payload.residenteDatosCompletos
      : {},
});

const validarVisitante = (visitante) => {
  const requiredFields = ["nombre", "documento", "residente", "torre", "apartamento", "motivo", "telefono"];
  const camposFaltantes = requiredFields.filter((field) => !visitante[field]);

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
  const visitante = normalizarVisitante({
    ...req.body,
    codigoAcceso: req.body?.codigoAcceso || `VST-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
  });
  const mensajeValidacion = validarVisitante(visitante);

  if (mensajeValidacion) {
    return res.status(400).json({ mensaje: mensajeValidacion });
  }

  try {
    const ref = await visitantesCollection().add({
      ...visitante,
      status: visitante.estado,
      fecha: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      horaIngreso: visitante.estado === ESTADO_INGRESO ? admin.firestore.FieldValue.serverTimestamp() : null,
      horaSalida: null,
      notificacion: `Vigilante, se registro esta persona y el estado esta ${visitante.estado.toLowerCase()}.`,
    });

    return res.status(201).json({
      mensaje: "Visitante registrado",
      visitante: { id: ref.id, ...visitante },
      qrPayload: {
        tipo: "VISITANTE_SAFEHOME",
        visitanteId: ref.id,
        codigoAcceso: visitante.codigoAcceso,
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const actualizarVisitante = async (req, res) => {
  const { id } = req.params;

  try {
    const docRef = visitantesCollection().doc(id);
    const currentDoc = await docRef.get();

    if (!currentDoc.exists) {
      return res.status(404).json({ mensaje: "No se encontro el visitante." });
    }

    const currentData = currentDoc.data() || {};
    const mergedData = {
      ...currentData,
      ...req.body,
      codigoAcceso: req.body?.codigoAcceso || currentData.codigoAcceso,
      estado: req.body?.estado || req.body?.status || currentData.estado || currentData.status,
      residenteDatosCompletos: req.body?.residenteDatosCompletos || currentData.residenteDatosCompletos,
    };

    if (req.body?.nombreCompleto) mergedData.nombre = req.body.nombreCompleto;
    if (req.body?.identificacion) mergedData.documento = req.body.identificacion;
    if (req.body?.residenteNombre) mergedData.residente = req.body.residenteNombre;
    if (req.body?.residenteTorre) mergedData.torre = req.body.residenteTorre;
    if (req.body?.residenteApartamento) mergedData.apartamento = req.body.residenteApartamento;

    const visitante = normalizarVisitante(mergedData);
    const mensajeValidacion = validarVisitante(visitante);

    if (mensajeValidacion) {
      return res.status(400).json({ mensaje: mensajeValidacion });
    }

    await docRef.update({
      ...visitante,
      status: visitante.estado,
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

const normalizarTipoVehiculoVisitante = (value) =>
  normalizeText(value).toLowerCase() === "carro" ? "Carro" : "Moto";

const crearVehiculoDesdeVisitante = async ({ visitanteId, visitante }) => {
  if (!visitante?.conVehiculo) {
    return;
  }

  const placa = normalizeText(visitante.placa).toUpperCase();

  if (!placa) {
    return;
  }

  const linkedSnapshot = await vehiculosCollection()
    .where("visitanteId", "==", visitanteId)
    .limit(1)
    .get();

  if (!linkedSnapshot.empty) {
    return;
  }

  const activePlateSnapshot = await vehiculosCollection().where("placa", "==", placa).get();
  const hasActivePlate = activePlateSnapshot.docs.some((snapshotDoc) => snapshotDoc.data()?.estado !== "Salio");

  if (hasActivePlate) {
    return;
  }

  const parqueadero =
    normalizeText(visitante.parqueadero || visitante.parqueaderoVehiculo) ||
    (await asignarParqueaderoDisponible());

  if (!parqueadero) {
    return;
  }

  const ingresoDate = new Date();
  await vehiculosCollection().add({
    propietario: normalizeText(visitante.nombre || visitante.nombreCompleto),
    documento: normalizeText(visitante.documento || visitante.identificacion),
    placa,
    telefono: normalizeText(visitante.telefono),
    torre: normalizeLocationValue(visitante.torre || visitante.residenteTorre),
    apartamento: normalizeLocationValue(visitante.apartamento || visitante.residenteApartamento),
    parqueadero,
    tipo: normalizarTipoVehiculoVisitante(visitante.tipoVehiculo || visitante.tipo),
    estado: "Activo",
    fecha: admin.firestore.Timestamp.fromDate(ingresoDate),
    ingresoAt: admin.firestore.Timestamp.fromDate(ingresoDate),
    createdAt: admin.firestore.Timestamp.fromDate(ingresoDate),
    vigilanteRegistroUid: "",
    vigilanteRegistroNombre: "Ingreso por codigo visitante",
    tarifaHoraBase: 0,
    visitanteId,
    visitanteCodigoAcceso: normalizeText(visitante.codigoAcceso),
  });

  await visitantesCollection().doc(visitanteId).update({
    parqueadero,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

const asignarParqueaderoDisponible = async () => {
  const usersSnapshot = await usersCollection().get();
  const cantidadParqueaderos = usersSnapshot.docs.reduce((maxValue, snapshotDoc) => {
    const currentValue = Number(snapshotDoc.data()?.cantidadParqueaderos);
    return Number.isFinite(currentValue) && currentValue > maxValue ? currentValue : maxValue;
  }, 0);

  const vehiclesSnapshot = await vehiculosCollection().get();
  const parqueaderosOcupados = new Set(
    vehiclesSnapshot.docs
      .filter((snapshotDoc) => snapshotDoc.data()?.estado !== "Salio")
      .map((snapshotDoc) => normalizeText(snapshotDoc.data()?.parqueadero))
      .filter(Boolean)
  );
  const limiteParqueaderos = cantidadParqueaderos || Math.max(parqueaderosOcupados.size + 1, 1);

  for (let index = 1; index <= limiteParqueaderos; index += 1) {
    const parqueadero = String(index);
    if (!parqueaderosOcupados.has(parqueadero)) {
      return parqueadero;
    }
  }

  return "";
};

const ingresarVisitantePorCodigo = async (req, res) => {
  const codigoAcceso = normalizeText(req.body?.codigoAcceso);

  if (!codigoAcceso) {
    return res.status(400).json({ mensaje: "Ingresa el codigo del visitante." });
  }

  try {
    const snapshot = await visitantesCollection()
      .where("codigoAcceso", "==", codigoAcceso)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ mensaje: "No se encontro un visitante con ese codigo." });
    }

    const currentDoc = snapshot.docs[0];
    const estadoActual = currentDoc.data()?.estado || currentDoc.data()?.status || ESTADO_PENDIENTE;

    if (estadoActual !== ESTADO_INGRESO) {
      await currentDoc.ref.update({
        estado: ESTADO_INGRESO,
        status: ESTADO_INGRESO,
        horaIngreso: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    const updatedDoc = await currentDoc.ref.get();
    await crearVehiculoDesdeVisitante({
      visitanteId: currentDoc.id,
      visitante: updatedDoc.data() || {},
    });

    return res.status(200).json({
      mensaje: estadoActual === ESTADO_INGRESO ? "El visitante ya habia ingresado." : "Visitante ingresado",
      visitante: mapVisitante(updatedDoc),
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  obtenerVisitantes,
  crearVisitante,
  actualizarVisitante,
  eliminarVisitante,
  ingresarVisitantePorCodigo,
  limpiarVisitantesAntiguos,
};
