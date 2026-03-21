require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const notifRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3004;

const connectDB = require('./config/db');
connectDB();

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'] }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(express.json({ limit: '10kb' }));
app.use('/api/notifications', notifRoutes);

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'notification-service', timestamp: new Date().toISOString() }));
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => res.status(500).json({ error: 'Internal server error' }));

app.listen(PORT, () => console.log(`Notification Service running on port ${PORT}`));
module.exports = app;
