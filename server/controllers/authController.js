const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../services/tokenService');
const { sendWelcomeEmail } = useSafeEmail();

function useSafeEmail() {
  // Lazy require keeps controllers easy to read
  return require('../services/emailService');
}

/** POST /api/auth/register */
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'user',
    });

    // Welcome email is best-effort (won't fail registration)
    sendWelcomeEmail(user).catch((err) => console.warn('Welcome email failed:', err.message));

    const token = signToken(user._id);
    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('register error:', err);
    return res.status(500).json({ message: 'Could not create account. Please try again.' });
  }
}

/** POST /api/auth/login */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user._id);
    return res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        avatarUrl: user.avatarUrl,
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

/**
 * POST /api/auth/change-password
 * Requires current password, then stores a new bcrypt hash.
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from the current password.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ message: 'Could not change password. Please try again.' });
  }
}

/** POST /api/auth/google — authenticate or register via Google */
async function googleAuth(req, res) {
  try {
    const { email, name, avatarUrl, googleId, credential } = req.body;

    let userEmail = email ? String(email).toLowerCase().trim() : '';
    let userName = name ? String(name).trim() : '';
    let userAvatar = avatarUrl || '';
    let userGoogleId = googleId || '';

    // If a Google ID token credential was passed, decode basic info
    if (credential && !userEmail) {
      try {
        const payloadBase64 = credential.split('.')[1];
        if (payloadBase64) {
          const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf-8'));
          userEmail = decoded.email?.toLowerCase().trim() || userEmail;
          userName = decoded.name || userName;
          userAvatar = decoded.picture || userAvatar;
          userGoogleId = decoded.sub || userGoogleId;
        }
      } catch (e) {
        console.warn('Could not parse Google credential token:', e.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ message: 'Google email is required.' });
    }

    let user = await User.findOne({ email: userEmail });

    if (!user) {
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      user = await User.create({
        name: userName || userEmail.split('@')[0],
        email: userEmail,
        passwordHash,
        avatarUrl: userAvatar,
        googleId: userGoogleId,
        role: 'user',
      });

      sendWelcomeEmail(user).catch((err) => console.warn('Welcome email failed:', err.message));
    } else {
      if (userAvatar && !user.avatarUrl) {
        user.avatarUrl = userAvatar;
      }
      if (userGoogleId && !user.googleId) {
        user.googleId = userGoogleId;
      }
      await user.save();
    }

    const token = signToken(user._id);
    return res.json({
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('googleAuth error:', err);
    return res.status(500).json({ message: 'Google authentication failed. Please try again.' });
  }
}

module.exports = { register, login, me, changePassword, googleAuth };
