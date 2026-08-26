/**
 * Restrict a route to users with the 'admin' role.
 * Must be used AFTER the `protect` middleware, since it relies on req.user.
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: administrators only' });
  }

  next();
};

module.exports = { adminOnly };
