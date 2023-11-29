const asyncHandler = require("express-async-handler");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const Comment = require("../models/commentModel");
const factory = require("./handllerFactory");
const {
  uploadSingleImage,
} = require("../middlewares/uploadImageMiddleware");

//upload Single image
exports.uploadCommentImage = uploadSingleImage("image");
//image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `comment-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/analytic/commentPost/${filename}`);

    //save image into our db
    req.body.image = filename;
  }

  next();
});
//filter comments in specefic post by post id
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.postId) filterObject = { post: req.params.postId };
  req.filterObj = filterObject;
  next();
};

exports.setUserIdToBody = (req, res, next) => {
  //set user id in the body i will take it from logged user
  req.body.user = req.user._id;
  next();
};
//@desc create a new group
//@route POST /api/v1/postComments
//@access protected user
exports.createComment = factory.createOne(Comment);
//@desc get all comments
//@route GET /api/v1/postComments
//@access protected user
exports.getAllComment = factory.getALl(Comment);
//@desc get comment
//@route GET /api/v1/postComments/:commentId
//@access protected user
exports.getComment = factory.getOne(Comment, "user");
//@desc update comment
//@route POST /api/v1/postComments/:commentId
//@access protected user that created the comment
exports.updateComment = factory.updateOne(Comment);
//@desc delete comment
//@route POST /api/v1/postComments/:commentId
//@access protected user that created the comment
exports.deleteComment = factory.deleteOne(Comment);
