const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const Lesson = require("../models/lessonModel");
const factory = require("./handllerFactory");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");

//upload Singel image
exports.uploadlessonImage = uploadSingleImage("image");
//image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `lesson-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/lessons/images/${filename}`);

    //save image into our db
    req.body.image = filename;
  }

  next();
});
// Create a new lesson
exports.createLesson = factory.createOne(Lesson);

//filter lessons in specefic section by courseId
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.sectionId) filterObject = { section: req.params.sectionId };
  req.filterObj = filterObject;
  next();
};
// Get all lessons of a section
exports.getLessons = factory.getALl(Lesson);

// Get a specific lesson by ID
exports.getLessonById = factory.getOne(Lesson);

// Update a lesson by ID
exports.updateLesson = factory.updateOne(Lesson);

// Delete a lesson by ID
exports.deleteLesson = factory.deleteOne(Lesson);
