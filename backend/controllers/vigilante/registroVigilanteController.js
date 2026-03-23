const admin = require("firebase-admin");

const registrarVigilante = async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    return res.status(400).json({ mensaje: "Complete todos los campos" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ mensaje: "Las contraseñas no coinciden" });
  }

  if (password.length < 6) {
    return res.status(400).json({ mensaje: "La contraseña debe tener al menos 6 caracteres" });
  }

  try {
    const userRecord = await admin.auth().createUser({ email, password });

    await admin.firestore().collection("users").doc(userRecord.uid).set({
      correo: email,
      rol: "Vigilante",
      creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    });

    await admin.auth().generateEmailVerificationLink(email);

    res.status(201).json({ mensaje: "Registrado con éxito, verifique su correo electrónico" });

  } catch (error) {
    let mensaje = error.message;
    if (error.code === "auth/email-already-exists") mensaje = "Este correo ya está registrado.";
    else if (error.code === "auth/invalid-email")   mensaje = "El correo no tiene un formato válido.";
    else if (error.code === "auth/weak-password")   mensaje = "La contraseña debe tener al menos 6 caracteres.";

    res.status(400).json({ mensaje });
  }
};

module.exports = { registrarVigilante };