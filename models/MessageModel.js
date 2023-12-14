const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    text: {
      type: String,
    },
    media: {
      // For storing links to media files or attachments
      type: [String],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    seendBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    reactions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        emoji: String,
      },
    ],
    repliedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    forwardedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);
MessageSchema.pre(/^find/, function (next) {
  this.populate({
    path: "forwardedFrom",
    select: "username profileImg",
  })
    .populate({
      path: "reactions",
      select: "username profileImg",
    })
    .populate({
      path: "senderId",
      select: "username profileImg",
    })
    .populate({
      path: "repliedTo", // Populate repliedTo field
      select: "senderId text media",
      populate: {
        path: "senderId", // Populate senderId within repliedTo field
        select: "username profileImg",
      },
    });
  next();
});
MessageSchema.post(/^save/, async (doc, next) => {
  try {
    // Populate the required fields
    await doc.populate({
      path: 'reactions',
      select: 'username profileImg',
    })
    .populate({
      path: 'senderId',
      select: 'username profileImg',
    })
    .populate({
      path: 'repliedTo',
      select: 'senderId text media',
      populate: {
        path: 'senderId',
        select: 'username profileImg',
      },
    })
    .execPopulate();

  next();;
  } catch (err) {
    next(err);
  }
});
const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
