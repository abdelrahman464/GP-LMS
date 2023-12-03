const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "order must be belong to user"],
    },
    taxPrice: {
      type: Number,
      default: 0,
    },
    totalOrderPrice: {
      type: Number,
    },
    paymentMethodType: {
      type: String, 
    },
    coupon: {
      type: String, 
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
  },
  { timestamp: true }
);
OrderSchema.pre(/^find/, function (next) {
  this.populate({ path: "user", select: "username phone email " })
  next();
});
module.exports = mongoose.model("Order", OrderSchema);
