const asyncHandler = require("express-async-handler");
const Notification = require("../models/notificationModel");

//@desc create notification
//import this function to create notification
exports.createNotification = async (userId, message) => {
  try {
    const notification = await Notification.create({ userId, message });
    return notification;
  } catch (error) {
    throw new Error("Error creating notification");
  }
};
//how to use it
//const notification = await NotificationService.createNotification(userId, message);
//res.status(201).json(notification);

//@desc get Notifications
//@route GET /api/v1/notification
//@access private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const notifications = await Notification.find({ userId }).sort({
    createdAt: -1,
  });

  res.status(200).json({ data: notifications });
});

//@desc  mark notification As Read
//@route Put /api/v1/notification/read
//@access private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const { notificationId } = req.params;
  const notification = await Notification.findByIdAndUpdate(
    notificationId,
    { read: true },
    { new: true }
  );
  res.status(200).json({ data: notification });
});
