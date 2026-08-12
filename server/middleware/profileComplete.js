module.exports = function ensureProfileComplete(req, res, next) {
  // Admins bypass the profile check
  if (req.user && req.user.role === 'admin') return next();

  if (!req.user || !req.user.profileCompleted) {
    return res.status(403).json({
      message: 'Profile incomplete. Please complete your profile.',
      redirect: '/complete-profile',
    });
  }
  next();
};
