const express = require('express');
const axios = require('axios');
const { authenticateToken, authenticateApiKey } = require('../middleware/auth');
const notifStore = require('../data/notifications');

const router = express.Router();
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-service-key-change-in-prod';

router.post('/order-placed', authenticateApiKey, async (req, res) => {
  const { orderId, userId, userEmail, bookTitle, quantity, totalPrice } = req.body;
  if (!orderId || !userId) return res.status(400).json({ error: 'orderId and userId are required' });

  let userName = userEmail;
  try {
    const userRes = await axios.get(`${USER_SERVICE_URL}/api/users/${userId}`, { headers: { 'x-api-key': INTERNAL_API_KEY }, timeout: 5000 });
    userName = userRes.data.user.name;
  } catch (err) {
    console.warn('Could not fetch user from User Service:', err.message);
  }

  const notification = await notifStore.create({
    type: 'order-placed', userId, userEmail,
    title: 'Order Confirmed!',
    message: `Hi ${userName}, your order for "${bookTitle}" (x${quantity}) has been placed. Total: $${totalPrice}.`,
    metadata: { orderId, bookTitle, quantity, totalPrice }
  });

  console.log(`[NOTIFICATION] Order: ${orderId} for user: ${userName}`);
  res.status(201).json({ message: 'Notification created', notification });
});

router.post('/welcome', authenticateApiKey, async (req, res) => {
  const { userId, userEmail, userName } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const notification = await notifStore.create({ type: 'welcome', userId, userEmail, title: 'Welcome!', message: `Welcome, ${userName}!`, metadata: {} });
  res.status(201).json({ message: 'Welcome notification created', notification });
});

router.get('/', authenticateApiKey, async (req, res) => {
  const notifications = await notifStore.findAll();
  res.json({ notifications, count: notifications.length });
});

router.get('/my', authenticateToken, async (req, res) => {
  res.json({ notifications: await notifStore.findByUserId(req.user.id) });
});

router.patch('/:id/read', authenticateToken, async (req, res) => {
  const n = await notifStore.markRead(req.params.id);
  if (!n) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Marked as read', notification: n });
});

module.exports = router;
