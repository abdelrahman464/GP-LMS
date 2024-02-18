const express = require("express");
const authServices = require("../services/authServices");
const {
  createFilterObj,
  createSection,
  deleteSection,
  getSection,
  getSections,
  updateSection,
} = require("../services/sectionService");

const router = express.Router();

// Create a new lesson
router.post("/", authServices.protect, createSection);
// Get all lessons of a section
router.get("/:courseId", authServices.protect, createFilterObj, getSections);
// Get a specific lesson by ID
router.get("/:id", authServices.protect, getSection);

// Update a lesson by ID
router.put("/:id", authServices.protect, updateSection);

// Delete a lesson by ID
router.delete("/:id", authServices.protect, deleteSection);

module.exports = router;
