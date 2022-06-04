const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../utils/appError');

// Models
const { ProductInCart } = require('../models/productInCart.model');
const { Product } = require('../models/product.model');
const { Cart } = require('../models/cart.model');
const { Order } = require('../models/order.model');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const getUserCart = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;

  const cart = await Cart.findOne({
    where: { userId: sessionUser.id, status: 'active' },
    include: [{ model: ProductInCart, include: [{ model: Product }] }],
  });

  res.status(200).json({ status: 'success', cart });
});

const addProductToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;

  const { sessionUser } = req;

  // check if there is a cart for the user in session
  const cart = await Cart.findOne({
    where: { userId: sessionUser.id, status: 'active' },
  });

  // validate the product model to extract quantity and price
  const product = await Product.findOne({
    where: { id: productId, status: 'active' },
  });

  if (quantity > product.quantity) {
    return next(
      new AppError(
        'you cannot create a cart if the product you buy exceeds the quantity',
        403
      )
    );
  }

  // if the user has an active cart do
  if (cart != null) {
    // consult the product and cart model to validate if there is a product already added
    const productoInCar = await ProductInCart.findOne({
      where: { cartId: cart.id, productId: productId },
    });
    // check if the product already exists
    // check if product exist and product is active -> error
    // check if product exist and product is remove -> update
    // else -> add product (product doesn't exit) -> create
    console.log(productoInCar);
    if (productoInCar != null && productoInCar.status === 'active') {
      return next(
        new AppError('the product is already added to an active cart', 403)
      );
    } else if (productoInCar != null && productoInCar.status === 'removed') {
      // Update
      await productoInCar.update({ quantity: quantity, status: 'active' });
      res.status(200).json({ status: 'success, the product has add ' });
    } else {
      //validate if the quantity does not exceed the stock

      const newProductInCart = await ProductInCart.create({
        cartId: cart.id,
        productId,
        quantity,
      });
      res.status(201).json({ status: 'exitoso', newProductInCart });
    }
  } else {
    const cartNew = await Cart.create({
      userId: sessionUser.id,
    });

    const newProductInCart = await ProductInCart.create({
      cartId: cartNew.id,
      productId,
      quantity,
    });
    res.status(201).json({ newProductInCart });
  }
});

const updateProductInCart = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;
  const { sessionUser } = req;

  // check if there is a cart for the user in session
  const cart = await Cart.findOne({
    where: { userId: sessionUser.id, status: 'active' },
  });
  // validate the product model to extract quantity and price
  const product = await Product.findOne({
    where: { id: productId, status: 'active' },
  });

  // consult the product and cart model to validate if there is a product already added
  const productoInCar = await ProductInCart.findOne({
    where: { cartId: cart.id, status: 'active', productId: productId },
  });

  if (quantity > product.quantity) {
    return next(
      new AppError(
        'you cannot create a cart if the product you buy exceeds the quantity',
        403
      )
    );
  }
  if (productoInCar == null) {
    return next(new AppError('the product is not in your active cart', 403));
  } else {
    if (quantity == 0) {
      await productoInCar.update({ quantity: 0, status: 'removed' });
      res.status(200).json({ status: 'he product is a removed' });
    } else {
      const productInCarUpdate = await ProductInCart.findOne({
        where: { productId: productId, status: 'active', cartId: cart.id },
      });
      await productInCarUpdate.update({ productId, quantity });
      res.status(200).json({ status: 'success, the product was updated ' });
    }
  }
});

const purchaseCart = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;

  // Get user's cart and get products in cart
  const cart = await Cart.findOne({
    where: { status: 'active', userId: sessionUser.id },
    include: [
      {
        model: ProductInCart,
        where: { status: 'active' },
        include: [{ model: Product }],
      },
    ],
  });

  if (!cart) {
    return next(new AppError('This user does not have a cart yet.', 400));
  }

  // await ProductInCart.findAll({ where: { cartId: cart.id } });

  // Loop products in cart to do the following (map async)
  let totalPrice = 0;

  const cartPromises = cart.productInCarts.map(async productInCart => {
    //  Substract to stock
    const updatedQty = productInCart.product.quantity - productInCart.quantity;

    await productInCart.product.update({ quantity: updatedQty });

    //  Calculate total price
    const productPrice = productInCart.quantity * +productInCart.product.price;
    totalPrice += productPrice;

    //  Mark products to status purchased
    return await productInCart.update({ status: 'purchased' });
  });

  await Promise.all(cartPromises);

  // Create order to user
  const newOrder = await Order.create({
    userId: sessionUser.id,
    cartId: cart.id,
    totalPrice,
    status: 'purchased',
  });

  await cart.update({ status: 'purchased' });

  res.status(200).json({ status: 'success', newOrder });
});

const removeProductFromCart = catchAsync(async (req, res, next) => {
  const { productInCarId } = req;

  await productInCarId.update({ quantity: 0, status: 'removed' });
  res.status(200).json({ status: 'success, the product was removed ' });
});

module.exports = {
  addProductToCart,
  updateProductInCart,
  purchaseCart,
  removeProductFromCart,
  getUserCart,
};
