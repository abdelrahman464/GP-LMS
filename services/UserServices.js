const bcrypt = require("bcryptjs");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const factory = require("./handllerFactory");
const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const UserAuthorization = require("../middlewares/userAuthorizationMiddleware");

//upload Singel image
exports.uploadProfileImage = uploadSingleImage("profileImg");

//image processing
exports.resizeImage = asyncHandler(async (req, res, next) => {
  const filename = `user-${uuidv4()}-${Date.now()}.jpeg`;

  if (req.file) {
    await sharp(req.file.buffer)
      .toFormat("jpeg")
      .jpeg({ quality: 98 })
      .toFile(`uploads/users/${filename}`);

    //save image into our db
    req.body.profileImg = filename;
  }

  next();
});

//@desc get list of user
//@route GET /api/v1/users
//@access private
exports.getUsers = factory.getALl(User);

//@desc get specific User by id
//@route GET /api/v1/User/:id
//@access private
exports.getUser = factory.getOne(User);

//@desc create user
//@route POST /api/v1/users
//@access private
exports.createUser = factory.createOne(User);

//@desc update specific user
//@route PUT /api/v1/user/:id
//@access private
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
      profileImg: req.body.profileImg,
      role: req.body.role,
    },
    {
      new: true,
    }
  );
  if (!user) {
    return next(new ApiError(`No document For this id ${req.params.id}`, 404));
  }

  res.status(200).json({ data: user });
});

exports.changeUserPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );
  if (!user) {
    return next(new ApiError(`No document For this id ${req.params.id}`, 404));
  }
  res.status(200).json({ data: user });
});

//@desc delete User
//@route DELETE /api/v1/user/:id
//@access private
exports.deleteUser = factory.deleteOne(User);

//@desc get logged user data
//@route GET /api/v1/user/getMe
//@access private/protect
exports.getLoggedUserData = asyncHandler(async (req, res, next) => {
  // i will set the req,pararms.id because i will go to the next middleware =>>> (getUser)
  req.params.id = req.user._id;
  next();
});

//@desc update logged user password
//@route PUT /api/v1/user/changeMyPassword
//@access private/protect
exports.updateLoggedUserPassword = asyncHandler(async (req, res, next) => {
  //update user password passed on user payload (req.user._id)
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      password: await bcrypt.hash(req.body.password, 12),
      passwordChangedAt: Date.now(),
    },
    {
      new: true,
    }
  );
  //genrate token
  const token = generateToken(req.user._id);

  res.status(200).json({ data: user, token });
});

//@desc update logged user data without updating password or role
//@route PUT /api/v1/user/changeMyData
//@access private/protect
exports.updateLoggedUserData = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
      profileImg: req.body.profileImg,
    },
    {
      new: true,
    }
  );
  res.status(200).json({ data: user });
});

// @desc    Deactivate Logged user
// @route   PUT /api/v1/users/deActiveMe
// @access  Private/protected
exports.deActiveLoggedUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({ status: "success" });
});

// @desc    Activate Logged user
// @route   PUT /api/v1/users/activeMe
// @access  Private/protected
exports.activeLoggedUser = asyncHandler(async (req, res, next) => {
  const userAuthorization = new UserAuthorization();

  const token = userAuthorization.getToken(req.headers.authorization);
  const decoded = userAuthorization.tokenVerifcation(token);
  const currentUser = await userAuthorization.checkCurrentUserExist(decoded);
  // console.log(currentUser);
  if (!currentUser.active) {
    // return next(new ApiError("Your Account is already active", 400));
    await User.findByIdAndUpdate(currentUser._id, { active: true });

    res.status(200).json({ data: "Your account has been activated" });
  }

  // await User.findByIdAndUpdate(currentUser._id, { active: true });

  // res.status(200).json({ data: "Your account has been activated" });
});
