// =====================================================
// RUTAS DEL MÓDULO DE RESERVAS
// =====================================================
// Define todos los endpoints de la API para CRUD de reservas
// Las validaciones de negocio las hace el controlador
const express = require("express");
const {
  actualizarReserva,  // Actualizar una reserva existente
  crearReserva,       // Crear nueva reserva
  eliminarReserva,    // Eliminar una reserva
  listarReservas,     // Obtener todas las reservas
} = require("../../controllers/shared/reservasController");

const router = express.Router();

// GET /api/reservas - Obtener todas las reservas (para cargar el calendario)
router.get("/reservas", listarReservas);

// POST /api/reservas - Crear una nueva reserva
router.post("/reservas", crearReserva);

// PUT /api/reservas/:id - Actualizar una reserva existente
router.put("/reservas/:id", actualizarReserva);

// DELETE /api/reservas/:id - Eliminar una reserva
router.delete("/reservas/:id", eliminarReserva);

module.exports = router;
