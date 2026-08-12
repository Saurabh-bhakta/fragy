const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Require a valid JWT in the Authorization header:
 *   Authorization: Bearer <token>
 * Attaches req.user = { id, name, email, role, avatarUrl, rollNumber, profileCompleted }
 */
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authentication required. Please log in.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('name email role createdAt avatarUrl rollNumber profileCompleted');

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    const profileCompleted = user.role === 'admin' || Boolean(user.profileCompleted && user.name && user.rollNumber);
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      avatarUrl: user.avatarUrl || '',
      rollNumber: user.rollNumber || '',
      profileCompleted,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token. Please log in again.' });
  }
}

/**
 * Restrict a route to specific roles (e.g. admin).
 * Must be used AFTER protect().
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = { protect, authorize };
