const mongoose = require("mongoose");
const Lesson = require("./lessonModel");

const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
});
sectionSchema.post("remove", async function (next) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Lesson.deleteMany({ section: this._id }).session(session);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
  next();
});


module.exports = mongoose.model("Section", sectionSchema);
