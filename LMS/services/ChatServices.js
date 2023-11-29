const asyncHandler = require("express-async-handler");
const Chat = require("../models/ChatModel");
const Message = require("../models/MessageModel");

//@desc create a chat room between 2 users
//@route POST /api/v1/chat\:receiverId
//@access protected
exports.createChat = asyncHandler(async (req, res, next) => {
  const senderId = req.user._id;
  const { receiverId } = req.params;

  const newChat = await Chat.create({
    members: [senderId, receiverId],
  });
  res.status(201).json({ data: newChat });
});
//@desc create a group chat
//@route POST /api/v1/chat\group
//@access protected
exports.createGroupChat = asyncHandler(async (req, res, next) => {
  const creatorId = req.user._id;
  const { memberIds, groupName, description } = req.body;

  const allMembers = [...new Set([...memberIds, creatorId])];

  const newGroupChat = await Chat.create({
    members: allMembers,
    isGroupChat: true,
    creator: creatorId,
    groupName,
    description,
  });

  res.status(201).json({ data: newGroupChat });
});
//@desc Get group chats of the logged-in user with detailed participant information
//@route GET /api/v1/chat/loggedUserGroupChats
//@access protected
exports.getLoggedUserGroupChats = asyncHandler(async (req, res, next) => {
  const loggedUserId = req.user._id;

  // Find group chats where the logged-in user is a participant
  const groupChats = await Chat.find({
    isGroupChat: true, // Assuming isGroupChat differentiates group chats from direct chats
    'participants.userId': loggedUserId,
  })
  .populate({
    path: 'participants.userId',
    select: 'username',
  })


  res.status(200).json({ data: groupChats });
});
//@desc Get chats of the logged-in user excluding direct one-on-one chats
//@route GET /api/v1/chat/loggedUserChats
//@access protected
exports.getLoggedUserChats = asyncHandler(async (req, res, next) => {
  const loggedUserId = req.user._id;

  // Find chats where the logged-in user is a participant and it's not a group chat
  const userChats = await Chat.find({
    members: loggedUserId, // Assuming direct chats contain only the logged-in user in the 'members' array
    isGroupChat: false, // Filtering out group chats
  })
  .populate({
    path: 'members',
    select: 'username',
  })
 

  res.status(200).json({ data: userChats });
});


//@desc Add a participant to a chat with a role
//@route PUT /api/v1/chat/:chatId/addParticipant
//@access protected
exports.addParticipantToChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const { userId, isAdmin } = req.body; // ID of the participant to be added and their role

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  // Check if the user is already a participant in the chat
  const existingParticipant = chat.participants.find(
    (participant) => String(participant.userId) === userId
  );

  if (existingParticipant) {
    return res
      .status(400)
      .json({ error: "User is already a participant in the chat" });
  }

  // Add the new participant to the chat with their role
  chat.participants.push({ userId, isAdmin });
  await chat.save();

  res.status(200).json({ data: chat });
});
//@desc Remove a participant from a chat
//@route PUT /api/v1/chat/:chatId/removeParticipant
//@access protected
exports.removeParticipantFromChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const { userId } = req.body; // ID of the participant to be removed

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  // Find the index of the participant in the chat
  const participantIndex = chat.participants.findIndex(
    (participant) => String(participant.userId) === userId
  );

  if (participantIndex === -1) {
    return res.status(400).json({ error: "Participant not found in the chat" });
  }

  // Remove the participant from the chat
  chat.participants.splice(participantIndex, 1);
  await chat.save();

  res.status(200).json({ data: chat });
});
//@desc Update participant role in a chat
//@route PUT /api/v1/chat/:chatId/updateParticipantRole
//@access protected
exports.updateParticipantRoleInChat = asyncHandler(async (req, res, next) => {
  const { chatId, userId, isAdmin } = req.body; // Chat ID, User ID, and desired role

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  // Find the participant in the chat
  const participant = chat.participants.find(
    (participant_) => String(participant_.userId) === userId
  );

  if (!participant) {
    return res.status(404).json({ error: "Participant not found in the chat" });
  }

  // Update the participant's role
  participant.isAdmin = isAdmin;
  await chat.save();

  res.status(200).json({ data: chat });
});

