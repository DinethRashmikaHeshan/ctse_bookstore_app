const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bookstore-super-secret-key-change-in-prod';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Internal API key auth (for service-to-service calls)
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.INTERNAL_API_KEY || 'internal-service-key-change-in-prod';

  if (apiKey === validKey) {
    req.isInternalCall = true;
    return next();
  }

  // Fall back to JWT
  authenticateToken(req, res, next);
};

module.exports = { authenticateToken, requireAdmin, authenticateApiKey, JWT_SECRET };
