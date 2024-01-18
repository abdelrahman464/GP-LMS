const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const ApiError = require("../apiError");
const Course = require("../../models/courseModel");


exports.createLessonValidator = [
  check("title")
    .isLength({ min: 2 })
    .withMessage("must be at least 2 chars")
    .notEmpty()
    .withMessage("Course required"),

  check("image").notEmpty().withMessage("Course Image Required"),

  check("course")
    .notEmpty()
    .withMessage("Lesson must be belong to a Course")
    .isMongoId()
    .withMessage("Invalid ID format")
    // before i add product to category i must check if category is in database
    .custom((courseId) =>
      Course.findById(courseId).then((course) => {
        if (!course) {
          return Promise.reject(new ApiError(`Course Not Found`, 404));
        }
      })
    ),

  //catch error and return it as a response
  validatorMiddleware,
];
exports.updateLessonValidator=[
  check("id").isMongoId().withMessage("invalid mongo Id "),

  check("title").optional()
  .isString().withMessage("string only allowed")
  .trim()
  .escape() 
  .isLength({min:3}).withMessage("too short title ")
  .isLength({max:125}).withMessage("too long title for course") ,

   check("course")
    .optional()
    .isMongoId()
    .withMessage("Invalid ID format")
    // before i add product to category i must check if category is in database
    .custom((courseId) =>
      Course.findById(courseId).then((course) => {
        if (!course) {
          return Promise.reject(new ApiError(`Course Not Found`, 404));
        }
      })
    )
    ,
    validatorMiddleware,
]

