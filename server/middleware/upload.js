const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists in project root
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Store uploaded avatars in top-level 'uploads' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const unique = `avatar_${req.user ? req.user.id : 'anon'}_${Date.now()}${ext}`;
    cb(null, unique);
  },
});

// Accept common image types only
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/.test(file.mimetype);
  if (allowed) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image file type. Only JPEG, PNG, WEBP, and GIF are allowed.'));
  }
};

const maxFileSize = process.env.MAX_AVATAR_SIZE
  ? parseInt(process.env.MAX_AVATAR_SIZE, 10)
  : 5 * 1024 * 1024; // 5 MB default limit

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxFileSize },
});
