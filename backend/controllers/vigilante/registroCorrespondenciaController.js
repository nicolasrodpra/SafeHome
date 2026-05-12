// Controlador de correspondencia.
// Registra paquetes, permite editar mientras sigan pendientes
// y marca la entrega con trazabilidad del vigilante.
const admin = require("../../config/firebaseAdmin");
const { formatDateLabel, formatTimeLabel, toDate } = require("../../utils/firestoreDates");
const {
  crearNotificacionCorrespondencia,
} = require("../shared/notificacionesResidenteController");
const {
  isAllowedValue,
  isNumericText,
  normalizeAllowedValue,
  normalizeLocationValue,
} = require("../../utils/validation");

const correspondenciaCollection = () => admin.firestore().collection("correspondencia");
const usersCollection = () => admin.firestore().collection("users");

const limpiarTexto = (value) => (typeof value === "string" ? value.trim() : "");

const normalizarCorrespondencia = (payload = {}) => ({
  residente: limpiarTexto(payload.residente),
  documento: limpiarTexto(payload.documento),
  torre: normalizeLocationValue(payload.torre),
  apartamento: normalizeLocationValue(payload.apartamento),
  tipoEntrega: normalizeAllowedValue(payload.tipoEntrega, ["Paquete", "Sobre", "Documento"]),
  remitente: limpiarTexto(payload.remitente),
  observacion: limpiarTexto(payload.observacion),
});

const obtenerCamposFaltantes = (registro) =>
  Object.entries(registro)
    .filter(([, value]) => !value)
    .map(([field]) => field);

const validarCorrespondencia = (registro) => {
  const camposFaltantes = obtenerCamposFaltantes(registro);

  if (camposFaltantes.length > 0) {
    return `Completa estos campos: ${camposFaltantes.join(", ")}.`;
  }

  if (!isNumericText(registro.documento)) {
    return "El documento del residente solo puede contener numeros.";
  }

  if (!isAllowedValue(registro.tipoEntrega, ["Paquete", "Sobre", "Documento"])) {
    return "Selecciona un tipo de entrega valido.";
  }

  return "";
};

const obtenerFechaRegistro = (data = {}) => toDate(data.fecha || data.createdAt);
const obtenerFechaEntrega = (data = {}) => toDate(data.entregadoAt);

const mapCorrespondencia = (snapshotDoc) => {
  const data = snapshotDoc.data();
  const fechaRegistro = obtenerFechaRegistro(data);
  const fechaEntrega = obtenerFechaEntrega(data);
  const estado = data.estado === "Entregado" ? "Entregado" : "Pendiente";

  return {
    id: snapshotDoc.id,
    ...data,
    estado,
    fecha: formatDateLabel(fechaRegistro) || "",
    hora: formatTimeLabel(fechaRegistro) || "",
    fechaIso: fechaRegistro ? fechaRegistro.toISOString() : "",
    fechaEntrega: formatDateLabel(fechaEntrega) || "",
    horaEntrega: formatTimeLabel(fechaEntrega) || "",
    entregaIso: fechaEntrega ? fechaEntrega.toISOString() : "",
    vigilanteNombre: limpiarTexto(data.vigilanteNombre),
    vigilanteUid: limpiarTexto(data.vigilanteUid),
    vigilanteEntregaNombre: limpiarTexto(data.vigilanteEntregaNombre),
    vigilanteEntregaUid: limpiarTexto(data.vigilanteEntregaUid),
  };
};

const ordenarCorrespondencia = (firstItem, secondItem) => {
  if (firstItem.estado !== secondItem.estado) {
    return firstItem.estado === "Pendiente" ? -1 : 1;
  }

  const firstReference = firstItem.estado === "Entregado" ? firstItem.entregaIso : firstItem.fechaIso;
  const secondReference =
    secondItem.estado === "Entregado" ? secondItem.entregaIso : secondItem.fechaIso;
  const firstDate = firstReference ? new Date(firstReference) : new Date(0);
  const secondDate = secondReference ? new Date(secondReference) : new Date(0);

  return secondDate.getTime() - firstDate.getTime();
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
  };
};

const buscarResidentePorDocumento = async (documento) => {
  const residentDocument = limpiarTexto(documento);

  if (!residentDocument) {
    return null;
  }

  const snapshot = await usersCollection().where("cedula", "==", residentDocument).limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  const residentDoc = snapshot.docs[0];
  const residentData = residentDoc.data() || {};

  if (limpiarTexto(residentData.rol) !== "Residente") {
    return null;
  }

  return {
    uid: residentDoc.id,
    nombre: limpiarTexto(residentData.nombre) || "Residente",
    torre: limpiarTexto(residentData.torre),
    apartamento: limpiarTexto(residentData.apartamento),
  };
};

