const admin = require("../config/firebaseAdmin");

const ROLES_VALIDOS = ["Administrador", "Residente", "Vigilante"];
const TIPOS_SANGRE_VALIDOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const FIREBASE_AUTH_BASE_URL = "https://identitytoolkit.googleapis.com/v1";

const limpiarTexto = (value) => (typeof value === "string" ? value.trim() : "");

const construirNombreCompleto = (nombres, apellidos) =>
  [nombres, apellidos].filter(Boolean).join(" ");

const construirDatosPorRol = ({ rol, torre, apartamento, zonaVigilancia, tipoSangre }) => {
  if (rol === "Residente") {
    return { torre, apartamento };
  }

  if (rol === "Vigilante") {
    return { zonaVigilancia, tipoSangre };
  }

  return {};
};

const validarCamposPorRol = ({
  rol,
  torre,
  apartamento,
  zonaVigilancia,
  tipoSangre,
}) => {
  if (rol === "Residente" && (!torre || !apartamento)) {
    return "Para registrar un residente debes completar torre y apartamento.";
  }

  if (rol === "Vigilante" && (!zonaVigilancia || !tipoSangre)) {
    return "Para registrar un vigilante debes completar la zona de vigilancia y el tipo de sangre.";
  }

  if (rol === "Vigilante" && !TIPOS_SANGRE_VALIDOS.includes(tipoSangre)) {
    return "Seleccione un tipo de sangre valido.";
  }

  return "";
};

const obtenerCamposFaltantes = ({ nombres, apellidos, cedula, email, password, confirmPassword, rolFinal }) => {
  const fields = [
    { label: "nombres", value: nombres },
    { label: "apellidos", value: apellidos },
    { label: "cedula", value: cedula },
    { label: "correo", value: email },
    { label: "contrasena", value: password },
    { label: "confirmacion de contrasena", value: confirmPassword },
    { label: "rol", value: rolFinal },
  ];

  return fields
    .filter((field) => !field.value)
    .map((field) => field.label);
};

const ejecutarSolicitudFirebaseAuth = async (endpoint, body) => {
  if (!process.env.FIREBASE_API_KEY) {
    throw new Error("Falta FIREBASE_API_KEY para completar la solicitud.");
  }

  const response = await fetch(
    `${FIREBASE_AUTH_BASE_URL}/${endpoint}?key=${process.env.FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "No se pudo completar la solicitud con Firebase.");
  }

  return data;
};

const obtenerIdToken = async (email, password) => {
  const data = await ejecutarSolicitudFirebaseAuth("accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });

  if (!data.idToken) {
    throw new Error("No se pudo autenticar el usuario para enviar el correo.");
  }

  return data.idToken;
};

const enviarCorreoVerificacion = async (email, password) => {
  const idToken = await obtenerIdToken(email, password);

  await ejecutarSolicitudFirebaseAuth("accounts:sendOobCode", {
    requestType: "VERIFY_EMAIL",
    idToken,
  });
};

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

  const mensajeCamposPorRol = validarCamposPorRol({
    rol: rolFinal,
    torre,
    apartamento,
    zonaVigilancia,
    tipoSangre,
  });

  if (mensajeCamposPorRol) {
    return res.status(400).json({ mensaje: mensajeCamposPorRol });
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
      ...construirDatosPorRol({
        rol: rolFinal,
        torre,
        apartamento,
        zonaVigilancia,
        tipoSangre,
      }),
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

    await enviarCorreoVerificacion(email, password);

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

module.exports = { registrarUsuario, ROLES_VALIDOS, TIPOS_SANGRE_VALIDOS };
