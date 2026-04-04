const express = require("express");
const {
  crearReserva,
  eliminarReserva,
  listarReservas,
} = require("../../controllers/shared/reservasController");

const router = express.Router();

router.get("/reservas", listarReservas);
router.post("/reservas", crearReserva);
router.delete("/reservas/:id", eliminarReserva);

module.exports = router;
