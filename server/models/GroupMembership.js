const mongoose = require('mongoose');

/**
 * Membership status for groups: 'pending', 'accepted', 'rejected', 'removed'.
 */
const groupMembershipSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'removed'],
      default: 'pending',
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
  },
  { timestamps: true }
);

// Prevent duplicate membership records for the same user and group
groupMembershipSchema.index({ group: 1, user: 1 }, { unique: true });
groupMembershipSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('GroupMembership', groupMembershipSchema);
