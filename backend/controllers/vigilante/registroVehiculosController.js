const admin = require("firebase-admin");

const obtenerVehiculos = async (req, res) => {
  try {
    const snapshot  = await admin.firestore().collection("vehiculos").get();
    const vehiculos = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      fecha: d.data().fecha?.toDate ? d.data().fecha.toDate().toLocaleDateString("es-CO") : d.data().fecha ?? "",
      hora:  d.data().fecha?.toDate ? d.data().fecha.toDate().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }) : "",
    }));
    res.status(200).json(vehiculos);
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
};

const crearVehiculo = async (req, res) => {
  const { propietario, documento, placa, telefono, torre, apartamento, tipo } = req.body;

  if (!propietario || !documento || !placa || !telefono || !torre || !apartamento || !tipo) {
    return res.status(400).json({ mensaje: "Complete todos los campos" });
  }

  try {
    const ref = await admin.firestore().collection("vehiculos").add({
      propietario, documento, torre, apartamento, tipo,
      placa:     placa.toUpperCase(),
      telefono,
      fecha:     admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      mensaje: "Vehículo registrado",
      vehiculo: { id: ref.id, propietario, documento, placa: placa.toUpperCase(), telefono, torre, apartamento, tipo },
    });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
};

const actualizarVehiculo = async (req, res) => {
  const { id } = req.params;
  const { propietario, documento, placa, telefono, torre, apartamento, tipo } = req.body;

  if (!propietario || !documento || !placa || !telefono || !torre || !apartamento || !tipo) {
    return res.status(400).json({ mensaje: "Complete todos los campos" });
  }

  try {
    await admin.firestore().collection("vehiculos").doc(id).update({
      propietario, documento, torre, apartamento, tipo,
      placa:     placa.toUpperCase(),
      telefono,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({
      mensaje: "Vehículo actualizado",
      vehiculo: { id, propietario, documento, placa: placa.toUpperCase(), telefono, torre, apartamento, tipo },
    });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
};

const eliminarVehiculo = async (req, res) => {
  const { id } = req.params;
  try {
    await admin.firestore().collection("vehiculos").doc(id).delete();
    res.status(200).json({ mensaje: "Vehículo eliminado" });
  } catch (err) {
    res.status(500).json({ mensaje: err.message });
  }
};

module.exports = { obtenerVehiculos, crearVehiculo, actualizarVehiculo, eliminarVehiculo };