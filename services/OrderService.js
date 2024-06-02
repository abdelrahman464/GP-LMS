const stripe = require("stripe")(process.env.STRIPE_SECRET);
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const factory = require("./handllerFactory");
const Order = require("../models/orderModel");
const Course = require("../models/courseModel");
const User = require("../models/userModel");
const Coupon = require("../models/couponModel");
const Notification = require("../models/notificationModel");
const Chat = require("../models/ChatModel");


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
      return next(new ApiError("Coupon is Invalid or Expired"));
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
            name: req.user.username,
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: 'https://yourdomain.com/profile', // Replace with your actual success URL
    cancel_url: 'https://yourdomain.com/', // Replace with your actual cancel URL
    customer_email: req.user.email,

    client_reference_id: req.params.courseId, // i will use to create order
    metadata: metadataObject,
  });

  //4) send session to response
  res.status(200).json({ status: "success", session });
});

//*-------------------------------------------------------------------------------------- */
async function giveUserCourse(user, course) {
  // Ensure user._id is an ObjectId
  const userId = mongoose.Types.ObjectId(user._id);

  // Add user to course
  await Course.findByIdAndUpdate(
    course._id,
    {
      $push: {
        users: userId, // Push the ObjectId directly
      },
    },
    { new: true }
  );

  // Add user to group chat
  const chat = await Chat.findOneAndUpdate(
    { course: course._id, isGroupChat: true },
    { $push: { participants: { user: userId, isAdmin: false } } }, // Adjust if participants field needs a specific structure
    { new: true }
  );

  // Send notification
  await Notification.create({
    user: userId,
    message: `You have been added to the group ${chat.groupName}`,
    chat: chat._id,
    type: "chat",
  });
}

const createOrder = async (session) => {
  const courseId = session.client_reference_id;
  const orderPrice = session.amount_total / 100;

  // Retrieve important objects
  const course = await Course.findById(courseId);
  const user = await User.findOne({ email: session.customer_email });

  if (!course) {
    throw new Error("Course Not Found");
  }
  if (!user) {
    throw new Error("User Not Found");
  }

  const coupon = session.metadata.coupon || "no coupon used";

  // Create order with default payment method cash
  const order = await Order.create({
    user: user._id,
    totalOrderPrice: orderPrice,
    isPaid: true,
    paymentMethodType: "stripe",
    coupon: coupon,
    paidAt: Date.now(),
  });

  if (!order) {
    throw new Error("Couldn't Create Order");
  }

  // Add course to user courses and joined him to chat and send notification to him
  await giveUserCourse(user, course);
  return true;
};

// Webhook route setup
exports.webhookCheckout = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
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
