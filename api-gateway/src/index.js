require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Service URLs (internal Docker network or Azure Container Apps FQDNs)
const SERVICES = {
  user:         process.env.USER_SERVICE_URL         || 'http://localhost:3001',
  book:         process.env.BOOK_SERVICE_URL         || 'http://localhost:3002',
  order:        process.env.ORDER_SERVICE_URL        || 'http://localhost:3003',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
};

// ── Security Middleware ─────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
app.use(morgan('combined'));

// Global rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests from this IP' }
}));

// Stricter rate limit for auth routes
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth', authLimiter);

// ── Health Aggregator ───────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const checks = await Promise.allSettled(
    Object.entries(SERVICES).map(async ([name, url]) => {
      const start = Date.now();
      const response = await axios.get(`${url}/health`, { timeout: 3000 });
      return { name, status: response.data.status, latencyMs: Date.now() - start };
    })
  );

  const results = checks.map(c =>
    c.status === 'fulfilled'
      ? c.value
      : { name: 'unknown', status: 'unhealthy', error: c.reason?.message }
  );

  const allHealthy = results.every(r => r.status === 'healthy');
  res.status(allHealthy ? 200 : 503).json({
    gateway: 'healthy',
    timestamp: new Date().toISOString(),
    services: results
  });
});

// ── Proxy Options Factory ───────────────────────────────────────────────────
const makeProxy = (target, pathRewrite = {}) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    on: {
      error: (err, req, res) => {
        console.error(`[Gateway] Proxy error to ${target}: ${err.message}`);
        res.status(502).json({ error: 'Service temporarily unavailable', service: target });
      }
    }
  });

// ── Route → Service Mapping ─────────────────────────────────────────────────
// Auth & Users  →  User Service
app.use('/api/auth',  makeProxy(SERVICES.user));
app.use('/api/users', makeProxy(SERVICES.user));

// Books  →  Book Service
app.use('/api/books', makeProxy(SERVICES.book));

// Orders  →  Order Service
app.use('/api/orders', makeProxy(SERVICES.order));

// Notifications  →  Notification Service
app.use('/api/notifications', makeProxy(SERVICES.notification));

// ── 404 Catch-all ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: ['/api/auth', '/api/users', '/api/books', '/api/orders', '/api/notifications', '/health']
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Routing to:', SERVICES);
});

module.exports = app;
