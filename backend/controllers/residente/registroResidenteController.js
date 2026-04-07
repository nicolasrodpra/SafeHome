// Adaptador pequeno para registrar residentes.
// Reutiliza el controlador general, fijando el rol "Residente".
const { registrarUsuario } = require("../registerController");

const registrarResidente = async (req, res) => registrarUsuario(req, res, "Residente");

module.exports = { registrarResidente };
