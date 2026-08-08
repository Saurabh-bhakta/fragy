const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const admin = require('../controllers/adminController');
const { adminGetAbout, adminUpdateAbout } = require('../controllers/aboutController');

const router = express.Router();

// Every admin route requires a logged-in admin
router.use(protect, authorize('admin'));

router.get('/overview', admin.overview);
router.get('/users', admin.listUsers);

router.get('/about', adminGetAbout);
router.put('/about', adminUpdateAbout);

router.post(
  '/semesters',
  [
    body('name').trim().notEmpty(),
    body('number').isInt({ min: 1 }),
  ],
  validate,
  admin.createSemester
);
router.patch('/semesters/:id', admin.updateSemester);

router.post(
  '/subjects',
  [
    body('name').trim().notEmpty(),
    body('semesterId').notEmpty(),
  ],
  validate,
  admin.createSubject
);
router.patch('/subjects/:id', admin.updateSubject);

router.post(
  '/resources',
  [
    body('title').trim().notEmpty(),
    body('type').isIn(['notes', 'slides', 'pyqs']),
    body('subjectId').notEmpty(),
    body('driveUrl').trim().notEmpty().withMessage('driveUrl is required'),
  ],
  validate,
  admin.createResource
);
router.patch('/resources/:id', admin.updateResource);
router.delete('/resources/:id', admin.removeResource);

module.exports = router;
