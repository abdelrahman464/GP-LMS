/* eslint-disable import/no-extraneous-dependencies */
const stripe = require("stripe")(process.env.STRIPE_SECRET);
const asyncHandler = require("express-async-handler");
const coinbase = require("coinbase-commerce-node");
const ApiError = require("../utils/apiError");
const factory = require("./handllerFactory");

const Order = require("../models/orderModel");
const Package = require("../models/packageModel");
const User = require("../models/userModel");
const Coupon = require("../models");

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
  const { packageId } = req.params;
  let metadataObject = {};
  metadataObject.type = "education";
  //app settings
  const taxPrice = 0;

  //1) get cart depend on catrId
  const package = await Package.findById(packageId);
  if (!package) {
    return next(new ApiError("There's no package", 404));
  }
  //2) get order price cart price  "check if copoun applied"
  let packagePrice = package.priceAfterDiscount
    ? package.priceAfterDiscount
    : package.price;

  //gomaa edit ' discount value' ----------------------------------------
  if (req.body.coupon) {
    const coupon = await Coupon.findOne({
      name: req.body.coupon,
      expire: { $gt: Date.now() },
    });
    if (!coupon) {
      return next(new ApiError("Coupon is Invalid or Expired "));
    }
    metadataObject.coupon = req.body.coupon;

    packagePrice = (
      packagePrice -
      (packagePrice * coupon.discount) / 100
    ).toFixed(2);
  }
  //------
  const totalOrderPrice = Math.ceil(packagePrice + taxPrice);

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
    success_url: `https://www.wealthmakers-fx.com/profile`,
    cancel_url: `https://www.wealthmakers-fx.com`,
    customer_email: req.user.email,

    client_reference_id: req.params.packageId, // i will use to create order
    metadata: metadataObject,
  });

  //4) send session to response
  res.status(200).json({ status: "success", session });
});
//*-------------------------------------------------------------------------------------- */
const createOrder = async (session) => {
  const packageId = session.client_reference_id;
  const orderPrice = session.amount_total / 100;
  //1)retrieve importsant objects
  const package = await Package.findById(packageId);
  const user = await User.findOne({ email: session.customer_email });
  console.log(`start 1`);
  if (!package) {
    return new Error("Package Not Found");
  }
  if (!user) {
    return new Error(" User Not Found");
  }
  console.log(`create order`);

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

  console.log(`createdd order`);

  if (!order) {
    return new Error("Couldn't Create Order");
  }

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + package.expirationTime);
  // 2)Add the user object to the users array
  const newUser = {
    user: user._id,
    start_date: startDate,
    end_date: endDate,
  };

  package.users.addToSet(newUser);
  console.log(`done`);
  await package.save();
};
//-----------------------------------------------------------------------

//@desc this webhook will run when the stripe payment success paied
//@route POST education/webhook-checkout
//@access protected/user
exports.webhookCheckoutEducation = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    console.log(`start verify`);
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET_EDUCATION
    );
  } catch (err) {
    console.log(err);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }
  console.log(`start to compare`);
  if (event.data.object.metadata.type === "education") {
    switch (event.type) {
      case "checkout.session.completed":
        console.log(`education :)`);
        await createOrder(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }

  res.status(200).json({ received: true });
});
//------------------------------------------------------------------------------
exports.checkoutSessionCoinBase = asyncHandler(async (req, res, next) => {
  const { packageId } = req.params;
  //app settings
  const taxPrice = 0;
  //1) get cart depend on catrId
  const package = await Package.findById(packageId);
  if (!package) {
    return next(new ApiError("There's no package", 404));
  }
  // eslint-disable-next-line prefer-const
  let metadatainfo = {
    type: "education",
    user_id: req.user._id,
    packageId: packageId,
  };

  //2) get order price cart price  "check if copoun applied"
  let packagePrice = package.priceAfterDiscount
    ? package.priceAfterDiscount
    : package.price;

  //applying discount
  if (req.body.coupon) {
    const coupon = await Coupon.findOne({
      name: req.body.coupon,
      expire: { $gt: Date.now() },
    });
    if (!coupon) {
      return next(new ApiError("Coupon is Invalid or Expired "));
    }
    metadatainfo.coupon = req.body.coupon;
    packagePrice = (
      packagePrice -
      (packagePrice * coupon.discount) / 100
    ).toFixed(2);
  }

  const totalOrderPrice = Math.ceil(packagePrice + taxPrice);

  //3)- create coin base session
  const { Client } = coinbase;
  const { resources } = coinbase;
  try {
    Client.init(process.env.COINBASE_API_KEY);

    const session = await resources.Charge.create({
      name: "purchaseing package",
      description: "have a nice payment",
      local_price: {
        amount: totalOrderPrice,
        currency: "USD",
      },
      pricing_type: "fixed_price",
      metadata: metadatainfo,
    });
    //4) send session to response
    console.log(metadatainfo);
    res.status(200).json({ status: "success", session });
  } catch (error) {
    res.status(400).json({ error: error });
  }
});
