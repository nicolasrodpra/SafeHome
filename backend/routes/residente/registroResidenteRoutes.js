const express = require("express");
const { registrarResidente } = require("../../controllers/residente/registroResidenteController");

const router = express.Router();

router.post("/registrar-residente", registrarResidente);

module.exports = router;