const express = require('express');
const { protect } = require('../middleware/auth');
const { getProfile, updateProfile, getPublicProfile } = require('../controllers/profileController');

const router = express.Router();

router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);
router.get('/:userId', protect, getPublicProfile);

module.exports = router;
