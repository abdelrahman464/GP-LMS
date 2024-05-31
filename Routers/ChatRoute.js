const express = require("express");
const {
  createChat,
  findChat,
  createGroupChat,
  addParticipantToChat,
  removeParticipantFromChat,
  updateParticipantRoleInChat,
  getChatDetails,
  updateGrpupChat,
  deleteChat,
  pinMessageInChat,
  unpinMessageInChat,
  archiveChat,
  unarchiveChat,
  getMyChats,
} = require("../services/ChatServices");
const authServices = require("../services/authServices");

const router = express.Router();
router.post(
  "/:receiverId",
  authServices.protect,
  authServices.allowedTo("admin"),
  createChat
);

router.post(
  "/",
  authServices.protect,
  authServices.allowedTo("admin"),
  createGroupChat
);

router.get("/myChats", authServices.protect, getMyChats);
router.get("/find/:secondPersonId", authServices.protect, findChat);

router.put(
  "/:chatId/addParticipant",
  authServices.protect,
  addParticipantToChat
);
router.put(
  "/:chatId/removeParticipant",
  authServices.protect,
  removeParticipantFromChat
);
router.put(
  "/:chatId/updateParticipantRole",
  authServices.protect,
  updateParticipantRoleInChat
);
router.get("/:chatId/details", authServices.protect, getChatDetails);
router.put(
  "/:chatId/updateGroup",
  authServices.protect,
  updateGrpupChat
);
router.delete("/:chatId", authServices.protect, deleteChat);
router.post("/:chatId/pin/:messageId", authServices.protect, pinMessageInChat);
router.delete(
  "/:chatId/unpin/:messageId",
  authServices.protect,
  unpinMessageInChat
);
router.put("/:chatId/archive", authServices.protect, archiveChat);
router.put("/:chatId/unarchive", authServices.protect, unarchiveChat);

module.exports = router;
