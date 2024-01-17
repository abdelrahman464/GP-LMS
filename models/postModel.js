const mongoose = require("mongoose");
const Reaction = require("./reactionModel");
const Comment = require("./commentModel");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    sharedTo: {
      type: String,
      enum: ["public", "course"],
      default: "public",
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    image: String,
  },
  { timestamps: true }
);

// ^find => it mean if part of of teh word contains find
postSchema.pre(/^find/, function (next) {
  // this => query
  this.populate({ path: "user", select: "name profileImg" });
  this.populate({ path: "course", select: "title" });
  next();
});

postSchema.post("remove", async function (next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Comment.deleteMany({ post: this._id }).session(session);
    await Reaction.deleteMany({ postId: this._id }).session(session);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
  next();
});



const setImageURL = (doc) => {
  //return image base url + iamge name
  if (doc.image) {
    const imageUrl = `${process.env.BASE_URL}/posts/${doc.image}`;
    doc.image = imageUrl;
  }
};
//after initializ the doc in db
// check if the document contains image
// it work with findOne,findAll,update
postSchema.post("init", (doc) => {
  setImageURL(doc);
});
// it work with create
postSchema.post("save", (doc) => {
  setImageURL(doc);
});
const Post = mongoose.model("Post", postSchema);
module.exports = Post;
