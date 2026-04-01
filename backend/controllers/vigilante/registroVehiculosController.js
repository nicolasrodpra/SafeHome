const admin = require("firebase-admin");

const vehiculosCollection = () => admin.firestore().collection("vehiculos");

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
  const { propietario, documento, placa, telefono, torre, apartamento, tipo } = req.body;

  if (!propietario || !documento || !placa || !telefono || !torre || !apartamento || !tipo) {
    return res.status(400).json({ mensaje: "Completa todos los campos" });
  }

  try {
    const vehiculo = {
      propietario,
      documento,
      placa: placa.toUpperCase(),
      telefono,
      torre,
      apartamento,
      tipo,
    };

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
  const { propietario, documento, placa, telefono, torre, apartamento, tipo } = req.body;

  if (!propietario || !documento || !placa || !telefono || !torre || !apartamento || !tipo) {
    return res.status(400).json({ mensaje: "Completa todos los campos" });
  }

  try {
    const vehiculo = {
      propietario,
      documento,
      placa: placa.toUpperCase(),
      telefono,
      torre,
      apartamento,
      tipo,
    };

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
