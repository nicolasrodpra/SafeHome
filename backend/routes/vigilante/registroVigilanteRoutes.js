// Ruta especializada para registrar vigilantes.
const express = require("express");
const { registrarVigilante } = require("../../controllers/vigilante/registroVigilanteController");

const router = express.Router();

router.post("/registrar-vigilante", registrarVigilante);

module.exports = router;
