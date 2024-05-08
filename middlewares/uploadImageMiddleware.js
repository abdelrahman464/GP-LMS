const multer = require("multer");
const ApiError = require("../utils/apiError");

const multerOptions = () => {
  //disk stroge engine
  // const multerStorage = multer.diskStorage({
  //   destination: function (req, file, cb) {
  //     cb(null, "uploads/categories");
  //   },
  //   filename: function (req, file, cb) {
  //     const ext = file.mimetype.split("/")[1];
  //     const filename = `cateogry-${uuidv4()}-${Date.now()}.${ext}`;
  //     cb(null, filename);
  //   },
  // });

  //memory stroge engine
  const multerStorage = multer.memoryStorage();

  const multterFilter = function (req, file, cb) {
    if (
      file.mimetype.startsWith("image") ||
      file.mimetype.startsWith("application/pdf")
    ) {
      cb(null, true);
    } else {
      cb(new ApiError("Only image or pdf Allowed ", 400), false);
    }
  };
  const upload = multer({ storage: multerStorage, fileFilter: multterFilter });
  return upload;
};

exports.uploadSingleImage = (fieldName) => multerOptions().single(fieldName);

exports.uploadMixOfImages = (arrayOfFields) =>
  multerOptions().fields(arrayOfFields);
