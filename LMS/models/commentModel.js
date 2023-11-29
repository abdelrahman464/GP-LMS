const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
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
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    image: String,
  },
  { timestamps: true }
);

// ^find => it mean if part of of teh word contains find
commentSchema.pre(/^find/, function (next) {
  // this => query
  this.populate({ path: "user", select: "username profileImg" });
  next();
});

const setImageURL = (doc) => {
  //return image base url + iamge name
  if (doc.image) {
    const imageUrl = `${process.env.BASE_URL}/commentPost/${doc.image}`;
    doc.image = imageUrl;
  }
};
//after initializ the doc in db
// check if the document contains image
// it work with findOne,findAll,update
commentSchema.post("init", (doc) => {
  setImageURL(doc);
});
// it work with create
commentSchema.post("save", (doc) => {
  setImageURL(doc);
});
const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
