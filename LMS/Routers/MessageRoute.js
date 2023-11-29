const express = require("express");

const { addMessage, getMessage } = require("../services/MessageServices");
const authServices = require("../services/authServices");
const router = express.Router();

router.post("/", authServices.protect, addMessage);
router.get("/:chatId", authServices.protect, getMessage);

module.exports = router;
