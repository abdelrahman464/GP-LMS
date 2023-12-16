const express = require("express");
const {
  createChat,
  findChat,
  getMyChats,
  createGroupChat,
  // getLoggedUserGroupChats,
  // getLoggedUserChats,
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
  markUserMessagesAsRead
} = require("../services/ChatServices");
const authServices = require("../services/authServices");

const router = express.Router();
router.post("/group", authServices.protect, createGroupChat);

router.post("/:receiverId", authServices.protect, createChat);

router.get("/myChats", authServices.protect, getMyChats);
router.get("/find/:secondPersonId", authServices.protect, findChat);

// router.get(
//   "/loggedUserGroupChats",
//   authServices.protect,
//   getLoggedUserGroupChats
// );
// router.get("/loggedUserChats", authServices.protect, getLoggedUserChats);
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
router.put("/:chatId/updateGroup", authServices.protect, updateGrpupChat);
router.delete("/:chatId", authServices.protect, deleteChat);
router.post("/:chatId/pin/:messageId", authServices.protect, pinMessageInChat);
router.delete(
  "/:chatId/unpin/:messageId",
  authServices.protect,
  unpinMessageInChat
);
router.put("/:chatId/archive", authServices.protect, archiveChat);
router.put("/:chatId/unarchive", authServices.protect, unarchiveChat);
router.put("/:chatId/markasread", authServices.protect, markUserMessagesAsRead);

module.exports = router;
