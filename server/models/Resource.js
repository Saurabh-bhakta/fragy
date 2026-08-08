const mongoose = require('mongoose');

/**
 * Study material metadata.
 * driveUrl points to Google Drive (or similar). Credentials stay out of the DB.
 */
const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['notes', 'slides', 'pyqs'],
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    driveUrl: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    /** If true, access still requires login (always) and confirmation modal */
    requiresAuth: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resource', resourceSchema);
