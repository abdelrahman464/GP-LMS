const express = require("express");
const passport = require("passport");

const {
  signupValidator,
  loginValidator,
} = require("../utils/validators/authValidator");
const {
  signup,
  login,
  forgotPassword,
  verifyPassResetCode,
  resetPassword,
} = require("../services/authServices");

const router = express.Router();

// Route to start the authentication process
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback route that Google will redirect to after authentication
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }), // Disable sessions
  (req, res) => {
    // Assuming your strategy attaches the JWT to the user object
    if (req.user && req.user.token) {
      // Redirect the user or send the token directly
      // Example: Redirect with the token in query params
      res.redirect(`/your-success-page?token=${req.user.token}`);
    } else {
      res.redirect("/login?error=authenticationFailed");
    }
  }
);

router.route("/signup").post(signupValidator, signup);
router.route("/login").post(loginValidator, login);
router.route("/forgotPassword").post(forgotPassword);
router.route("/verifyResetCode").post(verifyPassResetCode);
router.route("/resetPassword").put(resetPassword);

module.exports = router;
