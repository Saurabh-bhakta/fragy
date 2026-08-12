const express = require('express');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getProfile, updateProfile, getPublicProfile } = require('../controllers/profileController');

const router = express.Router();

router.get('/me', protect, getProfile);
router.put('/me', protect, upload.single('avatar'), updateProfile);
router.get('/:userId', protect, getPublicProfile);

module.exports = router;
