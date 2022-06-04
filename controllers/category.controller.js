const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Models
const { Category } = require('../models/category.model');

// Utils
const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../utils/appError');

dotenv.config({ path: './config.env' });

const getAllCategorys = catchAsync(async (req, res, next) => {
  const categorys = await Category.findAll({});

  res.status(200).json({
    categorys,
  });
});

const createCategory = catchAsync(async (req, res, next) => {
  const { name } = req.body;

  const newCategory = await Category.create({
    name,
  });

  res.status(201).json({ newCategory });
});

const getCategoryrId = catchAsync(async (req, res, next) => {
  const { categotyId } = req;
  // const { id } = req.params;
  // const repairId = await Repair.findOne({ where: { id } });

  if (!categotyId) {
    return res.status(404).json({
      status: 'error',
      message: 'Category not found given that id',
    });
  }

  res.status(200).json({
    categotyId,
  });
});

const updateCategory = catchAsync(async (req, res, next) => {
  const { categotyId } = req;
  const { name } = req.body;

  await categotyId.update({ name });

  res.status(200).json({ status: 'success' });
});

const deleteCategory = catchAsync(async (req, res, next) => {
  const { categotyId } = req;

  await categotyId.update({ status: 'deleted' });

  res.status(200).json({
    status: 'success',
  });
});

module.exports = {
  getAllCategorys,
  createCategory,
  getCategoryrId,
  updateCategory,
  deleteCategory,
};