const obtenerCorrespondencia = async (req, res) => {
  try {
    const snapshot = await correspondenciaCollection().get();
    const correspondencia = snapshot.docs.map(mapCorrespondencia).sort(ordenarCorrespondencia);

    return res.status(200).json(correspondencia);
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const crearCorrespondencia = async (req, res) => {
  const registro = normalizarCorrespondencia(req.body);
  const mensajeValidacion = validarCorrespondencia(registro);

  if (mensajeValidacion) {
    return res.status(400).json({ mensaje: mensajeValidacion });
  }

  try {
    const vigilante = await obtenerPerfilVigilante(req.body?.vigilanteUid);

    if (!vigilante) {
      return res.status(400).json({
        mensaje: "No se pudo identificar al vigilante que recibe la correspondencia.",
      });
    }

    const documento = {
      ...registro,
      estado: "Pendiente",
      vigilanteUid: vigilante.uid,
      vigilanteNombre: vigilante.nombre,
      fecha: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await correspondenciaCollection().add(documento);

    const residente = await buscarResidentePorDocumento(registro.documento);

    if (residente) {
      await crearNotificacionCorrespondencia({
        residentId: residente.uid,
        residentName: residente.nombre,
        documento: registro.documento,
        torre: residente.torre,
        apartamento: residente.apartamento,
        correspondenciaId: ref.id,
        tipoEntrega: registro.tipoEntrega,
        remitente: registro.remitente,
      });
    }

    return res.status(201).json({
      mensaje: "Correspondencia registrada",
      correspondencia: {
        id: ref.id,
        ...registro,
        estado: "Pendiente",
        vigilanteUid: vigilante.uid,
        vigilanteNombre: vigilante.nombre,
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const actualizarCorrespondencia = async (req, res) => {
  const { id } = req.params;
  const registro = normalizarCorrespondencia(req.body);
  const mensajeValidacion = validarCorrespondencia(registro);

  if (mensajeValidacion) {
    return res.status(400).json({ mensaje: mensajeValidacion });
  }

  try {
    const docRef = correspondenciaCollection().doc(id);
    const currentDoc = await docRef.get();

    if (!currentDoc.exists) {
      return res.status(404).json({ mensaje: "No se encontró la correspondencia." });
    }

    if (currentDoc.data()?.estado === "Entregado") {
      return res.status(400).json({
        mensaje: "No puedes editar una correspondencia que ya fue entregada.",
      });
    }

    await docRef.update({
      ...registro,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updatedDoc = await docRef.get();

    return res.status(200).json({
      mensaje: "Correspondencia actualizada",
      correspondencia: mapCorrespondencia(updatedDoc),
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const marcarCorrespondenciaEntregada = async (req, res) => {
  const { id } = req.params;

  try {
    const docRef = correspondenciaCollection().doc(id);
    const currentDoc = await docRef.get();

    if (!currentDoc.exists) {
      return res.status(404).json({ mensaje: "No se encontró la correspondencia." });
    }

    if (currentDoc.data()?.estado === "Entregado") {
      return res.status(400).json({ mensaje: "Esta correspondencia ya fue entregada." });
    }

    const vigilante = await obtenerPerfilVigilante(req.body?.vigilanteUid);

    if (!vigilante) {
      return res.status(400).json({
        mensaje: "No se pudo identificar al vigilante que confirma la entrega.",
      });
    }

    await docRef.update({
      estado: "Entregado",
      entregadoAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      vigilanteEntregaUid: vigilante.uid,
      vigilanteEntregaNombre: vigilante.nombre,
    });

    const updatedDoc = await docRef.get();

    return res.status(200).json({
      mensaje: "Correspondencia entregada correctamente.",
      correspondencia: mapCorrespondencia(updatedDoc),
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const eliminarCorrespondencia = async (req, res) => {
  const { id } = req.params;

  try {
    const docRef = correspondenciaCollection().doc(id);
    const currentDoc = await docRef.get();

    if (!currentDoc.exists) {
      return res.status(404).json({ mensaje: "No se encontro la correspondencia." });
    }

    await docRef.delete();
    return res.status(200).json({ mensaje: "Correspondencia eliminada" });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  obtenerCorrespondencia,
  crearCorrespondencia,
  actualizarCorrespondencia,
  marcarCorrespondenciaEntregada,
  eliminarCorrespondencia,
};
