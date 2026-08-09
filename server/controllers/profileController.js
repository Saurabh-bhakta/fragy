const User = require('../models/User');

/** GET /api/profile — Current user profile */
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }
    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio || '',
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ message: 'Could not fetch profile.' });
  }
}

/** PUT /api/profile — Update name, bio, and avatarUrl */
async function updateProfile(req, res) {
  try {
    const { name, bio, avatarUrl } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (name && typeof name === 'string') {
      user.name = name.trim().slice(0, 80);
    }
    if (typeof bio === 'string') {
      user.bio = bio.trim().slice(0, 300);
    }
    if (typeof avatarUrl === 'string') {
      // Basic size validation for base64 or URL strings
      if (avatarUrl.length > 2000000) { // 2MB max string length safeguard
        return res.status(400).json({ message: 'Avatar image file size is too large.' });
      }
      user.avatarUrl = avatarUrl.trim();
    }

    await user.save();

    return res.json({
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ message: 'Could not update profile.' });
  }
}

/** GET /api/profile/:userId — Public profile of another user */
async function getPublicProfile(req, res) {
  try {
    const user = await User.findById(req.params.userId).select('name avatarUrl bio createdAt email');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        bio: user.bio || '',
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('getPublicProfile error:', err);
    return res.status(500).json({ message: 'Could not fetch user profile.' });
  }
}

module.exports = { getProfile, updateProfile, getPublicProfile };
