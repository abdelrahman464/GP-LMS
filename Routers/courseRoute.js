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
  filterMyCoursesBasedOnRole,
  createCourse,
  setinstructorIdToBody,
  getAllCourses,
  getCourseById,
  deleteCourse,
  updateCourse,
  relatedCourses,
  addUserToCourse,
  getCourseSubscripers,
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
router.get("/", getAllCourses);
router.get(
  "/MyCourses",
  authServices.protect,
  authServices.allowedTo("instructor", "admin", "user"),
  filterMyCoursesBasedOnRole,
  getAllCourses
);

// Get a specific course by ID
router.get("/:id", checkCourseIdParamValidator, getCourseById);
//Get course with CategoryId  gomaa
router.get(
  "/relatedCourses/:catId",
  getRelatedCoursesValidator,
  relatedCourses
);
// add user to course list   gomaa
router.post("/addUserToCourse", authServices.protect, addUserToCourse);

// get course users
//make sure that the user is the instructor of the course
router.get(
  "/courseSubscripers/:id",
  authServices.protect,
  authServices.allowedTo("instructor", "admin"),
  checkCourseOwnership,
  getCourseSubscripers
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
