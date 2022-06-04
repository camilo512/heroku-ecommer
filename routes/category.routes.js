const express = require('express');

// Controllers
const {
  getAllCategorys,
  createCategory,
  getCategoryrId,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');

// Middlewares
const {
  protectToken,
  protectAdmin,
} = require('../middlewares/users.middlewares');
const { categoryExists } = require('../middlewares/category.middlewares');
const {
  createCategoryValidations,
  checkValidations,
} = require('../middlewares/validations.middlewares');

const router = express.Router();

router.use(protectToken);

router.get('/', getAllCategorys);

router.post(
  '/',
  protectAdmin,
  createCategoryValidations,
  checkValidations,
  createCategory
);

router
  .route('/:id')
  .get(categoryExists, getCategoryrId)
  .patch(protectAdmin, categoryExists, updateCategory)
  .delete(protectAdmin, categoryExists, deleteCategory);
module.exports = { categoryRouter: router };
