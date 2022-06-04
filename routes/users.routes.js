const express = require('express');

// Middlewares
const {
  userExists,
  protectToken,
  protectAccountOwner,
  protectAdmin,
} = require('../middlewares/users.middlewares');
const {
  createUserValidations,
  createCategoryValidations,
  checkValidations,
} = require('../middlewares/validations.middlewares');

// Controller
const {
  getAllUsers,
  createUser,
  // getUserById,
  updateUser,
  deleteUser,
  login,
  checkToken,
  getUserProducts,
  getUserOrders,
  getUserOrderById,
} = require('../controllers/users.controller');

//Utils
const { upload } = require('../utils/multer');

const router = express.Router();

router.post(
  '/',
  upload.single('profileImg'),
  createUserValidations,
  checkValidations,
  createUser
);

router.post('/login', login);

// Apply protectToken middleware
router.use(protectToken);

router.get('/me', getUserProducts);
router.get('/', protectAdmin, getAllUsers);

router.get('/orders', getUserOrders);

router.get('/orders/:id', getUserOrderById);

router.get('/check-token', checkToken);

router
  .route('/:id')
  .get(userExists)
  .patch(userExists, protectAccountOwner, updateUser)
  .delete(userExists, protectAccountOwner, deleteUser);

module.exports = { usersRouter: router };
