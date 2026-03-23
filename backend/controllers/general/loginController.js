const admin = require("firebase-admin");

const login = async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ mensaje: "Completa todos los campos" });
  }

  try {
    // Verificar usuario con Firebase Auth REST API
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
      if (code === "TOO_MANY_ATTEMPTS_TRY_LATER") mensaje = "Demasiados intentos. Intenta más tarde.";
      return res.status(401).json({ mensaje });
    }

    const uid = firebaseData.localId;

    // Obtener rol desde Firestore
    const userDoc = await admin.firestore().collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ mensaje: "No se encontró información del usuario." });
    }

    const rol = userDoc.data().rol;

    if (!["Vigilante", "Administrador", "Residente"].includes(rol)) {
      return res.status(400).json({ mensaje: "Rol no reconocido." });
    }

    res.status(200).json({ mensaje: "Login exitoso", rol });

  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

module.exports = { login };