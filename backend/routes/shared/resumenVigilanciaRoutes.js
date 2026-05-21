// Ruta del resumen de vigilancia para el dashboard del vigilante.
const express = require("express");
const {
  actualizarParqueaderosVigilancia,
  actualizarConfiguracionVigilancia,
  obtenerConfiguracionVigilancia,
  obtenerResumenVigilancia,
} = require("../../controllers/shared/resumenVigilanciaController");

const router = express.Router();

router.get("/resumen-vigilancia", obtenerResumenVigilancia);
router.get("/vigilancia/configuracion", obtenerConfiguracionVigilancia);
router.put("/vigilancia/configuracion", actualizarConfiguracionVigilancia);
router.put("/vigilancia/configuracion/parqueaderos", actualizarParqueaderosVigilancia);

module.exports = router;
