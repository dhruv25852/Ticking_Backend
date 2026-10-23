const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const {
  sendOrderConfirmationEmail,
  generateOrderConfirmationHtml,
  generateOrderConfirmationText
} = require('../services/emailService');

async function runDiagnostics() {
  console.log('--- TICKING Brevo Order Confirmation Email Diagnostics ---');
  console.log('BREVO_API_KEY configured:', Boolean(process.env.BREVO_API_KEY));
  console.log('BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL);
  console.log('BREVO_SENDER_NAME:', process.env.BREVO_SENDER_NAME);

  const mockOrder = {
    orderId: `TCK-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    createdAt: new Date(),
    paymentMethod: 'Online Payment',
    paymentStatus: 'Paid',
    paymentId: `PAY-MOCK-${Date.now().toString(36).toUpperCase()}`,
    trackingNumber: 'TCK-EXP-847291',
    subtotal: 1850000,
    discount: 50000,
    couponCode: 'ROYALTY10',
    shippingFee: 0,
    tax: 90000,
    grandTotal: 1890000,
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
        name: 'Rolex Cosmograph Daytona - Oyster, 40 mm, Everose Gold',
        brand: 'Rolex',
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
        price: 1850000,
        quantity: 1
      }
    ],
    confirmationEmailSent: false
  };

  const user = {
    name: 'Dhruv Savani',
    email: process.env.BREVO_SENDER_EMAIL || 'savanidhruv411@gmail.com'
  };

  console.log('\n1. Testing HTML generator...');
  const html = generateOrderConfirmationHtml(mockOrder, user);
  if (!html || !html.includes(mockOrder.orderId) || !html.includes('₹')) {
    throw new Error('HTML generation failed currency or orderId checks');
  }
  console.log('✓ HTML generated successfully, length:', html.length);

  console.log('\n2. Testing Plain text generator...');
  const text = generateOrderConfirmationText(mockOrder, user);
  if (!text || !text.includes('ORDER CONFIRMATION') || !text.includes('₹')) {
    throw new Error('Text generation failed summary ledger checks');
  }
  console.log('✓ Plain text generated successfully, length:', text.length);

  console.log('\n3. Testing live Brevo API order confirmation dispatch to:', mockOrder.shippingAddress.email);
  const result = await sendOrderConfirmationEmail({ order: mockOrder, user });
  console.log('Dispatch result:', result);

  if (!result.success && !result.skipped) {
    throw new Error(`Email dispatch failed: ${result.error}`);
  }

  console.log('\n4. Testing Deduplication Check (calling again on same order)...');
  mockOrder.confirmationEmailSent = true;
  const dedupResult = await sendOrderConfirmationEmail({ order: mockOrder, user });
  console.log('Deduplication result:', dedupResult);
  if (!dedupResult.skipped) {
    throw new Error('Deduplication test failed: duplicate was not skipped');
  }
  console.log('✓ Deduplication verified successfully');

  console.log('\nAll order confirmation email tests passed successfully!');
}

runDiagnostics()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Diagnostic error:', err);
    process.exit(1);
  });
