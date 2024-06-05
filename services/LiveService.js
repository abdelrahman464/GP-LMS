const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const Live = require("../models/LiveModel");
const Course = require("../models/courseModel");

const factory = require("./handllerFactory");
const sendEmail = require("../utils/sendEmail");

//---------------------------------------------------------------------------------------------------//
//@desc this filter lives based on time (8 days ago) and their privillage
exports.filterLives = async (req, res, next) => {
  let filterObject = {};
  // Calculate the date 8 days ago
  const eightDaysAgo = new Date();
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

  //1)-if user is admin
  // eslint-disable-next-line no-empty
  if (req.user.role === "admin") {
    return next();
  }
  //2)-if user is the instructor
  if (req.user.role === "instructor") {
    filterObject = {
      creator: req.user._id,
    };
  } else {
    //3)-get courses they are in and send in filter  3 conditions
    const courses = await Course.find({
      users: req.user._id,
    });

    if (courses.length === 0) {
      res.status(400).json({ msg: "you are not subscribed to any course" });
    }

    const coursesArray = courses.map((course) => course._id);
    filterObject.course = { $in: coursesArray };
  }

  req.filterObj = filterObject;
  // req.selectFields = "field1 field2"; // Add the desired fields to select
  return next();
};
//---------------------------------------------------------------------------------------------------//
//@desc this filter lives based on time (8 days ago) and their privillage
exports.searchBydateFilterObj = async (req, res, next) => {
  let filterObject = {};
  const { date } = req.params;
  const components = date.split(" ");
  //filter the date
  filterObject.day = components[2];
  filterObject.month = components[1];

  //1)-if user is admin
  // eslint-disable-next-line no-empty
  if (req.user.role === "admin") {
    return next();
  }
  //2)-if user is the instructor
  if (req.user.role === "instructor") {
    filterObject.creator = req.user._id;
  } else {
    //3)-get courses they are in and send in filter  3 conditions
    const courses = await Course.find({
      users: req.user._id,
    });
    if (courses.length == 0) {
      res.status(400).json({ msg: "you are not subscribed to any course" });
    }

    const coursesArray = courses.map((course) => course._id);
    filterObject.course = { $in: coursesArray };
  }

  req.filterObj = filterObject;
  // req.selectFields = "field1 field2"; // Add the desired fields to select
  return next();
};

//---------------------------------------------------------------------------------------------------//
exports.setCreatorIdToBody = (req, res, next) => {
  req.body.creator = req.user._id;
  return next();
};
//---------------------------------------------------------------------------------------------------//
// Create a new live
exports.createOne = factory.createOne(Live);
//---------------------------------------------------------------------------------//

// Get all lives
exports.getAll = factory.getALl(Live);
//---------------------------------------------------------------------------------//

// Get a specific live by ID
exports.getOne = factory.getOne(Live);
//---------------------------------------------------------------------------------//

// Update a live by ID
exports.updateOne = factory.updateOne(Live);
//---------------------------------------------------------------------------------//

// Delete a live  by ID
exports.deleteOne = factory.deleteOne(Live);

//---------------------------------------------------------------------------------//
exports.followLive = asyncHandler(async (req, res, next) => {
  const { liveId } = req.params;
  const live = await Live.findById(liveId);

  if (!live) {
    res.status(400).json({ message: "live not found" });
  }
  if (
    req.user.role !== "admin" &&
    live.creator.toString() !== req.user._id.toString()
  ) {
    const course = await Course.findOne({
      _id: live.course,
      users: req.user._id,
    });
    if (!course) {
      return res.status(400).json({
        status: "faild",
        msg: "you can't follow this live cause your not subscribed to it's course",
      });
    }
  }
  //loop over the array to check if any element is me
  const userIsFollower = live.followers.some(
    (follower) => follower.user.toString() === req.user._id.toString()
  );

  if (userIsFollower) {
    return res
      .status(400)
      .json({ message: "you have already followed this live" });
  }

  const newFollower = {
    user: req.user._id,
    email: req.user.email,
  };

  live.followers.push(newFollower);
  await live.save();

  return res.status(200).json({
    status: `success`,
    msg: "you have followed this live successfully",
  });
});
//<----------------------------------->//
exports.SendEmailsToLiveFollwers = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const live = await Live.findById(id);
  if (!live) {
    return next(ApiError("Live not found", 404));
  }

  try {
    const emailPromises = live.followers.map(async (follower) => {
      const emailMessage = req.body.info
        ? `Hi ${follower.email}\n The Live starts soon, be ready\n Here Is Some Information you might need\n ${req.body.info}`
        : `Hi ${follower.email}\n The Live starts soon, be ready`;

      await sendEmail({
        to: follower.email,
        subject: `Remember the live ${live.title}`,
        text: emailMessage,
      });
    });

    await Promise.all(emailPromises); // Wait for all email sending operations to complete

    return res.status(200).json({
      success: true,
      messgae: `email has been sent to all follwers of this live`,
    });
  } catch (err) {
    return next(
      new ApiError(`There is a problem with sending emails ${err}`, 500)
    );
  }
});
//---------------------------------------------------------------------------------//
exports.filterFollowedBydate = asyncHandler(async (req, res, next) => {
  let filterObject = {};

  const eightDaysAgo = new Date();
  eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

  const { date } = req.params;
  if (date) {
    const components = date.split(" ");
    filterObject = {
      day: components[2],
      month: components[1],
      "followers.user": req.user._id,
    };
  } else {
    filterObject = {
      "followers.user": req.user._id,
    };
  }
  filterObject.updatedAt = { $gte: eightDaysAgo };

  req.body.filterObj = filterObject;
  next();
});

//---------------------------------------------------------------------------------//
exports.myFollowedLives = asyncHandler(async (req, res) => {
  console.log(req.body.filterObj);
  const lives = await Live.find(req.body.filterObj);

  if (lives.length === 0) {
    res
      .status(200)
      .json({ status: "faild", msg: "you didn't follow any live" });
  } else {
    res.status(200).json({ status: "success", data: lives });
  }
});
//--------------------------------------------------------------------------------------
exports.searchByDate = asyncHandler(async (req, res) => {
  let filterObject = {};
  const { date } = req.params;
  // Split the URL-encoded date string by %
  // Split the decoded date string by '%'
  const dateComponents = date.split("-");

  console.log(dateComponents);
  // Extract the day (first component) and month (second component)
  filterObject.day = dateComponents[2];
  filterObject.month = dateComponents[1];

  //1)-if user is admin
  // eslint-disable-next-line no-empty
  if (req.user.role === "admin") {
  }
  //2)-if user is the instructor
  else if (req.user.role === "instructor") {
    filterObject.creator = req.user._id;
  } else {
    //3)-get courses they are in and send in filter  3 conditions
    const courses = await Course.find({
      users: req.user._id,
    });
    if (courses.length == 0) {
      res.status(400).json({ msg: "you are not subscribed to any course" });
    }

    const coursesArray = courses.map((course) => course._id);
    filterObject.course = { $in: coursesArray };
  }

  const lives = await Live.find(filterObject);
  if (lives.length === 0) {
    return res
      .status(400)
      .json({ status: "faild", msg: "There are no lives for that date" });
  } else {
    return res.status(400).json({ status: "success", data: lives });
  }
});
//---------------------------------------------------------------------------------//
exports.createLiveObj = asyncHandler(async (req, res, next) => {
  const { date } = req.body;
  if (date) {
    req.body.day = date.split("-")[2];
    req.body.month = date.split("-")[1];
    return next();
  }
  return next();
});
