// Rutas del modulo de usuarios.
// Exponen creacion, consulta de perfil, actualizacion y lista de residentes.
const express = require("express");
const { crearUsuario } = require("../../controllers/shared/crearUsuarioController");
const {
  actualizarPerfilUsuario,
  listarResidentes,
  obtenerPerfilUsuario,
} = require("../../controllers/shared/usuariosController");

const router = express.Router();

router.post("/users", crearUsuario);
router.get("/users/residentes", listarResidentes);
router.get("/users/:uid/profile", obtenerPerfilUsuario);
router.put("/users/:uid/profile", actualizarPerfilUsuario);

module.exports = router;
