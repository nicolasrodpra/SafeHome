const express = require("express");
const { chatWithAssistant } = require("../../controllers/shared/assistantController");

const router = express.Router();

router.post("/assistant/chat", chatWithAssistant);

module.exports = router;
