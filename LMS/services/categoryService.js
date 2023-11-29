const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");
const Category = require("../models/CategoryModel");
const factory = require("./handllerFactory");
const {
  uploadSingleImage,
} = require("../middlewares/uploadImageMiddleware");

//upload Singel image
exports.uploadCategoryImage = uploadSingleImage("image");
//image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `category-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/education/categories/${filename}`);

    //save image into our db
    req.body.image = filename;
  }

  next();
});

//@desc get list of categories
//@route GET /api/v1/categories
//@access public
exports.getCategories = factory.getALl(Category);
//@desc get specific category by id
//@route GET /api/v1/categories/:id
//@access public
exports.getCategory = factory.getOne(Category);
//@desc create category
//@route POST /api/v1/categories
//@access private
exports.createCategory = factory.createOne(Category);
//@desc update specific category
//@route PUT /api/v1/categories/:id
//@access private
exports.updateCategory = factory.updateOne(Category);
//@desc delete category
//@route DELETE /api/v1/categories/:id
//@access private
exports.deleteCategory = factory.deleteOne(Category);
