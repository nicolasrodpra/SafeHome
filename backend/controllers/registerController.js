const admin = require("firebase-admin");

exports.registerUser = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: "Faltan campos requeridos" });
    }
    // Firebase Admin crea el usuario con contraseña hasheada internamente
    const user = await admin.auth().createUser({ email, password, displayName: name });

    // Guarda solo datos no sensibles en Firestore
    await admin.firestore()
      .collection("users")
      .doc(user.uid)
      .set({ nombre: name, correo: email, rol: "Vigilante", creadoEn: admin.firestore.FieldValue.serverTimestamp() });

    return res.status(201).json({ uid: user.uid, message: "Usuario creado" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};