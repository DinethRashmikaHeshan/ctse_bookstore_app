const express = require('express');
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const { authenticateToken, authenticateApiKey, requireAdmin } = require('../middleware/auth');
const bookStore = require('../data/books');

const router = express.Router();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-service-key-change-in-prod';

// GET /api/books - list all books (public)
router.get('/', async (req, res) => {
  const { category, search } = req.query;
  const books = await bookStore.findAll({ category, search });
  res.json({ books, count: books.length });
});

// GET /api/books/:id - get book by ID (public)
router.get('/:id', async (req, res) => {
  const book = await bookStore.findById(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json({ book });
});

// GET /api/books/:id/with-seller - get book + creator info (calls User Service)
router.get('/:id/with-seller', async (req, res) => {
  const book = await bookStore.findById(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });

  try {
    // Call User Service to get admin/seller info
    const userRes = await axios.get(
      `${USER_SERVICE_URL}/api/users/1`,
      { headers: { 'x-api-key': INTERNAL_API_KEY }, timeout: 5000 }
    );
    res.json({ book, addedBy: userRes.data.user });
  } catch (err) {
    console.error('Failed to call User Service:', err.message);
    // Graceful degradation - still return book without seller info
    res.json({ book, addedBy: null, warning: 'Could not fetch seller info' });
  }
});

// POST /api/books - create book (admin only)
router.post('/', [
  authenticateToken,
  requireAdmin,
  body('title').trim().notEmpty(),
  body('author').trim().notEmpty(),
  body('price').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const book = await bookStore.create(req.body);
  res.status(201).json({ message: 'Book created', book });
});

// PUT /api/books/:id - update book (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const book = await bookStore.update(req.params.id, req.body);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json({ message: 'Book updated', book });
});

// POST /api/books/:id/reduce-stock - internal: reduce stock when order placed
router.post('/:id/reduce-stock', authenticateApiKey, async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Valid quantity required' });

  const book = await bookStore.reduceStock(req.params.id, quantity);
  if (!book) return res.status(400).json({ error: 'Book not found or insufficient stock' });

  res.json({ message: 'Stock updated', book });
});

module.exports = router;
