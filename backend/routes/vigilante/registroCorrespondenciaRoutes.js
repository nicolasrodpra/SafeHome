// Rutas operativas de correspondencia.
const express = require("express");
const {
  obtenerCorrespondencia,
  crearCorrespondencia,
  actualizarCorrespondencia,
  marcarCorrespondenciaEntregada,
  eliminarCorrespondencia,
} = require("../../controllers/vigilante/registroCorrespondenciaController");

const router = express.Router();

router.get("/correspondencia", obtenerCorrespondencia);
router.post("/correspondencia", crearCorrespondencia);
router.put("/correspondencia/:id", actualizarCorrespondencia);
router.post("/correspondencia/:id/entregar", marcarCorrespondenciaEntregada);
router.delete("/correspondencia/:id", eliminarCorrespondencia);

module.exports = router;
