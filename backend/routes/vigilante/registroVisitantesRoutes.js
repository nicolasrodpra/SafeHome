// Rutas operativas de visitantes.
const express = require("express");
const {
  obtenerVisitantes,
  crearVisitante,
  actualizarVisitante,
  eliminarVisitante,
} = require("../../controllers/vigilante/registroVisitantesController");

const router = express.Router();

router.get("/visitantes", obtenerVisitantes);
router.post("/visitantes", crearVisitante);
router.put("/visitantes/:id", actualizarVisitante);
router.delete("/visitantes/:id", eliminarVisitante);

module.exports = router;
