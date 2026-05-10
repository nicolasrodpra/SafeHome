// Rutas del módulo de usuarios.
// Exponen creación, consulta de perfil, actualización y lista de residentes.
const express = require("express");
const { crearUsuario } = require("../../controllers/shared/crearUsuarioController");
const {
  actualizarPerfilUsuario,
  actualizarResidenteDesdeAdmin,
  eliminarResidenteDesdeAdmin,
  listarResidentes,
  obtenerPerfilUsuario,
} = require("../../controllers/shared/usuariosController");

const router = express.Router();

router.post("/users", crearUsuario);
router.get("/users/residentes", listarResidentes);
router.put("/users/residentes/:uid", actualizarResidenteDesdeAdmin);
router.delete("/users/residentes/:uid", eliminarResidenteDesdeAdmin);
router.get("/users/:uid/profile", obtenerPerfilUsuario);
router.put("/users/:uid/profile", actualizarPerfilUsuario);

module.exports = router;
