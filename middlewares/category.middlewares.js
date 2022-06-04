const jwt = require('jsonwebtoken');

// Models
const { Category } = require('../models/category.model');

// Utils
const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../utils/appError');

const categoryExists = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const categotyId = await Category.findOne({
    where: { id, status: 'active' },
  });

  if (!categotyId) {
    return next(new AppError('Category does not exist with given Id', 404));
  }

  // add user data to the req object
  req.categotyId = categotyId;
  next();
});

module.exports = { categoryExists };
