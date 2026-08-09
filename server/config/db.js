const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load .env from notes-hub/.env (two levels up from server/config)
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Connect to MongoDB using process.env.MONGODB_URI exclusively.
 * Fails clearly if connection to Cloud Atlas fails without falling back to local database.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`✓ MongoDB connected (${uri.includes('mongodb+srv') ? 'Cloud Atlas' : 'Local'})`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    throw err;
  }
}

module.exports = connectDB;
