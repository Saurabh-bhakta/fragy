/**
 * NotesHub API server with Real-Time Socket.io support.
 * Run: npm run dev  (from /server)
 */
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load .env from project root (notes-hub/.env)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const commentRoutes = require('./routes/commentRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const profileRoutes = require('./routes/profileRoutes');
const membersRoutes = require('./routes/membersRoutes');
const groupRoutes = require('./routes/groupRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  // Join user-specific or group-specific socket room
  socket.on('join_room', (roomName) => {
    if (roomName) {
      socket.join(roomName);
    }
  });

  socket.on('leave_room', (roomName) => {
    if (roomName) {
      socket.leave(roomName);
    }
  });
});

async function start() {
  await connectDB();

  // Security & parsing middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin: (origin, callback) => callback(null, true), // Allow all origins for dev & deployed clients
      credentials: true,
    })
  );
  app.use(express.json({ limit: '5mb' }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'Fragy API' });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/announcements', announcementRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/members', membersRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api', contentRoutes);

  // 404 for unknown API paths
  app.use('/api', (req, res) => {
    res.status(404).json({ message: 'API route not found.' });
  });

  // Central error handler
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  });

  server.listen(PORT, () => {
    console.log(`✓ NotesHub API with Real-time Chat listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
