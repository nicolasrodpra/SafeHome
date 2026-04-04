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
