const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");
const Package = require("../models/packageModel");
const User = require("../models/userModel");
const factory = require("./handllerFactory");
const { checkCourseAuthority } = require("./courseService");

const {
  uploadSingleImage,
} = require("../middlewares/uploadImageMiddleware");

//upload Singel image
exports.uploadPackageImage = uploadSingleImage("image");
//image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `package-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat("jpeg")
      .jpeg({ quality: 95 })
      .toFile(`uploads/education/packages/${filename}`);

    //save image into our db
    req.body.image = filename;
  }

  next();
});

exports.convertToArray = async (req, res, next) => {
  if (req.body.courses) {
    // If it's not an array, convert it to an array
    if (!Array.isArray(req.body.courses)) {
      req.body.courses = [req.body.courses];
    }
  }
  next();
};
// Create a new package
exports.createPackage = factory.createOne(Package);
// Get all packages
exports.getAllPackages = factory.getALl(Package);
// Get a specific package by ID
exports.getPackageById = factory.getOne(Package, "courses");
// Update a package by ID
exports.updatePackage = factory.updateOne(Package);
// Delete a package by ID
exports.deletePackage = factory.deleteOne(Package);

exports.addCourseToPlan = asyncHandler(async (req, res) => {
  const { planId, courseId } = req.body;

  const plan = await Package.findById(planId);

  if (!plan) {
    res.status(400).json({ status: `no package for that id: ${planId}` });
  }
  // Add the courseId to the courses array
  plan.courses.push(courseId);

  await plan.save();

  res.status(200).json({ status: "success" });
});

// to be done when user purchase a package
//old version
exports.addCourseToPlan = asyncHandler(async (req, res) => {
  const { planId, courseId } = req.body;

  const plan = await Package.findById(planId);

  if (!plan) {
    res.status(400).json({ status: `no package for that id: ${planId}` });
  }
  // Add the courseId to the courses array
  plan.courses.push(courseId);

  await plan.save();

  res.status(200).json({ status: "success" });
});

// to be done when user purchase a package
//old version
exports.addUserToPlan = asyncHandler(async (req, res) => {
  const { planId,userEmail } = req.body; 
  const plan = await Package.findById(planId);

  if (!plan) {
    res.status(400).json({ status:`faild`, msg:`no package for that id: ${planId}` });
  }
  const user = await User.findOne({ email: userEmail });
  
  if (!user) {
    res.status(400).json({ status:`faild`, msg:`no user for that email: ${userEmail}` });
  }
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.expirationTime);
  // Add the user object to the users array
  const newUser = {
    user: user._id,
    start_date: startDate,
    end_date: endDate,
  };

  plan.users.push(newUser);

  await plan.save();

  res.status(200).json({ status: "success", data: `user has been added successfully` });
});
//-------------------------------------------------------------------------------------------------------------//
exports.removeUserFromPlan = asyncHandler(async (req, res) => {
  const { planId, userEmail } = req.body;
  
  try {
    const plan = await Package.findById(planId);
  
    if (!plan) {
      return res.status(400).json({ status: "failed", msg: `No package for that id: ${planId}` });
    }
  
    const user = await User.findOne({ email: userEmail });
  
    if (!user) {
      return res.status(400).json({ status: "failed", msg: `No user for that email: ${userEmail}` });
    }
    
    // Find the index of the user in the users array and remove it
    const userIndex = plan.users.findIndex(u => u.user.toString() === user._id.toString());
    if (userIndex !== -1) {
      plan.users.splice(userIndex, 1);
      await plan.save();
       res.status(200).json({ status: "success", data: `User has been removed from the package successfully` });
    } else {
       res.status(400).json({ status: "failed", msg: `User is not associated with this package` });
    }
  } catch (error) {
    // eslint-disable-next-line prefer-template
    return res.status(500).json({ status: "error", msg: "An error occurred while processing the request "+ error });
  }
});

