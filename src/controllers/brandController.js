const Brand = require('../models/Brand');
const Product = require('../models/Product');

// @desc    Get all prestigious brands
// @route   GET /api/brands
// @access  Public
const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({}).sort({ number: 1 });
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get brand by slug with its watches
// @route   GET /api/brands/:slug
// @access  Public
const getBrandBySlug = async (req, res) => {
  try {
    const brand = await Brand.findOne({ slug: req.params.slug.toLowerCase() });
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    const watches = await Product.find({
      brand: { $regex: new RegExp(`^${brand.name}$`, 'i') }
    }).limit(12);

    res.json({
      brand,
      watches
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new brand (Admin)
// @route   POST /api/brands
// @access  Private/Admin
const createBrand = async (req, res) => {
  try {
    const { name, tagline, description, foundedYear, country, headquarters, founder, presence, logo, bannerImage, stats, promises, iconicCollections, number } = req.body;

    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const existing = await Brand.findOne({ slug });
    if (existing) {
      return res.status(400).json({ message: 'Brand already exists' });
    }

    const brand = await Brand.create({
      name,
      slug,
      number: number || '09',
      tagline,
      description,
      foundedYear,
      country,
      headquarters,
      founder,
      presence,
      logo,
      bannerImage,
      stats,
      promises,
      iconicCollections
    });

    res.status(201).json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update brand (Admin)
// @route   PUT /api/brands/:id
// @access  Private/Admin
const updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    Object.assign(brand, req.body);
    const updated = await brand.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete brand (Admin)
// @route   DELETE /api/brands/:id
// @access  Private/Admin
const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    await Brand.findByIdAndDelete(req.params.id);
    res.json({ message: 'Brand deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBrands,
  getBrandBySlug,
  createBrand,
  updateBrand,
  deleteBrand
};
