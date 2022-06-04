const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');

// require('crypto').randomBytes(64).toString('hex')

// Models
const { User } = require('../models/user.model');
const { Product } = require('../models/product.model');
const { ProductImg } = require('../models/productImg.model');
const { Category } = require('../models/category.model');
const { Order } = require('../models/order.model');
const { Cart } = require('../models/cart.model');
const { ProductInCart } = require('../models/productInCart.model');

// Utils
const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../utils/appError');
const { storage } = require('../utils/firebase');

dotenv.config({ path: './config.env' });

const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.findAll({
    attributes: { exclude: ['password'] },
  });
  // Map async: you will use this techinque evertyme thah you need some async operations inside of an array
  const usersPromises = users.map(async user => {
    // Create firebase img ref and get the full path
    const imgRef = ref(storage, user.profileImgUrl);
    const url = await getDownloadURL(imgRef);

    // Update  the user's profileImgUrl property
    user.profileImgUrl = url;
    return user;
  });

  // Resolve every promise that map gave us ([Promise { <pending> }])
  const usersResolved = await Promise.all(usersPromises);

  res.status(200).json({
    users: usersResolved,
  });
});

const createUser = catchAsync(async (req, res, next) => {
  const { username, email, password, role, profileImgUrl } = req.body;

  const imgRef = ref(storage, `users/${Date.now()}-${req.file.originalname}`);
  const imgUploaded = await uploadBytes(imgRef, req.file.buffer);

  const salt = await bcrypt.genSalt(12);
  const hashPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    username,
    email,
    password: hashPassword,
    role,
    profileImgUrl: imgUploaded.metadata.fullPath,
  });

  // await new Email(newUser.email).sendWelcome(newUser.name);

  // Remove password from response
  newUser.password = undefined;

  res.status(201).json({ status: 'sucessed', newUser });
});

// const getUserById = catchAsync(async (req, res, next) => {
//   const { userId } = req;

//   res.status(200).json({
//     user,
//   });
// });

const updateUser = catchAsync(async (req, res, next) => {
  const { userId } = req;
  const { username } = req.body;

  await userId.update({ username });

  res.status(200).json({ status: 'success' });
});

const deleteUser = catchAsync(async (req, res, next) => {
  const { userId } = req;

  await userId.update({ status: 'deleted' });

  res.status(200).json({
    status: 'success',
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate that user exists with given email
  const user = await User.findOne({
    where: { email, status: 'active' },
  });

  // Compare password with db
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError('Invalid credentials', 400));
  }

  // Generate JWT
  const token = await jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  user.password = undefined;

  res.status(200).json({ token, user });
});

const checkToken = catchAsync(async (req, res, next) => {
  res.status(200).json({ user: req.sessionUser });
});

const getUserProducts = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;

  const products = await Product.findAll({
    where: { userId: sessionUser.id, status: 'active' },
    include: [
      { model: ProductImg, attributes: ['id', 'imgUrl'] },
      { model: Category, attributes: ['id', 'name'] },
    ],
  });
  // get all products' img
  const productsPromises = products.map(async product => {
    const productImgsPromises = product.productImgs.map(async productImg => {
      // Get img from firebase
      const imgRef = ref(storage, productImg.imgUrl);
      const url = await getDownloadURL(imgRef);

      //Update repairImgUrl prop
      productImg.imgUrl = url;
      return productImg;
    });

    // Resolve pending promises
    return await Promise.all(productImgsPromises);
  });
  await Promise.all(productsPromises);

  res.status(200).json({ products });
});
const getUserOrders = catchAsync(async (req, res, next) => {
  const { sessionUser } = req;

  const orders = await Order.findAll({
    attributes: ['id', 'totalPrice', 'createdAt'],
    where: { userId: sessionUser.id },
    include: [
      {
        model: Cart,
        attributes: ['id', 'status'],
        include: [
          {
            model: ProductInCart,
            attributes: ['quantity', 'status'],
            include: [
              {
                model: Product,
                attributes: ['id', 'title', 'description', 'price'],
                include: [{ model: Category, attributes: ['name'] }],
              },
            ],
          },
        ],
      },
    ],
  });

  res.status(200).json({ status: 'success', orders });
});

const getUserOrderById = catchAsync(async () => {
  res.status(200).json({ status: 'success' });
});

module.exports = {
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
};