//@desc Get details of a specific chat including participants' details
//@route GET /api/v1/chat/:chatId/details
//@access protected
exports.getChatDetails = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId)
    .populate({
      path: "participants.userId",
      select: "username email profileImg",
    })
    .populate("pinnedMessages.messageId", "text senderId"); // Populate pinned message details

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  res.status(200).json({ data: chat });
});

//@desc Update chat information (e.g., group name, description)
//@route PUT /api/v1/chat/:chatId/update
//@access protected
exports.updateChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const { groupName, description } = req.body;

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { groupName, description },
    { new: true, runValidators: true }
  );

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  res.status(200).json({ data: chat });
});
//@desc Delete a chat along with associated messages, etc.
//@route DELETE /api/v1/chat/:chatId
//@access protected
exports.deleteChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({ error: 'Chat not found' });
  }

  // Implement logic to delete associated messages, participants, etc.
  // Example: Delete associated messages
  await Message.deleteMany({ chatId });

  await chat.remove(); // Remove the chat

  res.status(200).json({ message: 'Chat deleted successfully' });
});

//@desc get all user chat rooms
//@route GET /api/v1/chat/myChats
//@access private
exports.getMyChats = asyncHandler(async (req, res) => {
  const { userId } = req.user._id; // logged user id

  const chat = await Chat.find({
    members: { $in: [userId] },
  });
  res.status(200).json({ data: chat });
});
//@desc Find a specific chat between two users that the logged-in user is part of
//@route GET /api/v1/chat/find/:secondPersonId
//@access private
exports.findChat = asyncHandler(async (req, res) => {
  const loggedUserId = req.user._id; // First participant of the chat
  const { secondPersonId } = req.params; // Second participant of the chat

  const chat = await Chat.findOne({
    members: { $all: [loggedUserId, secondPersonId] },
  })
  .populate({
    path: 'participants.userId', // Populate participant details
    select: 'username email' // Select fields from the User model
  });

  res.status(200).json({ data: chat });
});

//@desc Pin a message in a chat
//@route POST /api/v1/chat/:chatId/pin/:messageId
//@access protected
exports.pinMessageInChat = asyncHandler(async (req, res) => {
  const { chatId, messageId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  // Check if the message exists in the chat
  const isMessageInChat = chat.pinnedMessages.includes(messageId);
  if (isMessageInChat) {
    return res
      .status(400)
      .json({ error: "Message is already pinned in the chat" });
  }

  chat.pinnedMessages.push(messageId);
  await chat.save();

  res.status(200).json(chat);
});
//@desc Unpin a message in a chat
//@route DELETE /api/v1/chat/:chatId/unpin/:messageId
//@access protected
exports.unpinMessageInChat = asyncHandler(async (req, res) => {
  const { chatId, messageId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  // Check if the message exists in the pinned messages of the chat
  const messageIndex = chat.pinnedMessages.indexOf(messageId);
  if (messageIndex === -1) {
    return res.status(400).json({ error: "Message is not pinned in the chat" });
  }

  chat.pinnedMessages.splice(messageIndex, 1);
  await chat.save();

  res.status(200).json(chat);
});
//@desc Archive a chat
//@route PUT /api/v1/chat/:chatId/archive
//@access protected
exports.archiveChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  chat.archived = true;
  await chat.save();

  res.status(200).json(chat);
});
//@desc Unarchive a chat
//@route PUT /api/v1/chat/:chatId/unarchive
//@access protected
exports.unarchiveChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  chat.archived = false;
  await chat.save();

  res.status(200).json(chat);
});
