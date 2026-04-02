const admin = require("firebase-admin");

const visitantesCollection = () => admin.firestore().collection("visitantes");

const mapVisitante = (snapshotDoc) => {
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

const obtenerVisitantes = async (req, res) => {
  try {
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
};
