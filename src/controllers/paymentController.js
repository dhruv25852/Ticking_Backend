const crypto = require('crypto');
const { getRazorpayInstance, isRazorpayConfigured } = require('../config/razorpay');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Settings = require('../models/Settings');
const { sendOrderConfirmationEmail, sendPaymentSuccessEmail } = require('../services/emailService');

// @desc    Get Razorpay Public Configuration
// @route   GET /api/payment/config
// @access  Public / Private
const getPaymentConfig = (req, res) => {
  res.json({
    keyId: process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.trim() : '',
    isConfigured: isRazorpayConfigured()
  });
};

// @desc    Create Razorpay Order for Checkout
// @route   POST /api/payment/razorpay/create-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        message:
          'Razorpay Test Mode credentials are not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env to accept online card payments.'
      });
    }

    const { items, discount = 0 } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'No items in order to calculate payment' });
    }

    // Validate product existence and live pricing against MongoDB Atlas
    let subtotal = 0;
    for (const item of items) {
      const productId = item.product || item._id;
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Timepiece not found: ${productId}` });
      }

      const qty = Number(item.quantity) || 1;
      if (product.stock < qty) {
        return res.status(400).json({ message: `Insufficient vault stock for "${product.name}". Remaining: ${product.stock}` });
      }

      subtotal += product.price * qty;
    }

    const discountAmount = Math.max(0, Number(discount) || 0);

    // Read live tax rate from MongoDB Atlas settings singleton
    let taxRate = 5;
    try {
      const settings = await Settings.getSingleton();
      if (settings && typeof settings.taxRate === 'number') {
        taxRate = settings.taxRate;
      }
    } catch {
      taxRate = 5;
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const tax = Math.round(taxableAmount * (taxRate / 100));
    const grandTotal = Math.max(0, taxableAmount + tax);

    // Razorpay processes amounts in the smallest currency subunit (paise for INR)
    const amountInPaise = Math.round(grandTotal * 100);

    if (amountInPaise <= 0) {
      return res.status(400).json({ message: 'Order total must be greater than zero' });
    }

    const razorpay = getRazorpayInstance();
    if (!razorpay) {
      return res.status(503).json({
        message: 'Unable to initialize Razorpay client. Please verify credentials in backend/.env.'
      });
    }

    // Generate unique receipt reference
    const receiptId = `tck_${Date.now().toString(36)}_${Math.floor(100 + Math.random() * 900)}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        userId: req.user._id.toString(),
        customerEmail: req.user.email || ''
      }
    });

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID.trim(),
      grandTotal,
      subtotal,
      tax,
      discount: discountAmount
    });
  } catch (error) {
    console.error('[Razorpay Create Order Error]:', error);
    const rawErrorDesc = error.error?.description || error.message || 'Failed to initiate Razorpay order';
    const isAmountExceeded =
      rawErrorDesc.toLowerCase().includes('amount exceeds maximum') ||
      (error.error?.code === 'BAD_REQUEST_ERROR' &&
        String(error.error?.description || '').toLowerCase().includes('amount exceeds'));

    let errorMessage = rawErrorDesc;
    if (isAmountExceeded) {
      errorMessage =
        'This order amount exceeds the standard transaction limit enforced by your Razorpay merchant account (typically ₹5,00,000 for default accounts). To process higher-value timepiece acquisitions online, the merchant account must request a transaction limit approval via the Razorpay Dashboard. In the meantime, you can complete your acquisition using Cash on Delivery or contact concierge support.';
    }

    res.status(400).json({
      message: errorMessage,
      isLimitExceeded: isAmountExceeded,
      razorpayError: rawErrorDesc
    });
  }
};

// @desc    Cryptographically verify Razorpay Payment and finalize order
// @route   POST /api/payment/razorpay/verify
// @access  Private
const verifyRazorpayPayment = async (req, res) => {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        message:
          'Razorpay Test Mode credentials are not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.'
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderDetails
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: 'Missing required Razorpay payment verification parameters'
      });
    }

    // Cryptographic HMAC SHA256 verification
    const secret = process.env.RAZORPAY_KEY_SECRET.trim();
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: 'Cryptographic signature mismatch. Payment verification failed.'
      });
    }

    // Check for replay attacks or duplicate order creation
    const existingOrder = await Order.findOne({
      $or: [
        { paymentId: razorpay_payment_id },
        { razorpayOrderId: razorpay_order_id }
      ]
    });

    if (existingOrder) {
      return res.status(200).json(existingOrder);
    }

    const {
      items,
      shippingAddress,
      discount = 0,
      couponCode = '',
      notes = ''
    } = orderDetails || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required to complete acquisition' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city || !shippingAddress.pincode) {
      return res.status(400).json({ message: 'Please provide complete delivery destination' });
    }

    if (!shippingAddress.email && req.user && req.user.email) {
      shippingAddress.email = req.user.email;
    }

    // Re-verify products, compute prices from DB, and deduct inventory stock
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const productId = item.product || item._id;
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Timepiece not found in catalog: ${productId}` });
      }

      const qty = Number(item.quantity) || 1;
      subtotal += product.price * qty;

      orderItems.push({
        product: product._id,
        name: product.name,
        brand: product.brand,
        image: product.images[0] || '',
        price: product.price,
        quantity: qty
      });

      // Deduct stock safely
      product.stock = Math.max(0, product.stock - qty);
      await product.save();
    }

    const discountAmount = Math.max(0, Number(discount) || 0);
    const shippingFee = 0; // Complimentary Insured Global Transit

    // Live tax rate from settings
    let taxRate = 5;
    try {
      const settings = await Settings.getSingleton();
      if (settings && typeof settings.taxRate === 'number') {
        taxRate = settings.taxRate;
      }
    } catch {
      taxRate = 5;
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const tax = Math.round(taxableAmount * (taxRate / 100));
    const grandTotal = Math.max(0, taxableAmount + shippingFee + tax);

    // Generate luxury Order reference
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderId = `TCK-${new Date().getFullYear()}-${randomSuffix}`;

    const newOrder = new Order({
      orderId,
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod: 'Online Payment',
      paymentStatus: 'Paid',
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature,
      orderStatus: 'Confirmed',
      subtotal,
      discount: discountAmount,
      shippingFee,
      tax,
      grandTotal,
      couponCode,
      trackingNumber: `TCK-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      notes
    });

    const createdOrder = await newOrder.save();

    // Clear customer cart in MongoDB Atlas
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // Asynchronously send luxury Brevo Order Confirmation email
    sendOrderConfirmationEmail({
      order: createdOrder,
      user: req.user
    }).catch((emailErr) => {
      console.error('[Brevo Email] Order confirmation dispatch failed for order:', createdOrder.orderId, emailErr.message);
    });

    // Asynchronously send luxury Brevo Payment Successful confirmation email
    sendPaymentSuccessEmail({
      order: createdOrder,
      user: req.user,
      paymentDetails: {
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        paymentMethod: 'Online Payment (Razorpay Card / NetBanking / UPI)'
      }
    }).catch((emailErr) => {
      console.error('[Brevo Email] Payment success notification dispatch failed for order:', createdOrder.orderId, emailErr.message);
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error('[Razorpay Verify Error]:', error);
    res.status(500).json({ message: error.message || 'Internal payment verification failure' });
  }
};

module.exports = {
  getPaymentConfig,
  createRazorpayOrder,
  verifyRazorpayPayment
};
