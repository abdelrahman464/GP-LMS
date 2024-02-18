const express = require("express");

const {
  checkCourseIdParamValidator,
  createCourseValidator,
  updateCourseValidator,
  getRelatedCoursesValidator,
  checkCourseOwnership,
} = require("../utils/validators/courseValidator");
const {
  uploadCourseImage,
  resizeImage,
  createCourse,
  setinstructorIdToBody,
  getAllCourses,
  createFilterObj,
  getCourseById,
  deleteCourse,
  updateCourse,
  relatedCourses,
  addUserToCourse,
  getCourseUsers,
  createFilterObjToGetMyCourses,
} = require("../services/courseService");
const authServices = require("../services/authServices");
// nested routes
const reviewsRoute = require("./reviewRoute");

const router = express.Router({ mergeParams: true });

router.use("/:courseId/reviews", reviewsRoute);

// Create a new course
router.post(
  "/",
  authServices.protect,
  authServices.allowedTo("instructor", "admin"),
  uploadCourseImage,
  resizeImage,
  setinstructorIdToBody,
  createCourseValidator,
  createCourse
);

// Get all courses
router.get(
  "/",
  authServices.protect,
  authServices.allowedTo("instructor", "admin", "user"),
  createFilterObj,
  getAllCourses
);
router.get(
  "/MyCourses",
  authServices.protect,
  authServices.allowedTo("instructor", "admin", "user"),
  createFilterObjToGetMyCourses,
  getAllCourses
);

// Get a specific course by ID
router.get(
  "/:id",
  authServices.protect,
  authServices.allowedTo("instructor", "admin", "user"),
  checkCourseIdParamValidator,
  getCourseById
);
//Get course with CategoryId  gomaa
router.get(
  "/relatedCourses/:catId",
  authServices.protect,
  getRelatedCoursesValidator,
  relatedCourses
);
// add user to course list   gomaa
router.post("/addUserToCourse", authServices.protect, addUserToCourse);

// get course users
//make sure that the user is the instructor of the course
router.get(
  "/courseUsers",
  authServices.protect,
  authServices.allowedTo("instructor", "admin"),
  checkCourseOwnership,
  getCourseUsers
);

// Update a course by ID
router.put(
  "/:id",
  authServices.protect,
  authServices.allowedTo("instructor", "admin"),
  uploadCourseImage,
  resizeImage,
  updateCourseValidator,
  updateCourse
);

// Delete a course by ID
router.delete(
  "/:id",
  authServices.protect,
  authServices.allowedTo("instructor", "admin"),
  checkCourseIdParamValidator,
  deleteCourse
);

module.exports = router;
