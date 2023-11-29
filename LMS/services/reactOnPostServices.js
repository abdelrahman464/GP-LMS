const asyncHandler = require("express-async-handler");
const Reaction = require("../models/reactionModel");
const Post = require("../models/postModel");
const factory = require("../handllerFactory");

//filter reacts in specefic post by post id
exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.postId) filterObject = { postId: req.params.postId };
  req.filterObj = filterObject;
  next();
};
//@desc get all comments
//@route GET /api/v1/postReacts
//@access protected user
exports.getAllReactions = factory.getALl(Reaction);
//@desc user add react and if user already react post and he try to add diffrent
//      react on the same post he reacted before , the new react will override the old react but when
//      user already reacted the post and he trying to add the same react on the same post the react will reamove
//       the reacts (like , love , haha, support, sad)
//@route POST api/v1/postReacts
//@access protected user
exports.addReact = asyncHandler(async (req, res, next) => {
  const { postId, type } = req.body;
  const userId = req.user._id;
  // Check if the user has already reacted to the post
  const existingReaction = await Reaction.findOne({ postId, userId });

  if (existingReaction) {
    // If the existing reaction is of the same type, remove it and return success response
    if (existingReaction.type === type) {
      await existingReaction.remove();
      await Post.findByIdAndUpdate(postId, {
        $pull: { reactions: { user: userId, type } },
      });
      return res
        .status(200)
        .json({ message: "Reaction removed successfully." });
    }

    // If the existing reaction is of a different type, update it
    existingReaction.type = type;
    await existingReaction.save();
    await Post.findOneAndUpdate(
      { _id: postId, "reactions.user": userId },
      {
        $set: { "reactions.$.type": type },
      }
    );
  } else {
    // Create a new reaction
    const reaction = new Reaction({
      postId,
      userId,
      type,
    });

    // Save the reaction to the database
    await reaction.save();

    // Update the post's reactions array
    await Post.findByIdAndUpdate(postId, {
      $push: { reactions: { user: userId, type } },
    });
  }

  res.status(200).json({ success: true });
});
