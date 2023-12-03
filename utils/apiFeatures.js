class ApiFeatures {
  constructor(mongooseeQuery, queryStr) {
    this.mongooseeQuery = mongooseeQuery;
    this.queryStr = queryStr;
  }

  filter() {
    // take copy from req.query and delete the page and limit and..... from the copy req.body to use in filter
    const queryStringObj = { ...this.queryStr };
    const excludesFields = ["page", "sort", "limit", "fields"];
    excludesFields.forEach((field) => delete queryStringObj[field]);

    let queryStr = JSON.stringify(queryStringObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.mongooseeQuery = this.mongooseeQuery.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(".").join(" ");
      this.mongooseeQuery = this.mongooseeQuery.sort(sortBy);
    } else {
        this.mongooseeQuery = this.mongooseeQuery.sort("-createAt");
    }
    return this;
  }

  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(",").join(" ");
      this.mongooseeQuery = this.mongooseeQuery.select(fields);
    } else {
      this.mongooseeQuery = this.mongooseeQuery.select("-__v");
    }
    return this;
  }


  search(modelName) {
    if (this.queryStr.keyword) {
      let query = {};
      if (modelName === 'Product') {
        query.$or = [
          {  title_ar: { $regex: this.queryStr.keyword, $options: 'i' } },
          {  title_en: { $regex: this.queryStr.keyword, $options: 'i' } },
          { description_ar: { $regex: this.queryStr.keyword, $options: 'i' } },
          { description_en: { $regex: this.queryStr.keyword, $options: 'i' } },
        ];
      } else {
        query = {
           name: { $regex: this.queryStr.keyword, $options: 'i' },
           name_ar: { $regex: this.queryStr.keyword, $options: 'i' },
           name_en: { $regex: this.queryStr.keyword, $options: 'i' },
           };
      }
      this.mongooseeQuery = this.mongooseeQuery.find(query);
    }
    return this;
  }

  paginate(countDocuments) {
    const page = this.queryStr.page * 1 || 1;
    const limit = this.queryStr.limit * 1 || 50;
    const skip = (page - 1) * limit;
    const endIndex = page * limit; // 2 *10  = 20  =>then the endIndex of Page 2 =20

    const pagination = {};
    pagination.currentPage = page;
    pagination.limit = limit;
    pagination.numberOfPages = Math.ceil(countDocuments / limit);

    //next page
    if (endIndex < countDocuments) {
      pagination.nextPage = page + 1;
    }
    //previous
    if (skip > 0) {
      pagination.previousPage = page - 1;
    }

    this.mongooseeQuery = this.mongooseeQuery.skip(skip).limit(limit);

    this.paginationResult = pagination;
    return this;
  }
}  

module.exports = ApiFeatures;
