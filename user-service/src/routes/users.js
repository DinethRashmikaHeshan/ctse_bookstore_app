const express = require('express');
const axios = require('axios');
const { authenticateToken, authenticateApiKey, requireAdmin } = require('../middleware/auth');
const userStore = require('../data/users');

const router = express.Router();

const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-service-key-change-in-prod';

// GET /api/users/me - get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  const user = await userStore.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: userStore.toPublic(user) });
});

// GET /api/users/me/orders - get current user's orders (calls Order Service)
router.get('/me/orders', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(
      `${ORDER_SERVICE_URL}/api/orders/user/${req.user.id}`,
      {
        headers: { 'x-api-key': INTERNAL_API_KEY },
        timeout: 5000
      }
    );
    res.json({
      user: userStore.toPublic(await userStore.findById(req.user.id)),
      orders: response.data.orders
    });
  } catch (err) {
    console.error('Failed to fetch orders from Order Service:', err.message);
    res.status(502).json({ error: 'Could not fetch orders at this time' });
  }
});

// GET /api/users/:id - get user by ID (internal/admin use)
router.get('/:id', authenticateApiKey, async (req, res) => {
  const user = await userStore.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: userStore.toPublic(user) });
});

// GET /api/users - list all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  const usersList = await userStore.findAll();
  const users = usersList.map(userStore.toPublic);
  res.json({ users, count: users.length });
});

module.exports = router;
