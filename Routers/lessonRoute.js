const express = require("express");
const authServices = require("../services/authServices");
const {
  // checkAuthority2,
  createLessonValidator,
} = require("../utils/validators/lessonsValidator");
const {
  uploadlessonImage,
  resizeImage,
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonById,
  createFilterObj,
  getLessons,
  getLessonsByCourseId,
} = require("../services/lessonServices");

const router = express.Router();

// Create a new lesson
router.post(
  "/",
  authServices.protect,
  uploadlessonImage,
  resizeImage,
  createLessonValidator,
  createLesson
);
// Get all lessons of a section
router.get("/:sectionId", authServices.protect, createFilterObj, getLessons);
router.get("/incourse/:courseId", authServices.protect, getLessonsByCourseId);

// Get a specific lesson by ID
router.get("/:id", authServices.protect, getLessonById);

// Update a lesson by ID
router.put(
  "/:id",
  authServices.protect,
  uploadlessonImage,
  resizeImage,
  updateLesson
);

// Delete a lesson by ID
router.delete("/:id", authServices.protect, deleteLesson);

module.exports = router;
