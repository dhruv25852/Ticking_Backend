const Product = require('../models/Product');
const Brand = require('../models/Brand');
const Category = require('../models/Category');
const {
  isCloudinaryConfigured,
  uploadStreamToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl
} = require('../config/cloudinary');

// Helper to safely delete an image only if no other product uses it
const safeDeleteProductImage = async (imageUrlOrPublicId, currentProductId = null) => {
  if (!imageUrlOrPublicId || typeof imageUrlOrPublicId !== 'string') return;
  // Ignore local static placeholder images
  if (imageUrlOrPublicId.startsWith('/images/')) return;

  try {
    const query = {
      $or: [
        { images: imageUrlOrPublicId },
        { imagePublicIds: imageUrlOrPublicId }
      ]
    };
    if (currentProductId) {
      query._id = { $ne: currentProductId };
    }

    const otherProductUsingImage = await Product.findOne(query);
    if (otherProductUsingImage) {
      console.log(`[Cloudinary] Preserving shared image "${imageUrlOrPublicId}" still used by product "${otherProductUsingImage.name}"`);
      return;
    }

    let publicId = imageUrlOrPublicId;
    if (publicId.includes('http') || publicId.includes('/')) {
      const extracted = extractPublicIdFromUrl(publicId);
      if (extracted) publicId = extracted;
    }

    if (publicId && !publicId.startsWith('/images/')) {
      await deleteFromCloudinary(publicId);
    }
  } catch (err) {
    console.warn(`[Cloudinary] safeDeleteProductImage warning for "${imageUrlOrPublicId}":`, err.message);
  }
};

// Helper to generate slug
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

