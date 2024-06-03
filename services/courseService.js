const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const Course = require("../models/courseModel");
const Chat = require("../models/ChatModel");
const User = require("../models/userModel");
const factory = require("./handllerFactory");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const ApiError = require("../utils/apiError");

//upload Singel image
exports.uploadCourseImage = uploadSingleImage("image");
//image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `course-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    await sharp(req.file.buffer)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/courses/${filename}`);

    //save image into our db
    req.body.image = filename;
  }

  next();
});
// middleware to add instructorId to body
exports.setinstructorIdToBody = (req, res, next) => {
  if (!req.body.instructor) {
    req.body.instructor = req.user._id;
  }
  next();
};

//filter subCategories in specefic category by categoryId
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.categoryId) filterObject = { category: req.params.categoryId };
  req.filterObj = filterObject;
  next();
};
//filter to get my courses as admin , instractor , user
exports.filterMyCoursesBasedOnRole = async (req, res, next) => {
  let filterObject = {};
  if (req.user.role === "user") {
    console.log("user", req.user._id);
    filterObject = { users: { $in: [req.user._id] } };
  } else if (req.user.role === "instructor") {
    filterObject = { instructor: req.user._id };
  }
  req.filterObj = filterObject;
  next();
};
// Create a new course
exports.createCourse = asyncHandler(async (req, res) => {
  //create the course
  const course = await Course.create(req.body);
  //if course created then create the group chat
  if (course) {
    const { description, title } = req.body;
    const groupCreatorId = req.user._id.toString();
    const groupAdminId = req.body.instructor.toString();

    const groupNameAsCourse = `Group For Course: ${title}`;
    const groupDescriptionAsCourse = `This group is for the course: ${title} - ${description}`;

    // Create the new group chat
    await Chat.create({
      participants: [
        { user: groupCreatorId, isAdmin: true },
        { user: groupAdminId, isAdmin: true },
      ],
      isGroupChat: true,
      course: course._id,
      creator: req.user._id,
      groupName: groupNameAsCourse,
      description: groupDescriptionAsCourse,
    });
  }
  res.status(201).json({ data: course });
});
// Get all courses
exports.getAllCourses = async (req, res, next) => {
  const courses = await Course.find(req.filterObj).select("-users -__v");
  if (!courses) return next(new ApiError(`no courses found`, 404));
  return res.status(200).json({ role: req.user.role, data: courses });
};

// Get a specific course by ID
exports.getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate("reviews")
    .select("-users -__v");
  if (!course) return next(new ApiError(`no course found`, 404));
  return res.status(200).json({ data: course });
});

// Update a course by ID
exports.updateCourse = factory.updateOne(Course);

// Delete a course by ID
exports.deleteCourse = factory.deleteOne(Course);

exports.relatedCourses = asyncHandler(async (req, res) => {
  const { catId } = req.params;
  const courses = await Course.find({ category: catId });
  return res.status(200).json({ data: courses });
});
// to be done when user purchase a course
exports.addUserToCourse = asyncHandler(async (req, res, next) => {
  const { courseId } = req.body;
  const userId = req.user._id;

  const course = await Course.findById(courseId);

  if (!Course) {
    return next(new ApiError(`Not Found`, 404));
  }
  const startDate = new Date();

  // Add the user object to the users array
  await Course.findByIdAndUpdate(
    courseId,
    {
      $push: {
        users: {
          user: userId,
          start_date: startDate,
        },
      },
    },
    { new: true }
  );

  res.status(200).json({ status: "success", course: course });
});
//@desc get course users
//@route Get courses/courseUsers
//@access protected user
exports.getCourseSubscripers = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const course = await Course.findById(id);
  if (!course) {
    return next(new ApiError(`no course for that id`, 400));
  }
  const usersInCourse = course.users.map((user) => user.toString());
  const subscripedUsers = await User.find({
    _id: { $in: usersInCourse },
  }).select("_id username email");
  if (subscripedUsers.length === 0)
    return next(new ApiError(`no users in this course`, 400));

  return res.status(200).json({
    status: "success",
    numberOfSubscripers: subscripedUsers.length,
    subscripedUsers,
  });
});

exports.checkCourseAuthority = (req, res, next) =>
  asyncHandler(async (_req, _res, _next) => {
    const userId = req.user.id;
    const { courseId } = req.params;

    const course = await Course.findOne(
      {
        _id: courseId,
        "users.user": userId,
      },
      {
        "users.$": 1, // Select only the matched user object
      }
    );

    if (!course) {
      //check whether has access on courses
      return next(new ApiError(`Not Allowed`, 403));
    }
    // res.json(package)
    next();
  });
