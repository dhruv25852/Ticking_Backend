const Razorpay = require('razorpay');

/**
 * Returns a configured Razorpay instance or null if credentials are not configured.
 * This guarantees the server starts cleanly even if environment variables are empty.
 */
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret || !key_id.trim() || !key_secret.trim()) {
    return null;
  }

  return new Razorpay({
    key_id: key_id.trim(),
    key_secret: key_secret.trim()
  });
};

/**
 * Checks whether both Razorpay Test Mode credentials are provided.
 */
const isRazorpayConfigured = () => {
  return Boolean(
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_ID.trim() !== '' &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_SECRET.trim() !== ''
  );
};

module.exports = {
  getRazorpayInstance,
  isRazorpayConfigured
};
