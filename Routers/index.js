const userRoute = require("./UserRoute");
const authRoute = require("./AuthRoute");
const chatRoute = require("./ChatRoute");
const MessageRoute = require("./MessageRoute");
const NotificationRoute = require("./notificationRoute");

const PostRoute = require("./postRoute");
const PostCommentRoute = require("./postCommentRoute");
const PostReactRoute = require("./postReactRoute");


const CouponRoute = require("./couponRoute");
const ReviewRoute = require("./reviewRoute");
const CategoryRoute = require("./categoryRoute");
const CourseRoute = require("./courseRoute");
const LessonRoute = require("./lessonRoute");
const OrderRoute = require("./OrderRoute");
const LiveRoute = require("./LiveRoute");

const mountRoutes = (app) => {
  // Mount Routes
  app.use("/api/v1/users", userRoute);
  app.use("/api/v1/auth", authRoute);
  app.use("/api/v1/chat", chatRoute);
  app.use("/api/v1/message", MessageRoute);
  app.use("/api/v1/notification", NotificationRoute);

  
  app.use("/api/v1/coupons", CouponRoute);
  app.use("/api/v1/reviews", ReviewRoute);
  app.use("/api/v1/categories", CategoryRoute);
  app.use("/api/v1/courses", CourseRoute);
  app.use("/api/v1/lessons", LessonRoute);
  app.use("/api/v1/orders", OrderRoute);
  app.use("/api/v1/lives", LiveRoute);

  app.use("/api/v1/posts", PostRoute);
  app.use("/api/v1/postComments", PostCommentRoute);
  app.use("/api/v1/postReacts", PostReactRoute);
};
module.exports = mountRoutes;
