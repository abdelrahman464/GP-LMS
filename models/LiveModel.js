const mongoose = require("mongoose");

const LiveSchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    title: {
      type: String,
      required: true,
    },
    day: {
      type: String,
      required: [true, "day is required ?"],
    },
    month: {
      type: String,
      required: [true, "month is required ?"],
    },
    hour: {
      type: String,
      required: [true, "hour is required ?"],
    },
    duration: {
      type: Number,
      required: [true, "what is the duration of the live will be ?"],
    },

    link: String,
    info: String,

    followers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        email:String,
      },
    ],
  },
  { timestamps: true }
);

// ^find => it mean if part of of teh word contains find
LiveSchema.pre(/^find/, function (next) {
  // this => query
  this.populate({ path: "creator", select: "name profileImg" });
  this.populate({ path: "course", select: "title" });
  next();
});
const Live = mongoose.model("lives", LiveSchema);

module.exports = Live;
