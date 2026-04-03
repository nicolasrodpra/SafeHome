const express = require("express");
const {
  deleteManualConvivencia,
  getManualConvivencia,
  uploadManualConvivencia,
} = require("../../controllers/admin/manualConvivenciaController");

const router = express.Router();

router.get("/manual-convivencia", getManualConvivencia);
router.post("/manual-convivencia", uploadManualConvivencia);
router.delete("/manual-convivencia", deleteManualConvivencia);

module.exports = router;
