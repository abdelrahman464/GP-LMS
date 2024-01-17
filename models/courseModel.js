const mongoose = require("mongoose");
const Section = require("./sectionModel");
const Post = require("./postModel");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sold: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Course price is required"],
      trim: true,
      max: [200000, "Too long Course price"],
    },
    priceAfterDiscount: {
      type: Number,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    ratingsAverage: {
      type: Number,
      min: [1, "rating must be between 1.0 and 5.0"],
      max: [5, "rating must be between 1.0 and 5.0"],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
  },
  {
    timeseries: true,
    // to enable vitual population
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// virtual field =>reviews
courseSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "course",
  localField: "_id",
});

courseSchema.pre(/^find/, function (next) {
  this.populate({ path: "instructor", select: "username" });
  this.populate({ path: "category", select: "title" });
  next();
});
// courseSchema.pre("remove", async function (next) {
//   // Delete sections related to the course
//   await Section.deleteMany({ course: this._id });

//   // Delete lessons related to the sections of the course
//   await Lesson.deleteMany({ section: { $in: this.sections } });

//   // Delete current course's posts
//   await Post.deleteMany({ course: this._id });

//   next();
// });

courseSchema.post("remove", async function (next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find and delete related sections
    const sections = await Section.find({ course: this._id }).session(session);
    for (let section of sections) {
      await section.remove({ session });
    }

    // Find and delete related posts (cascade to comments and reactions)
    const posts = await Post.find({ course: this._id }).session(session);
    for (let post of posts) {
      await post.remove({ session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  next();
});


const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
