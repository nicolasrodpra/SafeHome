// Controlador de vehiculos visitantes.
// Gestiona ingreso, edicion, salida con cobro y limpieza automatica
// de registros antiguos ya finalizados.
const admin = require("../../config/firebaseAdmin");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates");

const vehiculosCollection = () => admin.firestore().collection("vehiculos");
const usersCollection = () => admin.firestore().collection("users");

const MILLISECONDS_PER_MINUTE = 60 * 1000;
const MINUTES_PER_HOUR = 60;
const MILLISECONDS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

const limpiarTexto = (value) => (typeof value === "string" ? value.trim() : "");

const normalizarNumero = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const textValue = limpiarTexto(value).replace(",", ".");
  const parsedValue = Number(textValue);

  return Number.isFinite(parsedValue) ? parsedValue : NaN;
};

const normalizarVehiculo = (payload) => ({
  propietario: limpiarTexto(payload.propietario),
  documento: limpiarTexto(payload.documento),
  placa: limpiarTexto(payload.placa).toUpperCase(),
  telefono: limpiarTexto(payload.telefono),
  torre: limpiarTexto(payload.torre),
  apartamento: limpiarTexto(payload.apartamento),
  tipo: limpiarTexto(payload.tipo),
});

const obtenerCamposFaltantes = (vehiculo) =>
  Object.entries(vehiculo)
    .filter(([, value]) => !value)
    .map(([field]) => field);

const obtenerFechaIngreso = (data = {}) => toDate(data.ingresoAt || data.createdAt || data.fecha);

const obtenerFechaSalida = (data = {}) => toDate(data.salidaAt);

const construirDuracionTexto = (duracionMinutos) => {
  const totalMinutos = Math.max(1, duracionMinutos);
  const horas = Math.floor(totalMinutos / MINUTES_PER_HOUR);
  const minutos = totalMinutos % MINUTES_PER_HOUR;

  if (!horas) {
    return `${minutos} min`;
  }

  if (!minutos) {
    return `${horas} h`;
  }

  return `${horas} h ${minutos} min`;
};

const calcularCobroVehiculo = ({ ingresoDate, salidaDate, tarifaHora }) => {
  const diferenciaMs = Math.max(salidaDate.getTime() - ingresoDate.getTime(), 0);
  const duracionMinutos = Math.max(1, Math.ceil(diferenciaMs / MILLISECONDS_PER_MINUTE));
  const horasCobradas = Math.max(1, Math.ceil(duracionMinutos / MINUTES_PER_HOUR));
  const valorCobrado = tarifaHora * horasCobradas;

  return {
    duracionMinutos,
    duracionTexto: construirDuracionTexto(duracionMinutos),
    horasCobradas,
    valorCobrado,
  };
};

const obtenerReferenciaOrden = (vehiculo) => {
  const referenceIso = vehiculo.estado === "Salio" ? vehiculo.salidaIso : vehiculo.ingresoIso;
  const referenceDate = referenceIso ? new Date(referenceIso) : null;

  return referenceDate && !Number.isNaN(referenceDate.getTime()) ? referenceDate.getTime() : 0;
};

const mapVehiculo = (snapshotDoc) => {
  const data = snapshotDoc.data();
  const ingresoDate = obtenerFechaIngreso(data);
  const salidaDate = obtenerFechaSalida(data);
  const estado = data.estado === "Salio" ? "Salio" : "Activo";

  return {
    id: snapshotDoc.id,
    ...data,
    estado,
    fecha: formatDateLabel(ingresoDate) || "",
    hora: formatTimeLabel(ingresoDate) || "",
    fechaIngreso: formatDateLabel(ingresoDate) || "",
    horaIngreso: formatTimeLabel(ingresoDate) || "",
    ingresoIso: ingresoDate ? ingresoDate.toISOString() : "",
    fechaSalida: formatDateLabel(salidaDate) || "",
    horaSalida: formatTimeLabel(salidaDate) || "",
    salidaIso: salidaDate ? salidaDate.toISOString() : "",
    duracionMinutos:
      typeof data.duracionMinutos === "number" && Number.isFinite(data.duracionMinutos)
        ? data.duracionMinutos
        : 0,
    duracionTexto: limpiarTexto(data.duracionTexto),
    horasCobradas:
      typeof data.horasCobradas === "number" && Number.isFinite(data.horasCobradas)
        ? data.horasCobradas
        : 0,
    tarifaHoraAplicada:
      typeof data.tarifaHoraAplicada === "number" && Number.isFinite(data.tarifaHoraAplicada)
        ? data.tarifaHoraAplicada
        : 0,
    valorCobrado:
      typeof data.valorCobrado === "number" && Number.isFinite(data.valorCobrado)
        ? data.valorCobrado
        : 0,
    vigilanteRegistroNombre: limpiarTexto(data.vigilanteRegistroNombre),
    vigilanteSalidaNombre: limpiarTexto(data.vigilanteSalidaNombre),
    vigilanteRegistroUid: limpiarTexto(data.vigilanteRegistroUid),
    vigilanteSalidaUid: limpiarTexto(data.vigilanteSalidaUid),
  };
};

