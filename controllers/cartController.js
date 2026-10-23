const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get logged-in user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'items.product',
      select: 'name slug brand price originalPrice discountPercentage images stock specifications'
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    } else {
      // Clean up any items whose product reference was deleted
      const initialLength = cart.items.length;
      cart.items = cart.items.filter((item) => item && item.product);
      if (cart.items.length !== initialLength) {
        await cart.save();
      }
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Number(quantity) || 1;

    if (qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product && item.product.toString() === productId
    );

    const existingQty = itemIndex > -1 ? cart.items[itemIndex].quantity : 0;
    const totalQty = existingQty + qty;

    if (product.stock < totalQty) {
      return res.status(400).json({ message: `Only ${product.stock} pieces available in stock` });
    }

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = totalQty;
      cart.items[itemIndex].price = product.price;
    } else {
      cart.items.push({
        product: productId,
        quantity: qty,
        price: product.price
      });
    }

    await cart.save();
    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name slug brand price originalPrice discountPercentage images stock specifications'
    });

    if (populatedCart) {
      populatedCart.items = populatedCart.items.filter((item) => item && item.product);
    }

    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:productId
// @access  Private
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;
    const qty = Number(quantity);

    if (qty <= 0) {
      return removeFromCart(req, res);
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < qty) {
      return res.status(400).json({ message: `Maximum ${product.stock} pieces available` });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product && item.product.toString() === productId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = qty;
      cart.items[itemIndex].price = product.price;
      await cart.save();

      const populatedCart = await Cart.findById(cart._id).populate({
        path: 'items.product',
        select: 'name slug brand price originalPrice discountPercentage images stock specifications'
      });
      if (populatedCart) {
        populatedCart.items = populatedCart.items.filter((item) => item && item.product);
      }
      return res.json(populatedCart);
    } else {
      return res.status(404).json({ message: 'Item not in cart' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      (item) => item.product && item.product.toString() !== productId
    );

    await cart.save();
    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.product',
      select: 'name slug brand price originalPrice discountPercentage images stock specifications'
    });
    if (populatedCart) {
      populatedCart.items = populatedCart.items.filter((item) => item && item.product);
    }

    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear user cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Cart cleared', items: [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
