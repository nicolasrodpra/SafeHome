// Punto de entrada del backend.
// Aqui se inicializa Express, se registra Firebase, se montan las rutas
// y se programan las limpiezas automaticas de registros temporales.
require("dotenv").config();
const cors = require("cors");
const express = require("express");
const path = require("path");
require("./config/firebaseAdmin");

const manualConvivenciaRoutes = require("./routes/admin/manualConvivenciaRoutes");
const registroAdminRoutes = require("./routes/admin/registroAdminRoutes");
const loginRoutes = require("./routes/general/loginRoutes");
const registroResidenteRoutes = require("./routes/residente/registroResidenteRoutes");
const comunicadosRoutes = require("./routes/shared/comunicadosRoutes");
const mensajeriaRoutes = require("./routes/shared/mensajeriaRoutes");
const reservasRoutes = require("./routes/shared/reservasRoutes");
const resumenVigilanciaRoutes = require("./routes/shared/resumenVigilanciaRoutes");
const assistantRoutes = require("./routes/shared/assistantRoutes");
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
app.use(express.json({ limit: "15mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Sirve archivos desde la carpeta "uploads" para acceder a imágenes y documentos subidos.

app.get("/", (req, res) => {
  res.send("API SafeHome funcionando");
});

// Aquí agrupamos todas las rutas bajo `/api` para que el frontend
// tenga un punto único de entrada hacia el backend.
app.use("/api", registroAdminRoutes);
app.use("/api", manualConvivenciaRoutes);
app.use("/api", loginRoutes);
app.use("/api", registroResidenteRoutes);
app.use("/api", usuariosRoutes);
app.use("/api", comunicadosRoutes);
app.use("/api", mensajeriaRoutes);
app.use("/api", reservasRoutes);
app.use("/api", resumenVigilanciaRoutes);
app.use("/api", assistantRoutes);
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
