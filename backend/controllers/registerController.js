const admin = require("firebase-admin");

const ROLES_VALIDOS = ["Administrador", "Residente", "Vigilante"];

const registrarUsuario = async (req, res, rolPorDefecto) => {
  const { nombre, email, password, confirmPassword, rol } = req.body;
  const rolFinal = rol || rolPorDefecto;

  if (!nombre || !email || !password || !confirmPassword || !rolFinal) {
    return res.status(400).json({ mensaje: "Complete todos los campos" });
  }

  if (!ROLES_VALIDOS.includes(rolFinal)) {
    return res.status(400).json({ mensaje: "Seleccione un rol valido" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ mensaje: "Las contrasenas no coinciden" });
  }

  if (password.length < 6) {
    return res.status(400).json({ mensaje: "La contrasena debe tener al menos 6 caracteres" });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: nombre.trim(),
    });

    await admin.firestore().collection("users").doc(userRecord.uid).set({
      nombre: nombre.trim(),
      correo: email,
      rol: rolFinal,
      creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    });

    await admin.auth().generateEmailVerificationLink(email);

    return res.status(201).json({
      mensaje: "Registrado con exito, verifique su correo electronico",
    });
  } catch (error) {
    let mensaje = error.message;

    if (error.code === "auth/email-already-exists") {
      mensaje = "Este correo ya esta registrado.";
    } else if (error.code === "auth/invalid-email") {
      mensaje = "El correo no tiene un formato valido.";
    } else if (error.code === "auth/weak-password") {
      mensaje = "La contrasena debe tener al menos 6 caracteres.";
    }

    return res.status(400).json({ mensaje });
  }
};

module.exports = { registrarUsuario, ROLES_VALIDOS };
