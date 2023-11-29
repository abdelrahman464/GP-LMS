const express = require("express");

const {
  checkCourseIdParamValidator,
  createCourseValidator,
  updateCourseValidator,
  getRelatedCoursesValidator
} = require("../utils/validators/courseValidator");
const {
  createCourse,
  setinstructorIdToBody,
  getAllCourses,
  createFilterObj,
  getCourseById,
  deleteCourse,
  updateCourse,
  relatedCourses,
  addUserToCourse,
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

// Get a specific course by ID
router.get(
  "/:id",
  authServices.protect,
  authServices.allowedTo("instructor", "admin", "user"),
  checkCourseIdParamValidator,
  getCourseById
);
//Get course with CategoryId  gomaa
router.get("/relatedCourses/:catId", authServices.protect,getRelatedCoursesValidator,relatedCourses);
// add user to course list   gomaa
router.post("/addUserToCourse", authServices.protect, addUserToCourse);

// Update a course by ID
router.put(
  "/:id",
  authServices.protect,
  authServices.allowedTo("instructor", "admin"),
  
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
