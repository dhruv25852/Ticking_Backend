const Settings = require('../models/Settings');

/**
 * @desc    Get store settings (public)
 * @route   GET /api/settings
 * @access  Public
 */
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.getSingleton();
    res.json(settings);
  } catch (error) {
    console.error('[Settings] Error fetching settings:', error);
    res.status(500).json({ message: 'Failed to retrieve settings', error: error.message });
  }
};

/**
 * @desc    Update store settings (admin only)
 * @route   PUT /api/settings
 * @access  Private/Admin
 */
const updateSettings = async (req, res) => {
  try {
    const { storeName, currency, taxRate, shippingPolicy, supportEmail, phone } = req.body;

    const updates = {};

    if (storeName !== undefined) {
      if (!storeName || !storeName.trim()) {
        return res.status(400).json({ message: 'Brand identity name cannot be empty' });
      }
      updates.storeName = storeName.trim();
    }

    if (supportEmail !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!supportEmail || !emailRegex.test(supportEmail.trim())) {
        return res.status(400).json({ message: 'A valid concierge email address is required' });
      }
      updates.supportEmail = supportEmail.trim().toLowerCase();
    }

    if (phone !== undefined) {
      if (!phone || !phone.trim()) {
        return res.status(400).json({ message: 'Boutique phone number cannot be empty' });
      }
      updates.phone = phone.trim();
    }

    if (taxRate !== undefined) {
      const parsedTax = Number(taxRate);
      if (isNaN(parsedTax) || parsedTax < 0 || parsedTax > 100) {
        return res.status(400).json({ message: 'Luxury duty / tax rate must be between 0 and 100' });
      }
      updates.taxRate = parsedTax;
    }

    if (shippingPolicy !== undefined) {
      updates.shippingPolicy = (shippingPolicy || '').trim() || 'Free Worldwide Insured Shipping';
    }

    if (currency !== undefined) {
      let cleanCurrency = (currency || '').trim();
      if (!cleanCurrency || cleanCurrency.includes('?')) {
        cleanCurrency = 'INR (₹)';
      }
      updates.currency = cleanCurrency;
    }

    // Single document guarantee: upsert on empty query matches first doc or creates one
    const updatedSettings = await Settings.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: 'Store settings saved successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('[Settings] Error updating settings:', error);
    res.status(500).json({ message: 'Failed to update store settings', error: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings
};
