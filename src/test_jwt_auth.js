/**
 * Complete JWT Authentication & Authorization Verification Suite for TICKING
 * Tests all 12 core requirements across public, customer, and admin flows.
 */
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:5000/api';

const results = [];
function record(testName, passed, details = '') {
  results.push({ testName, passed, details });
  const mark = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`${mark}: ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function fetchJson(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-test-suite': 'true',
      ...options.headers
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log('STARTING TICKING JWT AUTHENTICATION VERIFICATION SUITE');
  console.log('======================================================\n');

  const timestamp = Date.now();
  const userAEmail = `user_a_${timestamp}@test.com`;
  const userBEmail = `user_b_${timestamp}@test.com`;
  const initialPassword = 'password123';
  const newPassword = 'newSecretPassword456';

  let userAToken = null;
  let userAId = null;
  let userBToken = null;
  let userBId = null;
  let adminToken = null;
  let sampleProductId = null;

  // 0. Setup: fetch sample product
  try {
    const prodRes = await fetchJson('/products');
    if (prodRes.status === 200 && prodRes.data.products && prodRes.data.products.length > 0) {
      sampleProductId = prodRes.data.products[0]._id;
    }
  } catch (err) {
    console.error('Setup error:', err.message);
  }

  // TEST 1: User Registration and Login
  try {
    // 1a. Register User A
    const regRes = await fetchJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Horology Connoisseur A',
        email: userAEmail,
        password: initialPassword,
        phone: '9876543210'
      })
    });
    const regPass = regRes.status === 201 && regRes.data.token && regRes.data.role === 'customer' && !regRes.data.password;
    record('Test 1a: Customer Registration', regPass, `Status: ${regRes.status}`);
    userAToken = regRes.data.token;
    userAId = regRes.data._id;

    // 1b. Login User A
    const loginRes = await fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: userAEmail, password: initialPassword })
    });
    const loginPass = loginRes.status === 200 && loginRes.data.token && loginRes.data.email === userAEmail;
    record('Test 1b: Customer Login', loginPass, `Status: ${loginRes.status}`);
    userAToken = loginRes.data.token;

    // 1c. Admin Login
    const adminLoginRes = await fetchJson('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@ticking.com', password: 'adminpassword123' })
    });
    const adminPass = adminLoginRes.status === 200 && adminLoginRes.data.token && adminLoginRes.data.role === 'admin';
    record('Test 1c: Master Admin Login', adminPass, `Status: ${adminLoginRes.status}`);
    adminToken = adminLoginRes.data.token;

    // Register User B
    const regBRes = await fetchJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Collector B',
        email: userBEmail,
        password: initialPassword
      })
    });
    userBToken = regBRes.data.token;
    userBId = regBRes.data._id;
  } catch (err) {
    record('Test 1: User Registration and Login', false, err.message);
  }

  // TEST 2: Incorrect Credentials & Role Enforcements
  try {
    // Wrong password for customer
    const wrongPass = await fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: userAEmail, password: 'wrong_password_999' })
    });
    record('Test 2a: Customer Login with Wrong Password', wrongPass.status === 401, `Status: ${wrongPass.status}`);

    // Non-existent email
    const nonExist = await fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: `nonexistent_${timestamp}@test.com`, password: 'password123' })
    });
    record('Test 2b: Non-existent User Login', nonExist.status === 401, `Status: ${nonExist.status}`);

    // Normal customer attempts admin login
    const normalAsAdmin = await fetchJson('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: userAEmail, password: initialPassword })
    });
    record('Test 2c: Non-Admin Attempt on Admin Login Endpoint', normalAsAdmin.status === 403, `Status: ${normalAsAdmin.status}`);

    // Admin login with wrong password
    const adminWrongPass = await fetchJson('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@ticking.com', password: 'incorrect_admin_pass' })
    });
    record('Test 2d: Admin Login with Wrong Password', adminWrongPass.status === 401, `Status: ${adminWrongPass.status}`);
  } catch (err) {
    record('Test 2: Incorrect Credentials', false, err.message);
  }

  // TEST 3: Missing, Invalid, Malformed, and Expired JWTs
  try {
    // Missing token
    const noToken = await fetchJson('/auth/profile');
    record('Test 3a: Request with Missing Token', noToken.status === 401, `Status: ${noToken.status}`);

    // Malformed token
    const malformed = await fetchJson('/auth/profile', {
      headers: { Authorization: 'Bearer thisisnotavalidjwttoken' }
    });
    record('Test 3b: Request with Malformed Token', malformed.status === 401, `Status: ${malformed.status}`);

    // Token signed with invalid/untrusted secret
    const fakeToken = jwt.sign({ id: userAId }, 'attacker_compromised_secret_key', { expiresIn: '1h' });
    const wrongSecret = await fetchJson('/auth/profile', {
      headers: { Authorization: `Bearer ${fakeToken}` }
    });
    record('Test 3c: Request with Token Signed by Untrusted Secret', wrongSecret.status === 401, `Status: ${wrongSecret.status}`);

    // Expired token
    const expiredToken = jwt.sign(
      { id: userAId, exp: Math.floor(Date.now() / 1000) - 60 },
      process.env.JWT_SECRET || 'ticking_luxury_watches_super_secret_jwt_key_2026'
    );
    const expiredReq = await fetchJson('/auth/profile', {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    record('Test 3d: Request with Expired Token', expiredReq.status === 401 && expiredReq.data.expired === true, `Status: ${expiredReq.status}`);
  } catch (err) {
    record('Test 3: Token Validation', false, err.message);
  }

  // TEST 4: Accessing Protected Endpoints Without Authentication
  try {
    const p1 = await fetchJson('/orders/my-orders');
    const p2 = await fetchJson('/cart');
    const p3 = await fetchJson('/wishlist');
    const p4 = await fetchJson('/auth/profile', { method: 'PUT', body: JSON.stringify({ name: 'Hacker' }) });
    const allProtected = [p1, p2, p3, p4].every((r) => r.status === 401);
    record('Test 4a: Protected User Endpoints Block Unauthenticated Access', allProtected);

    // Verify public endpoints are still accessible
    const pubProducts = await fetchJson('/products');
    const pubSettings = await fetchJson('/settings');
    const pubHealth = await fetchJson('/health');
    const allPublic = pubProducts.status === 200 && pubSettings.status === 200 && pubHealth.status === 200;
    record('Test 4b: Public Browsing Endpoints Remain Accessible', allPublic);
  } catch (err) {
    record('Test 4: Unauthenticated Access', false, err.message);
  }

  // TEST 5: User Access to Another User's Resources (Cross-User Isolation)
  try {
    // User A creates an order
    const createOrderRes = await fetchJson('/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        items: [{ product: sampleProductId, quantity: 1 }],
        shippingAddress: {
          fullName: 'Connoisseur A',
          email: userAEmail,
          phone: '9876543210',
          address: '42 Royal Horology Way',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        paymentMethod: 'Cash on Delivery'
      })
    });
    const orderA = createOrderRes.data;
    const orderCreated = createOrderRes.status === 201 && orderA._id;
    record('Test 5a: User A Places Order', orderCreated, `Order ID: ${orderA?.orderId || orderA?._id}`);

    if (orderA && orderA._id) {
      // User B attempts to view User A's order
      const crossView = await fetchJson(`/orders/${orderA._id}`, {
        headers: { Authorization: `Bearer ${userBToken}` }
      });
      record('Test 5b: User B Attempting to View User A Order Blocked (403)', crossView.status === 403, `Status: ${crossView.status}`);

      // User B attempts to cancel User A's order
      const crossCancel = await fetchJson(`/orders/${orderA._id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${userBToken}` }
      });
      record('Test 5c: User B Attempting to Cancel User A Order Blocked (403)', crossCancel.status === 403, `Status: ${crossCancel.status}`);

      // User A can view own order
      const ownerView = await fetchJson(`/orders/${orderA._id}`, {
        headers: { Authorization: `Bearer ${userAToken}` }
      });
      record('Test 5d: Owner (User A) Permitted to View Own Order (200)', ownerView.status === 200);

      // Admin can view order
      const adminView = await fetchJson(`/orders/${orderA._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      record('Test 5e: Administrator Permitted to View Any Order (200)', adminView.status === 200);
    }
  } catch (err) {
    record('Test 5: Cross-User Resource Isolation', false, err.message);
  }

  // TEST 6: Normal User Attempts to Access Admin APIs
  try {
    const a1 = await fetchJson('/admin/dashboard', { headers: { Authorization: `Bearer ${userAToken}` } });
    const a2 = await fetchJson('/admin/customers', { headers: { Authorization: `Bearer ${userAToken}` } });
    const a3 = await fetchJson('/admin/inventory', { headers: { Authorization: `Bearer ${userAToken}` } });
    const a4 = await fetchJson('/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({ storeName: 'Hacked Store' })
    });
    const a5 = await fetchJson('/reseed', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` }
    });

    const allAdminBlocked = [a1, a2, a3, a4, a5].every((r) => r.status === 403);
    record('Test 6a: Normal Customer Blocked From All Admin Endpoints (403)', allAdminBlocked, `Statuses: ${[a1, a2, a3, a4, a5].map((r) => r.status).join(',')}`);

    // Verified Admin access
    const adminDash = await fetchJson('/admin/dashboard', { headers: { Authorization: `Bearer ${adminToken}` } });
    const adminSettings = await fetchJson('/settings', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ storeName: 'TICKING LUXARY WATCH' })
    });
    record('Test 6b: Master Admin Successfully Accesses Admin Dashboard and Settings', adminDash.status === 200 && adminSettings.status === 200);
  } catch (err) {
    record('Test 6: Admin API Protection', false, err.message);
  }

  // TEST 7: Logout and Subsequent Access Attempts
  try {
    // When a client logs out, token is removed. A subsequent request without token must fail.
    const loggedOutReq = await fetchJson('/auth/profile');
    record('Test 7: Post-Logout Unauthenticated Request Rejected (401)', loggedOutReq.status === 401);
  } catch (err) {
    record('Test 7: Logout Handling', false, err.message);
  }

  // TEST 8: Session Restoration / Token Profile Verification
  try {
    const profileRes = await fetchJson('/auth/profile', {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    const profileValid = profileRes.status === 200 && profileRes.data.email === userAEmail;
    record('Test 8: Session Profile Restoration with Valid JWT (200)', profileValid, `Email: ${profileRes.data?.email}`);
  } catch (err) {
    record('Test 8: Session Restoration', false, err.message);
  }

  // TEST 9: Token Expiration and Reauthentication Flow
  try {
    // 9a. Reauthentication with credentials
    const reAuth = await fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: userAEmail, password: initialPassword })
    });
    const reAuthPass = reAuth.status === 200 && reAuth.data.token;
    record('Test 9: Re-Authentication Flow Generates Fresh Valid Token', reAuthPass);
    if (reAuthPass) userAToken = reAuth.data.token;
  } catch (err) {
    record('Test 9: Re-Authentication Flow', false, err.message);
  }

  // TEST 10: Shopping Cart Isolation Across Users
  try {
    // User A adds product to cart
    await fetchJson('/cart', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({ productId: sampleProductId, quantity: 1 })
    });

    // User A cart should have items
    const cartA = await fetchJson('/cart', { headers: { Authorization: `Bearer ${userAToken}` } });
    const cartAHasItems = cartA.status === 200 && cartA.data.items && cartA.data.items.length > 0;

    // User B cart must be empty (isolated)
    const cartB = await fetchJson('/cart', { headers: { Authorization: `Bearer ${userBToken}` } });
    const cartBIsEmpty = cartB.status === 200 && cartB.data.items && cartB.data.items.length === 0;

    record('Test 10a: User A Cart Contains Added Items', cartAHasItems, `Count: ${cartA.data?.items?.length}`);
    record('Test 10b: User B Cart is Completely Isolated (0 items)', cartBIsEmpty, `Count: ${cartB.data?.items?.length}`);
  } catch (err) {
    record('Test 10: Cart Isolation', false, err.message);
  }

  // TEST 11: Profile Updates and Password Changes
  try {
    // 11a. Update Profile
    const updateProf = await fetchJson('/auth/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        name: 'Horology Connoisseur A (Updated)',
        phone: '9909225852'
      })
    });
    record('Test 11a: Update User Profile', updateProf.status === 200 && updateProf.data.name.includes('(Updated)'));

    // 11b. Change Password with wrong current password
    const wrongCurr = await fetchJson('/auth/change-password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        currentPassword: 'completely_wrong_pass',
        newPassword: newPassword,
        confirmPassword: newPassword
      })
    });
    record('Test 11b: Password Change Rejects Incorrect Current Password (400)', wrongCurr.status === 400);

    // 11c. Change Password successfully
    const changeSuccess = await fetchJson('/auth/change-password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: newPassword,
        confirmPassword: newPassword
      })
    });
    record('Test 11c: Password Change Successfully Applied (200)', changeSuccess.status === 200);

    // 11d. Login with old password fails
    const oldLogin = await fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: userAEmail, password: initialPassword })
    });
    record('Test 11d: Old Password Disallowed After Password Change (401)', oldLogin.status === 401);

    // 11e. Login with new password succeeds
    const newLogin = await fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: userAEmail, password: newPassword })
    });
    record('Test 11e: Login with New Password Succeeds (200)', newLogin.status === 200);
    if (newLogin.status === 200) userAToken = newLogin.data.token;
  } catch (err) {
    record('Test 11: Profile and Password Change', false, err.message);
  }

  // TEST 12: Account Deactivation Security Enforcement
  try {
    // Admin deactivates User B
    const deactRes = await fetchJson(`/auth/customers/${userBId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ isActive: false })
    });
    record('Test 12a: Admin Deactivates Customer Account', deactRes.status === 200);

    // User B attempts to access protected endpoint with existing JWT
    const deactAccess = await fetchJson('/auth/profile', {
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    record('Test 12b: Deactivated User Token Immediately Rejected (401)', deactAccess.status === 401, `Status: ${deactAccess.status}`);

    // User B attempts login
    const deactLogin = await fetchJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: userBEmail, password: initialPassword })
    });
    record('Test 12c: Deactivated User Login Blocked (403)', deactLogin.status === 403, `Status: ${deactLogin.status}`);

    // Reactivate User B to restore clean state
    await fetchJson(`/auth/customers/${userBId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ isActive: true })
    });
  } catch (err) {
    record('Test 12: Deactivation Enforcement', false, err.message);
  }

  console.log('\n======================================================');
  console.log('TEST SUMMARY');
  console.log('======================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`TOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  if (failed === 0) {
    console.log('>>> ALL JWT AUTHENTICATION AND AUTHORIZATION TESTS PASSED! <<<');
  } else {
    console.log(`>>> ${failed} TEST(S) FAILED. Inspect output above. <<<`);
  }
  console.log('======================================================\n');
}

runAllTests().catch(console.error);
