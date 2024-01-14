/* eslint-disable import/no-extraneous-dependencies */
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const factory = require("./handllerFactory");
const Order = require("../models/orderModel");
const Course = require("../models/courseModel");
const User = require("../models/userModel");
const Coupon = require("../models/couponModel");

// const{calculateProfits}=require('../marketing/marketingService')

exports.filterOrderForLoggedUser = asyncHandler(async (req, res, next) => {
  if (req.user.role === "user") req.filterObj = { user: req.user._id };
  if (req.user.role === "instructor") req.filterObj = { user: req.user._id };
  next();
});
//@desc get all orders
//@route GET /api/v1/orders
//@access protected
exports.findAllOrders = factory.getALl(Order);
//@desc get specifi orders
//@route GET /api/v1/orders/:orderId
//@access protected/
exports.findSpecificOrder = factory.getOne(Order);
//@desc Get checkout session from stripe and send it as response
//@route GET /api/v1/orders/checkout-session/packageId
//@access protected/user
exports.checkoutSession = asyncHandler(async (req, res, next) => {
  const { courseId } = req.params;
  const metadataObject = {};
  //app settings
  const taxPrice = 0;

  //1) get cart depend on catrId
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new ApiError("There's no course", 404));
  }
  //2) get order price cart price  "check if copoun applied"
  let coursePrice = course.priceAfterDiscount
    ? course.priceAfterDiscount
    : course.price;

  if (req.body.coupon) {
    const coupon = await Coupon.findOne({
      name: req.body.coupon,
      expire: { $gt: Date.now() },
    });
    if (!coupon) {
      return next(new ApiError("Coupon is Invalid or Expired "));
    }
    metadataObject.coupon = req.body.coupon;

    coursePrice = (coursePrice - (coursePrice * coupon.discount) / 100).toFixed(
      2
    );
  }
  //------
  const totalOrderPrice = Math.ceil(coursePrice + taxPrice);

  //3)create stripe checkout session
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          unit_amount: totalOrderPrice * 100,
          currency: "usd",
          product_data: {
            name: req.user.name,
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `/profile`,
    cancel_url: `/`,
    customer_email: req.user.email,

    client_reference_id: req.params.courseId, // i will use to create order
    metadata: metadataObject,
  });

  //4) send session to response
  res.status(200).json({ status: "success", session });
});
//*-------------------------------------------------------------------------------------- */
const createOrder = async (session) => {
  const courseId = session.client_reference_id;
  const orderPrice = session.amount_total / 100;
  //1)retrieve importsant objects
  const course = await Course.findById(courseId);
  const user = await User.findOne({ email: session.customer_email });
  if (!course) {
    return new Error("course Not Found");
  }
  if (!user) {
    return new Error(" User Not Found");
  }

  const coupon = session.metadata.coupon || "no coupon used";
  //2)create order with default payment method cash
  const order = await Order.create({
    user: user._id,
    totalOrderPrice: orderPrice,
    isPaid: true,
    paymentMethodType: "stripe",
    coupon: coupon,
    paidAt: Date.now(),
  });

  if (!order) {
    return new Error("Couldn't Create Order");
  }

  // 2)Add the user object to the users array in the course
  course.users.addToSet(user._id);
  await course.save();
};
//-----------------------------------------------------------------------

//@desc this webhook will run when the stripe payment success paied
//@route POST /webhook-checkout
//@access protected/user
exports.webhookCheckout = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  switch (event.type) {
    case "checkout.session.completed":
      await createOrder(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
});
