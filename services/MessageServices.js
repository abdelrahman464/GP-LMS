const asyncHandler = require("express-async-handler");
const Message = require("../models/MessageModel");
const Chat = require("../models/ChatModel");
const Notification = require("../models/notificationModel");
// const User = require("../models/userModel");
const factory = require("./handllerFactory");
const ApiError = require("../utils/apiError");

const sendEmail = require("../utils/sendEmail");

//@desc add a message to chat
//@route POST /api/v1/message/:chatId
//@access protected
exports.addMessage = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const { text, media } = req.body;

  const sender = req.user._id; // logged user id

  // Check if the logged-in user is a participant of the chat
  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  // Check if the logged-in user is a participant of the chat
  const participantIds = chat.participants.map((participant) =>
    String(participant.user._id)
  );

  if (!participantIds.includes(String(sender))) {
    return next(
      new ApiError(
        "Unauthorized access: You are not a participant of this chat",
        403
      )
    );
  }

  // send email to the receiver(s) if the last message was sent more than 6 hours ago
  // Check the timestamp of the last message
  const lastMessage = await Message.findOne({ chat: chatId }).sort({
    createdAt: -1,
  });

  const delayHoursInMillis = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
  const now = new Date();
  if (lastMessage && now - lastMessage.createdAt > delayHoursInMillis) {
    // Find the receiver(s) in the chat (excluding the sender)
    const receivers = chat.participants
      .filter((participant) => String(participant.user._id) !== String(sender))
      .map((participant) => participant.user);

    // Send email to each receiver
    receivers.forEach(async (receiver) => {
      await sendEmail({
        to: receiver.email,
        subject: "New message in chat",
        text: `You have a new message in the chat from ${req.user.username}.`,
      });
    });
  }

  // Create a new message
  const messageData = {
    chat,
    sender,
    text,
  };

  if (media) {
    messageData.media = media;
  }

  // Create a new message
  const msg = await Message.create(messageData);

  const newMessage = await Message.findById(msg._id);
  res.status(201).json(newMessage);
});
//filter meesages from chat
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  filterObject = { chat: req.params.chatId };
  req.filterObj = filterObject;
  next();
};
//@desc get all messages in chat
//@route GET /api/v1/message/chatId
//@access protected
exports.getMessage = factory.getALl(Message, "Message", "reactions.user");
//@desc Update a message by ID
//@route PUT /api/v1/message/:messageId
//@access protected
exports.updateMessage = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;
  const { text, media } = req.body;
  const userId = req.user._id; // logged user id

  const message = await Message.findById(messageId);

  if (!message) {
    return next(new ApiError("Message not found", 404));
  }

  const sixHoursInMillis = 6 * 60 * 60 * 1000;
  const now = new Date();

  // Check if the logged-in user is the sender of the message
  if (String(message.sender._id) !== String(userId)) {
    return next(
      new ApiError("Unauthorized access: You cannot update this message", 403)
    );
  }
  // user cannot update the message after 6h from he sent it unless he is an admin
  if (now - message.createdAt > sixHoursInMillis) {
    if (req.user.role !== "admin") {
      return next(
        new ApiError(
          "Unauthorized access: You cannot update this message after 6 hours",
          403
        )
      );
    }
  }

  // Create an update object based on provided data
  const updateData = {};
  if (text !== undefined && text !== null) {
    updateData.text = text;
  }
  if (media !== undefined && media !== null) {
    updateData.media = media;
  }

  // Update the message if updateData is not empty
  if (Object.keys(updateData).length > 0) {
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      updateData,
      { new: true }
    );

    res.status(200).json(updatedMessage);
  } else {
    // If no data is provided to update, return the unmodified message
    res.status(200).json(message);
  }
});
//@desc Delete a message by ID
//@route DELETE /api/v1/message/:messageId
//@access protected

