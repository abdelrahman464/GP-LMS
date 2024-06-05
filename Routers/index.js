const userRoute = require("./UserRoute");
const authRoute = require("./AuthRoute");
const ChatRoute = require("./ChatRoute");
const MessageRoute = require("./MessageRoute");
const notificationRoute = require("./notificationRoute");

const PostRoute = require("./postRoute");
const PostCommentRoute = require("./postCommentRoute");
const PostReactRoute = require("./postReactRoute");

const CouponRoute = require("./couponRoute");
const ReviewRoute = require("./reviewRoute");
const CategoryRoute = require("./categoryRoute");
const CourseRoute = require("./courseRoute");
const LessonRoute = require("./lessonRoute");
const sectionRoute = require("./sectionRoute");
const OrderRoute = require("./OrderRoute");

const InstructorRoute = require("./instructorsReqsRoute");

const LiveRoute = require("./LiveRoute");

const mountRoutes = (app) => {
  // Mount Routes
  app.use("/api/v1/users", userRoute);
  app.use("/api/v1/auth", authRoute);

  app.use("/api/v1/coupons", CouponRoute);
  app.use("/api/v1/reviews", ReviewRoute);
  app.use("/api/v1/categories", CategoryRoute);
  app.use("/api/v1/courses", CourseRoute);
  app.use("/api/v1/lessons", LessonRoute);
  app.use("/api/v1/sections", sectionRoute);
  app.use("/api/v1/orders", OrderRoute);

  app.use("/api/v1/posts", PostRoute);
  app.use("/api/v1/postComments", PostCommentRoute);
  app.use("/api/v1/postReacts", PostReactRoute);

  app.use("/api/v1/instructorsReqs", InstructorRoute);

  app.use("/api/v1/chats", ChatRoute);
  app.use("/api/v1/messages", MessageRoute);
  app.use("/api/v1/notifications", notificationRoute);
  app.use("/api/v1/lives", LiveRoute);
};
module.exports = mountRoutes;
