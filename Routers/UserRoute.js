const express = require("express");
const {
  getUserValidator,
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,

  updateLoggedUserValidator,
  changeLoggedUserPasswordValidator,
} = require("../utils/validators/userValidator");
const authServices = require("../services/authServices");
const {
  getUsers,
  createFilterToGetInstructors,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  getLoggedUserData,
  updateLoggedUserPassword,
  updateLoggedUserData,
  uploadProfileImage,
  resizeImage,
  deActiveLoggedUser,
  activeLoggedUser,
} = require("../services/UserServices");

const router = express.Router();

router.get("/getMe", authServices.protect, getLoggedUserData, getUser);
router.get(
  "/getInstructors",
  authServices.protect,
  createFilterToGetInstructors,
  getUsers
);

router.put(
  "/changeMyPassword",
  authServices.protect,
  changeLoggedUserPasswordValidator,
  updateLoggedUserPassword
);
router.put(
  "/changeMyData",
  authServices.protect,
  uploadProfileImage,
  resizeImage,
  updateLoggedUserValidator,
  updateLoggedUserData
);

router.put("/deActiveMe", authServices.protect, deActiveLoggedUser);
router.put("/activeMe", activeLoggedUser);

router
  .route("/")
  .get(authServices.protect, authServices.allowedTo("admin"), getUsers)
  .post(
    authServices.protect,
    authServices.allowedTo("admin"),
    uploadProfileImage,
    resizeImage,
    createUserValidator,
    createUser
  );
router
  .route("/:id")
  .get(
    authServices.protect,
    authServices.allowedTo("admin"),
    getUserValidator,
    getUser
  )
  .put(
    authServices.protect,
    authServices.allowedTo("admin"),
    uploadProfileImage,
    resizeImage,
    updateUserValidator,
    updateUser
  )
  .delete(
    authServices.protect,
    authServices.allowedTo("admin"),
    deleteUserValidator,
    deleteUser
  );

module.exports = router;
