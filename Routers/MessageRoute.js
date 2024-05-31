const express = require("express");

const {
  replyToMessage,
  getRepliesToMessage,
  addMessage,
  getMessage,
  updateMessage,
  deleteMessage,
  toggleReactionToMessage,
  createFilterObj,
} = require("../services/MessageServices");
const authServices = require("../services/authServices");

const router = express.Router();

router.post("/:chatId", authServices.protect, addMessage);
router.get("/:chatId", authServices.protect, createFilterObj, getMessage);

router.put("/:messageId", authServices.protect, updateMessage);
router.post("/:messageId/reply", authServices.protect, replyToMessage);
router.get("/:messageId/replies", authServices.protect, getRepliesToMessage);
router.delete("/:messageId", authServices.protect, deleteMessage);
router.post(
  "/:messageId/reactions",
  authServices.protect,
  toggleReactionToMessage
);

module.exports = router;
