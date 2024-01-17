const mongoose = require("mongoose");
const Course = require("./courseModel");
//1- create schema
const categorySchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "category required"],
      unique: [true, "category must be unique"],
      minlength: [3, "too short category name"],
      maxlength: [32, "too long category name"],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    image: String,
  },
  { timestamps: true }
);

const setImageURL = (doc) => {
  //return image base url + iamge name
  if (doc.image) {
    const imageUrl = `${process.env.BASE_URL}/categories/${doc.image}`;
    doc.image = imageUrl;
  }
};
//after initializ the doc in db
// check if the document contains image
// it work with findOne,findAll,update
categorySchema.post("init", (doc) => {
  setImageURL(doc);
});
// it work with create
categorySchema.post("save", (doc) => {
  setImageURL(doc);
});
categorySchema.post("remove", async function (next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Find all courses in the category
    const courses = await Course.find({ category: this._id }).session(session);

    // Delete each course and cascade delete related entities
    for (let course of courses) {
      await course.remove({ session });
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



//2- create model
const CategoryModel = mongoose.model("Category", categorySchema);

module.exports = CategoryModel;
