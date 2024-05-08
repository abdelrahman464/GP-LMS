const mongoose = require("mongoose");

const InstructorsReqsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    fullName: {
      type: String,
    },
    country: {
      type: String,
    },
    city: {
      type: String,
    },
    birthDate: {
      type: Date,
    },
    currentWork: {
      type: String,
    },
    ansOfQuestion: {
      type: String,
    },
    sampleOfWork: {
      type: String,
    },
    cv: {
      //pdf uploading
      type: String,
    },
    status: {
      type: String,
      enum: ["accepted", "rejected", "pending"],
      default: "pending",
    },
  },
  { timestamps: true }
);

InstructorsReqsSchema.pre(/^find/, function (next) {
  // this => query
  this.populate({ path: "user", select: "name email profileImg" });
  next();
});
//----------------------------------------------------------------
const setImageURL = (doc) => {
  if (doc.cv) {
    doc.cv = `${process.env.BASE_URL}/instructor-reqs/cv/${doc.cv}`;
  }
};
//after initializ the doc in db
// check if the document contains image
// it work with findOne,findAll,update
InstructorsReqsSchema.post("init", (doc) => {
  setImageURL(doc);
});
// it work with create
InstructorsReqsSchema.post("save", (doc) => {
  setImageURL(doc);
});

const InstructorsReq = mongoose.model("InstructorsReqs", InstructorsReqsSchema);

module.exports = InstructorsReq;
