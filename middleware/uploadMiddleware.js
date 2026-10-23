const multer = require('multer');
const path = require('path');

// Memory storage keeps file buffers in RAM so they can be streamed directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  const isExtAllowed = allowedExtensions.test(ext);
  const isMimeAllowed = allowedExtensions.test(file.mimetype.toLowerCase()) || file.mimetype.startsWith('image/');

  if (isExtAllowed && isMimeAllowed) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file format. Only JPEG, JPG, PNG, WEBP, and GIF images are allowed.');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per image
  },
  fileFilter
});

module.exports = upload;
