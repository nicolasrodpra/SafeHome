const admin = require("firebase-admin");

const db = admin.firestore();

exports.registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email y password son requeridos" });
    }

    const newUser = {
      email,
      password,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const userRef = await db.collection("users").add(newUser);

    return res.status(201).json({ id: userRef.id, message: "Usuario creado correctamente" });
  } catch (error) {
    console.error("Error en registerUser:", error);
    return res.status(500).json({ message: "Error interno del servidor", error: error.message });
  }
};