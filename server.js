/* eslint-disable arrow-body-style */
/* eslint-disable import/no-extraneous-dependencies */
const http = require("http");
const path = require("path");
const passport = require("passport");
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const axios = require("axios");
const ApiError = require("./utils/apiError");
const globalError = require("./middlewares/errorMiddleware");
const { webhookCheckout } = require("./services/OrderService");
// eslint-disable-next-line import/newline-after-import
const Course = require("./models/courseModel");
dotenv.config({ path: "config.env" });

const dbConnection = require("./config/database");
const mountRoutes = require("./Routers");

const socketIOServer = require("./socket/socketio-server");

//connect with database
dbConnection();
mongoose.set("strictQuery", false);

const app = express();

const CompleteServer = http.createServer(app);

// Integrate Socket.IO with the HTTP server
socketIOServer.attach(CompleteServer);
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.options("*", cors());
app.use(compression());
app.use(passport.initialize());

app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  webhookCheckout
);

app.use(
  express.json({
    limit: "250kb",
  })
);
app.use(express.static(path.join(__dirname, "uploads")));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(process.env.NODE_ENV);
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message:
    "Too many requests created from this IP, please try again after a 15-minute interval",
});
app.use("/api", limiter);

app.get("/get-recommendations", async (req, res, next) => {
  try {
    const courseTitle = req.query.course_title;
    const numRecommendations = req.query.number_of_recommendation || 5;

    const response = await axios.get("http://localhost:5000/api/v1/recommend", {
      params: {
        course_title: courseTitle,
        number_of_recommendation: numRecommendations,
      },
    });

    // Use Promise.all to await all the Course.findOne calls
    const data = await Promise.all(
      response.data.map(async (course) => {
        return await Course.findOne({ title: course });
      })
    );

    res.json(data);
  } catch (error) {
    next(
      new ApiError(`Failed to fetch recommendations: ${error.message}`, 500)
    );
  }
});

mountRoutes(app);

app.all("*", (req, res, next) => {
  next(new ApiError(`Cannot Find This Route ${req.originalUrl}`, 400));
});

app.use(globalError);

const PORT = process.env.PORT || 1700;
const server = CompleteServer.listen(PORT, () => {
  console.log(`App running on ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error(`UnhandledRejection Errors: ${err.name} | ${err.message}`);
  server.close(() => {
    console.log("Shutting Down...");
    process.exit(1);
  });
});