const ordenarVehiculos = (firstVehicle, secondVehicle) => {
  if (firstVehicle.estado !== secondVehicle.estado) {
    return firstVehicle.estado === "Activo" ? -1 : 1;
  }

  return obtenerReferenciaOrden(secondVehicle) - obtenerReferenciaOrden(firstVehicle);
};

const limpiarVehiculosFinalizadosAntiguos = async () => {
  const snapshot = await vehiculosCollection().where("estado", "==", "Salio").get();
  const now = Date.now();
  const docsToDelete = snapshot.docs.filter((snapshotDoc) => {
    const salidaDate = obtenerFechaSalida(snapshotDoc.data());

    if (!salidaDate) {
      return false;
    }

    return now - salidaDate.getTime() >= MILLISECONDS_PER_WEEK;
  });

  if (!docsToDelete.length) {
    return;
  }

  const batch = admin.firestore().batch();
  docsToDelete.forEach((snapshotDoc) => batch.delete(snapshotDoc.ref));
  await batch.commit();
};

const obtenerPerfilVigilante = async (uid) => {
  const vigilanteUid = limpiarTexto(uid);

  if (!vigilanteUid) {
    return null;
  }

  const snapshot = await usersCollection().doc(vigilanteUid).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() || {};

  if (limpiarTexto(data.rol) !== "Vigilante") {
    return null;
  }

  return {
    uid: vigilanteUid,
    nombre: limpiarTexto(data.nombre) || "Vigilante",
    tarifaHora: normalizarNumero(data.tarifaHora),
  };
};

const buscarVehiculoActivoPorPlaca = async (placa, ignoredId = "") => {
  const snapshot = await vehiculosCollection().where("placa", "==", placa).get();

  return snapshot.docs.find((snapshotDoc) => {
    if (snapshotDoc.id === ignoredId) {
      return false;
    }

    const estado = snapshotDoc.data()?.estado;

    return estado !== "Salio";
  });
};

