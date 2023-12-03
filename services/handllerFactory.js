const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");

exports.updateOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!document) {
      return next(
        new ApiError(`No document For this id ${req.params.id}`, 404)
      );
    }
    //trigger "save" event when update the document
    // document.save();
    res.status(200).json({ data: document });
  });

exports.createOne = (Model) =>
  asyncHandler(async (req, res) => {
    const document = await Model.create(req.body);
    res.status(201).json({ data: document });
  });

exports.getOne = (Model, populationOt) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    //1-build query
    let query = Model.findById(id);
    if (populationOt) {
      query = query.populate(populationOt);
    }
    //2- excute query
    const document = await query;

    if (!document) {
      return next(new ApiError(`No document For this id ${id}`, 404));
    }
    res.status(200).json({ data: document });
  });

  exports.getALl = (Model, modelName = "") =>
  asyncHandler(async (req, res) => {
    let filter = {};
    if (req.filterObj) {
      filter = req.filterObj;
    }
    const documentsCounts = await Model.countDocuments();
    const apiFeatures = new ApiFeatures(Model.find(filter), req.query)
      .paginate(documentsCounts)
      .filter()
      .search(modelName)
      .limitFields()
      .sort();

    const { mongooseeQuery, paginationResult } = apiFeatures;
    const documents = await mongooseeQuery;

    res
      .status(200)
      .json({ results: documents.length, paginationResult, data: documents });
  });
  //   const documentsCounts = await Model.countDocuments();
  //   const apiFeatures = new ApiFeatures(Model.find(filter), req.query)
  //     .paginate(documentsCounts)
  //     .filter()
  //     .search(modelName)
  //     .limitFields()
  //     .sort();

  //   const { mongooseeQuery, paginationResult } = apiFeatures;
  //   const documents = await mongooseeQuery;

  //   res
  //     .status(200)
  //     .json({ results: documents.length, paginationResult, data: documents });
  // });

exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const document = await Model.findByIdAndDelete(id);
    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }
    // Trigger "remove" event when delete document
    document.remove();
    res.status(204).send();
  });
