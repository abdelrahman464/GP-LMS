const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const Chat = require("../models/ChatModel");
const Message = require("../models/MessageModel");
const Notification = require("../models/notificationModel");
const ApiError = require("../utils/apiError");

//@desc create a chat room between 2 users
//@route POST /api/v1/chat/:receiverId
//@access protected
exports.createChat = asyncHandler(async (req, res, next) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.params;

    // Check if a chat already exists between sender and receiver
    const existingChat = await Chat.findOne({
      $and: [
        { "participants.user": senderId },
        { "participants.user": receiverId },
      ],
    });

    if (existingChat) {
      return res.status(200).json({
        message: "Chat already exists between these users",
        data: existingChat,
      });
    }

    // Create a new chat
    const newChat = await Chat.create({
      participants: [
        { user: senderId, isAdmin: true },
        { user: receiverId, isAdmin: true },
      ],
    });

    // Create a notification for the receiver
    await Notification.create({
      user: receiverId,
      message: `${req.user.username} has started a chat with you`,
      chat: newChat._id,
      type: "chat",
    });

    res.status(201).json({ data: newChat });
  } catch (error) {
    next(error);
  }
});

//@desc get all user chat rooms
//@route GET /api/v1/chat/myChats
//@access privat
exports.getMyChats = async (req, res, next) => {
  try {
    const baseUrl = process.env.BASE_URL; // Set your domain URL here
    const chats = await Chat.aggregate([
      {
        $match: { "participants.user": mongoose.Types.ObjectId(req.user._id) },
      },
      {
        $lookup: {
          from: "messages",
          let: { chatId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$chat", "$$chatId"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
            {
              $lookup: {
                from: "users",
                localField: "sender",
                foreignField: "_id",
                as: "senderDetails",
              },
            },
            {
              $addFields: {
                media: {
                  $map: {
                    input: "$media",
                    as: "file",
                    in: { $concat: [baseUrl, "/messages/", "$$file"] }, // Adjust the path as necessary
                  },
                },
              },
            },
            {
              $project: {
                text: 1,
                media: 1,
                createdAt: 1,
                sender: 1,
                senderDetails: { $arrayElemAt: ["$senderDetails", 0] },
              },
            },
          ],
          as: "lastMessage",
        },
      },
      { $unwind: "$participants" },
      {
        $lookup: {
          from: "users",
          localField: "participants.user",
          foreignField: "_id",
          as: "participants.userDetails",
        },
      },
      { $unwind: "$participants.userDetails" },
      {
        $addFields: {
          "participants.userDetails.profileImg": {
            $cond: {
              if: "$participants.userDetails.profileImg",
              then: {
                $concat: [
                  baseUrl,
                  "/users/",
                  "$participants.userDetails.profileImg",
                ],
              },
              else: null,
            },
          },
        },
      },
      {
        $group: {
          _id: "$_id",
          participants: { $push: "$participants" },
          root: { $mergeObjects: "$$ROOT" },
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: ["$root", "$$ROOT"],
          },
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },

      {
        $project: {
          participants: 1,
          isGroupChat: 1,

          groupName: 1,
          description: 1,
          archived: 1,
          lastMessage: 1,
          _id: 1,
        },
      },
    ]);

    res.status(200).json({
      status: "success",
      results: chats.length,
      data: chats,
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch chats",
    });
  }
};

