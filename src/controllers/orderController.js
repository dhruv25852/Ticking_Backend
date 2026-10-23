const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { sendOrderConfirmationEmail } = require('../services/emailService');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      paymentId,
      discount = 0,
      couponCode = '',
      notes = ''
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items specified' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city || !shippingAddress.pincode) {
      return res.status(400).json({ message: 'Please provide complete delivery address' });
    }

    if (!shippingAddress.email && req.user && req.user.email) {
      shippingAddress.email = req.user.email;
    }

    // Verify products and calculate subtotal
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.name || item.product}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      subtotal += product.price * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        brand: product.brand,
        image: product.images[0] || '',
        price: product.price,
        quantity: item.quantity
      });

      // Deduct stock
      product.stock -= item.quantity;
      await product.save();
    }

    const discountAmount = Number(discount) || 0;
    const shippingFee = 0; // Free Worldwide Shipping

    // Read tax rate dynamically from settings singleton
    let taxRate = 5;
    try {
      const Settings = require('../models/Settings');
      const settings = await Settings.getSingleton();
      if (settings && typeof settings.taxRate === 'number') {
        taxRate = settings.taxRate;
      }
    } catch {
      taxRate = 5;
    }

    const tax = Math.round((subtotal - discountAmount) * (taxRate / 100));
    const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee + tax);

    // Generate readable luxury Order ID
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderId = `TCK-${new Date().getFullYear()}-${randomSuffix}`;
    const generatedPaymentId = paymentId || (paymentMethod === 'Cash on Delivery' ? '' : `PAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);

    const order = new Order({
      orderId,
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'Online Payment',
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
      paymentId: generatedPaymentId,
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

    const createdOrder = await order.save();

    // Clear user cart after placing order
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    // Asynchronously dispatch luxury order confirmation email via Brevo
    sendOrderConfirmationEmail({ order: createdOrder, user: req.user }).catch((emailErr) => {
      console.error('[Brevo Email] Order confirmation dispatch failed for order:', createdOrder.orderId, emailErr.message);
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only order owner or admin can view
    const orderUserId = (order.user?._id || order.user)?.toString();
    if (orderUserId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: You are not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const { status, paymentStatus, search } = req.query;
    const query = {};

    if (status && status !== 'All') {
      query.orderStatus = status;
    }
    if (paymentStatus && paymentStatus !== 'All') {
      query.paymentStatus = paymentStatus;
    }
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const wasPaymentPending = order.paymentStatus !== 'Paid';

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    const updated = await order.save();

    // If payment status transitioned to 'Paid' and confirmation email hasn't been sent yet, trigger it
    if (wasPaymentPending && updated.paymentStatus === 'Paid' && !updated.confirmationEmailSent) {
      sendOrderConfirmationEmail({ order: updated, user: updated.user }).catch((emailErr) => {
        console.error('[Brevo Email] Triggered order confirmation email dispatch error:', emailErr.message);
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const orderUserId = (order.user?._id || order.user)?.toString();
    if (orderUserId !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: You are not authorized to cancel this order' });
    }

    if (order.orderStatus === 'Delivered') {
      return res.status(400).json({ message: 'Delivered orders cannot be cancelled' });
    }

    order.orderStatus = 'Cancelled';
    await order.save();

    // Restock items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder
};
