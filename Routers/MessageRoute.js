const express = require("express");

const {
  addMessage,
  getMessage,
  updateMessage,
  deleteMessage,
  toggleReactionToMessage,
  replyToMessage,
  getRepliesToMessage,
  forwardMessage,
  getForwardedMessages,
} = require("../services/MessageServices");
const authServices = require("../services/authServices");

const router = express.Router();

router.post("/:chatId", authServices.protect, addMessage);
router.get("/:chatId", authServices.protect, getMessage);
router.put("/:messageId", authServices.protect, updateMessage);
router.delete("/:messageId", authServices.protect, deleteMessage);
router.post(
  "/:messageId/reactions",
  authServices.protect,
  toggleReactionToMessage
);
router.post("/:messageId/reply", authServices.protect, replyToMessage);
router.get("/:messageId/replies", authServices.protect, getRepliesToMessage);
router.post("/:messageId/forward", authServices.protect, forwardMessage);
router.get("/:messageId/forwarded", authServices.protect, getForwardedMessages);

module.exports = router;
