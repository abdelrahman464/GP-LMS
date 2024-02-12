const asyncHandler = require("express-async-handler");
const Course = require("../models/courseModel");
const User = require("../models/userModel");
const factory = require("./handllerFactory");

// middleware to add instructorId to body
exports.setinstructorIdToBody = (req, res, next) => {
  req.body.instructor = req.user._id;
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
exports.createFilterObjToGetMyCourses = async (req, res, next) => {
  let filterObject = {};
  if (req.user.role === "user") {
    filterObject = { users: req.user._id };
  } else if (req.user.role === "instructor") {
    filterObject = { instructor: req.user._id };
  }
  req.filterObj = filterObject;
  next();
};
// Create a new course
exports.createCourse = factory.createOne(Course);

// Get all courses
exports.getAllCourses = factory.getALl(Course);

// Get a specific course by ID
exports.getCourseById = factory.getOne(Course, "reviews");

// Update a course by ID
exports.updateCourse = factory.updateOne(Course);

// Delete a course by ID
exports.deleteCourse = factory.deleteOne(Course);

exports.relatedCourses = asyncHandler(async (req, res) => {
  const { catId } = req.params;
  const courses = await Course.find({ category: catId });
  res.status(200).json({ data: courses });
});
// to be done when user purchase a course
exports.addUserToCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const userId = req.user._id;

  const course = await Course.findById(courseId);

  if (!Course) {
    res.status(400).json({ status: `no course for that id: ${courseId}` });
  }
  const startDate = new Date();

  // Add the user object to the users array
  const newUser = {
    user: userId,
    start_date: startDate,
  };

  course.users.push(newUser);

  await course.save();

  res.status(200).json({ status: "success", course: course });
});
//@desc get course users
//@route Get courses/courseUsers
//@access protected user
exports.getCourseUsers = asyncHandler(async (req, res) => {
  const { courseId } = req.body;
  const course = await Course.findById(courseId);
  if (!course) {
    return res
      .status(400)
      .json({ status: `no course for that id: ${courseId}` });
  }
  const usersInCourse = course.users.map((user) => user.toString());
  const users = await User.find({ _id: { $in: usersInCourse } });
  if (!users)
    return res.status(400).json({ status: "no users in this course" });

  return res.status(200).json({ status: "success", usersInCourse });
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
      res.json({ msg: "not allowed" });
    }
    // res.json(package)
    next();
  });
