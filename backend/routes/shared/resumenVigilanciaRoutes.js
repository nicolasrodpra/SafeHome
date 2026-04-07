// Ruta del resumen de vigilancia para el dashboard del vigilante.
const express = require("express");
const {
  obtenerResumenVigilancia,
} = require("../../controllers/shared/resumenVigilanciaController");

const router = express.Router();

router.get("/resumen-vigilancia", obtenerResumenVigilancia);

module.exports = router;
