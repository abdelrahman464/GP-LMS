const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    sender: {
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
        user: {
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
  },
  { timestamps: true }
);
MessageSchema.pre(/^find/, function (next) {
  this.populate({
    path: "sender",
    select: "username profileImg",
  }).populate({
    path: "repliedTo", // Populate repliedTo field
    select: "sender text media",
    populate: {
      path: "sender", // Populate sender within repliedTo field
      select: "username profileImg",
    },
  });

  next();
});
const setImageURL = (doc) => {
  //return image base url + iamge name
  if (doc.media) {
    const mediaListWithUrl = [];
    doc.media.forEach((m) => {
      const mediaUrl = `${process.env.BASE_URL}/messages/${m}`;
      mediaListWithUrl.push(mediaUrl);
    });
    doc.media = mediaListWithUrl;
  }
};

//after initializ the doc in db
// check if the document contains image
// it work with findOne,findAll,update
MessageSchema.post("init", (doc) => {
  setImageURL(doc);
});
// it work with create
MessageSchema.post("save", (doc) => {
  setImageURL(doc);
});
const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