//@desc create a group chat
//@route POST /api/v1/chat/group
//@access protected
exports.createGroupChat = asyncHandler(async (req, res, next) => {
  const { participantIds, groupName, description } = req.body;

  const groupCreatorId = req.user._id.toString();

  // Ensure the creator is not duplicated in participantIds array
  const filteredParticipantIds = participantIds.filter(
    (participant) => participant !== groupCreatorId
  );

  // Create the new group chat
  const newGroupChat = await Chat.create({
    participants: [
      ...filteredParticipantIds,
      { user: groupCreatorId, isAdmin: true },
    ],
    isGroupChat: true,
    creator: req.user._id,
    groupName,
    description,
  });

  // Send notification to all participants (except the creator)
  const notifications = filteredParticipantIds.map(async (participant) => {
    await Notification.create({
      user: participant.user,
      message: `${req.user.username} has added you to a group chat`,
      chat: newGroupChat._id,
      type: "chat",
    });
  });

  await Promise.all(notifications);

  res.status(201).json({ data: newGroupChat });
});
//-------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------
//@desc Add a participant to a chat with a role
//@route PUT /api/v1/chat/:chatId/addParticipant
//@access protected
exports.addParticipantToChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const { user, isAdmin } = req.body; // ID of the participant to be added and their role
  const loggedUserId = req.user._id; // logged user id

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new ApiError("Chat not found", 404));
  }

  // Find the logged-in user in the chat to verify admin privileges
  const loggedUser = chat.participants.find(
    (participant_) => String(participant_.user._id) === String(loggedUserId)
  );

  if (!loggedUser || !loggedUser.isAdmin) {
    return next(
      new ApiError("Unauthorized: You are not an admin in this Group", 403)
    );
  }

  // Check if the user is already a participant in the chat
  const existingParticipant = chat.participants.find(
    (participant) => String(participant.user) === user
  );

  if (existingParticipant) {
    return next(new ApiError("User is already a participant in the chat", 400));
  }

  // Update the chat document to add the new participant with their role
  const thisChat = await Chat.findByIdAndUpdate(
    chatId,
    { $push: { participants: { user, isAdmin } } },
    { new: true } // To return the modified document
  );

  if (thisChat) {
    await Notification.create({
      user: user,
      message: `${req.user.username} has added you to a group chat`,
      chat: thisChat._id,
      type: "chat",
    });
  }

  res.status(200).json({ data: "user added successfully" });
});
//@desc Remove a participant from a chat
//@route PUT /api/v1/chat/:chatId/removeParticipant
//@access protected
exports.removeParticipantFromChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const { user } = req.body; // ID of the participant to be removed
  const loggedUserId = req.user._id; // logged user id

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new ApiError("Chat not found", 404));
  }
  // Find the logged-in user in the chat to verify admin privileges
  const loggedUser = chat.participants.find(
    (participant_) => String(participant_.user._id) === String(loggedUserId)
  );

  if (!loggedUser || !loggedUser.isAdmin) {
    return next(
      new ApiError("Unauthorized: You are not an admin in this Group", 403)
    );
  }

  // Find the index of the participant in the chat
  const participantIndex = chat.participants.findIndex(
    (participant) => String(participant.user._id) === user
  );

  if (participantIndex === -1) {
    return next(new ApiError("Participant not found in the chat", 400));
  }

  // Update the chat document to remove the participant
  const thisChat = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { participants: { user: user } } },
    { new: true } // To return the modified document
  );

  if (thisChat) {
    await Notification.create({
      user: user,
      message: `${req.user.username} has added you to a group chat`,
      chat: thisChat._id,
      type: "chat",
    });
  }

  res.status(200).json({ data: "user removed successfully" });
});
//@desc Update participant role in a chat
//@route PUT /api/v1/chat/:chatId/updateParticipantRole
//@access protected
exports.updateParticipantRoleInChat = asyncHandler(async (req, res, next) => {
  const { user, isAdmin } = req.body; // Chat ID, User ID, and desired role
  const { chatId } = req.params;
  const loggedUserId = req.user._id; // logged user id

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return next(new ApiError("Chat not found", 404));
  }

  // Find the logged-in user in the chat to verify admin privileges
  const loggedUser = chat.participants.find(
    (participant_) => String(participant_.user._id) === String(loggedUserId)
  );

  if (!loggedUser || !loggedUser.isAdmin) {
    return next(
      new ApiError("Unauthorized: You are not an admin in this Group", 403)
    );
  }

  // Find the participant to update their role
  const participantToUpdate = chat.participants.find(
    (participant_) => String(participant_.user._id) === user
  );

  if (!participantToUpdate) {
    return next(new ApiError("Participant not found in the chat", 404));
  }

  // Check if the userId from body matches the creator of the chat
  const creatorOfChat = chat.creator._id; // Assuming the creator is the first participant

  if (String(creatorOfChat) === user) {
    return next(
      new ApiError("Unauthorized: Cannot update the creator's role", 403)
    );
  }

  // Update the participant's role directly in the database
  const thisChat = await Chat.updateOne(
    { _id: chatId, "participants.user": user },
    { $set: { "participants.$.isAdmin": isAdmin } }
  );

  if (thisChat) {
    await Notification.create({
      user: user,
      message: `${req.user.username} has updated your role in a group chat to ${
        isAdmin ? "admin" : "participant"
      }`,
      chat: thisChat._id,
      type: "chat",
    });
  }

  res.status(200).json({ data: "user updated successfully" });
});

//@desc Get details of a specific chat including participants' details
//@route GET /api/v1/chat/:chatId/details
//@access protected
exports.getChatDetails = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;

  // Fetch the chat details along with the user details for each participant
  const chat = await Chat.findById(chatId).populate({
    path: "participants.user",
    select:
      "_id username email password isOAuthUser role active createdAt updatedAt __v profileImg",
  });

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }
  // get chat media in messages belong to this chat
  const messages = await Message.find({ chat: chatId, media: { $ne: [] } });
  const mediaUrls = messages.map((message) => message.media).flat(); // Flattens the array of arrays into a single array

  // Transform the participants structure to include userDetails
  const transformedParticipants = chat.participants.map((participant) => ({
    user: participant.user._id,
    isAdmin: participant.isAdmin,
    _id: participant._id,
    userDetails: participant.user,
  }));

  const transformedChat = {
    _id: chat._id,
    participants: transformedParticipants,
    isGroupChat: chat.isGroupChat,
  };

  res.status(200).json({ data: transformedChat, mediaUrls });
});

