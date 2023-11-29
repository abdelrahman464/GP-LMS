const express = require("express");
const {
  CouponIdValidator,
  createCouponValidator,
  updateCouponValidator,
} = require("../utils/validators/couponValidator");
const authServices = require("../services/authServices");
const {
  getCoupons,
  createCoupon,
  getCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../services/couponService");

const router = express.Router();
router.use(authServices.protect, authServices.allowedTo("admin"));
router.route("/").get(getCoupons).post(createCouponValidator, createCoupon);
router
  .route("/:id")
  .get(CouponIdValidator, getCoupon)
  .put(updateCouponValidator, updateCoupon)
  .delete(CouponIdValidator, deleteCoupon);

module.exports = router;
