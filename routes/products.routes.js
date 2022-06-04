const express = require('express');

// Controllers
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/products.controller');

// Middlewares
const { protectToken } = require('../middlewares/users.middlewares');
const {
  createProductValidations,
  checkValidations,
} = require('../middlewares/validations.middlewares');
const {
  productsExists,
  protectProductOwner,
} = require('../middlewares/products.middlewares');

// Utils
const { upload } = require('../utils/multer');

const router = express.Router();

router.get('/', getAllProducts);

router.use(protectToken);

router.post(
  '/',
  upload.array('productImgs', 3),
  createProductValidations,
  checkValidations,
  createProduct
);

router
  .route('/:id')
  .get(productsExists, getProductById)
  .patch(productsExists, protectProductOwner, updateProduct)
  .delete(productsExists, protectProductOwner, deleteProduct);

module.exports = { productsRouter: router };