// lessons courses
//middleware to check user Authority to courses
exports.checkAuthority = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { courseId } = req.params;

  const package = await Package.findOne(
    {
      courses: { $in: [courseId] },
      "users.user": userId,
    },
    {
      "users.$": 1, // Select only the matched user object
    }
  );

  if (!package) {
    //course    user
    //check whether has access on courses
    checkCourseAuthority(req, res, next);

    return res.status(403).json({ error: "Access denied" }); //Api Error
  }
  // res.json(package)
  const user = package.users[0];
  const bool =
    new Date(user.start_date).getTime() < new Date(user.end_date).getTime();

  if (!bool) {
    // User's start date is not valid, delete the user object from the users array
    await Package.updateOne(
      { _id: package._id }, // Identify the document by its unique identifier
      { $pull: { users: { _id: user._id } } } // Specify the field and the element to remove
    );

    res.status(403).json({ error: "your subscription expired " });
  } else {
    // User has authority, proceed to the next middleware
    next();
  }
});

//-------------------------------------------------------------------------
exports.getMyPackages = asyncHandler(async (req, res) => {
  const packages = await Package.find({
    "users.user": req.user._id,
  });

  if (packages.length === 0) {
    res.json({ message: "you are not subscribed to any package" });
  } else {
    res.status(200).json({ packages });
  }
});

// exports.checkCourseAuthority=asyncHandler(async(req,res,next)=>{
//   try {
//   const userId=req.user.id;
//   const planId = req.user.plan;
//   const courseId=req.params.courseId;

//  const package = await Package.findOne({
//       courses: { $in: [courseId] },
//       'users.user': userId,
//       'users.end_date': {  $lt: new Date() }
//     });
//     if (!package) {
//       return res.status(403).json({ error: 'Access denied' });
//     }

//     next();
//   }catch (error) {
//     res.status(500).json({ error: 'An error occurred' });
//   }

// })

// const checkCourseAuthority2 = async (req, res, next) => {
//   const userId = req.user.id;
//   const { courseId } = req.params;

// const course = await Course.findOne(
//     {
//       _id: courseId,
//       "users.user": userId,
//     },
//     {
//       "users.$": 1, // Select only the matched user object
//     }
//   );

//   if (!course) {
//     //check whether has access on courses
//     res.json({ msg: "not allowed" });
//   }
//   // res.json(package)
//   next();
// };

// exports.checkCourseAuthority = () =>
//   asyncHandler(async (req, res, next) => {
//     const userId = req.user.id;
//     const { courseId } = req.params;

//     const course = await Course.findOne(
//       {
//         _id: courseId,
//         "users.user": userId,
//       },
//       {
//         "users.$": 1, // Select only the matched user object
//       }
//     );

//     if (!course) {
//       //check whether has access on courses
//       res.json({ msg: "not allowed" });
//     }
//     // res.json(package)
//     next();
//   });
//<,--------------------------------.>
exports.addTelgramIdToUserInPackage = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // Replace this with the ID of the user you want to update
  const { telgramId } = req.body; // Replace this with the Telegram ID to be added

  const existUser = await Package.findOne({
    "users.user": id,
    "users.telgramId": telgramId,
  });
  if (existUser) {
    res.status(400).json({status:"faild",msg:`User already exists`});
  } else {
    // Use findOneAndUpdate to update the telegram_id for the specific user
    const filter = { "users.user": id }; // Find the document that contains the user with the given ID in the users array
    const update = { $set: { "users.$.telgramId": telgramId } }; // Update the telegram_id for the matched user

    // Set the new option to true to get the updated document as the result of the update operation
    const options = { new: true };

    // Perform the update operation
    const updatedPackage = await Package.findOneAndUpdate(
      filter,
      update,
      options
    );

    if (updatedPackage) {
      res.status(200).json({status:"success",msg:`Telegram ID updated for user with ID ${id}`});
    } else {
      
      res.status(400).json({status:"faild",msg:`User with ID ${id} not found in the package`});
    }
  }
});
//<,--------------------------------.>
//<,--------------------------------.>
//<,--------------------------------.>
//<,--------------------------------.>
exports.getMyChannels = asyncHandler(async (req, res, next) => {
  const { telegramId } = req.params;

  const packages = await Package.find({
    "users.telgramId": telegramId,
  });
  

  if (packages.length === 0) {
    res.json({status:"faild",message: "you are not subscribed to any package" });
  } else {
    // Extract all telegramChannelNames from the array of objects
    const allTelegramChannelNames =await packages.flatMap(
      (item) => item.telegramChannelNames
    );
    if (allTelegramChannelNames.includes("*")) {
      res.json({ channels: "*" });
    } else {
      // if(allTelegramChannelNames)
      res.json({ channels: allTelegramChannelNames });
    }
  }
});
