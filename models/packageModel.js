const mongoose = require("mongoose");

const PackageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  sold: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: [true, "Package price is required"],
    trim: true,
    max: [200000, "Too long Package price"],
  },
  priceAfterDiscount: {
    type: Number,
    trim: true,
    max: [200000, "Too long Package priceAfterDiscount"],
  },
  expirationTime: {
    //0  //30   //  //expirtaioInDays
    type: Number,
    required: [true, "expirationTime required"],
  },
  image: String,

  courses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  allCourses: {
    type: Boolean,
    default: false,
  },
  telegramChannelNames: [
    {
      type: String,
    },
  ],
  users: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      telgramId: String,
      start_date: {
        type: Date,
        required: true,
      },
      end_date: {
        type: Date,
        required: true,
      },
    },
  ],
});

const setImageURL = (doc) => {
  //return image base url + iamge name
  if (doc.image) {
    const imageUrl = `${process.env.BASE_URL}/packages/${doc.image}`;
    doc.image = imageUrl;
  }
};
//after initializ the doc in db
// check if the document contains image
// it work with findOne,findAll,update
PackageSchema.post("init", (doc) => {
  setImageURL(doc);
});
// it work with create
PackageSchema.post("save", (doc) => {
  setImageURL(doc);
});

PackageSchema.pre(/^find/, function (next) {
  this.populate({ path: "courses", select: "title" });
  next();
});

const Package = mongoose.model("Package", PackageSchema);

module.exports = Package;
