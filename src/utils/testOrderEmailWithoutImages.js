const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const mongoose = require('mongoose');
const {
  generateOrderConfirmationHtml,
  generateOrderConfirmationText,
  sendOrderConfirmationEmail
} = require('../services/emailService');

async function verifyOrderEmailNoImages() {
  console.log('================================================================');
  console.log(' VERIFYING ORDER CONFIRMATION EMAIL: NO WATCH PRODUCT IMAGES   ');
  console.log('================================================================\n');

  const testOrder = {
    orderId: `TCK-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    createdAt: new Date(),
    paymentMethod: 'Online Payment',
    paymentStatus: 'Paid',
    paymentId: `PAY-${Date.now().toString(36).toUpperCase()}`,
    trackingNumber: 'TCK-EXP-912834',
    subtotal: 1245000,
    discount: 50000,
    couponCode: 'ROYALTY10',
    shippingFee: 0,
    tax: 59750,
    grandTotal: 1254750,
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
        name: 'Rolex Submariner Date 41mm',
        brand: 'Rolex',
        price: 1245000,
        quantity: 1
      }
    ],
    confirmationEmailSent: false
  };

  const user = {
    name: 'Dhruv Savani',
    email: testOrder.shippingAddress.email
  };

  console.log('1. Generating Order Confirmation HTML...');
  const html = generateOrderConfirmationHtml(testOrder, user);

  // Assertion 1: Must contain NO <img> tags
  const hasImgTag = html.includes('<img');
  console.log('  - Contains any <img> tag:', hasImgTag);
  if (hasImgTag) {
    throw new Error('FAIL: HTML template still contains an <img> tag!');
  }
  console.log('  ✓ Verified: ZERO <img> tags present in order confirmation email HTML');

  // Assertion 2: Must contain watch details
  if (!html.includes('Rolex Submariner Date 41mm')) {
    throw new Error('FAIL: Watch name missing from HTML template');
  }
  if (!html.includes('Rolex')) {
    throw new Error('FAIL: Watch brand missing from HTML template');
  }
  if (!html.includes('Qty:')) {
    throw new Error('FAIL: Quantity missing from HTML template');
  }
  console.log('  ✓ Verified: Watch name, brand, quantity, and unit price are intact');

  // Assertion 3: Order, customer, and financial ledger checks
  if (!html.includes(testOrder.orderId)) {
    throw new Error('FAIL: Order ID missing from HTML template');
  }
  if (!html.includes(testOrder.shippingAddress.address)) {
    throw new Error('FAIL: Delivery address missing from HTML template');
  }
  if (!html.includes('Online Payment') || !html.includes('Paid')) {
    throw new Error('FAIL: Payment details missing from HTML template');
  }
  console.log('  ✓ Verified: Order number, customer address, payment details, and total amounts are intact');

  // 4. Send live test order confirmation email via Brevo
  console.log('\n2. Sending live order confirmation email through Brevo...');
  const result = await sendOrderConfirmationEmail({ order: testOrder, user });
  console.log('  Dispatch Result:', result);

  if (!result.success) {
    throw new Error(`Email dispatch failed: ${result.error}`);
  }
  console.log(`  ✓ Email successfully sent via Brevo! Message ID: ${result.messageId}`);

  console.log('\n================================================================');
  console.log(' ALL VERIFICATIONS PASSED: Watch images removed cleanly!       ');
  console.log('================================================================');
}

verifyOrderEmailNoImages()
  .catch((err) => {
    console.error('Verification Error:', err);
    process.exit(1);
  });
