const Section = require("../models/sectionModel");
const factory = require("./handllerFactory");

//filter sections in specefic course by courseId
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.courseId) filterObject = { course: req.params.courseId };
  req.filterObj = filterObject;
  next();
};
//@desc get list of categories
//@route GET /api/v1/categories
//@access public
exports.getSections = factory.getALl(Section);
//@desc get specific category by id
//@route GET /api/v1/categories/:id
//@access public
exports.getSection = factory.getOne(Section);
//@desc create category
//@route POST /api/v1/categories
//@access private
exports.createSection = factory.createOne(Section);
//@desc update specific category
//@route PUT /api/v1/categories/:id
//@access private
exports.updateSection = factory.updateOne(Section);
//@desc delete category
//@route DELETE /api/v1/categories/:id
//@access private
exports.deleteSection = factory.deleteOne(Section);
