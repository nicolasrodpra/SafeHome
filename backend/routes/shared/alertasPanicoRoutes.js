const express = require("express");
const {
  cerrarAlertaPanicoPorResidente,
  crearAlertaPanico,
  guardarAudioAlertaPanico,
  listarAlertasPanico,
  marcarAlertaPanicoEnCamino,
  obtenerAlertaPanicoActivaResidente,
  resolverAlertaPanico,
} = require("../../controllers/shared/alertasPanicoController");

const router = express.Router();

router.get("/alertas-panico", listarAlertasPanico);
router.get("/alertas-panico/residente/:residentId/activa", obtenerAlertaPanicoActivaResidente);
router.post("/alertas-panico", crearAlertaPanico);
router.put("/alertas-panico/:id/en-camino", marcarAlertaPanicoEnCamino);
router.put("/alertas-panico/:id/audio", guardarAudioAlertaPanico);
router.put("/alertas-panico/:id/residente-cierre", cerrarAlertaPanicoPorResidente);
router.put("/alertas-panico/:id/resolver", resolverAlertaPanico);

module.exports = router;
