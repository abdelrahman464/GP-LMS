const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const Live = require("../models/liveModel");
const Package = require("../models/packageModel");
const factory = require("./handllerFactory");
const sendEmail = require("../utils/sendEmail");

//---------------------------------------------------------------------------------------------------//
//@desc this filter lives based on time (8 days ago) and their privillage
exports.createFilterObj = async (req, res, next) => {
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
    const package = await Package.findOne({
      "users.user": req.user._id,
      "users.end_date": { $gt: new Date() },
    });
    if (!package) {
      res.status(400).json({ msg: "no lives for you" });
    }

    // eslint-disable-next-line no-empty
    else if (package.allCourses === true) {
    } else {
      const coursesArray = package.courses.map((courseId) => courseId);
      filterObject.course = { $in: coursesArray };
    }
  }
  // Filter by date range (updated_at >= eightDaysAgo and updated_at <= current date)
  filterObject.updatedAt = { $gte: eightDaysAgo };

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
    const package = await Package.findOne({
      "users.user": req.user._id,
      "users.end_date": { $gt: new Date() },
    });
    if (!package) {
      res.status(400).json({ msg: "no lives for you" });
    }

    // eslint-disable-next-line no-empty
    else if (package.allCourses === true) {
    } else {
      const coursesArray = package.courses.map((courseId) => courseId);
      filterObject.course = { $in: coursesArray };
    }
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
exports.createLive = factory.createOne(Live);
//---------------------------------------------------------------------------------//

// Get all lives
exports.getAllLives = factory.getALl(Live);
//---------------------------------------------------------------------------------//

// Get a specific live by ID
exports.getLivebyId = factory.getOne(Live);
//---------------------------------------------------------------------------------//

// Update a live by ID
exports.updateLive = factory.updateOne(Live);
//---------------------------------------------------------------------------------//

// Delete a live  by ID
exports.deleteLive = factory.deleteOne(Live);

//---------------------------------------------------------------------------------//
exports.followLive = asyncHandler(async (req, res, next) => {
  const { liveId } = req.params;
  const live = await Live.findById(liveId);

  if (!live) {
    res.status(400).json({ message: "live not found" });
  }
  //loop over the array to check if any element is me
  const userIsFollower = live.followers.some(
    (follower) => follower.user.toString() === req.user._id.toString()
  );

  if (userIsFollower) {
    res.status(400).json({ message: "you have already followed this live" });
  }

  const newFollower = {
    user: req.user._id,
    email: req.user.email,
  };

  live.followers.push(newFollower);
  await live.save();

  res.status(200).json({ succes: "true" });
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
  console.log("date: ", date);
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
  console.log(req.body.filterObj);
  console.log(filterObject);
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
    const package = await Package.findOne({
      "users.user": req.user._id,
      "users.end_date": { $gt: new Date() },
    });
    if (!package) {
      return res.status(400).json({ msg: "no lives for you" });
    }

    // eslint-disable-next-line no-empty
    else if (package.allCourses === true) {
    } else {
      const coursesArray = package.courses.map((courseId) => courseId);
      filterObject.course = { $in: coursesArray };
    }
  }
  console.log(filterObject)

  const lives = await Live.find(filterObject);
  if (lives.length === 0) {
    return res
      .status(400)
      .json({ status: "faild", msg: "there are no lives for that date" });
  } else {
    return res.status(400).json({ status: "success", data: lives });
  }
});
//---------------------------------------------------------------------------------//
exports.createLiveObj = asyncHandler(async (req, res, next) => {
  const { date } = req.body;
  if (date) {
    req.body.day = date.split(" ")[2];
    req.body.month = date.split(" ")[1];
    return next();
  }
  return next();
});