exports.deleteMessage = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;
  const userId = req.user._id; // logged user id

  const message = await Message.findById(messageId);

  if (!message) {
    return next(new ApiError("Message not found", 404));
  }

  const sixHoursInMillis = 6 * 60 * 60 * 1000;
  const now = new Date();

  // Check if the logged-in user is the sender of the message or an admin
  if (String(message.sender._id) !== String(userId)) {
    if (req.user.role !== "admin") {
      return next(
        new ApiError("Unauthorized access: You cannot delete this message", 403)
      );
    }
    // If the user is an admin, allow deletion of any message regardless of the time it was sent
    // user cannot delete the message after 6h from he sent it unless he is an admin
  } else if (now - message.createdAt > sixHoursInMillis) {
    if (req.user.role !== "admin") {
      return next(
        new ApiError(
          "Unauthorized access: You cannot delete this message after 6 hours",
          403
        )
      );
    }
  }

  await Message.findByIdAndDelete(messageId);

  res.status(200).json({ message: "Message deleted successfully" });
});

//@desc Add a reaction to a message
//@route POST /api/v1/message/:messageId/reactions
//@access protected
exports.toggleReactionToMessage = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id; // logged user id

  const message = await Message.findById(messageId);

  if (!message) {
    return next(new ApiError("Message not found", 404));
  }

  // Check if the user has already reacted to this message
  const existingReactionIndex = message.reactions.findIndex(
    (reaction) => String(reaction.user) === String(userId)
  );

  if (existingReactionIndex !== -1) {
    const existingReaction = message.reactions[existingReactionIndex];
    if (existingReaction.emoji === emoji) {
      // If the new reaction is the same as the existing one, remove the reaction
      await Message.findByIdAndUpdate(
        messageId,
        { $pull: { reactions: { user: userId } } },
        { new: true }
      );
    } else {
      // If the new reaction is different, update the existing reaction
      await Message.updateOne(
        { _id: messageId, "reactions.user": userId },
        { $set: { "reactions.$.emoji": emoji } },
        { new: true }
      );
    }
  } else {
    // If the user has not reacted, add the reaction
    await Message.findByIdAndUpdate(
      messageId,
      { $push: { reactions: { user: userId, emoji: emoji } } },
      { new: true }
    );
  }

  // Fetch the updated message after toggling the reaction
  const updatedMessage = await Message.findById(messageId);

  res.status(200).json({ data: updatedMessage });
});

//@desc Reply to a message
//@route POST /api/v1/message/:messageId/reply
//@access protected
exports.replyToMessage = asyncHandler(async (req, res, next) => {
  const { messageId } = req.params;
  const { text, media } = req.body;
  const sender = req.user._id; // logged user id

  const repliedMessage = await Message.findById(messageId);

  if (!repliedMessage) {
    return next(new ApiError("Message not found", 404));
  }

  // Prepare reply message data
  const replyData = {
    chat: repliedMessage.chat,
    sender,
    text,
    repliedTo: repliedMessage._id,
  };

  // Include media if provided
  if (media) {
    replyData.media = media;
  }

  // Create reply message
  const replyMessage = await Message.create(replyData);

  // Check if the sender of the replied message is not the same as the sender of the reply
  if (repliedMessage.sender._id.toString() !== sender.toString()) {
    const notificationMessage = `
    \n You have a new reply to your message.
    \n\n Message: ${text} 
    \n\nClick here to view the message: https://nexgen-academy.com/en/chat/${repliedMessage.chat}`;

    await Notification.create({
      user: sender._id,
      message: notificationMessage,
      chat: repliedMessage.chat,
      type: "chat",
    });
  }
  const message = await Message.findById(replyMessage._id);

  res.status(200).json({ data: message });
});
//@desc Get replies to a message
//@route GET /api/v1/message/:messageId/replies
//@access protected
exports.getRepliesToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const replies = await Message.find({ repliedTo: messageId });

  res.status(200).json({ data: replies });
});
