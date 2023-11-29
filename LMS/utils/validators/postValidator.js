const { check } = require("express-validator");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Post = require("../../models/postModel");
const Course = require("../../models/courseModel");

exports.processPostValidator = [
  check("id")
    .isMongoId()
    .withMessage("Invalid Requst id format")
    .custom((val, { req }) =>
      Post.findById(val).then((post) => {
        if (!post) {
          return Promise.reject(new Error(`Post not found`));
        }
        if (
          post.user._id.toString() !== req.user._id.toString() &&
          req.user.role !== "admin"
        ) {
          return Promise.reject(
            new Error(`Your are not allowed to perform this action`)
          );
        }
      })
    ),

  validatorMiddleware,
];

exports.createPostValidator = [
  check("images")
    .optional()
    .isArray()
    .withMessage("images should be array of string"),
  check("course")
    .optional()
    .isMongoId()
    .withMessage("Invalid Requst id format")
    .custom((val, { req }) =>
      Course.findById(val).then((course) => {
        //check if course exists
        if (!course) {
          return Promise.reject(new Error(`Course not found`));
        }
        //check if the logged user is the instractor of this course to add post in this course
        if (req.user.role === "admin") {
          return true;
        }
        if (req.user._id.toString() !== course.instructor.toString()) {
          return Promise.reject(
            new Error(`You Are Not The instractor of this course`)
          );
        }
      })
    ),

  validatorMiddleware,
];

exports.getPostValidator = [
  check("id").isMongoId().withMessage("Invalid Requst id format"),
  validatorMiddleware,
];
