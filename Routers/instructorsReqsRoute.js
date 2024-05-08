const express = require("express");
const authServices = require("../services/authServices");
const {
  filterReqs,
  filterMyReq,
  uploadRequestPdfs,
  handleRequestsPdfs,
  getAllRequests,
  createRequest,
  getOne,
  deleteOne,
  canSendRequest,
  acceptRequest,
  rejectRequest,
} = require("../services/InstructorReqsService");

const router = express.Router();

router.use(authServices.protect);

router.get("/my-reqs", filterMyReq, getAllRequests);
router
  .route("/")
  .get(authServices.allowedTo("admin"), filterReqs, getAllRequests)
  .post(canSendRequest, uploadRequestPdfs, handleRequestsPdfs, createRequest);

router
  .route("/:id")
  .get(authServices.allowedTo("admin"), getOne)
  .delete(authServices.allowedTo("admin"), deleteOne);

router.route("/accept/:id").put(authServices.allowedTo("admin"), acceptRequest);

router.route("/reject/:id").put(authServices.allowedTo("admin"), rejectRequest);
module.exports = router;
