const mongoose = require("mongoose");
const Course = require("./courseModel");

const ReviewSchema = mongoose.Schema(
  {
    title: {
      type: "String",
    },
    ratings: {
      type: Number,
      min: [1, "min value is 1.0"],
      max: [5, "max value is 5.0"],
      required: [true, "review ratings required"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "review must belong to user"],
    },
    // parent references (1 - many)
    course: {
      type: mongoose.Schema.ObjectId,
      ref: "Course",
      required: [true, "review must belong to Course"],
    },
  },
  { timestamps: true }
);

// any query containe find
ReviewSchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "username profileImg" });
  this.populate({ path: "course", select: " title " });
  next();
});

ReviewSchema.statics.calcAverageRatingsAndQuantity = async function (courseId) {
  const result = await this.aggregate([
    // Stage 1 : get all reviews in specific course
    {
      $match: { course: courseId },
    },
    // Stage 2: Grouping reviews based on courseID and calc avgRatings, ratingsQuantity
    {
      $group: {
        _id: "course",
        avgRatings: { $avg: "$ratings" },
        ratingsQuantity: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await Course.findByIdAndUpdate(courseId, {
      ratingsAverage: result[0].avgRatings,
      ratingsQuantity: result[0].ratingsQuantity,
    });
  } else {
    await Course.findByIdAndUpdate(courseId, {
      ratingsAverage: 0,
      ratingsQuantity: 0,
    });
  }
};
//this function is called when i delete a review
ReviewSchema.post("remove", async function () {
  await this.constructor.calcAverageRatingsAndQuantity(this.course);
});
//this function is called when i save a review
ReviewSchema.post("save", async function () {
  await this.constructor.calcAverageRatingsAndQuantity(this.course);
});

const ReviewModel = mongoose.model("Review", ReviewSchema);

module.exports = ReviewModel;
