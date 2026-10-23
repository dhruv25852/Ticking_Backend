const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { sendOrderConfirmationEmail } = require('../services/emailService');

async function testE2EFlow() {
  console.log('--- TICKING End-to-End Order Email & MongoDB Persistence Test ---');

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI not defined in .env');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✓ Connected to MongoDB Atlas successfully');

  // Find a product
  const product = await Product.findOne();
  if (!product) {
    throw new Error('No product found in database');
  }
  console.log(`✓ Found sample watch: "${product.name}" (Price: ₹${product.price})`);

  // Find or create test customer
  let user = await User.findOne({ role: 'customer' });
  if (!user) {
    user = await User.findOne();
  }
  console.log(`✓ Customer: ${user.name} (${user.email})`);

  // Create real test Order document in MongoDB
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const testOrderId = `TCK-TEST-${randomSuffix}`;

  const order = new Order({
    orderId: testOrderId,
    user: user._id,
    items: [
      {
        product: product._id,
        name: product.name,
        brand: product.brand || 'Luxury Manufacture',
        image: product.images[0] || '',
        price: product.price,
        quantity: 1
      }
    ],
    shippingAddress: {
      fullName: user.name || 'Test Collector',
      email: process.env.BREVO_SENDER_EMAIL || user.email, // Deliver to sender email to ensure test receipt
      phone: '+91 99092 25852',
      address: 'Boutique Suite 101, Luxury Arcade',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395007'
    },
    paymentMethod: 'Online Payment',
    paymentStatus: 'Paid',
    paymentId: `PAY-E2E-${Date.now().toString(36).toUpperCase()}`,
    orderStatus: 'Confirmed',
    subtotal: product.price,
    discount: 0,
    shippingFee: 0,
    tax: Math.round(product.price * 0.05),
    grandTotal: Math.round(product.price * 1.05),
    trackingNumber: `TCK-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
    notes: 'Automated Brevo integration verification order'
  });

  const savedOrder = await order.save();
  console.log(`✓ Order created in MongoDB: ${savedOrder.orderId} (_id: ${savedOrder._id})`);
  console.log(`  Initial confirmationEmailSent: ${savedOrder.confirmationEmailSent}`);

  // Dispatch confirmation email
  console.log('Sending order confirmation email through Brevo...');
  const result = await sendOrderConfirmationEmail({ order: savedOrder, user });
  console.log('Dispatch result:', result);

  if (!result.success) {
    throw new Error(`Order email failed: ${result.error || result.reason}`);
  }

  // Reload order from MongoDB to verify persistence
  const reloadedOrder = await Order.findById(savedOrder._id);
  console.log(`✓ Reloaded MongoDB Order confirmationEmailSent: ${reloadedOrder.confirmationEmailSent}`);
  console.log(`✓ Confirmation Email Sent At: ${reloadedOrder.confirmationEmailSentAt}`);

  if (!reloadedOrder.confirmationEmailSent) {
    throw new Error('Verification failed: confirmationEmailSent was not set to true in MongoDB');
  }

  // Attempt duplicate dispatch - must be skipped
  console.log('Verifying duplicate prevention...');
  const duplicateResult = await sendOrderConfirmationEmail({ order: reloadedOrder, user });
  console.log('Duplicate check result:', duplicateResult);
  if (!duplicateResult.skipped) {
    throw new Error('Duplicate prevention failed: email was not skipped');
  }
  console.log('✓ Duplicate check successfully skipped!');

  // Clean up test order
  await Order.findByIdAndDelete(savedOrder._id);
  console.log('✓ Cleaned up test order document');

  await mongoose.disconnect();
  console.log('\n--- All E2E Order Email tests passed successfully! ---');
}

testE2EFlow()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('E2E Test Failed:', err);
    mongoose.disconnect().finally(() => process.exit(1));
  });
