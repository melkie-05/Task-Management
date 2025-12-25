export const authorize = (permission) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (!req.user.permissions || !req.user.permissions.includes(permission))
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  next();
};
