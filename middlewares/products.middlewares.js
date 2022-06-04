const { Product } = require('../models/product.model');

const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../utils/appError');

const productsExists = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const productId = await Product.findOne({ where: { id, status: 'active' } });

  if (!productId) {
    return next(new AppError('Product not found with given id', 404));
  }

  req.productId = productId;

  next();
});

const protectProductOwner = catchAsync(async (req, res, next) => {
  //Get current session user and the user that is going to be updated

  const { sessionUser, productId } = req;
  const productIdUpdate = await Product.findOne({
    where: { id: productId.userId },
  });

  //compare the id's
  if (sessionUser.id !== productIdUpdate.userId) {
    return next(new AppError('You do not own this account', 403));
  }
  next();
});

module.exports = { protectProductOwner, productsExists };