// @desc    Get all products with filtering, searching, sorting, and pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      gender,
      strapMaterial,
      caseMaterial,
      dialColor,
      inStock,
      rating,
      collectionName,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { collectionName: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && category !== 'All' && category !== 'all') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    // Brand filter
    if (brand && brand !== 'All' && brand !== 'all') {
      query.brand = { $regex: new RegExp(`^${brand}$`, 'i') };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Gender filter
    if (gender && gender !== 'All') {
      query['specifications.gender'] = gender;
    }

    // Strap Material filter
    if (strapMaterial && strapMaterial !== 'All') {
      query['specifications.strapMaterial'] = { $regex: strapMaterial, $options: 'i' };
    }

    // Case Material filter
    if (caseMaterial && caseMaterial !== 'All') {
      query['specifications.caseMaterial'] = { $regex: caseMaterial, $options: 'i' };
    }

    // Dial Color filter
    if (dialColor && dialColor !== 'All') {
      query['specifications.dialColor'] = { $regex: dialColor, $options: 'i' };
    }

    // Availability / inStock filter
    if (inStock === 'true' || inStock === true) {
      query.stock = { $gt: 0 };
    }

    // Rating filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // Collection filter
    if (collectionName) {
      query.collectionName = { $regex: collectionName, $options: 'i' };
    }

    // Sorting
    let sortQuery = { createdAt: -1 };
    if (sort === 'price-asc') {
      sortQuery = { price: 1 };
    } else if (sort === 'price-desc') {
      sortQuery = { price: -1 };
    } else if (sort === 'rating') {
      sortQuery = { rating: -1 };
    } else if (sort === 'newest') {
      sortQuery = { createdAt: -1 };
    } else if (sort === 'popular') {
      sortQuery = { numReviews: -1, rating: -1 };
    } else if (sort === 'featured') {
      sortQuery = { isFeatured: -1, createdAt: -1 };
    }

    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 12;
    const skip = (pageNumber - 1) * pageSize;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(pageSize);

    res.json({
      products,
      page: pageNumber,
      pages: Math.ceil(total / pageSize),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Watch product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) {
      return res.status(404).json({ message: 'Watch product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get featured products
// @route   GET /api/products/special/featured
// @access  Public
const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true }).limit(8);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get new arrivals
// @route   GET /api/products/special/new-arrivals
// @access  Public
const getNewArrivals = async (req, res) => {
  try {
    const products = await Product.find({ isNewArrival: true }).limit(8);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get best sellers
// @route   GET /api/products/special/best-sellers
// @access  Public
const getBestSellers = async (req, res) => {
  try {
    const products = await Product.find({ isBestSeller: true }).limit(8);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get related products
// @route   GET /api/products/:id/related
// @access  Public
const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const related = await Product.find({
      _id: { $ne: product._id },
      $or: [{ brand: product.brand }, { category: product.category }]
    }).limit(4);

    res.json(related);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new product (Admin)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const {
      name,
      brand,
      category,
      collectionName,
      price,
      originalPrice,
      stock,
      sku,
      images,
      imagePublicIds,
      description,
      shortDescription,
      specifications,
      isFeatured,
      isBestSeller,
      isNewArrival
    } = req.body;

    const baseSlug = slugify(name);
    let slug = baseSlug;
    let count = 1;
    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    const generatedSku = sku || `TCK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const cleanImages = Array.isArray(images) && images.length ? images : ['/images/watches/hero_chronograph.jpg'];

    // Collect public_ids from payload or extract from Cloudinary URLs
    let cleanPublicIds = Array.isArray(imagePublicIds) ? imagePublicIds : [];
    if (cleanPublicIds.length === 0) {
      cleanPublicIds = cleanImages
        .map((img) => extractPublicIdFromUrl(img))
        .filter(Boolean);
    }

    const product = new Product({
      name,
      slug,
      brand,
      category,
      collectionName: collectionName || 'Prestige Collection',
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : Number(price),
      stock: Number(stock) || 10,
      sku: generatedSku,
      images: cleanImages,
      imagePublicIds: cleanPublicIds,
      description: description || 'Handcrafted Swiss luxury timepiece.',
      shortDescription: shortDescription || description?.slice(0, 100),
      specifications: specifications || {},
      isFeatured: !!isFeatured,
      isBestSeller: !!isBestSeller,
      isNewArrival: !!isNewArrival
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updates = req.body;
    if (updates.name && updates.name !== product.name) {
      updates.slug = slugify(updates.name);
    }

    // When images are updated, identify removed images and safely delete from Cloudinary if not used elsewhere
    if (updates.images && Array.isArray(updates.images)) {
      const oldImages = product.images || [];
      const removedImages = oldImages.filter((oldImg) => !updates.images.includes(oldImg));

      for (const removedImg of removedImages) {
        await safeDeleteProductImage(removedImg, product._id);
      }

      // Re-sync imagePublicIds
      if (!updates.imagePublicIds) {
        updates.imagePublicIds = updates.images
          .map((img) => extractPublicIdFromUrl(img))
          .filter(Boolean);
      }
    }

    Object.assign(product, updates);
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Clean up images from Cloudinary if not used by any other product
    const imagesToDelete = [
      ...(product.imagePublicIds || []),
      ...(product.images || [])
    ];
    for (const imgRef of imagesToDelete) {
      await safeDeleteProductImage(imgRef, product._id);
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product successfully removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload product image(s) to Cloudinary (Admin)
// @route   POST /api/products/upload
// @access  Private/Admin
const uploadProductImages = async (req, res) => {
  try {
    const files = req.files && req.files.length > 0
      ? req.files
      : (req.file ? [req.file] : []);

    if (files.length === 0) {
      return res.status(400).json({ message: 'Please select an image file to upload.' });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        message: 'Cloudinary credentials are not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env to enable image uploads.',
        code: 'CLOUDINARY_NOT_CONFIGURED'
      });
    }

    const uploadResults = [];
    for (const file of files) {
      const result = await uploadStreamToCloudinary(file.buffer, {
        folder: 'ticking/products',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });
      uploadResults.push({
        url: result.secure_url,
        secure_url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes
      });
    }

    res.json({
      message: `${uploadResults.length} image(s) uploaded successfully`,
      url: uploadResults[0].secure_url,
      secure_url: uploadResults[0].secure_url,
      public_id: uploadResults[0].public_id,
      images: uploadResults,
      urls: uploadResults.map((r) => r.secure_url)
    });
  } catch (error) {
    console.error('[Product Image Upload Error]:', error);
    res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to upload product image to Cloudinary'
    });
  }
};

// @desc    Delete a product image from Cloudinary (Admin)
// @route   POST /api/products/delete-image
// @access  Private/Admin
const deleteProductImage = async (req, res) => {
  try {
    const { public_id, publicId, url, productId } = req.body;
    const target = public_id || publicId || url;

    if (!target) {
      return res.status(400).json({ message: 'public_id or url is required' });
    }

    await safeDeleteProductImage(target, productId);
    res.json({ message: 'Image deletion request processed' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to delete image' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductBySlug,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getRelatedProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage
};
