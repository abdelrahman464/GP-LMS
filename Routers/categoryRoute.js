const express = require("express");
const courseRoute = require("./courseRoute");
const {
  createCategroyValidator,
  updateCategroyValidator,
  CategoryIdValidator,
} = require("../utils/validators/categoryValidator");
const {
  getCategories,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryImage,
  resizeImage,
} = require("../services/categoryService");

const authServices = require("../services/authServices");

const router = express.Router();

router.use("/:catId/courses", courseRoute);

router
  .route("/")
  .get(getCategories)
  .post(
    authServices.protect,
    authServices.allowedTo("admin"),
    uploadCategoryImage,
    resizeImage,
    createCategroyValidator,
    createCategory
  );
router
  .route("/:id")
  .get(CategoryIdValidator, getCategory)
  .put(
    authServices.protect,
    authServices.allowedTo("admin"),
    uploadCategoryImage,
    resizeImage,
    updateCategroyValidator,
    updateCategory
  )
  .delete(
    authServices.protect,
    authServices.allowedTo("admin"),
    CategoryIdValidator,
    deleteCategory
  );

module.exports = router;
