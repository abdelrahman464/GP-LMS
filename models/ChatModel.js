const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: ["true", "UserIds required"],
        },
        isAdmin: {
          type: Boolean,
          default: false,
        },
      },
    ],
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    groupName: String,
    description: String,
    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    archived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

chatSchema.pre(/^find/, function (next) {
  this.populate({
    path: "participants.userId",
    select: "username profileImg",
  }).populate({ path: "creator", select: "username profileImg" });
  next();
});
const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
