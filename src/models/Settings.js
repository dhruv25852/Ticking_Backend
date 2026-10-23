const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: [true, 'Brand identity name is required'],
      default: 'TICKING LUXARY WATCH',
      trim: true
    },
    currency: {
      type: String,
      default: 'INR (₹)',
      trim: true
    },
    taxRate: {
      type: Number,
      default: 5,
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%']
    },
    shippingPolicy: {
      type: String,
      default: 'Free Worldwide Insured Shipping',
      trim: true
    },
    supportEmail: {
      type: String,
      required: [true, 'Concierge support email is required'],
      default: 'ticking@gmail.com',
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: [true, 'Boutique phone number is required'],
      default: '9909225852',
      trim: true
    }
  },
  {
    timestamps: true
  }
);

/**
 * Singleton helper: retrieves the existing settings document,
 * or initializes it with the default values if no document exists.
 */
settingsSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      storeName: 'TICKING LUXARY WATCH',
      currency: 'INR (₹)',
      taxRate: 5,
      shippingPolicy: 'Free Worldwide Insured Shipping',
      supportEmail: 'ticking@gmail.com',
      phone: '9909225852'
    });
  } else if (!settings.currency || settings.currency.includes('?')) {
    settings.currency = 'INR (₹)';
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