const obtenerVehiculos = async (req, res) => {
  try {
    await limpiarVehiculosFinalizadosAntiguos();

    const snapshot = await vehiculosCollection().get();
    const vehiculos = snapshot.docs.map(mapVehiculo).sort(ordenarVehiculos);

    return res.status(200).json(vehiculos);
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const crearVehiculo = async (req, res) => {
  const vehiculo = normalizarVehiculo(req.body);
  const camposFaltantes = obtenerCamposFaltantes(vehiculo);

  if (camposFaltantes.length > 0) {
    return res.status(400).json({
      mensaje: `Completa estos campos: ${camposFaltantes.join(", ")}.`,
    });
  }

  try {
    await limpiarVehiculosFinalizadosAntiguos();

    const vehiculoActivo = await buscarVehiculoActivoPorPlaca(vehiculo.placa);

    if (vehiculoActivo) {
      return res.status(400).json({
        mensaje: "Ya existe un vehiculo activo con esa placa. Registra la salida antes de volverlo a ingresar.",
      });
    }

    const vigilante = await obtenerPerfilVigilante(req.body?.vigilanteUid);
    const ingresoDate = new Date();

    const registro = {
      ...vehiculo,
      estado: "Activo",
      fecha: admin.firestore.Timestamp.fromDate(ingresoDate),
      ingresoAt: admin.firestore.Timestamp.fromDate(ingresoDate),
      createdAt: admin.firestore.Timestamp.fromDate(ingresoDate),
      vigilanteRegistroUid: vigilante?.uid || "",
      vigilanteRegistroNombre: vigilante?.nombre || "",
      tarifaHoraBase:
        typeof vigilante?.tarifaHora === "number" && Number.isFinite(vigilante.tarifaHora)
          ? vigilante.tarifaHora
          : 0,
    };

    const ref = await vehiculosCollection().add(registro);

    return res.status(201).json({
      mensaje: "Vehiculo registrado",
      vehiculo: mapVehiculo({
        id: ref.id,
        data: () => registro,
      }),
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const actualizarVehiculo = async (req, res) => {
  const { id } = req.params;
  const vehiculo = normalizarVehiculo(req.body);
  const camposFaltantes = obtenerCamposFaltantes(vehiculo);

  if (camposFaltantes.length > 0) {
    return res.status(400).json({
      mensaje: `Completa estos campos: ${camposFaltantes.join(", ")}.`,
    });
  }

  try {
    const vehicleDoc = await vehiculosCollection().doc(id).get();

    if (!vehicleDoc.exists) {
      return res.status(404).json({ mensaje: "No se encontro el vehiculo." });
    }

    if (vehicleDoc.data()?.estado === "Salio") {
      return res.status(400).json({
        mensaje: "No puedes editar un vehiculo que ya registro su salida.",
      });
    }

    const vehiculoActivo = await buscarVehiculoActivoPorPlaca(vehiculo.placa, id);

    if (vehiculoActivo) {
      return res.status(400).json({
        mensaje: "Ya existe un vehiculo activo con esa placa. Usa otra placa o registra primero su salida.",
      });
    }

    await vehiculosCollection().doc(id).update({
      ...vehiculo,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updatedDoc = await vehiculosCollection().doc(id).get();

    return res.status(200).json({
      mensaje: "Vehiculo actualizado",
      vehiculo: mapVehiculo(updatedDoc),
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const registrarSalidaVehiculo = async (req, res) => {
  const { id } = req.params;

  try {
    await limpiarVehiculosFinalizadosAntiguos();

    const vehicleRef = vehiculosCollection().doc(id);
    const vehicleDoc = await vehicleRef.get();

    if (!vehicleDoc.exists) {
      return res.status(404).json({ mensaje: "No se encontro el vehiculo." });
    }

    const vehicleData = vehicleDoc.data() || {};

    if (vehicleData.estado === "Salio") {
      return res.status(400).json({ mensaje: "Este vehiculo ya registro su salida." });
    }

    const vigilante = await obtenerPerfilVigilante(req.body?.vigilanteUid);

    if (!vigilante) {
      return res.status(400).json({
        mensaje: "No se pudo identificar al vigilante que esta registrando la salida.",
      });
    }

    if (!Number.isFinite(vigilante.tarifaHora) || vigilante.tarifaHora <= 0) {
      return res.status(400).json({
        mensaje: "El vigilante no tiene una tarifa por hora valida configurada.",
      });
    }

    const ingresoDate = obtenerFechaIngreso(vehicleData);

    if (!ingresoDate) {
      return res.status(400).json({
        mensaje: "No se pudo calcular la salida porque el vehiculo no tiene una fecha de ingreso valida.",
      });
    }

    const salidaDate = new Date();
    const liquidacion = calcularCobroVehiculo({
      ingresoDate,
      salidaDate,
      tarifaHora: vigilante.tarifaHora,
    });

    await vehicleRef.update({
      estado: "Salio",
      salidaAt: admin.firestore.Timestamp.fromDate(salidaDate),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      vigilanteSalidaUid: vigilante.uid,
      vigilanteSalidaNombre: vigilante.nombre,
      tarifaHoraAplicada: vigilante.tarifaHora,
      valorCobrado: liquidacion.valorCobrado,
      horasCobradas: liquidacion.horasCobradas,
      duracionMinutos: liquidacion.duracionMinutos,
      duracionTexto: liquidacion.duracionTexto,
    });

    const updatedDoc = await vehicleRef.get();

    return res.status(200).json({
      mensaje: "Salida registrada correctamente.",
      vehiculo: mapVehiculo(updatedDoc),
      cobro: liquidacion,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const eliminarVehiculo = async (req, res) => {
  const { id } = req.params;

  try {
    await vehiculosCollection().doc(id).delete();
    return res.status(200).json({ mensaje: "Vehiculo eliminado" });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  obtenerVehiculos,
  crearVehiculo,
  actualizarVehiculo,
  registrarSalidaVehiculo,
  eliminarVehiculo,
  limpiarVehiculosFinalizadosAntiguos,
};
