require('dotenv').config({ path: './.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const { redirectUrl } = require('./controllers/urlController');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to databases
connectDB();
connectRedis();

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);

// *** THE REDIRECT ROUTE ***
// This must come AFTER api routes
// When someone visits /:shortCode it redirects to the original URL
app.get('/:shortCode', redirectUrl);

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;