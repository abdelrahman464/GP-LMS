const mongoose = require("mongoose");

const userShcema = mongoose.Schema(
  {
    invitor:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default:null
    },
    startMarketing: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      trim: true,
      required: [true, "name required"],
    },
    email: {
      type: String,
      required: [true, "email required"],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "password required"],
      minlength: [8, "too short Password"],
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "instractor", "admin"],
      default: "user",
    },
    profileImg: String,
    about: String,
    country: String,

  },
  { timestamps: true }
);
userShcema.pre("save", async function (next) {
  //if password field is not modified go to next middleware
  if (!this.isModified("password")) return next();
  // Hashing user password
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const setProfileImageURL = (doc) => {
  //return image base url + iamge name
  if (doc.profileImg) {
    const profileImageUrl = `${process.env.BASE_URL}/users/${doc.profileImg}`;
    doc.profileImg = profileImageUrl;
  }
};
//after initializ the doc in db
// check if the document contains image
// it work with findOne,findAll,update
userShcema.post("init", (doc) => {
  setProfileImageURL(doc);
});
// it work with create
userShcema.post("save", (doc) => {
  setProfileImageURL(doc);
});
const User = mongoose.model("User", userShcema);
module.exports = User;
