const { v2: cloudinary } = require('cloudinary');

// Function to get current Cloudinary configuration status
const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME.trim() !== '' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY.trim() !== '' &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_API_SECRET.trim() !== ''
  );
};

// Initialize / refresh Cloudinary configuration dynamically
const configureCloudinary = () => {
  if (isCloudinaryConfigured()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
      api_key: process.env.CLOUDINARY_API_KEY.trim(),
      api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
      secure: true
    });
    return true;
  }
  return false;
};

// Initial setup attempt
configureCloudinary();

/**
 * Upload a buffer to Cloudinary using upload_stream
 * @param {Buffer} fileBuffer - The in-memory file buffer from Multer
 * @param {Object} options - Upload options (folder, transformation, etc.)
 * @returns {Promise<Object>} - Resolves with { url, secure_url, public_id, width, height, format, bytes }
 */
const uploadStreamToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    if (!configureCloudinary()) {
      const err = new Error(
        'Cloudinary credentials are not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env.'
      );
      err.statusCode = 503;
      err.code = 'CLOUDINARY_NOT_CONFIGURED';
      return reject(err);
    }

    const defaultOptions = {
      resource_type: 'image',
      folder: 'ticking/uploads',
      ...options
    };

    const stream = cloudinary.uploader.upload_stream(defaultOptions, (error, result) => {
      if (error) {
        console.error('[Cloudinary] Upload stream error:', error);
        return reject(new Error(error.message || 'Cloudinary upload failed'));
      }
      resolve({
        url: result.secure_url || result.url,
        secure_url: result.secure_url || result.url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      });
    });

    stream.end(fileBuffer);
  });
};

/**
 * Delete an asset from Cloudinary by its public_id
 * @param {string} publicId - The Cloudinary public_id of the asset to delete
 * @param {Object} options - Additional deletion options
 * @returns {Promise<Object>}
 */
const deleteFromCloudinary = async (publicId, options = {}) => {
  if (!publicId) return { result: 'skipped_no_id' };
  if (!configureCloudinary()) {
    console.warn('[Cloudinary] Cannot delete asset; Cloudinary credentials are not configured.');
    return { result: 'skipped_unconfigured' };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true,
      ...options
    });
    return result;
  } catch (error) {
    console.error(`[Cloudinary] Failed to delete asset with public_id "${publicId}":`, error.message);
    return { result: 'error', error: error.message };
  }
};

/**
 * Helper to extract public_id from a Cloudinary secure_url if not explicitly stored
 * e.g. "https://res.cloudinary.com/cloud/image/upload/v1234567/ticking/products/sample.jpg"
 * -> "ticking/products/sample"
 */
const extractPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('res.cloudinary.com')) return null;

  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    const pathAfterUpload = parts[1];
    // Remove version tag if present (e.g. v1700000000/)
    const withoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
    // Remove extension
    const lastDot = withoutVersion.lastIndexOf('.');
    if (lastDot > -1) {
      return withoutVersion.substring(0, lastDot);
    }
    return withoutVersion;
  } catch {
    return null;
  }
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  configureCloudinary,
  uploadStreamToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl
};
