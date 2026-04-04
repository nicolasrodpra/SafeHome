const express = require("express");
const {
  actualizarComunicado,
  crearComunicado,
  eliminarComunicado,
  listarComunicados,
} = require("../../controllers/shared/comunicadosController");

const router = express.Router();

router.get("/comunicados", listarComunicados);
router.post("/comunicados", crearComunicado);
router.put("/comunicados/:id", actualizarComunicado);
router.delete("/comunicados/:id", eliminarComunicado);

module.exports = router;
