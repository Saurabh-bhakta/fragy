const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { listComments, createComment, updateComment } = require('../controllers/commentController');

const router = express.Router();

const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many comments. Please try again later.' },
});

// Public — everyone can read
router.get('/', listComments);

// Logged-in users can write
router.post(
  '/',
  protect,
  commentLimiter,
  [
    body('message')
      .trim()
      .isLength({ min: 2, max: 500 })
      .withMessage('Comment must be between 2 and 500 characters'),
  ],
  validate,
  createComment
);

// Logged-in users can edit their own comment (within 5 minutes window)
router.put(
  '/:id',
  protect,
  [
    body('message')
      .trim()
      .isLength({ min: 2, max: 500 })
      .withMessage('Comment must be between 2 and 500 characters'),
  ],
  validate,
  updateComment
);

module.exports = router;
