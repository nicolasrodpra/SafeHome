// Controlador general de registro de usuarios.
// Valida entradas, protege la ubicación única del residente y completa el alta en Auth + Firestore.
const admin = require("../config/firebaseAdmin");

const ROLES_VALIDOS = ["Administrador", "Residente", "Vigilante"];
const TIPOS_SANGRE_VALIDOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const FIREBASE_AUTH_BASE_URL = "https://identitytoolkit.googleapis.com/v1";
const RESIDENT_LOCATION_COLLECTION = "residentLocations";

// Helpers de acceso y normalización.
const usersCollection = () => admin.firestore().collection("users");
const residentLocationsCollection = () =>
  admin.firestore().collection(RESIDENT_LOCATION_COLLECTION);

const limpiarTexto = (value) => (typeof value === "string" ? value.trim() : "");
const esCedulaNumerica = (value) => /^\d+$/.test(limpiarTexto(value));

const normalizarUbicacion = (value) => {
  const normalizedValue = limpiarTexto(value).toUpperCase().replace(/\s+/g, "");

  if (!normalizedValue) {
    return "";
  }

  return /^\d+$/.test(normalizedValue)
    ? String(Number.parseInt(normalizedValue, 10))
    : normalizedValue;
};

const getResidentLocationKey = (torre, apartamento) => `${torre}__${apartamento}`;

const parseCantidadParqueaderos = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  const textValue = limpiarTexto(value);
  const parsedValue = Number(textValue);

  return Number.isFinite(parsedValue) ? Math.trunc(parsedValue) : NaN;
};

const parseTarifaHora = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const textValue = limpiarTexto(value).replace(",", ".");
  const parsedValue = Number(textValue);

  return Number.isFinite(parsedValue) ? parsedValue : NaN;
};

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Reglas específicas del residente para evitar duplicar torre + apartamento.
const existeResidenteEnUbicacion = async (torre, apartamento) => {
  if (!torre || !apartamento) {
    return false;
  }

  const snapshot = await usersCollection().where("rol", "==", "Residente").get();

  return snapshot.docs.some((docSnapshot) => {
    const data = docSnapshot.data() || {};

    return (
      normalizarUbicacion(data.torre) === torre &&
      normalizarUbicacion(data.apartamento) === apartamento
    );
  });
};

