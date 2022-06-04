const jwt = require('jsonwebtoken');

// Models
const { ProductInCart } = require('../models/productInCart.model');
const { Cart } = require('../models/cart.model');

// Utils
const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../utils/appError');

const productInCartExists = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  const { sessionUser } = req;

  // check if there is a cart for the user in session
  const cart = await Cart.findOne({
    where: { userId: sessionUser.id, status: 'active' },
  });

  const productInCarId = await ProductInCart.findOne({
    where: { productId: productId, status: 'active', cartId: cart.id },
  });

  if (!productInCarId) {
    return next(
      new AppError(
        'does not exist with given productId, in the cart to be removed',
        404
      )
    );
  }

  // add user data to the req object
  req.productInCarId = productInCarId;

  next();
});

module.exports = { productInCartExists };
