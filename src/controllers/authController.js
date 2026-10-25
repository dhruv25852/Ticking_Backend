const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const { sendRegistrationWelcomeEmail, sendAccountDeletedEmail } = require('../services/emailService');
const {
  isCloudinaryConfigured,
  uploadStreamToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl
} = require('../config/cloudinary');

const generateToken = (id, role = 'customer') => {
  const secret = process.env.JWT_SECRET || 'ticking_luxury_watches_super_secret_jwt_key_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id, role }, secret, {
    expiresIn
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role: 'customer',
      isActive: true,
      deletedAt: null
    });

    if (user) {
      // Trigger Brevo welcome email after successful MongoDB user creation
      sendRegistrationWelcomeEmail({ name: user.name, email: user.email }).catch((emailErr) => {
        console.error('[Brevo Email] Error during registration welcome email dispatch:', emailErr?.message);
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar || '',
        isActive: user.isActive,
        token: generateToken(user._id, user.role)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
      if (user.isActive === false) {
        return res.status(403).json({
          message: 'This account has been deactivated. Please contact TICKING concierge for assistance.'
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar || '',
        isActive: user.isActive,
        addresses: user.addresses,
        token: generateToken(user._id, user.role)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && user.role === 'admin' && (await user.matchPassword(password))) {
      if (user.isActive === false) {
        return res.status(403).json({
          message: 'Admin account has been deactivated.'
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        isActive: user.isActive,
        token: generateToken(user._id, user.role)
      });
    } else if (user && user.role !== 'admin') {
      res.status(403).json({ message: 'Access denied: You do not have administrator privileges.' });
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user account / profile
// @route   PUT /api/auth/update-account
// @route   PUT /api/auth/profile
// @access  Private
const updateAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;

      if (req.body.email && req.body.email.toLowerCase() !== user.email) {
        const emailTaken = await User.findOne({
          email: req.body.email.toLowerCase(),
          _id: { $ne: user._id }
        });
        if (emailTaken) {
          return res.status(400).json({ message: 'Email address is already registered' });
        }
        user.email = req.body.email.toLowerCase();
      }

      if (req.body.address) {
        user.addresses = [req.body.address];
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      if (req.body.avatar !== undefined) {
        user.avatar = req.body.avatar;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatar: updatedUser.avatar || '',
        isActive: updatedUser.isActive,
        addresses: updatedUser.addresses,
        token: generateToken(updatedUser._id, updatedUser.role)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !currentPassword.trim()) {
      return res.status(400).json({ message: 'Current password is required' });
    }

    if (!newPassword || !newPassword.trim()) {
      return res.status(400).json({ message: 'New password is required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password cannot be the same as your current password' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password against stored bcrypt hash
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Assign new password; mongoose pre-save hook will hash it with bcrypt
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('[Change Password Error]:', error.message);
    res.status(500).json({ message: error.message || 'Server error while updating password' });
  }
};

// @desc    Upload profile photo to Cloudinary
// @route   POST /api/auth/profile/photo
// @access  Private
const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please select an image file to upload.' });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        message: 'Cloudinary credentials are not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env to enable photo uploads.',
        code: 'CLOUDINARY_NOT_CONFIGURED'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Safely delete previous Cloudinary profile photo if present
    if (user.avatarPublicId) {
      await deleteFromCloudinary(user.avatarPublicId);
    } else if (user.avatar && user.avatar.includes('res.cloudinary.com')) {
      const extracted = extractPublicIdFromUrl(user.avatar);
      if (extracted) await deleteFromCloudinary(extracted);
    }

    // Upload to Cloudinary with square crop & face gravity for avatars
    const result = await uploadStreamToCloudinary(req.file.buffer, {
      folder: 'ticking/avatars',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });

    user.avatar = result.secure_url;
    user.avatarPublicId = result.public_id;
    const updatedUser = await user.save();

    res.json({
      message: 'Profile photo updated successfully',
      avatar: updatedUser.avatar,
      avatarPublicId: updatedUser.avatarPublicId,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        isActive: updatedUser.isActive,
        addresses: updatedUser.addresses
      }
    });
  } catch (error) {
    console.error('[Profile Photo Upload Error]:', error);
    res.status(error.statusCode || 500).json({
      message: error.message || 'Failed to upload profile photo'
    });
  }
};

// @desc    Remove profile photo
// @route   DELETE /api/auth/profile/photo
// @access  Private
const deleteProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.avatarPublicId) {
      await deleteFromCloudinary(user.avatarPublicId);
    } else if (user.avatar && user.avatar.includes('res.cloudinary.com')) {
      const extracted = extractPublicIdFromUrl(user.avatar);
      if (extracted) await deleteFromCloudinary(extracted);
    }

    user.avatar = '';
    user.avatarPublicId = '';
    const updatedUser = await user.save();

    res.json({
      message: 'Profile photo removed successfully',
      avatar: '',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatar: '',
        isActive: updatedUser.isActive,
        addresses: updatedUser.addresses
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to remove profile photo' });
  }
};

// @desc    Permanently delete user account after password verification
// @route   DELETE /api/auth/delete-account
// @route   POST /api/auth/delete-account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    // 1. Password is required
    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required to delete your account'
      });
    }

    // 2. Fetch authenticated user with password from database
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    // 3. Prevent accidental deletion of primary master administrator account
    if (user.role === 'admin' && user.email.toLowerCase() === 'admin@ticking.com') {
      return res.status(403).json({
        success: false,
        message: 'The primary master administrator account cannot be deleted'
      });
    }

    // 4. Verify password securely using bcrypt
    const isMatch = await user.matchPassword(password.trim());
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Account deletion cancelled.'
      });
    }

    // Capture user details for confirmation email before deletion
    const userEmail = user.email;
    const userName = user.name;
    const userId = user._id;
    const deletionDate = new Date();

    // 5. Clean up avatar from Cloudinary if stored there
    try {
      if (user.avatarPublicId) {
        await deleteFromCloudinary(user.avatarPublicId);
      } else if (user.avatar && user.avatar.includes('res.cloudinary.com')) {
        const extracted = extractPublicIdFromUrl(user.avatar);
        if (extracted) await deleteFromCloudinary(extracted);
      }
    } catch (cloudErr) {
      console.warn('[Account Deletion] Could not remove avatar from Cloudinary:', cloudErr.message);
    }

    // 6. Clean up temporary personal cart and wishlist data
    try {
      const Cart = require('../models/Cart');
      const Wishlist = require('../models/Wishlist');
      await Cart.deleteMany({ user: userId });
      await Wishlist.deleteMany({ user: userId });
    } catch (cleanErr) {
      console.warn('[Account Deletion] Notice during cart/wishlist cleanup:', cleanErr.message);
    }

    // 7. Delete the user document securely from MongoDB Atlas
    // Historical order records in the Order collection are preserved for business, tax, and warranty compliance
    await User.findByIdAndDelete(userId);

    // 8. Send Account Deleted confirmation email via Brevo
    try {
      await sendAccountDeletedEmail({
        name: userName,
        email: userEmail,
        deletionDate
      });
    } catch (emailErr) {
      console.error('[Account Deletion] Brevo email notification failed:', emailErr.message);
    }

    // 9. Clear session cookie
    res.cookie('token', '', {
      httpOnly: true,
      expires: new Date(0)
    });

    return res.json({
      success: true,
      message: 'Account successfully deleted. A confirmation email has been sent.'
    });
  } catch (error) {
    console.error('[Account Deletion Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while deleting account'
    });
  }
};

