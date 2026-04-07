// Ruta especializada para registrar administradores.
const express = require("express");
const { registrarAdmin } = require("../../controllers/admin/registroAdminController");

const router = express.Router();

router.post("/registrar-admin", registrarAdmin);

module.exports = router;
