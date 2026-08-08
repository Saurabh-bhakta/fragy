const mongoose = require('mongoose');

/**
 * Singleton site settings for the About page.
 * Only one document is used (key: "main").
 * Editable from the Admin panel.
 */
const personDetailsSchema = new mongoose.Schema(
  {
    name: { type: String, default: '', trim: true, maxlength: 120 },
    role: { type: String, default: '', trim: true, maxlength: 120 },
    email: { type: String, default: '', trim: true, maxlength: 160 },
    phone: { type: String, default: '', trim: true, maxlength: 40 },
    bio: { type: String, default: '', trim: true, maxlength: 1000 },
    links: { type: String, default: '', trim: true, maxlength: 300 },
  },
  { _id: false }
);

const siteSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'main',
      unique: true,
    },
    aboutIntro: {
      type: String,
      default:
        'Fragy is a learning project that brings semester-wise notes, slides, and previous-year questions into one calm, student-friendly place.',
      maxlength: 2000,
    },
    owner: {
      type: personDetailsSchema,
      default: () => ({
        name: 'Fragy Owner',
        role: 'Platform owner',
        email: '',
        phone: '',
        bio: 'Edit this section from the Admin panel to share your details with students.',
        links: '',
      }),
    },
    contentProvider: {
      type: personDetailsSchema,
      default: () => ({
        name: 'Content Provider',
        role: 'Notes & materials',
        email: '',
        phone: '',
        bio: 'Edit this section from the Admin panel to credit the person who provides study materials.',
        links: '',
      }),
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
