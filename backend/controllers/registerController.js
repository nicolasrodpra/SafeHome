const admin = require("../config/firebaseAdmin");

const ROLES_VALIDOS = ["Administrador", "Residente", "Vigilante"];
const TIPOS_SANGRE_VALIDOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const FIREBASE_AUTH_BASE_URL = "https://identitytoolkit.googleapis.com/v1";
const limpiarTexto = (value) => (typeof value === "string" ? value.trim() : "");

const parseTarifaHora = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const textValue = limpiarTexto(value).replace(",", ".");
  const parsedValue = Number(textValue);

  return Number.isFinite(parsedValue) ? parsedValue : NaN;
};

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Esta función decide qué datos extra guardar según el rol.
// Así evitamos mezclar datos de residente con datos de vigilante.
const construirDatosPorRol = ({
  rol,
  torre,
  apartamento,
  zonaVigilancia,
  tipoSangre,
  tarifaHora,
}) => {
  if (rol === "Residente") {
    return { torre, apartamento };
  }

  if (rol === "Vigilante") {
    return { zonaVigilancia, tipoSangre, tarifaHora };
  }

  return {};
};

// Aquí validamos los campos especiales de cada rol.
// Los datos generales, como correo y contraseña, se revisan después.
const validarCamposPorRol = ({
  rol,
  torre,
  apartamento,
  zonaVigilancia,
  tipoSangre,
  tarifaHora,
}) => {
  if (rol === "Residente" && (!torre || !apartamento)) {
    return "Para registrar un residente debes completar torre y apartamento.";
  }

  if (rol === "Vigilante" && (!zonaVigilancia || !tipoSangre || Number.isNaN(tarifaHora))) {
    return "Para registrar un vigilante debes completar la zona de vigilancia, el tipo de sangre y la tarifa por hora.";
  }

  if (rol === "Vigilante" && !TIPOS_SANGRE_VALIDOS.includes(tipoSangre)) {
    return "Selecciona un tipo de sangre válido.";
  }

  if (rol === "Vigilante" && tarifaHora <= 0) {
    return "La tarifa por hora del vigilante debe ser mayor a 0.";
  }

  return "";
};

// Esta función concentra la llamada HTTP a Firebase Auth.
// La separamos para reutilizar el mismo flujo cuando haga falta.
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
  let lastError = null;

  for (const waitTimeMs of [0, 800, 1500]) {
    if (waitTimeMs > 0) {
      await esperar(waitTimeMs);
    }

    try {
      const data = await ejecutarSolicitudFirebaseAuth("accounts:signInWithPassword", {
        email,
        password,
        returnSecureToken: true,
      });

      if (!data.idToken) {
        throw new Error("No se pudo autenticar el usuario para enviar el correo.");
      }

      return data.idToken;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No se pudo autenticar el usuario para enviar el correo.");
};

const enviarCorreoVerificacion = async (email, password) => {
  const idToken = await obtenerIdToken(email, password);

  await ejecutarSolicitudFirebaseAuth("accounts:sendOobCode", {
    requestType: "VERIFY_EMAIL",
    idToken,
  });
};

// Esta función hace el registro completo:
// 1. valida los datos;
// 2. crea el usuario en Firebase Auth;
// 3. guarda el perfil en Firestore;
// 4. envía el correo de verificación.
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
    tarifaHora,
  } = req.body;
  const rolFinal = rol || rolPorDefecto;
  const nombreCompleto = nombre || [nombres, apellidos].filter(Boolean).join(" ").trim();
  const tarifaHoraNormalizada = parseTarifaHora(tarifaHora);
  const emailNormalizado = limpiarTexto(email).toLowerCase();

  if (!nombreCompleto || !emailNormalizado || !password || !confirmPassword || !rolFinal) {
    return res.status(400).json({ mensaje: "Completa todos los campos." });
  }

  if (!ROLES_VALIDOS.includes(rolFinal)) {
    return res.status(400).json({ mensaje: "Selecciona un rol válido." });
  }

  const mensajeCamposPorRol = validarCamposPorRol({
    rol: rolFinal,
    torre,
    apartamento,
    zonaVigilancia,
    tipoSangre,
    tarifaHora: tarifaHoraNormalizada,
  });

  if (mensajeCamposPorRol) {
    return res.status(400).json({ mensaje: mensajeCamposPorRol });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ mensaje: "Las contraseñas no coinciden." });
  }

  if (password.length < 6) {
    return res.status(400).json({ mensaje: "La contraseña debe tener al menos 6 caracteres." });
  }

  if (rolFinal === "Residente" && (!torre || !apartamento)) {
    return res.status(400).json({ mensaje: "Para residente debes registrar torre y apartamento." });
  }

  if (
    rolFinal === "Vigilante" &&
    (!zonaVigilancia || !tipoSangre || Number.isNaN(tarifaHoraNormalizada))
  ) {
    return res.status(400).json({
      mensaje:
        "Para vigilante debes registrar la zona de vigilancia, el tipo de sangre y la tarifa por hora.",
    });
  }

  let createdUserId = "";

  try {
    const userRecord = await admin.auth().createUser({
      email: emailNormalizado,
      password,
      displayName: nombreCompleto,
    });
    createdUserId = userRecord.uid;

    const userData = {
      nombre: nombreCompleto,
      nombres: nombres?.trim() || "",
      apellidos: apellidos?.trim() || "",
      cedula: cedula?.trim() || "",
      correo: emailNormalizado,
      email: emailNormalizado,
      rol: rolFinal,
      ...construirDatosPorRol({
        rol: rolFinal,
        torre,
        apartamento,
        zonaVigilancia,
        tipoSangre,
        tarifaHora: tarifaHoraNormalizada,
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
      userData.tarifaHora = tarifaHoraNormalizada;
    }

    await admin.firestore().collection("users").doc(userRecord.uid).set(userData);

    await enviarCorreoVerificacion(emailNormalizado, password);

    return res.status(201).json({
      mensaje: "Registro completado con éxito. Verifica tu correo electrónico.",
    });
  } catch (error) {
    if (createdUserId) {
      await Promise.allSettled([
        admin.auth().deleteUser(createdUserId),
        admin.firestore().collection("users").doc(createdUserId).delete(),
      ]);
    }

    let mensaje = error.message;

    if (error.code === "auth/email-already-exists") {
      mensaje = "Este correo ya está registrado.";
    } else if (error.code === "auth/invalid-email") {
      mensaje = "El correo no tiene un formato válido.";
    } else if (error.code === "auth/weak-password") {
      mensaje = "La contraseña debe tener al menos 6 caracteres.";
    }

    if (String(error.message || "").includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
      mensaje =
        "Firebase no pudo enviar el correo de verificaciÃ³n en este momento. Intenta registrar nuevamente en unos minutos.";
    } else if (String(error.message || "").includes("OPERATION_NOT_ALLOWED")) {
      mensaje =
        "Firebase Authentication no tiene habilitado el acceso con correo y contraseÃ±a. Revisa la configuraciÃ³n del proyecto.";
    } else if (String(error.message || "").includes("CONFIGURATION_NOT_FOUND")) {
      mensaje =
        "Firebase no encontrÃ³ la configuraciÃ³n necesaria para enviar el correo de verificaciÃ³n.";
    }

    return res.status(400).json({ mensaje });
  }
};

module.exports = { registrarUsuario, ROLES_VALIDOS, TIPOS_SANGRE_VALIDOS };
