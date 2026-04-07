// Ruta de autenticacion.
// Conecta POST /login con el controlador de inicio de sesion.
const express = require("express");
const { login } = require("../../controllers/general/loginController");

const router = express.Router();

router.post("/login", login);

module.exports = router;
