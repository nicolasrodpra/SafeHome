const admin = require("../../config/firebaseAdmin");
const { buildUserProfile } = require("../../utils/userProfile");

const limpiarTexto = (value) => (typeof value === "string" ? value.trim() : "");

// Esta función valida el login en Firebase Auth y luego busca
// el perfil del usuario en Firestore para completar la sesión.
const login = async (req, res) => {
  const email = limpiarTexto(req.body.email).toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ mensaje: "Completa el correo y la contraseña." });
  }

  try {
    const firebaseRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const firebaseData = await firebaseRes.json();

    if (!firebaseRes.ok) {
      const code = firebaseData.error?.message;
      let mensaje = "Correo o contraseña incorrectos.";

      if (code === "TOO_MANY_ATTEMPTS_TRY_LATER") {
        mensaje = "Demasiados intentos. Intenta más tarde.";
      }

      return res.status(401).json({ mensaje });
    }

    const uid = firebaseData.localId;
    const authUser = await admin.auth().getUser(uid);

    if (!authUser.emailVerified) {
      return res.status(403).json({
        mensaje:
          "Debes verificar tu correo electronico antes de iniciar sesion. Revisa tu bandeja de entrada.",
      });
    }

    const userDoc = await admin.firestore().collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ mensaje: "No se encontró la información del usuario." });
    }

    const session = buildUserProfile(uid, userDoc.data());

    if (!["Vigilante", "Administrador", "Residente"].includes(session.rol)) {
      return res.status(400).json({ mensaje: "Rol no reconocido." });
    }

    return res.status(200).json({
      mensaje: "Inicio de sesión exitoso.",
      session,
      ...session,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

module.exports = { login };
