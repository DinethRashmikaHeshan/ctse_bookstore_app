const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authenticateApiKey } = require('../middleware/auth');
const orderStore = require('../data/orders');

const router = express.Router();

const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL || 'http://localhost:3002';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-service-key-change-in-prod';
const internalHeaders = { 'x-api-key': INTERNAL_API_KEY };

// POST /api/orders - place a new order (calls Book Service + Notification Service)
router.post('/', [
  authenticateToken,
  (req, res, next) => {
    // Normalize _id to bookId if the client sends _id directly from the books response
    if (!req.body.bookId && req.body._id) {
      req.body.bookId = req.body._id;
    }
    next();
  },
  body('bookId').notEmpty().withMessage('bookId is required'),
  body('quantity').isInt({ min: 1 }).withMessage('quantity must be at least 1')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { bookId, quantity } = req.body;

  try {
    // Step 1: Validate book exists and check stock (calls Book Service)
    let book;
    try {
      const bookRes = await axios.get(
        `${BOOK_SERVICE_URL}/api/books/${bookId}`,
        { headers: internalHeaders, timeout: 5000 }
      );
      book = bookRes.data.book;
    } catch (err) {
      return res.status(404).json({ error: 'Book not found or Book Service unavailable' });
    }

    if (book.stock < quantity) {
      return res.status(400).json({ error: `Insufficient stock. Available: ${book.stock}` });
    }

    // Step 2: Reserve stock (calls Book Service)
    await axios.post(
      `${BOOK_SERVICE_URL}/api/books/${bookId}/reduce-stock`,
      { quantity },
      { headers: internalHeaders, timeout: 5000 }
    );

    // Step 3: Create the order
    const order = await orderStore.create({
      userId: req.user.id,
      userEmail: req.user.email,
      bookId,
      bookTitle: book.title,
      bookAuthor: book.author,
      quantity,
      unitPrice: book.price,
      totalPrice: (book.price * quantity).toFixed(2)
    });

    // Step 4: Notify (non-blocking - fire and forget)
    axios.post(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/order-placed`,
      { orderId: order.id, userId: req.user.id, userEmail: req.user.email, bookTitle: book.title, quantity, totalPrice: order.totalPrice },
      { headers: internalHeaders, timeout: 5000 }
    ).catch(err => console.error('Notification failed (non-critical):', err.message));

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    console.error('Order creation error:', err.message);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders - all orders (admin/internal)
router.get('/', authenticateApiKey, async (req, res) => {
  const orders = await orderStore.findAll();
  res.json({ orders, count: orders.length });
});

// GET /api/orders/my - current user orders
router.get('/my', authenticateToken, async (req, res) => {
  const orders = await orderStore.findByUserId(req.user.id);
  res.json({ orders, count: orders.length });
});

// GET /api/orders/user/:userId - called by User Service
router.get('/user/:userId', authenticateApiKey, async (req, res) => {
  const orders = await orderStore.findByUserId(req.params.userId);
  res.json({ orders, count: orders.length });
});

// GET /api/orders/:id
router.get('/:id', authenticateToken, async (req, res) => {
  const order = await orderStore.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json({ order });
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  const { status } = req.body;
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
  }
  const order = await orderStore.updateStatus(req.params.id, status);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ message: 'Order status updated', order });
});

module.exports = router;
