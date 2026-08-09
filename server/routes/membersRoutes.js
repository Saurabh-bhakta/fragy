const express = require('express');
const { protect } = require('../middleware/auth');
const { getMembers } = require('../controllers/membersController');

const router = express.Router();

router.get('/', protect, getMembers);

module.exports = router;
