// Ruta de autenticación.
// Conecta POST /login con el controlador de inicio de sesión.
const express = require("express");
const { login } = require("../../controllers/general/loginController");

const router = express.Router();

router.post("/login", login);

module.exports = router;
