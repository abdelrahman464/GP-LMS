// database
const mongoose = require("mongoose");
const Course = require("./courseModel");
const Lesson = require("./lessonModel");
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
categorySchema.pre("remove", async function (next) {
  //course sections lesson
  // Remove sections of courses relted to category
  const courses = await Course.find({ category: this._id });
  const courseIds = courses.map((course) => course._id); //[1.2.3]
  await Lesson.deleteMany({ course: { $in: courseIds } });

  await Course.deleteMany({ category: this._id });

  next();
});
//2- create model
const CategoryModel = mongoose.model("Category", categorySchema);

module.exports = CategoryModel;