const reservarUbicacionResidente = async ({ torre, apartamento, email }) => {
  const locationRef = residentLocationsCollection().doc(getResidentLocationKey(torre, apartamento));

  await admin.firestore().runTransaction(async (transaction) => {
    const locationSnapshot = await transaction.get(locationRef);

    if (locationSnapshot.exists) {
      throw new Error(
        `Ya existe un residente registrado en la torre ${torre} apartamento ${apartamento}.`
      );
    }

    transaction.set(locationRef, {
      torre,
      apartamento,
      email: limpiarTexto(email).toLowerCase(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
};

const liberarUbicacionResidente = async (torre, apartamento) => {
  if (!torre || !apartamento) {
    return;
  }

  await residentLocationsCollection().doc(getResidentLocationKey(torre, apartamento)).delete();
};

// Armado y validación por rol.
const construirDatosPorRol = ({
  rol,
  torre,
  apartamento,
  zonaVigilancia,
  tipoSangre,
  tarifaHora,
  cantidadParqueaderos,
  residentLocationKey,
}) => {
  if (rol === "Residente") {
    return { torre, apartamento, residentLocationKey };
  }

  if (rol === "Vigilante") {
    return { zonaVigilancia, tipoSangre, tarifaHora, cantidadParqueaderos };
  }

  return {};
};

const validarCamposPorRol = ({
  rol,
  torre,
  apartamento,
  zonaVigilancia,
  tipoSangre,
  tarifaHora,
  cantidadParqueaderos,
}) => {
  if (rol === "Residente" && (!torre || !apartamento)) {
    return "Para registrar un residente debes completar torre y apartamento.";
  }

  if (
    rol === "Vigilante" &&
    (!zonaVigilancia ||
      !tipoSangre ||
      Number.isNaN(tarifaHora) ||
      Number.isNaN(cantidadParqueaderos))
  ) {
    return "Para registrar un vigilante debes completar la zona de vigilancia, el tipo de sangre, la tarifa por hora y la cantidad de parqueaderos.";
  }

  if (rol === "Vigilante" && !TIPOS_SANGRE_VALIDOS.includes(tipoSangre)) {
    return "Selecciona un tipo de sangre válido.";
  }

  if (rol === "Vigilante" && tarifaHora <= 0) {
    return "La tarifa por hora del vigilante debe ser mayor a 0.";
  }

  if (rol === "Vigilante" && cantidadParqueaderos <= 0) {
    return "La cantidad de parqueaderos del vigilante debe ser mayor a 0.";
  }

  return "";
};

// Llamadas directas a Firebase Auth para iniciar sesión temporal y disparar el correo de verificación.
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

// Flujo principal de registro.
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
    cantidadParqueaderos,
  } = req.body;

  const rolFinal = limpiarTexto(rol) || rolPorDefecto;
  const nombresNormalizados = limpiarTexto(nombres);
  const apellidosNormalizados = limpiarTexto(apellidos);
  const nombreCompleto =
    limpiarTexto(nombre) ||
    [nombresNormalizados, apellidosNormalizados].filter(Boolean).join(" ").trim();
  const emailNormalizado = limpiarTexto(email).toLowerCase();
  const cedulaNormalizada = limpiarTexto(cedula);
  const torreNormalizada = normalizarUbicacion(torre);
  const apartamentoNormalizado = normalizarUbicacion(apartamento);
  const zonaVigilanciaNormalizada = limpiarTexto(zonaVigilancia);
  const tipoSangreNormalizado = limpiarTexto(tipoSangre);
  const tarifaHoraNormalizada = parseTarifaHora(tarifaHora);
  const cantidadParqueaderosNormalizada = parseCantidadParqueaderos(cantidadParqueaderos);
  const residentLocationKey =
    rolFinal === "Residente"
      ? getResidentLocationKey(torreNormalizada, apartamentoNormalizado)
      : "";

  if (!nombreCompleto || !emailNormalizado || !password || !confirmPassword || !rolFinal) {
    return res.status(400).json({ mensaje: "Completa todos los campos." });
  }

  if (!esCedulaNumerica(cedulaNormalizada)) {
    return res.status(400).json({ mensaje: "La cedula solo puede contener numeros." });
  }

  if (!ROLES_VALIDOS.includes(rolFinal)) {
    return res.status(400).json({ mensaje: "Selecciona un rol válido." });
  }

  const mensajeCamposPorRol = validarCamposPorRol({
    rol: rolFinal,
    torre: torreNormalizada,
    apartamento: apartamentoNormalizado,
    zonaVigilancia: zonaVigilanciaNormalizada,
    tipoSangre: tipoSangreNormalizado,
    tarifaHora: tarifaHoraNormalizada,
    cantidadParqueaderos: cantidadParqueaderosNormalizada,
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

  if (
    rolFinal === "Residente" &&
    (await existeResidenteEnUbicacion(torreNormalizada, apartamentoNormalizado))
  ) {
    return res.status(400).json({
      mensaje: `Ya existe un residente registrado en la torre ${torreNormalizada} apartamento ${apartamentoNormalizado}.`,
    });
  }

  let createdUserId = "";
  let residentLocationReserved = false;

  try {
    if (rolFinal === "Residente") {
      await reservarUbicacionResidente({
        torre: torreNormalizada,
        apartamento: apartamentoNormalizado,
        email: emailNormalizado,
      });
      residentLocationReserved = true;
    }

    const userRecord = await admin.auth().createUser({
      email: emailNormalizado,
      password,
      displayName: nombreCompleto,
    });
    createdUserId = userRecord.uid;

    const userData = {
      nombre: nombreCompleto,
      nombres: nombresNormalizados,
      apellidos: apellidosNormalizados,
      cedula: cedulaNormalizada,
      correo: emailNormalizado,
      email: emailNormalizado,
      rol: rolFinal,
      ...construirDatosPorRol({
        rol: rolFinal,
        torre: torreNormalizada,
        apartamento: apartamentoNormalizado,
        zonaVigilancia: zonaVigilanciaNormalizada,
        tipoSangre: tipoSangreNormalizado,
        tarifaHora: tarifaHoraNormalizada,
        cantidadParqueaderos: cantidadParqueaderosNormalizada,
        residentLocationKey,
      }),
      creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    };

    await usersCollection().doc(userRecord.uid).set(userData);
    await enviarCorreoVerificacion(emailNormalizado, password);

    return res.status(201).json({
      mensaje: "Registro completado con éxito. Verifica tu correo electrónico.",
    });
  } catch (error) {
    if (createdUserId) {
      await Promise.allSettled([
        admin.auth().deleteUser(createdUserId),
        usersCollection().doc(createdUserId).delete(),
      ]);
    }

    if (residentLocationReserved) {
      await Promise.allSettled([
        liberarUbicacionResidente(torreNormalizada, apartamentoNormalizado),
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
        "Firebase no pudo enviar el correo de verificación en este momento. Intenta registrar nuevamente en unos minutos.";
    } else if (String(error.message || "").includes("OPERATION_NOT_ALLOWED")) {
      mensaje =
        "Firebase Authentication no tiene habilitado el acceso con correo y contraseña. Revisa la configuración del proyecto.";
    } else if (String(error.message || "").includes("CONFIGURATION_NOT_FOUND")) {
      mensaje =
        "Firebase no encontró la configuración necesaria para enviar el correo de verificación.";
    }

    return res.status(400).json({ mensaje });
  }
};

module.exports = { registrarUsuario, ROLES_VALIDOS, TIPOS_SANGRE_VALIDOS };
