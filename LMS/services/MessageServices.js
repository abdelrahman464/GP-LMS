const asyncHandler = require("express-async-handler");
const Message = require("../models/MessageModel");

//@desc add a message to chat
//@route POST /api/v1/message\chatId
//@access protected
exports.addMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { text } = req.body;
  const senderId = req.user._id; // logged user id

  const message = new Message({
    chatId,
    senderId,
    text,
  });

  const result = await message.save();
  res.status(200).json(result);
});
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

  const message = await Message.findByIdAndUpdate(
    messageId,
    { text, media },
    { new: true, runValidators: true }
  );

  if (!message) {
    return res.status(404).json({ error: "Message not found" });
  }

  res.status(200).json(message);
});
//@desc Delete a message by ID
//@route DELETE /api/v1/message/:messageId
//@access protected
exports.deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;

  const message = await Message.findByIdAndDelete(messageId);

  if (!message) {
    return res.status(404).json({ error: "Message not found" });
  }

  res.status(200).json({ message: "Message deleted successfully" });
});
//@desc Add a reaction to a message
//@route POST /api/v1/message/:messageId/reactions
//@access protected
exports.addReactionToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { userId, emoji } = req.body;

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({ error: "Message not found" });
  }

  // Check if the user has already reacted to this message
  const existingReaction = message.reactions.find(
    (reaction) => String(reaction.userId) === String(userId)
  );

  if (existingReaction) {
    return res
      .status(400)
      .json({ error: "User has already reacted to this message" });
  }

  // Add the reaction to the message
  message.reactions.push({ userId, emoji });
  await message.save();

  res.status(200).json(message);
});
//@desc Remove a user's reaction from a message
//@route DELETE /api/v1/message/:messageId/reactions/:userId
//@access protected
exports.removeReactionFromMessage = asyncHandler(async (req, res) => {
  const { messageId, userId } = req.params;

  const message = await Message.findById(messageId);

  if (!message) {
    return res.status(404).json({ error: "Message not found" });
  }

  // Find the index of the user's reaction
  const reactionIndex = message.reactions.findIndex(
    (reaction) => String(reaction.userId) === userId
  );

  if (reactionIndex === -1) {
    return res
      .status(404)
      .json({ error: "User reaction not found for this message" });
  }

  // Remove the reaction
  message.reactions.splice(reactionIndex, 1);
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
//@route POST /api/v1/message/:messageId/forward
//@access protected
exports.forwardMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { chatId } = req.body;
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
