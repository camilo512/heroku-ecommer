const { ref, uploadBytes, getDownloadURL } = require('firebase/storage');

//Models
const { Product } = require('../models/product.model');
const { User } = require('../models/user.model');
const { ProductImg } = require('../models/productImg.model');
const { Category } = require('../models/category.model');

const { catchAsync } = require('../utils/catchAsync');
const { storage } = require('../utils/firebase');

const getAllProducts = catchAsync(async (req, res, next) => {
  const products = await Product.findAll({
    where: { status: 'active' },
    include: [
      { model: ProductImg, attributes: ['id', 'imgUrl'] },
      { model: Category, attributes: ['id', 'name'] },
      { model: User, attributes: ['id', 'username', 'email'] },
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

  res.status(200).json({
    products,
  });
});

const getProductById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const productId = await Product.findAll({
    where: { id },
    include: [
      { model: ProductImg, attributes: ['id', 'imgUrl'] },
      { model: Category, attributes: ['id', 'name'] },
      { model: User, attributes: ['id', 'username', 'email'] },
    ],
  });

  // get all products' img
  const productIdPromises = productId.map(async productId => {
    const productIdImgsPromises = productId.productImgs.map(
      async productIdImg => {
        // Get img from firebase
        const imgRef = ref(storage, productIdImg.imgUrl);
        const url = await getDownloadURL(imgRef);

        //Update repairImgUrl prop
        productIdImg.imgUrl = url;
        return productIdImg;
      }
    );

    // Resolve pending promises
    return await Promise.all(productIdImgsPromises);
  });

  await Promise.all(productIdPromises);

  res.status(200).json({
    productId,
  });
});

const createProduct = catchAsync(async (req, res) => {
  //   console.log(req.body.name)

  const { title, description, quantity, price, categoryId, userId } = req.body;
  const { sessionUser } = req;

  const newProduct = await Product.create({
    title,
    description,
    quantity,
    price,
    categoryId,
    userId: sessionUser.id,
  });

  // console.log(req.files);

  // Map through the files and upload them to firebase
  const productImgsPromises = req.files.map(async file => {
    // Create img ref
    const imgRef = ref(
      storage,
      `products/${newProduct.id}-${Date.now()}-${file.originalname}`
    );
    // Use upload bytes
    const imgUploaded = await uploadBytes(imgRef, file.buffer);

    // Create a new RepairImg instance (repairImg.create)
    return await ProductImg.create({
      productId: newProduct.id,
      imgUrl: imgUploaded.metadata.fullPath,
    });
  });

  // Resolve the pending
  await Promise.all(productImgsPromises);

  res.status(201).json({ status: 'Sucess', newProduct });
});

const updateProduct = catchAsync(async (req, res, next) => {
  const { productId } = req;
  const { title, description, quantity, price } = req.body;

  await productId.update({ title, description, quantity, price });
  res.status(200).json({ status: 'Success' });
});

const deleteProduct = catchAsync(async (req, res, next) => {
  const { productId } = req;
  //delete from...
  //await user.destroy();
  await productId.update({ status: 'deleted' });
  res.status(200).json({ status: 'Success' });
});

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
