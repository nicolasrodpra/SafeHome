// Punto de entrada del backend.
// Aqui se inicializa Express, se registra Firebase, se montan las rutas
// y se programan las limpiezas automaticas de registros temporales.
require("dotenv").config();
const cors = require("cors");
const express = require("express");
const path = require("path");
const admin = require("./config/firebaseAdmin");
const { readVigilanciaConfig } = require("./utils/vigilanciaConfig");

const manualConvivenciaRoutes = require("./routes/admin/manualConvivenciaRoutes");
const registroAdminRoutes = require("./routes/admin/registroAdminRoutes");
const loginRoutes = require("./routes/general/loginRoutes");
const registroResidenteRoutes = require("./routes/residente/registroResidenteRoutes");
const comunicadosRoutes = require("./routes/shared/comunicadosRoutes");
const emergenciasRoutes = require("./routes/shared/emergenciasRoutes");
const mensajeriaRoutes = require("./routes/shared/mensajeriaRoutes");
const reservasRoutes = require("./routes/shared/reservasRoutes");
const resumenVigilanciaRoutes = require("./routes/shared/resumenVigilanciaRoutes");
const assistantRoutes = require("./routes/shared/assistantRoutes");
const alertasPanicoRoutes = require("./routes/shared/alertasPanicoRoutes");
const usuariosRoutes = require("./routes/shared/usuariosRoutes");
const registroCorrespondenciaRoutes = require("./routes/vigilante/registroCorrespondenciaRoutes");
const registroVehiculosRoutes = require("./routes/vigilante/registroVehiculosRoutes");
const registroVisitantesRoutes = require("./routes/vigilante/registroVisitantesRoutes");
const registroVigilanteRoutes = require("./routes/vigilante/registroVigilanteRoutes");
const {
  limpiarVehiculosFinalizadosAntiguos,
} = require("./controllers/vigilante/registroVehiculosController");
const {
  limpiarVisitantesAntiguos,
} = require("./controllers/vigilante/registroVisitantesController");

const app = express();

