const admin = require("firebase-admin");

const ROLES_VALIDOS = ["Administrador", "Residente", "Vigilante"];

const registrarUsuario = async (req, res, rolPorDefecto) => {
  const {
    nombre,
    nombres,
    apellidos,
    cedula,
    email,
    password,
    confirmPassword,
    rol,
    torre,
    apartamento,
    zonaVigilancia,
    tipoSangre,
  } = req.body;
  const rolFinal = rol || rolPorDefecto;
  const nombreCompleto = nombre || [nombres, apellidos].filter(Boolean).join(" ").trim();

  if (!nombreCompleto || !email || !password || !confirmPassword || !rolFinal) {
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

  if (rolFinal === "Residente" && (!torre || !apartamento)) {
    return res.status(400).json({ mensaje: "Para residente debes registrar torre y apartamento" });
  }

  if (rolFinal === "Vigilante" && (!zonaVigilancia || !tipoSangre)) {
    return res.status(400).json({ mensaje: "Para vigilante debes registrar zona de vigilancia y tipo de sangre" });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: nombreCompleto,
    });

    const userData = {
      nombre: nombreCompleto,
      nombres: nombres?.trim() || "",
      apellidos: apellidos?.trim() || "",
      cedula: cedula?.trim() || "",
      correo: email,
      rol: rolFinal,
      creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (rolFinal === "Residente") {
      userData.torre = torre.trim();
      userData.apartamento = apartamento.trim();
    }

    if (rolFinal === "Vigilante") {
      userData.zonaVigilancia = zonaVigilancia.trim();
      userData.tipoSangre = tipoSangre.trim();
    }

    await admin.firestore().collection("users").doc(userRecord.uid).set(userData);

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
