const express = require('express');
const { protect } = require('../middleware/auth');
const ensureProfileComplete = require('../middleware/profileComplete');
const {
  listSemesters,
  getSemester,
  getSubject,
  accessResource,
} = require('../controllers/contentController');
const { getAbout } = require('../controllers/aboutController');

const router = express.Router();

// Homepage can show semester names only (no subjects / materials)
router.get('/semesters', listSemesters);

// Public About page details (owner + content provider)
router.get('/about', getAbout);

// Subjects, materials metadata, and Drive links require a logged-in account
router.get('/semesters/:idOrNumber', protect, ensureProfileComplete, getSemester);
router.get('/subjects/:subjectId', protect, ensureProfileComplete, getSubject);
router.get('/resources/:resourceId/access', protect, ensureProfileComplete, accessResource);

module.exports = router;
