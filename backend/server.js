require("dotenv").config();
const cors = require("cors");
const express = require("express");
const path = require("path");
require("./config/firebaseAdmin");

const manualConvivenciaRoutes = require("./routes/admin/manualConvivenciaRoutes");
const registroAdminRoutes = require("./routes/admin/registroAdminRoutes");
const loginRoutes = require("./routes/general/loginRoutes");
const registroResidenteRoutes = require("./routes/residente/registroResidenteRoutes");
const registroCorrespondenciaRoutes = require("./routes/vigilante/registroCorrespondenciaRoutes");
const registroVehiculosRoutes = require("./routes/vigilante/registroVehiculosRoutes");
const registroVisitantesRoutes = require("./routes/vigilante/registroVisitantesRoutes");
const registroVigilanteRoutes = require("./routes/vigilante/registroVigilanteRoutes");

const app = express();
const apiRoutes = [
  registroAdminRoutes,
  loginRoutes,
  registroResidenteRoutes,
  registroVehiculosRoutes,
  registroVigilanteRoutes,
];

app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("API SafeHome funcionando");
});

app.use("/api", registroAdminRoutes);
app.use("/api", manualConvivenciaRoutes);
app.use("/api", loginRoutes);
app.use("/api", registroResidenteRoutes);
app.use("/api", registroCorrespondenciaRoutes);
app.use("/api", registroVehiculosRoutes);
app.use("/api", registroVisitantesRoutes);
app.use("/api", registroVigilanteRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