// @desc    Get all customers for admin
// @route   GET /api/auth/customers
// @access  Private/Admin
const getCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: { $ne: 'admin' } })
      .select('-password')
      .sort({ createdAt: -1 });

    const customersWithOrders = await Promise.all(
      customers.map(async (cust) => {
        const userOrders = await Order.find({
          $or: [
            { user: cust._id },
            { 'shippingAddress.email': cust.email.toLowerCase() }
          ],
          orderStatus: { $ne: 'Cancelled' }
        });

        const totalOrders = userOrders.length;
        const totalSpent = userOrders.reduce(
          (acc, curr) => acc + (curr.grandTotal || curr.totalAmount || curr.subtotal || 0),
          0
        );

        return {
          ...cust.toObject(),
          totalOrders,
          totalSpent
        };
      })
    );

    res.json(customersWithOrders);
  } catch (error) {
    console.error('[Get Customers Error]:', error);
    res.status(500).json({ message: error.message || 'Failed to retrieve customers from MongoDB Atlas' });
  }
};

// @desc    Activate or deactivate customer status
// @route   PATCH /api/auth/customers/:id/status
// @access  Private/Admin
const updateCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean (true or false)' });
    }

    const customer = await User.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.isActive = isActive;
    customer.deletedAt = isActive ? null : new Date();
    await customer.save();

    res.json({
      success: true,
      message: `Customer ${customer.name} has been ${isActive ? 'activated' : 'deactivated'}`,
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        isActive: customer.isActive,
        deletedAt: customer.deletedAt
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user / clear cookies
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = {
  registerUser,
  loginUser,
  adminLogin,
  logoutUser,
  getUserProfile,
  updateUserProfile: updateAccount,
  updateAccount,
  changePassword,
  deleteAccount,
  getCustomers,
  updateCustomerStatus,
  uploadProfilePhoto,
  deleteProfilePhoto
};
