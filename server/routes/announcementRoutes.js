const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  listPublicAnnouncements,
  listAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  toggleAnnouncement,
  deleteAnnouncement,
} = require('../controllers/announcementController');

// Public route: GET /api/announcements
router.get('/', listPublicAnnouncements);

// Protected Admin routes:
router.get('/admin', protect, authorize('admin'), listAdminAnnouncements);
router.post('/', protect, authorize('admin'), createAnnouncement);
router.put('/:id', protect, authorize('admin'), updateAnnouncement);
router.patch('/:id/toggle', protect, authorize('admin'), toggleAnnouncement);
router.delete('/:id', protect, authorize('admin'), deleteAnnouncement);

module.exports = router;
