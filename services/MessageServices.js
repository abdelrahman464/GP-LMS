const asyncHandler = require("express-async-handler");
const Message = require("../models/MessageModel");
const Chat = require("../models/ChatModel");

//@desc add a message to chat
//@route POST /api/v1/message/:chatId
//@access protected
exports.addMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { text } = req.body;
  const senderId = req.user._id; // logged user id

  // Create a new message
  const message = new Message({
    chatId,
    senderId,
    text,
  });

  // Save the message
  await message.save();

  // Retrieve all chats of the user
  const userChats = await Chat.find({ "participants.userId": senderId });

  // Find the last chat that contains the latest message
  let lastChatWithLatestMessage = null;
  let latestMessageTimestamp = 0;

  for (const chat of userChats) {
    if (
      chat.lastMessage &&
      chat.lastMessage.createdAt > latestMessageTimestamp
    ) {
      latestMessageTimestamp = chat.lastMessage.createdAt;
      lastChatWithLatestMessage = chat;
    }
  }

  res.status(200).json({ userChats, lastChatWithLatestMessage });
});
// exports.addMessage = asyncHandler(async (req, res) => {
//   const { chatId } = req.params;
//   const { text } = req.body;
//   const senderId = req.user._id; // logged user id

//   // Create a new message
//   const message = new Message({
//     chatId,
//     senderId,
//     text,
//   });

//   // Save the message
//   await message.save();

//   // Retrieve all chats of the user and sort by the time of the last message
//   const userChats = await Chat.aggregate([
//     {
//       $match: { "participants.userId": senderId }
//     },
//     {
//       $lookup: {
//         from: "messages",
//         localField: "_id",
//         foreignField: "chatId",
//         as: "messages",
//       },
//     },
//     {
//       $addFields: {
//         lastMessageTime: { $max: "$messages.createdAt" }
//       }
//     },
//     {
//       $sort: { lastMessageTime: -1 }
//     }
//   ]);

//   res.status(200).json({ userChats });
// });
//@desc
//@route GET /api/v1/message
//@access protected
exports.getMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const result = await Message.find({ chatId });
  res.status(200).json(result);
});
//@desc Update a message by ID
//@route PUT /api/v1/message/:messageId
//@access protected
exports.updateMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { text, media } = req.body;
  const userId = req.user._id; // logged user id

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({ error: "Message not found" });
  }

  // Check if the logged-in user is the sender of the message
  if (String(message.senderId) !== String(userId)) {
    return res
      .status(403)
      .json({ error: "Unauthorized access: You cannot update this message" });
  }

  const updatedMessage = await Message.findByIdAndUpdate(
    messageId,
    { text, media },
    { new: true, runValidators: true }
  );

  res.status(200).json(updatedMessage);
});
//@desc Delete a message by ID
//@route DELETE /api/v1/message/:messageId
//@access protected
exports.deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id; // logged user id

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({ error: "Message not found" });
  }

  // Check if the logged-in user is the sender of the message
  if (String(message.senderId) !== String(userId)) {
    return res
      .status(403)
      .json({ error: "Unauthorized access: You cannot delete this message" });
  }

  await Message.findByIdAndDelete(messageId);

  res.status(200).json({ message: "Message deleted successfully" });
});
//@desc Add a reaction to a message
//@route POST /api/v1/message/:messageId/reactions
//@access protected
exports.toggleReactionToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id; // logged user id

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({ error: "Message not found" });
  }

  // Check if the user has already reacted to this message
  const existingReactionIndex = message.reactions.findIndex(
    (reaction) => String(reaction.userId) === String(userId)
  );

  if (existingReactionIndex !== -1) {
    const existingReaction = message.reactions[existingReactionIndex];
    if (existingReaction.emoji === emoji) {
      // If the new reaction is the same as the existing one, remove the reaction
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // If the new reaction is different, update the existing reaction
      existingReaction.emoji = emoji;
    }
  } else {
    // If the user has not reacted, add the reaction
    message.reactions.push({ userId, emoji });
  }

  await message.save();

  res.status(200).json(message);
});

//@desc Reply to a message
//@route POST /api/v1/message/:messageId/reply
//@access protected
exports.replyToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { text } = req.body;
  const senderId = req.user._id; // logged user id

  const repliedMessage = await Message.findById(messageId);

  if (!repliedMessage) {
    return res.status(404).json({ error: "Message not found" });
  }

  const replyMessage = new Message({
    chatId: repliedMessage.chatId,
    senderId,
    text,
    repliedTo: repliedMessage._id,
  });

  const result = await replyMessage.save();
  res.status(200).json(result);
});
//@desc Get replies to a message
//@route GET /api/v1/message/:messageId/replies
//@access protected
exports.getRepliesToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const replies = await Message.find({ repliedTo: messageId });

  res.status(200).json(replies);
});
//@desc Forward a message to another chat
//@route POST /api/v1/message/:messageId/forward/:chatId
//@access protected
exports.forwardMessage = asyncHandler(async (req, res) => {
  const { messageId, chatId } = req.params;
  const senderId = req.user._id; // logged user id

  const messageToForward = await Message.findById(messageId);

  if (!messageToForward) {
    return res.status(404).json({ error: "Message not found" });
  }

  const forwardedMessage = new Message({
    chatId,
    senderId,
    text: messageToForward.text,
    media: messageToForward.media,
    forwardedFrom: messageToForward.senderId,
  });

  const result = await forwardedMessage.save();
  res.status(200).json(result);
});
//@desc Get messages forwarded by a user
//@route GET /api/v1/message/forwarded
//@access protected
exports.getForwardedMessages = asyncHandler(async (req, res) => {
  const userId = req.user._id; // logged user id

  const forwardedMessages = await Message.find({ forwardedFrom: userId });

  res.status(200).json(forwardedMessages);
});
