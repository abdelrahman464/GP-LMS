const express = require("express");
const {
  createChat,
  findChat,
  getMyChats,
} = require("../services/ChatServices");
const authServices = require("../services/authServices");
const router = express.Router();

router.post("/:receiverId", authServices.protect, createChat);
router.get("/myChats", authServices.protect, getMyChats);
router.get("/find/:secondPersonId", authServices.protect, findChat);

module.exports = router;
