const express = require("express");
const authServices = require("../services/authServices");
const {
  checkAuthority2,
  createLessonValidator,
} = require("../utils/validators/lessonsValidator");
const {
  uploadlessonImage,
  resizeImage,
  createLesson,
  updateLesson,
  deleteLesson,
  getLessonById,
  getLessonsBySectionId,
  relatedLessons,
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
router.get("/", authServices.protect, getLessonsBySectionId);

// Get a specific lesson by ID
router.get("/:id", authServices.protect, getLessonById);
//Get course with CategoryId
router.get(
  "/relatedLessons/:courseId",
  authServices.protect,
  checkAuthority2,
  relatedLessons
);

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
