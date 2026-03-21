const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bookstore-super-secret-key-change-in-prod';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-service-key-change-in-prod';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey === INTERNAL_API_KEY) {
    req.isInternalCall = true;
    return next();
  }
  authenticateToken(req, res, next);
};

const requireAdmin = (req, res, next) => {
  if (!req.isInternalCall && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { authenticateToken, authenticateApiKey, requireAdmin };
