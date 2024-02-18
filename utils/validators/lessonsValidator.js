const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const ApiError = require("../apiError");
const Section = require("../../models/sectionModel");

exports.createLessonValidator = [
  check("title")
    .isLength({ min: 2 })
    .withMessage("must be at least 2 chars")
    .notEmpty()
    .withMessage("Course required"),

  check("image").notEmpty().withMessage("lesson Image Required"),

  check("section")
    .notEmpty()
    .withMessage("Lesson must be belong to a Course")
    .isMongoId()
    .withMessage("Invalid ID format")
    .custom((sectionId) =>
      Section.findById(sectionId).then((section) => {
        if (!section) {
          return Promise.reject(new ApiError(`section Not Found`, 404));
        }
      })
    ),

  //catch error and return it as a response
  validatorMiddleware,
];
exports.updateLessonValidator = [
  check("id").isMongoId().withMessage("invalid mongo Id "),

  check("title")
    .optional()
    .isString()
    .withMessage("string only allowed")
    .trim()
    .escape()
    .isLength({ min: 3 })
    .withMessage("too short title ")
    .isLength({ max: 125 })
    .withMessage("too long title for lesson"),

  check("section")
    .optional()
    .isMongoId()
    .withMessage("Invalid ID format")
    // before i add product to category i must check if category is in database
    .custom((sectionId) =>
      Section.findById(sectionId).then((section) => {
        if (!section) {
          return Promise.reject(new ApiError(`section Not Found`, 404));
        }
      })
    ),
  validatorMiddleware,
];
