const { registrarUsuario } = require("../registerController");

const registrarAdmin = async (req, res) => registrarUsuario(req, res, "Administrador");

module.exports = { registrarAdmin };
