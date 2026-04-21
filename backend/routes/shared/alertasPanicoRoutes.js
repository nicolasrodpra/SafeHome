const express = require("express");
const {
  crearAlertaPanico,
  listarAlertasPanico,
  resolverAlertaPanico,
} = require("../../controllers/shared/alertasPanicoController");

const router = express.Router();

router.get("/alertas-panico", listarAlertasPanico);
router.post("/alertas-panico", crearAlertaPanico);
router.put("/alertas-panico/:id/resolver", resolverAlertaPanico);

module.exports = router;
