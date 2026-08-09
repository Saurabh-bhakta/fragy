const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { sendAnnouncementNotification } = require('../services/emailService');

/**
 * Public: Get active announcements sorted newest first
 * GET /api/announcements
 */
async function listPublicAnnouncements(req, res) {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const formatted = announcements.map((a) => ({
      id: a._id.toString(),
      title: a.title,
      message: a.message,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      isNew: Date.now() - new Date(a.createdAt).getTime() < 48 * 60 * 60 * 1000,
    }));

    return res.json({ announcements: formatted });
  } catch (err) {
    console.error('Error fetching public announcements:', err);
    return res.status(500).json({ message: 'Failed to fetch announcements.' });
  }
}

/**
 * Admin: Get all announcements (active & inactive)
 * GET /api/announcements/admin
 */
async function listAdminAnnouncements(req, res) {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const formatted = announcements.map((a) => ({
      id: a._id.toString(),
      _id: a._id.toString(),
      title: a.title,
      message: a.message,
      isActive: a.isActive,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      createdBy: a.createdBy ? { name: a.createdBy.name, email: a.createdBy.email } : null,
    }));

    return res.json({ announcements: formatted });
  } catch (err) {
    console.error('Error fetching admin announcements:', err);
    return res.status(500).json({ message: 'Failed to load admin announcements.' });
  }
}

/**
 * Admin: Create a new announcement and trigger user email notification
 * POST /api/announcements
 */
async function createAnnouncement(req, res) {
  try {
    const { title, message } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Announcement title is required.' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Announcement message is required.' });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      isActive: true,
      createdBy: req.user.id,
    });

    let emailSent = false;
    let emailError = null;

    // Send email notification to registered users
    try {
      const users = await User.find({}).select('email').lean();
      const emails = users.map((u) => u.email).filter(Boolean);

      if (emails.length > 0) {
        await sendAnnouncementNotification(announcement, emails);
        emailSent = true;
      }
    } catch (mailErr) {
      console.error('[announcement:email-error]', mailErr.message);
      emailError = mailErr.message || 'Could not dispatch notification email.';
    }

    const formatted = {
      id: announcement._id.toString(),
      _id: announcement._id.toString(),
      title: announcement.title,
      message: announcement.message,
      isActive: announcement.isActive,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
    };

    return res.status(201).json({
      message: emailSent
        ? 'Announcement published successfully! Email notifications sent to registered users.'
        : emailError
        ? 'Announcement published, but email notification could not be sent.'
        : 'Announcement published successfully.',
      announcement: formatted,
      emailSent,
      emailError,
    });
  } catch (err) {
    console.error('Error creating announcement:', err);
    return res.status(500).json({ message: 'Failed to create announcement.' });
  }
}

/**
 * Admin: Update an existing announcement
 * PUT /api/announcements/:id
 */
async function updateAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const { title, message, isActive } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    if (title !== undefined) announcement.title = title.trim();
    if (message !== undefined) announcement.message = message.trim();
    if (isActive !== undefined) announcement.isActive = Boolean(isActive);

    await announcement.save();

    return res.json({
      message: 'Announcement updated successfully.',
      announcement: {
        id: announcement._id.toString(),
        _id: announcement._id.toString(),
        title: announcement.title,
        message: announcement.message,
        isActive: announcement.isActive,
        createdAt: announcement.createdAt,
        updatedAt: announcement.updatedAt,
      },
    });
  } catch (err) {
    console.error('Error updating announcement:', err);
    return res.status(500).json({ message: 'Failed to update announcement.' });
  }
}

/**
 * Admin: Toggle active state of an announcement
 * PATCH /api/announcements/:id/toggle
 */
async function toggleAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    announcement.isActive = !announcement.isActive;
    await announcement.save();

    return res.json({
      message: `Announcement ${announcement.isActive ? 'activated' : 'deactivated'} successfully.`,
      announcement: {
        id: announcement._id.toString(),
        _id: announcement._id.toString(),
        title: announcement.title,
        message: announcement.message,
        isActive: announcement.isActive,
        createdAt: announcement.createdAt,
        updatedAt: announcement.updatedAt,
      },
    });
  } catch (err) {
    console.error('Error toggling announcement:', err);
    return res.status(500).json({ message: 'Failed to toggle announcement status.' });
  }
}

/**
 * Admin: Delete an announcement
 * DELETE /api/announcements/:id
 */
async function deleteAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    return res.json({ message: 'Announcement deleted successfully.' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    return res.status(500).json({ message: 'Failed to delete announcement.' });
  }
}

module.exports = {
  listPublicAnnouncements,
  listAdminAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  toggleAnnouncement,
  deleteAnnouncement,
};
