const { check } = require("express-validator");
const { validationResult } = require("express-validator");

const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const ApiError = require("../apiError");
const Course = require("../../models/courseModel");
const Package = require("../../models/packageModel");

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



// exports.checkAuthority2 = [
//   check("courseId")
//     .isMongoId()
//     .withMessage("Invalid courseId")
//     .custom(
//       (courseId, { req }) =>
//         new Promise((resolve, reject) => {
//           //if he is an admin 
//           if(req.user.role==="admin"){
//             resolve();
//           }
//           // Check if the user has a subscription for the course
//           Package.findOne({
//             $or: [
//               { courses: { $in: [courseId] } },
//               { allCourses: true }
//             ],
//             // eslint-disable-next-line no-underscore-dangle
//             "users.user": req.user._id, 
//           },
//           {
//             "users.$": 1, // Select only the matched user object
//           }
//           )
//             .then((package) => {
//               if (package) {
//                 // check whether user subscribtion expired or not 
//                 const user = package.users[0];
//                 const bool =
//                   new Date(user.end_date).getTime() <= new Date().getTime();
//                   if (bool) {
//                     // User's start date is not valid, delete the user object from the users array
//                      Package.updateOne(
//                       { _id: package._id }, // Identify the document by its unique identifier
//                       { $pull: { users: { _id: user._id } } } // Specify the field and the element to remove
//                     ).then(()=>{
//                       reject("your subscription expired ");
//                     });
                
//                   }
//                   resolve();
//               } else {
//                 // Check if the user has paid for the course or is the instructor
//                 Course.findOne({
//                   _id: courseId,
//                   // eslint-disable-next-line no-underscore-dangle
//                   instructor: req.user._id ,
                  
//                 })
//                   .then((course) => {
//                     if (course) {
//                       // User is the instructor of the course
//                       resolve();
//                     } else {
//                       // User does not have the necessary authority
//                       // eslint-disable-next-line prefer-promise-reject-errors
//                       reject("you are not allowed to access this course");
//                     }
//                   })
//                   .catch((error) => {
//                     reject(new Error(error));
//                   });
//               }
//             })
//             .catch((error) => {
//               reject(error);
//             });
//         })
//     ),
//     (req, res, next) => {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ msg: errors.array()[0].msg});
//       }
//       //if no error go to next handler middleware
//       next();
//     }
// ];

