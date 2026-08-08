const { validationResult } = require('express-validator');

/**
 * Run after express-validator checks.
 * If validation failed, return 400 with a clear list of errors.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, msg: e.msg })),
    });
  }
  next();
}

module.exports = validate;
