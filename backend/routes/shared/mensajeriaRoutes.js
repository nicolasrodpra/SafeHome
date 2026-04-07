// Rutas del modulo de mensajeria o PQRS.
const express = require("express");
const {
  crearMensaje,
  listarMensajeria,
  responderMensaje,
} = require("../../controllers/shared/mensajeriaController");

const router = express.Router();

router.get("/mensajeria", listarMensajeria);
router.post("/mensajeria", crearMensaje);
router.put("/mensajeria/:id/respuesta", responderMensaje);

module.exports = router;
