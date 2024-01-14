const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const ApiError = require("../utils/apiError");
const Lesson = require("../models/lessonModel");
const Course = require("../models/courseModel");
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
      .toFile(`uploads/lessons/iamge/${filename}`);

    //save image into our db
    req.body.image = filename;
  }
  
  next();
});
// Create a new lesson
exports.createLesson = asyncHandler(async (req, res, next) => {
  const { course, title, type, videoUrl, image } = req.body;
  // Create a new section
  const lesson = new Lesson({
    title,
    course,
    type,
    videoUrl,
    image,
  });
  //check if section exists
  const currentCourse = await Course.findById(course);
  if (!currentCourse) {
    return next(new ApiError(`course not found`, 404));
  }
  //save
  await lesson.save();

  res.status(201).json({ success: true, lesson });
});

// Get all lessons of a section
exports.getLessonsBySectionId = factory.getALl(Lesson);

// Get a specific lesson by ID
exports.getLessonById = factory.getOne(Lesson);

// Update a lesson by ID
exports.updateLesson = factory.updateOne(Lesson);

// Delete a lesson by ID
exports.deleteLesson = factory.deleteOne(Lesson);

exports.relatedLessons = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const lessons = await Lesson.find({ course: courseId });
  res.status(200).json({ data: lessons });
});
