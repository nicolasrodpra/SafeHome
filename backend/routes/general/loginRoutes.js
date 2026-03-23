const express = require("express");
const { login } = require("../../controllers/general/loginController");

const router = express.Router();

router.post("/login", login);

module.exports = router;