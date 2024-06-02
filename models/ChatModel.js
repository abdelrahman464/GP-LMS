const mongoose = require("mongoose");
const Message = require("./MessageModel");

const chatSchema = new mongoose.Schema(
  {
    groupName: String,
    description: String,
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: ["true", "User required"],
        },
        isAdmin: {
          type: Boolean,
          default: false,
        },
      },
    ],
    image: String,
    //chat details -----------------------
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
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
    //------------------------------------
  },
  { timestamps: true }
);

chatSchema.pre(/^find/, function (next) {
  this.populate({
    path: "participants.user",
    select: "username profileImg",
  })
    .populate({ path: "creator", select: "username profileImg" })
    .populate({ path: "pinnedMessages", select: "text" })
    .populate({
      path: "course",
      select: "title  -category",
    });
  next();
});

const setImageURL = (doc) => {
  //return image base url + iamge name
  if (doc.image) {
    const ImageUrl = `${process.env.BASE_URL}/chats/${doc.image}`;
    doc.image = ImageUrl;
  }
};
//after initializ the doc in db
// check if the document contains image
// it work with findOne,findAll,update
chatSchema.post("init", (doc) => {
  setImageURL(doc);
});
// it work with create
chatSchema.post("save", (doc) => {
  setImageURL(doc);
});

chatSchema.pre("remove", async function () {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find and delete related messages
    await Message.find({ chat: this._id }).session(session);

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;
