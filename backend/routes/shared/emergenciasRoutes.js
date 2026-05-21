const express = require("express");
const {
  atenderEmergencia,
  crearEmergencia,
  listarEmergenciasActivas,
} = require("../../controllers/shared/emergenciasController");

const router = express.Router();

router.get("/emergencias/activas", listarEmergenciasActivas);
router.post("/emergencias", crearEmergencia);
router.put("/emergencias/:id/atender", atenderEmergencia);

module.exports = router;
