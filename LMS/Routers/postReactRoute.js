const express = require("express");

const authServices = require("../services/authServices");
const {
  addReact,
  createFilterObj,
  getAllReactions,
} = require("../services/reactOnPostServices");

const router = express.Router({ mergeParams: true });
router
  .route("/")
  .get(
    authServices.protect,
    authServices.allowedTo("user", "admin"),
    createFilterObj,
    getAllReactions
  )
  .post(
    authServices.protect,
    authServices.allowedTo("user", "admin"),
    addReact
  );

module.exports = router;
