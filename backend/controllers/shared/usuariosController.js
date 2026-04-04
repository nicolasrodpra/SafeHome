const admin = require("../../config/firebaseAdmin");
const { buildUserProfile } = require("../../utils/userProfile");
const { normalizeText } = require("../../utils/text");

const usersCollection = () => admin.firestore().collection("users");

// Esta función lee el documento del usuario y lo transforma
// al formato estable que usa todo el frontend.
const getProfileSnapshot = async (uid) => {
  const snapshot = await usersCollection().doc(uid).get();

  if (!snapshot.exists) {
    return null;
  }

  return buildUserProfile(snapshot.id, snapshot.data());
};

// Devuelve el perfil listo para pintar la vista de "Mi perfil".
const obtenerPerfilUsuario = async (req, res) => {
  const { uid } = req.params;

  try {
    const profile = await getProfileSnapshot(uid);

    if (!profile) {
      return res.status(404).json({ mensaje: "No se encontró la información del usuario." });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

// Esta función actualiza solo los campos editables del perfil,
// conserva el rol original y vuelve a consultar el documento guardado.
const actualizarPerfilUsuario = async (req, res) => {
  const { uid } = req.params;

  try {
    const currentProfile = await getProfileSnapshot(uid);

    if (!currentProfile) {
      return res.status(404).json({ mensaje: "No se encontró la información del usuario." });
    }

    const nombres = normalizeText(req.body?.nombres);
    const apellidos = normalizeText(req.body?.apellidos);
    const nombreCompleto =
      [nombres, apellidos].filter(Boolean).join(" ").trim() || currentProfile.nombre;

    const payload = {
      nombre: nombreCompleto,
      nombres,
      apellidos,
      cedula: normalizeText(req.body?.cedula),
      rol: currentProfile.rol,
      torre: normalizeText(req.body?.torre),
      apartamento: normalizeText(req.body?.apartamento),
      zonaVigilancia: normalizeText(req.body?.zonaVigilancia),
      tipoSangre: normalizeText(req.body?.tipoSangre),
      correo: currentProfile.email,
      email: currentProfile.email,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await usersCollection().doc(uid).set(payload, { merge: true });
    await admin.auth().updateUser(uid, { displayName: nombreCompleto });

    const nextProfile = await getProfileSnapshot(uid);

    return res.status(200).json({
      mensaje: "Perfil actualizado correctamente.",
      profile: nextProfile,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

// Aquí listamos solo a los residentes para reutilizar la misma consulta
// en módulos como reservas o mensajería administrativa.
const listarResidentes = async (req, res) => {
  try {
    const snapshot = await usersCollection().where("rol", "==", "Residente").get();
    const residentes = snapshot.docs
      .map((docSnapshot) => buildUserProfile(docSnapshot.id, docSnapshot.data()))
      .sort((firstResident, secondResident) =>
        firstResident.nombre.localeCompare(secondResident.nombre, "es")
      );

    return res.status(200).json(residentes);
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = {
  actualizarPerfilUsuario,
  listarResidentes,
  obtenerPerfilUsuario,
};
