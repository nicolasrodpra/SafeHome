const { registrarUsuario } = require("../registerController");

const registrarResidente = async (req, res) => registrarUsuario(req, res, "Residente");

module.exports = { registrarResidente };
