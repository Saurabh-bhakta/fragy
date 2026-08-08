const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the URI from environment variables.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing. Copy .env.example to .env and configure it.');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('✓ MongoDB connected');
}

module.exports = connectDB;