//@desc Update chat information (e.g., group name, description)
//@route PUT /api/v1/chat/:chatId/update
//@access protected
exports.updateGrpupChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const { groupName, description } = req.body;
  const user = req.user._id; // logged user id

  // Check if the logged-in user is an admin in the group
  const chat = await Chat.findOne({
    _id: chatId,
    "participants.user": user,
    "participants.isAdmin": true,
  });

  if (!chat) {
    return next(
      new ApiError("Unauthorized: You are not an admin in this Group", 403)
    );
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { groupName, description },
    { new: true, runValidators: true }
  );

  if (!updatedChat) {
    return next(new ApiError("Chat not found", 404));
  }

  res.status(200).json({ data: updatedChat });
});

//@desc Delete a chat along with associated messages, etc.
//@route DELETE /api/v1/chat/:chatId
//@access protected
exports.deleteChat = asyncHandler(async (req, res, next) => {
  try {
    await mongoose.connection.transaction(async (session) => {
      // Find and delete the course
      const chat = await Chat.findByIdAndDelete(req.params.chatId).session(
        session
      );

      // Check if course exists
      if (!chat) {
        return next(
          new ApiError(`chat not found for this id ${req.params.chatId}`, 404)
        );
      }

      // Delete associated lessons and reviews
      await Promise.all([
        Message.deleteMany({ chat: chat._id }).session(session),
      ]);
    });

    // Return success response
    res.status(204).send();
  } catch (error) {
    // Handle any transaction-related errors
    console.error("Transaction error:", error);
    if (error instanceof ApiError) {
      // Forward specific ApiError instances
      return next(error);
    }
    // Handle other errors with a generic message
    return next(new ApiError("Error during chat deletion", 500));
  }
});
//filter to get my chats
exports.createFilterObj = (req, res, next) => {
  const filterObject = {
    "participants.user": req.user._id,
  };
  req.filterObj = filterObject;
  next();
};

//@desc Find a specific chat between two users that the logged-in user is part of
//@route GET /api/v1/chat/find/:secondPersonId
//@access private
exports.findChat = asyncHandler(async (req, res, next) => {
  const loggedUserId = req.user._id; // First participant of the chat
  const { secondPersonId } = req.params; // Second participant of the chat

  const chat = await Chat.findOne({
    $and: [
      {
        "participants.user": loggedUserId,
      },
      {
        "participants.user": secondPersonId,
      },
      {
        isGroupChat: false, // Ensuring it's not a group chat
      },
    ],
  });
  if (!chat) {
    return next(new ApiError("Chat not found", 404));
  }
  res.status(200).json({ data: chat });
});

//@desc Pin a message in a chat
//@route POST /api/v1/chat/:chatId/pin/:messageId
//@access protected
exports.pinMessageInChat = asyncHandler(async (req, res, next) => {
  const { chatId, messageId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new ApiError("Chat not found", 404));
  }

  // Check if the message exists in the chat
  const isMessageInChat = chat.pinnedMessages.includes(messageId);
  if (isMessageInChat) {
    return next(new ApiError("Message is already pinned in the chat", 400));
  }

  // Update the chat document to add the message to the pinnedMessages array
  await Chat.findByIdAndUpdate(
    chatId,
    { $push: { pinnedMessages: messageId } },
    { new: true } // To return the modified document
  );

  // Fetch the updated chat document after pinning the message
  const updatedChat = await Chat.findById(chatId);

  res.status(200).json(updatedChat);
});
//@desc Unpin a message in a chat
//@route DELETE /api/v1/chat/:chatId/unpin/:messageId
//@access protected
exports.unpinMessageInChat = asyncHandler(async (req, res, next) => {
  const { chatId, messageId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new ApiError("Chat not found", 404));
  }

  // Check if the message exists in the pinned messages of the chat
  const messageIndex = chat.pinnedMessages.indexOf(messageId);
  if (messageIndex === -1) {
    return next(new ApiError("Message is not pinned in the chat", 400));
  }

  // Update the chat document to remove the message from the pinnedMessages array
  await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { pinnedMessages: messageId } },
    { new: true } // To return the modified document
  );

  // Fetch the updated chat document after unpinning the message
  const updatedChat = await Chat.findById(chatId);

  res.status(200).json(updatedChat);
});
//@desc Archive a chat
//@route PUT /api/v1/chat/:chatId/archive
//@access protected
exports.archiveChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;

  // Update the chat document to set the archived field to true
  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { $set: { archived: true } },
    { new: true } // To return the modified document
  );
  if (!chat) {
    return next(new ApiError("Chat not found", 404));
  }

  res.status(200).json({ message: "archived" });
});
//@desc Unarchive a chat
//@route PUT /api/v1/chat/:chatId/unarchive
//@access protected
exports.unarchiveChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;

  const chat = await Chat.findByIdAndUpdate(
    chatId,
    { $set: { archived: false } },
    { new: true }
  );

  if (!chat) {
    return next(new ApiError("Chat not found", 404));
  }

  res.status(200).json({ message: "unarchived" });
});
