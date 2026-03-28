require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { redirectUrl } = require('./controllers/urlController');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const isTest = process.env.NODE_ENV === 'test';

app.use(helmet());
app.use(compression());
if (!isTest) {
  app.use(morgan('dev'));
}
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use('/api', apiLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/analytics', analyticsRoutes);
app.get('/:shortCode', redirectUrl);

app.use(errorHandler);

module.exports = app;
