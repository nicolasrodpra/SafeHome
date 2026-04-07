// Rutas operativas de vehículos visitantes.
const express = require("express");
const {
  obtenerVehiculos,
  crearVehiculo,
  actualizarVehiculo,
  registrarSalidaVehiculo,
  eliminarVehiculo,
} = require("../../controllers/vigilante/registroVehiculosController");

const router = express.Router();

router.get("/vehiculos",     obtenerVehiculos);
router.post("/vehiculos",    crearVehiculo);
router.put("/vehiculos/:id", actualizarVehiculo);
router.post("/vehiculos/:id/salida", registrarSalidaVehiculo);
router.delete("/vehiculos/:id", eliminarVehiculo);

module.exports = router;
