const express = require('express');
const { protect } = require('../middleware/auth');
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
router.get('/semesters/:idOrNumber', protect, getSemester);
router.get('/subjects/:subjectId', protect, getSubject);
router.get('/resources/:resourceId/access', protect, accessResource);

module.exports = router;
