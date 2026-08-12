const User = require('../models/User');

/** GET /api/profile/me — Get current user's profile */
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }
    const profileCompleted = !!(user.name && user.rollNumber);
    return res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber || '',
        avatarUrl: user.avatarUrl || '',
        bio: user.bio || '',
        role: user.role,
        profileCompleted: user.profileCompleted || profileCompleted,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('getProfile error:', err);
    return res.status(500).json({ message: 'Could not fetch profile.' });
  }
}

/** PUT /api/profile/me — Complete or update user profile */
async function updateProfile(req, res) {
  try {
    const { name, rollNumber, bio, avatarUrl: bodyAvatarUrl } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Handle avatar photo from file upload or body payload
    let avatarUrl = user.avatarUrl || '';
    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
    } else if (bodyAvatarUrl && typeof bodyAvatarUrl === 'string') {
      if (bodyAvatarUrl.length > 2000000) {
        return res.status(400).json({ message: 'Avatar image file size is too large.' });
      }
      avatarUrl = bodyAvatarUrl.trim();
    }

    const trimmedName = name !== undefined ? String(name).trim() : user.name;
    const trimmedRollNumber = rollNumber !== undefined ? String(rollNumber).trim() : (user.rollNumber || '');

    // Validate mandatory fields (Name and Roll Number)
    if (!trimmedName) {
      return res.status(400).json({ message: 'Name is mandatory and cannot be empty.' });
    }
    if (!trimmedRollNumber) {
      return res.status(400).json({ message: 'Roll Number is mandatory and cannot be empty.' });
    }

    // Enforce Roll Number uniqueness (case-insensitive)
    const existingUser = await User.findOne({
      _id: { $ne: user._id },
      rollNumber: { $regex: new RegExp(`^${trimmedRollNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existingUser) {
      return res.status(400).json({
        message: `Roll Number "${trimmedRollNumber}" is already registered to another user.`,
      });
    }

    user.name = trimmedName.slice(0, 80);
    user.rollNumber = trimmedRollNumber;
    user.avatarUrl = avatarUrl;
    if (typeof bio === 'string') {
      user.bio = bio.trim().slice(0, 300);
    }
    user.profileCompleted = true;

    await user.save();

    return res.json({
      message: 'Profile updated successfully!',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        role: user.role,
        profileCompleted: user.profileCompleted,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Roll Number is already registered to another user.' });
    }
    return res.status(500).json({ message: err.message || 'Could not update profile.' });
  }
}

/** GET /api/profile/:userId — Public profile of another user */
async function getPublicProfile(req, res) {
  try {
    const user = await User.findById(req.params.userId).select('name avatarUrl rollNumber bio createdAt email');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        avatarUrl: user.avatarUrl,
        rollNumber: user.rollNumber || '',
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
