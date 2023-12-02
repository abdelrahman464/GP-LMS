const express = require("express");

const authServices = require("../services/authServices");
const {
  addMessage,
  getMessage,
  updateMessage,
  deleteMessage,
  addReactionToMessage,
  removeReactionFromMessage,
  replyToMessage,
  getRepliesToMessage,
  forwardMessage,
  getForwardedMessages,
} = require("../services/MessageServices");

const router = express.Router();

router.post("/", authServices.protect, addMessage);
router.get("/:chatId", authServices.protect, getMessage);

module.exports = router;
