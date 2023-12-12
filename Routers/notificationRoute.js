const express = require("express");
const {
  getNotifications,
  markAsRead,
} = require("../services/notificationServices");
const authServices = require("../services/authServices");

const router = express.Router();
router.get("/", authServices.protect, getNotifications);

router.put("/read", authServices.protect, markAsRead);

module.exports = router;
