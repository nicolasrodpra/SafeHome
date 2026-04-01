const { registrarUsuario } = require("../registerController");

const registrarVigilante = async (req, res) => registrarUsuario(req, res, "Vigilante");

module.exports = { registrarVigilante };
