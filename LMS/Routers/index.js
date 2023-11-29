const userRoute = require("./UserRoute");
const authRoute = require("./AuthRoute");
const chatRoute = require("./ChatRoute");
const MessageRoute = require("./MessageRoute");

const mountRoutes = (app) => {
  // Mount Routes
  app.use("/api/v1/users", userRoute);
  app.use("/api/v1/auth", authRoute);
  app.use("/api/v1/chat", chatRoute);
  app.use("/api/v1/message", MessageRoute);
};
module.exports = mountRoutes;
