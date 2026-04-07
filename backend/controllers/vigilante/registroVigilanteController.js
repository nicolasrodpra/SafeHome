// Adaptador pequeno para registrar vigilantes.
// Reutiliza el controlador general, fijando el rol "Vigilante".
const { registrarUsuario } = require("../registerController");

const registrarVigilante = async (req, res) => registrarUsuario(req, res, "Vigilante");

module.exports = { registrarVigilante };
