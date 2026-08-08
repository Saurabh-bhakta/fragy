/**
 * NotesHub API server
 * Run: npm run dev  (from /server)
 */
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load .env from project root (notes-hub/.env)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function start() {
  await connectDB();

  // Security & parsing middleware
  app.use(helmet());
  app.use(
    cors({
      origin: CLIENT_URL,
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'Fragy API' });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api', contentRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/admin', adminRoutes);

  // 404 for unknown API paths
  app.use('/api', (req, res) => {
    res.status(404).json({ message: 'API route not found.' });
  });

  // Central error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  });

  app.listen(PORT, () => {
    console.log(`✓ NotesHub API listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
