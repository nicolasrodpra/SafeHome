// Controlador compartido para crear usuarios desde administracion.
// Delegamos en el registro general pero dejamos un endpoint comun /users.
const { registrarUsuario } = require("../registerController");

// Esta función reutiliza el flujo general de registro, pero deja
// el endpoint preparado para creaciones internas desde administración.
const crearUsuario = async (req, res) => registrarUsuario(req, res, req.body?.rol);

module.exports = {
  crearUsuario,
};
