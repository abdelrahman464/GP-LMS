const express = require("express");
const {
  deleteCommentValidator,
  updateCommentValidator,
  getCommentValidator,
  createCommentValidator,
} = require("../utils/validators/postCommentValidator");
const authServices = require("../services/authServices");

const {
  uploadCommentImage,
  resizeImage,
  createComment,
  getComment,
  getAllComment,
  deleteComment,
  updateComment,
  createFilterObj,
  setUserIdToBody,
} = require("../services/commentOnPostServices");

const router = express.Router({ mergeParams: true });

router
  .route("/")
  .post(
    authServices.protect,
    authServices.allowedTo("user", "instructor", "admin"),
    uploadCommentImage,
    resizeImage,
    setUserIdToBody,
    createCommentValidator,
    createComment
  )
  .get(
    authServices.protect,
    authServices.allowedTo("user", "admin", "instructor"),
    createFilterObj,
    getAllComment
  );
router
  .route("/:id")
  .get(
    authServices.protect,
    authServices.allowedTo("user", "admin", "instructor"),
    getCommentValidator,
    getComment
  )
  .put(
    authServices.protect,
    authServices.allowedTo("user", "instructor", "admin"),
    uploadCommentImage,
    resizeImage,
    updateCommentValidator,
    updateComment
  )
  .delete(
    authServices.protect,
    authServices.allowedTo("user", "admin", "instructor"),
    deleteCommentValidator,
    deleteComment
  );

module.exports = router;
