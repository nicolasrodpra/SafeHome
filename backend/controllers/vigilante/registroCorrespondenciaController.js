const admin = require("firebase-admin");

const correspondenciaCollection = () => admin.firestore().collection("correspondencia");

const mapCorrespondencia = (snapshotDoc) => {
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

const obtenerCorrespondencia = async (req, res) => {
  try {
    const snapshot = await correspondenciaCollection().get();
    const correspondencia = snapshot.docs.map(mapCorrespondencia);

    return res.status(200).json(correspondencia);
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const crearCorrespondencia = async (req, res) => {
  const { residente, documento, torre, apartamento, tipoEntrega, remitente, observacion } =
    req.body;

  if (
    !residente ||
    !documento ||
    !torre ||
    !apartamento ||
    !tipoEntrega ||
    !remitente ||
    !observacion
  ) {
    return res.status(400).json({ mensaje: "Completa todos los campos" });
  }

  try {
    const registro = {
      residente,
      documento,
      torre,
      apartamento,
      tipoEntrega,
      remitente,
      observacion,
    };

    const ref = await correspondenciaCollection().add({
      ...registro,
      fecha: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(201).json({
      mensaje: "Correspondencia registrada",
      correspondencia: { id: ref.id, ...registro },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const actualizarCorrespondencia = async (req, res) => {
  const { id } = req.params;
  const { residente, documento, torre, apartamento, tipoEntrega, remitente, observacion } =
    req.body;

  if (
    !residente ||
    !documento ||
    !torre ||
    !apartamento ||
    !tipoEntrega ||
    !remitente ||
    !observacion
  ) {
    return res.status(400).json({ mensaje: "Completa todos los campos" });
  }

  try {
    const registro = {
      residente,
      documento,
      torre,
      apartamento,
      tipoEntrega,
      remitente,
      observacion,
    };

    await correspondenciaCollection().doc(id).update({
      ...registro,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      mensaje: "Correspondencia actualizada",
      correspondencia: { id, ...registro },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

const eliminarCorrespondencia = async (req, res) => {
  const { id } = req.params;

  try {
    await correspondenciaCollection().doc(id).delete();
    return res.status(200).json({ mensaje: "Correspondencia eliminada" });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  obtenerCorrespondencia,
  crearCorrespondencia,
  actualizarCorrespondencia,
  eliminarCorrespondencia,
};
