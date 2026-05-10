// Rutas del módulo de mensajería o PQRS.
const express = require("express");
const {
  crearMensaje,
  gestionarMensaje,
  listarMensajeria,
} = require("../../controllers/shared/mensajeriaController");

const router = express.Router();

router.get("/mensajeria", listarMensajeria);
router.post("/mensajeria", crearMensaje);
router.put("/mensajeria/:id/gestion", gestionarMensaje);
router.put("/mensajeria/:id/respuesta", gestionarMensaje);

module.exports = router;
