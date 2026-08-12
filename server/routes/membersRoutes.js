const express = require('express');
const { protect } = require('../middleware/auth');
const ensureProfileComplete = require('../middleware/profileComplete');
const { getMembers } = require('../controllers/membersController');

const router = express.Router();

router.get('/', protect, ensureProfileComplete, getMembers);

module.exports = router;
