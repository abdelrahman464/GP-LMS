const express = require("express");
const authServices = require("../services/authServices");

const {
  filterLives,
  createOne,
  getAll,
  getOne,
  updateOne,
  deleteOne,
  followLive,
  SendEmailsToLiveFollwers,
  searchBydateFilterObj,
  setCreatorIdToBody,
  searchByDate,
  createLiveObj,
  filterFollowedBydate,
  myFollowedLives,
} = require("../services/LiveService");
// Validation
const {
  checkLiveAuthority,
  createLiveValidator,
  updateLiveValidator,
} = require("../utils/validators/liveValidator");

const router = express.Router();

//create   admin  instructor of course
//update delete admin instructorof course
//send emails to students
router.get(
  "/myFollowedLives/:date?",
  authServices.protect,
  filterFollowedBydate,
  myFollowedLives
);
//will return all livesm for admin , instructor's courses and user subscribed to
router.get("/", authServices.protect, filterLives, getAll);

router.get(
  "/searchByDate/:date",
  authServices.protect,
  searchBydateFilterObj,
  searchByDate
);

router
  .route("/") //middleware
  .post(
    authServices.protect,
    authServices.allowedTo("instructor"),
    createLiveValidator,
    setCreatorIdToBody,
    createLiveObj,
    createOne
  );

router
  .route("/sendEmailsToFollowers/:id")
  .post(
    authServices.protect,
    authServices.allowedTo("instructor", "admin"),
    checkLiveAuthority,
    SendEmailsToLiveFollwers
  );

router
  .route("/:id")
  .get(authServices.protect, checkLiveAuthority, getOne)
  .put(
    authServices.protect,
    authServices.allowedTo("instructor", "admin"),
    checkLiveAuthority,
    updateLiveValidator,
    createLiveObj,
    updateOne
  )
  .delete(
    authServices.protect,
    authServices.allowedTo("instructor", "admin"),
    checkLiveAuthority,
    deleteOne
  );

//follow a specific live
router.put(
  "/followLive/:liveId",
  authServices.protect,
  authServices.allowedTo("user", "admin"),
  followLive
);

//          middleware-> link

module.exports = router;
