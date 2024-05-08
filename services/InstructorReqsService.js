const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const asyncHandler = require("express-async-handler");
const InstructorsReq = require("../models/instructorsReqsModel");
const factory = require("./handllerFactory");
const sendEmail = require("../utils/sendEmail");
const ApiError = require("../utils/apiError");
const User = require("../models/userModel");

const { uploadMixOfImages } = require("../middlewares/uploadImageMiddleware");
// const { all } = require("../../routes/marketing/marktingReqsRoute");

exports.filterReqs = asyncHandler(async (req, res, next) => {
  req.filterObj = { status: req.query.status || "pending" };
  next();
});
exports.filterMyReq = asyncHandler(async (req, res, next) => {
  req.filterObj = { user: req.user._id };
  return next();
});
//----------------------------------------------------------------
exports.uploadRequestPdfs = uploadMixOfImages([
  {
    name: "cv",
    maxCount: 1,
  },
  {
    name: "identity",
    maxCount: 1,
  },
]);
//----------------------------------------------------------------
//image processing
exports.handleRequestsPdfs = asyncHandler(async (req, res, next) => {
  //cv
  if (req.files.cv) {
    const pdfFile = req.files.cv[0];
    const pdfFileName = `marketingReq-cv-${uuidv4()}-${Date.now()}.pdf`;
    const pdfPath = `uploads/instructor-reqs/cv/${pdfFileName}`;
    // Save the PDF file using fs
    fs.writeFileSync(pdfPath, pdfFile.buffer);
    // Save PDF into our db
    req.body.cv = pdfFileName;
  }
  // if (req.files.identity) {
  //   const File = req.files.identity[0];
  //   const FileName = `marketingReq-identity-${uuidv4()}-${Date.now()}.pdf`;
  //   const filePath = `uploads/marketing/identities/${FileName}`;
  //   // Save the PDF file using fs
  //   fs.writeFileSync(filePath, File.buffer);
  //   // Save PDF into our db
  //   req.body.identity = FileName;
  // }
  next();
});
//--------------------------------------------------------------------------------------------
exports.canSendRequest = async (req, res, next) => {
  const request = await InstructorsReq.findOne({
    user: req.user._id,
  });
  // return res.json(withdrawRequest)

  if (!request) {
    return next();
  }
  if (request.status === "pending") {
    return res.status(400).json({
      status: "faild",
      msg: "your request is pending , wait till admin review your request ",
    });
  }
  if (request.status === "rejectd") {
    return res
      .status(400)
      .json({ status: "faild", msg: "your request was rejected " });
  }
  if (request.status === "accepted") {
    return res.status(400).json({
      status: "faild",
      msg: "your request was accepted successfully",
    });
  }
  next();
};

//---------------------------------------------------------------------------------------------------//
// Create a new MarketingRequests
exports.createRequest = async (req, res) => {
  // return res.json(req.body);
  // Parse the date string to convert it into the Date data type
  const dateParts = req.body.birthDate.split("/"); // Assuming date format is day/month/year
  const formattedDate = new Date(
    `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
  );

  req.body.user = req.user._id;
  req.body.birthDate = formattedDate;
  const request = await InstructorsReq.create(req.body);
  return res.status(200).json({ status: `success`, date: request });
};
//---------------------------------------------------------------------------------//
// Get all MarketingRequests
exports.getAllRequests = factory.getALl(InstructorsReq);
//---------------------------------------------------------------------------------//
// Get a specific MarketingRequests by ID
exports.getOne = factory.getOne(InstructorsReq);
//---------------------------------------------------------------------------------//
// Delete a MarketingRequests  by ID
exports.deleteOne = factory.deleteOne(InstructorsReq);
//---------------------------------------------------------------------------------//
// Update a MarketingRequests by ID
exports.acceptRequest = async (req, res, next) => {
  const { id } = req.params;

  //get user marketLog and update his role
  const request = await InstructorsReq.findOneAndUpdate(
    { _id: id },
    { status: "accepted" }
  );
  if (!request) {
    return next(new ApiError(`Reuest Not Found`, 404));
  }
  console.log(request);
  //SEND EMAIL TO   MarketRequest.user Telling him he he been marketer
  const requestOwner = await User.findOneAndUpdate(
    { _id: request.user._id },
    { role: "instructor" }
  );
  console.log(requestOwner);
  try {
    const emailMessage = `Hi ${requestOwner.name}, 
                          \n your request to be a marketer has been accepted by the admin
                          \n your request to be a marketer has been accepted by the admin
                          \n please login to your account to see your new role
                          \n the new-normal Team`;

    await sendEmail({
      to: requestOwner.email,
      subject: "Your Request To Be An Instructor Has Been Accepted",
      text: emailMessage,
    });
  } catch (err) {
    return next(
      new ApiError("there is a problem with sending Email to the user ", 500)
    );
  }
  return res.status(200).json({ status: "status updated successfully" });
};
//---------------------------------------------------------------------------------//
// reject a MarketingRequests by ID
exports.rejectRequest = async (req, res, next) => {
  const { id } = req.params;

  //get user marketLog and update his role
  const request = await InstructorsReq.findOneAndUpdate(
    { _id: id },
    { status: "reject" }
  );

  if (!request) {
    return next(new ApiError(`Reuest Not Found`, 404));
  }
  //SEND EMAIL TO   MarketRequest.user Telling him he he been marketer
  const requestOwner = await User.findById(requestOwner.user._id);
  try {
    const emailMessage = `Hi ${requestOwner.name}, 
                          \n unfortunately 
                          \n your request to be an instructor has been rejected by the admin
                          \n please try again later`;

    await sendEmail({
      to: requestOwner.email,
      subject: "Your Request To Be An instructor Has Been Rejected",
      text: emailMessage,
    });
  } catch (err) {
    return next(
      new ApiError("there is a problem with sending Email to the user ", 500)
    );
  }

  return res.status(200).json({ status: "status was rejected successfully" });
};
