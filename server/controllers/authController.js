const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../services/tokenService');

function useSafeEmail() {
  return require('../services/emailService');
}

/** POST /api/auth/register — password registration */
async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanPassword = String(password);

    if (cleanPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists. Please log in.' });
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 12);
    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: 'user',
      profileCompleted: false,
    });

    const { sendWelcomeEmail } = useSafeEmail();
    sendWelcomeEmail(user).catch((err) => console.warn('Welcome email failed:', err.message));

    const token = signToken(user._id);
    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber || '',
        avatarUrl: user.avatarUrl || '',
        profileCompleted: false,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ message: 'Could not create account. Please try again.' });
  }
}

/** POST /api/auth/login — email & password login */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const cleanPassword = String(password);

    const user = await User.findOne({ email: cleanEmail }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // If legacy account created without passwordHash (e.g. old OTP/OAuth test accounts), automatically set passwordHash
    if (!user.passwordHash) {
      if (cleanPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters to secure this account.' });
      }
      user.passwordHash = await bcrypt.hash(cleanPassword, 12);
      await user.save();
    } else {
      let match = await bcrypt.compare(cleanPassword, user.passwordHash);
      if (!match && cleanPassword.trim() !== cleanPassword) {
        match = await bcrypt.compare(cleanPassword.trim(), user.passwordHash);
      }

      if (!match) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }
    }

    const profileCompleted = user.role === 'admin' || Boolean(user.profileCompleted && user.name && user.avatarUrl && user.rollNumber);
    const token = signToken(user._id);

    return res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber || '',
        avatarUrl: user.avatarUrl || '',
        profileCompleted,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ message: 'Could not log in. Please try again.' });
  }
}

/** GET /api/auth/me — current user profile */
async function me(req, res) {
  return res.json({ user: req.user });
}

/** POST /api/auth/change-password */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.passwordHash) {
      let match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match && String(currentPassword).trim() !== String(currentPassword)) {
        match = await bcrypt.compare(String(currentPassword).trim(), user.passwordHash);
      }
      if (!match) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from current password.' });
    }
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 12);
    await user.save();
    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ message: 'Could not change password. Please try again.' });
  }
}

module.exports = {
  register,
  login,
  me,
  changePassword,
};
