const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter product name'],
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    brand: {
      type: String,
      required: [true, 'Please specify brand name'],
      trim: true
    },
    brandRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand'
    },
    collectionName: {
      type: String,
      default: 'Iconic Collection'
    },
    category: {
      type: String,
      required: [true, 'Please specify category'],
      trim: true
    },
    categoryRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    price: {
      type: Number,
      required: [true, 'Please enter product price in INR'],
      min: 0
    },
    originalPrice: {
      type: Number,
      min: 0
    },
    discountPercentage: {
      type: Number,
      default: 0
    },
    stock: {
      type: Number,
      required: true,
      default: 10,
      min: 0
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    images: {
      type: [String],
      required: true,
      validate: [val => val.length > 0, 'At least one product image is required']
    },
    imagePublicIds: {
      type: [String],
      default: []
    },
    description: {
      type: String,
      required: true
    },
    shortDescription: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      default: 4.9,
      min: 0,
      max: 5
    },
    numReviews: {
      type: Number,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isBestSeller: {
      type: Boolean,
      default: false
    },
    isNewArrival: {
      type: Boolean,
      default: false
    },
    specifications: {
      caseMaterial: { type: String, default: 'Oystersteel / 18 ct Gold' },
      strapMaterial: { type: String, default: 'Oyster, flat three-piece links' },
      movement: { type: String, default: 'Perpetual, mechanical, self-winding' },
      waterResistance: { type: String, default: '300 metres / 1,000 feet' },
      dialColor: { type: String, default: 'Midnight Black' },
      caseSize: { type: String, default: '41 mm' },
      warranty: { type: String, default: '5 Years International Warranty' },
      gender: { type: String, enum: ["Men's", "Women's", "Unisex"], default: "Unisex" }
    }
  },
  { timestamps: true }
);

// Auto calculate discount if originalPrice is provided
productSchema.pre('save', function (next) {
  if (this.originalPrice && this.originalPrice > this.price) {
    this.discountPercentage = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  } else if (!this.originalPrice) {
    this.originalPrice = this.price;
    this.discountPercentage = 0;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
