const express = require("express");
const authServices = require("../services/authServices");
const {
  findSpecificOrder,
  findAllOrders,
  filterOrderForLoggedUser,
  checkoutSession,
} = require("../services/OrderService");

const router = express.Router();

router.use(authServices.protect);

router.put(
  "/checkout-session/:courseId",
  authServices.protect,
  authServices.allowedTo("user", "instructor","admin"),
  checkoutSession
);
router
  .route("/")
  .get(
    authServices.allowedTo("user", "admin", "instructor"),
    filterOrderForLoggedUser,
    findAllOrders
  );
router.route("/:id").get(authServices.allowedTo("admin"), findSpecificOrder);
module.exports = router;
