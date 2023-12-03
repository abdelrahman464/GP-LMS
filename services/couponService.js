const Coupon = require("../models/couponModel");
const factory = require("./handllerFactory");
//@desc get list of coupons
//@route GET /api/v1/coupons
//@access private/admin-manager
exports.getCoupons = factory.getALl(Coupon);
//@desc get specific coupon by id
//@route GET /api/v1/coupon/:id
//@access private/admin-manager
exports.getCoupon = factory.getOne(Coupon);
//@desc create coupon
//@route POST /api/v1/coupons
//@access private/admin-manager
exports.createCoupon = factory.createOne(Coupon);
//@desc update specific Coupon
//@route PUT /api/v1/coupon/:id
//@access private/admin-manager
exports.updateCoupon = factory.updateOne(Coupon);
//@desc delete coupon
//@route DELETE /api/v1/coupon/:id
//@access private/admin-manager
exports.deleteCoupon = factory.deleteOne(Coupon);
