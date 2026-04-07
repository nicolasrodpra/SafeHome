// Adaptador pequeno para registrar administradores.
// Solo reutiliza el flujo general de registro forzando el rol correcto.
const { registrarUsuario } = require("../registerController");

const registrarAdmin = async (req, res) => registrarUsuario(req, res, "Administrador");

module.exports = { registrarAdmin };
