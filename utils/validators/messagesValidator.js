const asyncHandler = require("express-async-handler");
const Chat = require("../../models/ChatModel");
const ApiError = require("../apiError");

exports.getMessageValidator = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const userId = req.user._id; // logged user id

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return next(new ApiError("Chat not found", 404));
  }
   // Check if the logged-in user is a participant of the chat
   const participantIds = chat.participants.map((participant) =>
    String(participant.user ? participant.user._id : null)  // Handle case where participant.user might be null
  );

  if (!participantIds.includes(String(userId))) {
    return next(
      new ApiError(
        "Unauthorized access: You are not a participant of this chat",
        403
      )
    );
  }

  next();
});
