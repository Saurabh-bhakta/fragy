const jwt = require('jsonwebtoken');

/** Create a signed JWT for a user id */
function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

module.exports = { signToken };
