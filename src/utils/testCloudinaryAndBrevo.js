const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const {
  sendOrderConfirmationEmail,
  sendRegistrationWelcomeEmail,
  generateOrderConfirmationHtml
} = require('../services/emailService');

const EXPECTED_CLOUDINARY_URLS = {
  datejust: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843446/datejust.jpg',
  daytona: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843442/daytona.jpg',
  submariner: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843445/submariner.jpg',
  nautilus: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843442/nautilus.jpg',
  overseas: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843444/overseas.jpg',
  santos: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843444/santos.jpg',
  speedmaster: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843444/speedmaster.jpg',
  navitimer: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843443/navitimer.jpg',
  lange_1815: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843442/lange_1815.jpg',
  ap_diver: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843446/ap_diver.jpg',
  hero_chronograph: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843442/hero_chronograph.jpg',
  movement_craft: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843443/movement_craft.jpg',
  tag_connected: 'https://res.cloudinary.com/bjaodxyt/image/upload/v1792843445/tag_connected.jpg'
};

async function runTests() {
  console.log('================================================================');
  console.log(' TICKING LUXARY WATCH - Cloudinary & Brevo Verification Suite   ');
  console.log('================================================================\n');

  // 1. Verify Cloudinary URLs live accessibility
  console.log('TEST 1: Verifying all 13 Cloudinary URLs live HTTP status...');
  for (const [name, url] of Object.entries(EXPECTED_CLOUDINARY_URLS)) {
    const res = await fetch(url, { method: 'HEAD' });
    if (res.status !== 200) {
      throw new Error(`Cloudinary URL failed for ${name} (${url}) with status ${res.status}`);
    }
    console.log(`  ✓ [200 OK] ${name} -> ${url}`);
  }
  console.log('✓ All 13 Cloudinary URLs are publicly accessible via HTTPS!\n');

  // 2. Connect to MongoDB Atlas
  console.log('TEST 2: Connecting to MongoDB Atlas & inspecting Product collection...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('  ✓ Connected to MongoDB Atlas');

  const products = await Product.find({});
  console.log(`  ✓ Found ${products.length} products in database.`);

  let invalidImagesCount = 0;
  for (const p of products) {
    const primaryImg = p.images?.[0];
    if (!primaryImg || !primaryImg.startsWith('https://res.cloudinary.com/')) {
      console.error(`  ✗ Product [${p.sku}] ${p.name} has non-Cloudinary image: ${primaryImg}`);
      invalidImagesCount++;
    } else {
      console.log(`  ✓ [${p.sku}] ${p.name} -> ${primaryImg}`);
    }
  }

  if (invalidImagesCount > 0) {
    throw new Error(`Found ${invalidImagesCount} products with invalid images`);
  }
  console.log('✓ All 12 products have valid Cloudinary delivery URLs!\n');

  // 3. Test Email Template with Multi-Watch Order
  console.log('TEST 3: Testing Brevo Order Confirmation HTML with Multi-Watch Order...');
  const submarinerProduct = products.find((p) => p.sku === 'TCK-RLX-SUB01') || products[0];
  const nautilusProduct = products.find((p) => p.sku === 'TCK-PP-NAUT01') || products[1];

  const multiWatchOrder = {
    orderId: `TCK-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    createdAt: new Date(),
    paymentMethod: 'Online Payment',
    paymentStatus: 'Paid',
    paymentId: `PAY-${Date.now().toString(36).toUpperCase()}`,
    subtotal: submarinerProduct.price + nautilusProduct.price,
    discount: 50000,
    couponCode: 'ROYALTY10',
    shippingFee: 0,
    tax: Math.round((submarinerProduct.price + nautilusProduct.price - 50000) * 0.05),
    grandTotal: Math.round((submarinerProduct.price + nautilusProduct.price - 50000) * 1.05),
    shippingAddress: {
      fullName: 'Dhruv Savani',
      email: process.env.BREVO_SENDER_EMAIL || 'savanidhruv411@gmail.com',
      phone: '+91 99092 25852',
      address: '742 Evergreen Terrace, Luxury Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    items: [
      {
        product: submarinerProduct._id,
        name: submarinerProduct.name,
        brand: submarinerProduct.brand,
        image: submarinerProduct.images[0],
        price: submarinerProduct.price,
        quantity: 1
      },
      {
        product: nautilusProduct._id,
        name: nautilusProduct.name,
        brand: nautilusProduct.brand,
        image: nautilusProduct.images[0],
        price: nautilusProduct.price,
        quantity: 2
      }
    ],
    confirmationEmailSent: false
  };

  const html = generateOrderConfirmationHtml(multiWatchOrder, { name: 'Dhruv Savani', email: multiWatchOrder.shippingAddress.email });

  // Verification checks on HTML
  if (html.includes('<img src="http://localhost') || html.includes('<img src="/images/')) {
    throw new Error('HTML email contains localhost or relative image paths in img src!');
  }
  if (!html.includes(EXPECTED_CLOUDINARY_URLS.submariner)) {
    throw new Error('Submariner Cloudinary URL missing from HTML email!');
  }
  if (!html.includes(EXPECTED_CLOUDINARY_URLS.nautilus)) {
    throw new Error('Nautilus Cloudinary URL missing from HTML email!');
  }
  console.log('  ✓ HTML contains correct Submariner Cloudinary HTTPS URL');
  console.log('  ✓ HTML contains correct Nautilus Cloudinary HTTPS URL');
  console.log('  ✓ Zero localhost or relative paths present in email HTML\n');

  // 4. Test Live Brevo API Dispatch for Order
  console.log('TEST 4: Sending live Brevo order confirmation email for multi-watch order...');
  const dispatchResult = await sendOrderConfirmationEmail({
    order: multiWatchOrder,
    user: { name: 'Dhruv Savani', email: multiWatchOrder.shippingAddress.email }
  });
  console.log('  Dispatch Result:', dispatchResult);
  if (!dispatchResult.success) {
    throw new Error(`Email dispatch failed: ${dispatchResult.error}`);
  }
  console.log(`  ✓ Order confirmation email delivered via Brevo (Message ID: ${dispatchResult.messageId})\n`);

  // 5. Test Deduplication
  console.log('TEST 5: Testing deduplication check (attempting duplicate email dispatch)...');
  multiWatchOrder.confirmationEmailSent = true;
  const dedupResult = await sendOrderConfirmationEmail({
    order: multiWatchOrder,
    user: { name: 'Dhruv Savani', email: multiWatchOrder.shippingAddress.email }
  });
  console.log('  Deduplication Result:', dedupResult);
  if (!dedupResult.skipped) {
    throw new Error('Deduplication failed: email was not skipped');
  }
  console.log('  ✓ Duplicate email dispatch was safely skipped!\n');

  // 6. Test Welcome Email
  console.log('TEST 6: Testing Registration Welcome email dispatch via Brevo...');
  const welcomeResult = await sendRegistrationWelcomeEmail({
    name: 'Dhruv Savani',
    email: process.env.BREVO_SENDER_EMAIL || 'savanidhruv411@gmail.com'
  });
  console.log('  Welcome Email Result:', welcomeResult);
  if (!welcomeResult.success) {
    throw new Error(`Welcome email failed: ${welcomeResult.error}`);
  }
  console.log(`  ✓ Registration welcome email delivered via Brevo (Message ID: ${welcomeResult.messageId})\n`);

  console.log('================================================================');
  console.log(' ALL 6 VERIFICATION SUITE TESTS PASSED WITH 100% SUCCESS!       ');
  console.log('================================================================');

  await mongoose.disconnect();
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nTest Suite Failed:', err);
    mongoose.disconnect().finally(() => process.exit(1));
  });
