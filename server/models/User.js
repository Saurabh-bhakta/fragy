const mongoose = require('mongoose');

/**
 * User account.
 * Passwords are stored only as passwordHash (never plain text).
 * role: "user" | "admin"
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // do not return hash unless explicitly requested
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
      default: '',
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

module.exports = mongoose.model('User', userSchema);
