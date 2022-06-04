const express = require('express');

// Controllers
const {
  addProductToCart,
  updateProductInCart,
  purchaseCart,
  removeProductFromCart,
  getUserCart,
} = require('../controllers/orders.controller');

// Middlewares
const { protectToken } = require('../middlewares/users.middlewares');
const {
  createAddProductValidations,
  checkValidations,
} = require('../middlewares/validations.middlewares');

const {
  productInCartExists,
} = require('../middlewares/productsInCarts.middleware');

const router = express.Router();

router.use(protectToken);

router.get('/', getUserCart);

router.post(
  '/add-product',
  createAddProductValidations,
  checkValidations,
  addProductToCart
);

router.patch('/update-cart', updateProductInCart);

router.post('/purchase', purchaseCart);

router.delete('/:productId', productInCartExists, removeProductFromCart);

module.exports = { cartRouter: router };
