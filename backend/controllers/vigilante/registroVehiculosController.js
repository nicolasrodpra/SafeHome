const admin = require("../../config/firebaseAdmin");

const vehiculosCollection = () => admin.firestore().collection("vehiculos");
const limpiarTexto = (value) => (typeof value === "string" ? value.trim() : "");

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

const mapVehiculo = (snapshotDoc) => {
  const data = snapshotDoc.data();

  return {
    id: snapshotDoc.id,
    ...data,
    fecha: data.fecha?.toDate ? data.fecha.toDate().toLocaleDateString("es-CO") : data.fecha ?? "",
    hora: data.fecha?.toDate
      ? data.fecha.toDate().toLocaleTimeString("es-CO", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
  };
};

const obtenerVehiculos = async (req, res) => {
  try {
    const snapshot = await vehiculosCollection().get();
    const vehiculos = snapshot.docs.map(mapVehiculo);

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
    const ref = await vehiculosCollection().add({
      ...vehiculo,
      fecha: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      mensaje: "Vehiculo registrado",
      vehiculo: { id: ref.id, ...vehiculo },
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
    await vehiculosCollection().doc(id).update({
      ...vehiculo,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      mensaje: "Vehiculo actualizado",
      vehiculo: { id, ...vehiculo },
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
  eliminarVehiculo,
};
