const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const ApiError = require("../apiError");
const Course = require("../../models/courseModel");


exports.createPackageValidator=[
    check("title")
    .isLength({ min: 2 })
    .withMessage("must be at least 2 chars")
    .notEmpty()
    .withMessage("title required"),

    check("description")
    .isLength({ min: 5 })
    .withMessage("must be at least 5 chars")
    .notEmpty()
    .withMessage("description required"),


    check("price")
    .notEmpty()
    .withMessage("price is required")
    .isNumeric()
    .withMessage(" price must be a number"),

    check("expirationTime")
    .notEmpty()
    .withMessage("expirationTime is required")
    .isNumeric()
    .withMessage("expirationTime must be a number"),

    check("image").optional(),

    check("courses")
    .optional()
    .isArray()
    .withMessage("courses must be an array")
    .custom((coursesArray) => {
      const coursePromises = coursesArray.map((courseId) => Course.findById(courseId));
      return Promise.all(coursePromises)
        .then((courses) => {
          const missingCourses = courses.filter((course) => !course);
          if (missingCourses.length > 0) {
            return Promise.reject(new ApiError(`Some Courses Not Found`, 404));
          }
        });
    }),
check("allCourses")
.optional()
.isBoolean()
.withMessage("allCourses should be boolean"),

  //catch error and return it as a response
  validatorMiddleware,

]
exports.updatePackageValidator=[

check("title")
    .optional()
    .isLength({ min: 2 })
    .withMessage("must be at least 2 chars"),

check("description")
    .optional()
    .isLength({ min: 5 })
    .withMessage("must be at least 5 chars"),

check("price")
    .optional()
    .isNumeric()
    .withMessage(" price must be a number"),

check("expirationTime")
    .optional()
    .isNumeric()
    .withMessage("expirationTime must be a number"),

check("image")
    .optional(),

    check("courses")
    .optional()
    .isArray()
    .withMessage("courses must be an array")
    .custom((coursesArray) => {
      const coursePromises = coursesArray.map((courseId) => Course.findById(courseId));
      return Promise.all(coursePromises)
        .then((courses) => {
          const missingCourses = courses.filter((course) => !course);
          if (missingCourses.length > 0) {
            return Promise.reject(new ApiError(`Some Courses Not Found`, 404));
          }
        });
    }),
check("allCourses")
    .optional()
    .isBoolean()
    .withMessage("allCourses should be boolean"),
  //catch error and return it as a response
  validatorMiddleware,

]