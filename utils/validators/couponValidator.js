const { check, body } = require("express-validator");
const Coupon = require("../../models/couponModel");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");

exports.CouponIdValidator = [
  //rules
  check("id").isMongoId().withMessage("Invalid Coupon id format"),
  //catch error
  validatorMiddleware,
];
exports.createCouponValidator = [
  check("name")
    .notEmpty()
    .withMessage("Coupon name required")
    .custom((val) =>
      Coupon.findOne({ name: val }).then((coupon) => {
        if (coupon) {
          return Promise.reject(new Error("coupon already exist"));
        }
      })
    ),
  check("expire").notEmpty().withMessage("Coupon expire date required"),
  check("discount").notEmpty().withMessage("Coupon discount required"),
  validatorMiddleware,
];
exports.updateCouponValidator = [
  check("id").isMongoId().withMessage("Invalid Coupon id format"),
  body("name").optional(),
  validatorMiddleware,
];