app.disable("x-powered-by"); 
app.use(cors()); 
app.use(express.json({ limit: "35mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Sirve archivos desde la carpeta "uploads" para acceder a imÃ¡genes y documentos subidos.

app.get("/", (req, res) => {
  res.send("API SafeHome funcionando");
});

const formatGeneratedDate = (rawValue) => {
  const dateValue = new Date(rawValue);
  if (Number.isNaN(dateValue.getTime())) {
    return String(rawValue || "").trim() || "No disponible";
  }

  return dateValue.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getResidentProfileById = async (uid) => {
  const cleanUid = String(uid || "").trim();
  if (!cleanUid) {
    return {};
  }

  try {
    const snapshot = await admin.firestore().collection("users").doc(cleanUid).get();
    if (!snapshot.exists) {
      return {};
    }
    return snapshot.data() || {};
  } catch (error) {
    return {};
  }
};

const normalizeQrVehicleType = (value) => {
  const cleanValue = String(value || "").trim().toLowerCase();
  return cleanValue === "carro" ? "Carro" : "Moto";
};

const registerVisitorVehicleIfNeeded = async ({ visitorId, visitorData }) => {
  const hasVehicle = Boolean(visitorData?.conVehiculo);
  const placa = String(visitorData?.placa || "").trim().toUpperCase();

  if (!hasVehicle) {
    return { ok: true, parqueadero: "" };
  }

  if (!placa) {
    return {
      ok: false,
      mensaje: "El visitante tiene vehiculo registrado, pero no tiene placa. No se registro el vehiculo.",
    };
  }

  const vehiculosRef = admin.firestore().collection("vehiculos");
  const alreadyLinkedSnapshot = await vehiculosRef
    .where("visitanteId", "==", visitorId)
    .limit(1)
    .get();

  if (!alreadyLinkedSnapshot.empty) {
    return {
      ok: true,
      parqueadero: String(alreadyLinkedSnapshot.docs[0].data()?.parqueadero || "").trim(),
    };
  }

  const activePlateSnapshot = await vehiculosRef.where("placa", "==", placa).get();
  const hasActivePlate = activePlateSnapshot.docs.some((snapshotDoc) => {
    const estado = snapshotDoc.data()?.estado;
    return estado !== "Salio";
  });

  if (hasActivePlate) {
    return {
      ok: false,
      mensaje: `La placa ${placa} ya tiene un vehiculo activo. No se registro el vehiculo.`,
    };
  }

  const tipoVehiculo = normalizeQrVehicleType(visitorData?.tipoVehiculo || visitorData?.tipo);
  const parqueaderoSolicitado = String(
    visitorData?.parqueadero || visitorData?.parqueaderoVehiculo || ""
  ).trim();
  const parqueadero =
    parqueaderoSolicitado && (await isRequestedParkingAvailable(parqueaderoSolicitado, tipoVehiculo))
      ? parqueaderoSolicitado
      : await assignAvailableParking(tipoVehiculo);

  if (!parqueadero) {
    return {
      ok: false,
      mensaje: `No hay cupos de parqueadero disponibles para ${tipoVehiculo.toLowerCase()}s. No se registro el vehiculo.`,
    };
  }

  const now = new Date();
  await vehiculosRef.add({
    propietario: String(visitorData?.nombre || visitorData?.nombreCompleto || "").trim(),
    documento: String(visitorData?.documento || visitorData?.identificacion || "").trim(),
    placa,
    telefono: String(visitorData?.telefono || "").trim(),
    torre: String(visitorData?.torre || visitorData?.residenteTorre || "").trim(),
    apartamento: String(visitorData?.apartamento || visitorData?.residenteApartamento || "").trim(),
    parqueadero,
    tipo: tipoVehiculo,
    estado: "Activo",
    fecha: admin.firestore.Timestamp.fromDate(now),
    ingresoAt: admin.firestore.Timestamp.fromDate(now),
    createdAt: admin.firestore.Timestamp.fromDate(now),
    vigilanteRegistroUid: "",
    vigilanteRegistroNombre: "Ingreso por QR visitante",
    tarifaHoraBase: 0,
    visitanteId: visitorId,
    visitanteCodigoAcceso: String(visitorData?.codigoAcceso || "").trim(),
  });

  await admin.firestore().collection("visitantes").doc(visitorId).update({
    parqueadero,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, parqueadero };
};

const getParkingCapacity = async () => {
  const configuracion = await readVigilanciaConfig();
  return {
    Carro: Number(configuracion?.cantidadParqueaderosCarro) || 0,
    Moto: Number(configuracion?.cantidadParqueaderosMoto) || 0,
  };
};

const getOccupiedParkingByType = async (tipoVehiculo) => {
  const tipoNormalizado = normalizeQrVehicleType(tipoVehiculo);
  const vehiclesSnapshot = await admin.firestore().collection("vehiculos").get();
  return new Set(
    vehiclesSnapshot.docs
      .filter((snapshotDoc) => {
        const data = snapshotDoc.data() || {};
        return data.estado !== "Salio" && normalizeQrVehicleType(data.tipo) === tipoNormalizado;
      })
      .map((snapshotDoc) => String(snapshotDoc.data()?.parqueadero || "").trim())
      .filter(Boolean)
  );
};

const isRequestedParkingAvailable = async (parqueadero, tipoVehiculo) => {
  const parqueaderoNormalizado = String(parqueadero || "").trim();
  const tipoNormalizado = normalizeQrVehicleType(tipoVehiculo);
  const capacidad = await getParkingCapacity();
  const numeroParqueadero = Number.parseInt(parqueaderoNormalizado, 10);

  if (!numeroParqueadero || numeroParqueadero > capacidad[tipoNormalizado]) {
    return false;
  }

  const occupiedParking = await getOccupiedParkingByType(tipoNormalizado);
  return !occupiedParking.has(parqueaderoNormalizado);
};

const assignAvailableParking = async (tipoVehiculo = "Moto") => {
  const tipoNormalizado = normalizeQrVehicleType(tipoVehiculo);
  const capacidad = await getParkingCapacity();
  const parkingLimit = capacidad[tipoNormalizado];

  if (!parkingLimit) {
    return "";
  }

  const occupiedParking = await getOccupiedParkingByType(tipoNormalizado);

  for (let index = 1; index <= parkingLimit; index += 1) {
    const parkingNumber = String(index);
    if (!occupiedParking.has(parkingNumber)) {
      return parkingNumber;
    }
  }

  return "";
};

const renderQrVisitante = async (req, res) => {
  const rawPayload = String(req.query?.payload || "");

  if (!rawPayload) {
    return res.status(400).send("No se recibio informacion del visitante.");
  }

  let parsedPayload = null;

  try {
    parsedPayload = JSON.parse(rawPayload);
  } catch (error) {
    return res.status(400).send("El contenido del QR no es valido.");
  }

  const safe = (value) => String(value || "").trim();
  const yesNo = (value) => (value ? "Si" : "No");
  const visitanteId = safe(parsedPayload.visitanteId);
  let parkingAuthorizationError = "";
  if (visitanteId) {
    try {
      const visitorDoc = await admin.firestore().collection("visitantes").doc(visitanteId).get();
      if (visitorDoc.exists) {
        const visitorData = visitorDoc.data() || {};
        if ((visitorData.estado || visitorData.status) === "Pendiente") {
          const vehicleResult = await registerVisitorVehicleIfNeeded({
            visitorId: visitanteId,
            visitorData,
          });

          if (!vehicleResult.ok) {
            parkingAuthorizationError = vehicleResult.mensaje;
          }

          await visitorDoc.ref.update({
            estado: "Ingreso",
            status: "Ingreso",
            horaIngreso: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          const vehicleResult = await registerVisitorVehicleIfNeeded({
            visitorId: visitanteId,
            visitorData,
          });
          if (!vehicleResult.ok) {
            parkingAuthorizationError = vehicleResult.mensaje;
          }
        }
        const updatedVisitorDoc = await visitorDoc.ref.get();
        parsedPayload = { ...parsedPayload, ...updatedVisitorDoc.data() };
      }
    } catch (error) {
      // Si falla la lectura, seguimos mostrando la informacion incluida en el QR.
    }
  }

  const visitorName = safe(parsedPayload.nombreCompleto || parsedPayload.nombre) || "Visitante";
  const residentData = parsedPayload.residenteDatosCompletos || {};
  const dbResidentData = await getResidentProfileById(parsedPayload.residenteLookupId);
  const residentPhone = safe(
    parsedPayload.residenteTelefono ||
      residentData.telefono ||
      residentData.celular ||
      dbResidentData.telefono ||
      dbResidentData.celular
  );
  const prettyGeneratedDate = formatGeneratedDate(parsedPayload.generadoEn || parsedPayload.createdAt);
  const visitorDocument = safe(parsedPayload.identificacion || parsedPayload.documento);
  const visitorPhone = safe(parsedPayload.telefono);
  const entryHour = safe(parsedPayload.horaEntrada || parsedPayload.horaEntradaProgramada);
  const visitorVehicleType = safe(parsedPayload.tipoVehiculo || parsedPayload.tipo);
  const visitorParking = safe(parsedPayload.parqueadero || parsedPayload.parqueaderoVehiculo);

  const html = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>SafeHome - Detalle QR visitante</title>
        <style>
          body { font-family: Arial, sans-serif; background:#f6f5f8; color:#241a2d; margin:0; }
          .shell { max-width: 860px; margin: 0 auto; padding: 22px 14px 30px; }
          .card { background:#fff; border:1px solid rgba(17,24,39,.09); border-radius:14px; padding:14px; margin-bottom:12px; }
          h1 { margin:0 0 6px; color:#460669; font-size:24px; }
          h2 { margin:0 0 8px; color:#460669; font-size:18px; }
          .copy { color:#665d72; margin:0 0 12px; }
          .vehicle-alert {
            display:flex;
            gap:12px;
            align-items:flex-start;
            background:linear-gradient(135deg, #ffffff 0%, #fbf7fd 100%);
            border:1px solid rgba(70, 6, 105, .14);
            border-radius:16px;
            box-shadow:0 14px 38px rgba(49, 9, 77, .1);
            color:#2c2437;
            padding:16px;
            margin:14px 0 18px;
          }
          .vehicle-alert-icon {
            width:42px;
            height:42px;
            border-radius:14px;
            background:#f4e9f8;
            color:#7a124f;
            display:flex;
            align-items:center;
            justify-content:center;
            flex:0 0 auto;
            font-size:22px;
            font-weight:800;
          }
          .vehicle-alert-content { min-width:0; }
          .vehicle-alert-kicker {
            display:inline-flex;
            align-items:center;
            min-height:24px;
            padding:0 10px;
            border-radius:999px;
            background:#f3e8f8;
            color:#460669;
            font-size:11px;
            font-weight:800;
            letter-spacing:.04em;
            text-transform:uppercase;
            margin-bottom:8px;
          }
          .vehicle-alert-title {
            color:#21182f;
            font-size:17px;
            font-weight:800;
            margin:0 0 6px;
          }
          .vehicle-alert-copy {
            color:#675b73;
            font-size:14px;
            font-weight:600;
            line-height:1.5;
            margin:0;
          }
          .vehicle-alert-note {
            color:#8a315f;
            font-size:13px;
            font-weight:700;
            margin:8px 0 0;
          }
          table { width:100%; border-collapse: collapse; }
          td { border-bottom:1px solid #efedf3; padding:9px 6px; font-size:14px; vertical-align: top; }
          td.label { color:#6f647d; width:38%; font-weight:700; }
          td.value { color:#2c2437; font-weight:500; word-break: break-word; }
          .badge { display:inline-block; background:#f0e8fa; color:#460669; border-radius:999px; padding:6px 10px; font-size:12px; font-weight:700; }
        </style>
      </head>
      <body>
        <div class="shell">
          <div class="card">
            <h1>SafeHome - Acceso visitante</h1>
            <p class="copy">Informacion generada desde el QR de ingreso.</p>
            <span class="badge">Codigo: ${safe(parsedPayload.codigoAcceso) || "N/A"}</span>
          </div>
          ${
            parkingAuthorizationError
              ? `<div class="vehicle-alert">
                  <div class="vehicle-alert-icon">!</div>
                  <div class="vehicle-alert-content">
                    <span class="vehicle-alert-kicker">Parqueadero no disponible</span>
                    <p class="vehicle-alert-title">Visitante ingresado correctamente</p>
                    <p class="vehicle-alert-copy">${parkingAuthorizationError}</p>
                    <p class="vehicle-alert-note">El acceso del visitante queda registrado; el vehiculo no se agrego al modulo de parqueadero.</p>
                  </div>
                </div>`
              : ""
          }

          <div class="card">
            <h2>Datos del visitante</h2>
            <table>
              <tr><td class="label">Nombre completo</td><td class="value">${visitorName}</td></tr>
              <tr><td class="label">Identificacion</td><td class="value">${visitorDocument || "No registrada"}</td></tr>
              <tr><td class="label">Telefono</td><td class="value">${visitorPhone || "No registrado"}</td></tr>
              <tr><td class="label">Hora de entrada</td><td class="value">${entryHour || "No registrada"}</td></tr>
              <tr><td class="label">Estado</td><td class="value">${safe(parsedPayload.estado || parsedPayload.status) || "Pendiente"}</td></tr>
              <tr><td class="label">Entra con vehiculo</td><td class="value">${yesNo(parsedPayload.conVehiculo)}</td></tr>
              <tr><td class="label">Tipo de vehiculo</td><td class="value">${visitorVehicleType || "No aplica"}</td></tr>
              <tr><td class="label">Placa</td><td class="value">${safe(parsedPayload.placa) || "No aplica"}</td></tr>
              <tr><td class="label">Parqueadero</td><td class="value">${visitorParking || "No aplica"}</td></tr>
              <tr><td class="label">Fecha de generacion</td><td class="value">${prettyGeneratedDate}</td></tr>
            </table>
          </div>

          <div class="card">
            <h2>Datos del residente</h2>
            <table>
              <tr><td class="label">Nombre</td><td class="value">${safe(parsedPayload.residenteNombre || residentData.nombre) || "No disponible"}</td></tr>
              <tr><td class="label">Rol</td><td class="value">${safe(parsedPayload.residenteRol || residentData.rol) || "No disponible"}</td></tr>
              <tr><td class="label">Cedula</td><td class="value">${safe(parsedPayload.residenteCedula || residentData.cedula) || "No disponible"}</td></tr>
              <tr><td class="label">Email</td><td class="value">${safe(parsedPayload.residenteEmail || residentData.email) || "No disponible"}</td></tr>
              <tr><td class="label">Telefono</td><td class="value">${residentPhone || "No disponible"}</td></tr>
              <tr><td class="label">Torre</td><td class="value">${safe(parsedPayload.residenteTorre || residentData.torre) || "No disponible"}</td></tr>
              <tr><td class="label">Apartamento</td><td class="value">${safe(parsedPayload.residenteApartamento || residentData.apartamento) || "No disponible"}</td></tr>
            </table>
          </div>
        </div>
      </body>
    </html>
  `;

  return res.status(200).send(html);
};

app.get("/qr/visitante", renderQrVisitante);
app.get("/api/qr/visitante", renderQrVisitante);

// AquÃ­ agrupamos todas las rutas bajo `/api` para que el frontend
// tenga un punto Ãºnico de entrada hacia el backend.
app.use("/api", registroAdminRoutes);
app.use("/api", manualConvivenciaRoutes);
app.use("/api", loginRoutes);
app.use("/api", registroResidenteRoutes);
app.use("/api", usuariosRoutes);
app.use("/api", comunicadosRoutes);
app.use("/api", emergenciasRoutes);
app.use("/api", mensajeriaRoutes);
app.use("/api", reservasRoutes);
app.use("/api", resumenVigilanciaRoutes);
app.use("/api", assistantRoutes);
app.use("/api", alertasPanicoRoutes);
app.use("/api", registroCorrespondenciaRoutes);
app.use("/api", registroVehiculosRoutes);
app.use("/api", registroVisitantesRoutes);
app.use("/api", registroVigilanteRoutes);

const PORT = process.env.PORT || 5000;
const DAILY_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

limpiarVehiculosFinalizadosAntiguos().catch((error) => {
  console.error("No se pudo ejecutar la limpieza inicial de vehiculos:", error.message);
});

limpiarVisitantesAntiguos().catch((error) => {
  console.error("No se pudo ejecutar la limpieza inicial de visitantes:", error.message);
});

setInterval(() => {
  limpiarVehiculosFinalizadosAntiguos().catch((error) => {
    console.error("No se pudo ejecutar la limpieza programada de vehiculos:", error.message);
  });

  limpiarVisitantesAntiguos().catch((error) => {
    console.error("No se pudo ejecutar la limpieza programada de visitantes:", error.message);
  });
}, DAILY_CLEANUP_INTERVAL_MS); // Ejecuta la limpieza cada 24 horas

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
