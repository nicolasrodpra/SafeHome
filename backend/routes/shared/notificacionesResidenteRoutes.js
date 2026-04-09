const express = require("express");
const {
  listarNotificacionesResidente,
  marcarNotificacionesComoVistas,
} = require("../../controllers/shared/notificacionesResidenteController");

const router = express.Router();

router.get("/residentes/:residentId/notificaciones", listarNotificacionesResidente);
router.put(
  "/residentes/:residentId/notificaciones/marcar-vistas",
  marcarNotificacionesComoVistas
);

module.exports = router;
