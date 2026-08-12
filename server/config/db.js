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
  const primaryUri = process.env.MONGODB_URI;
  const localUri = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/fragy';

  mongoose.set('strictQuery', true);

  if (primaryUri) {
    try {
      await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`✓ MongoDB connected (${primaryUri.includes('mongodb+srv') ? 'Cloud Atlas' : 'Local Primary'})`);
      return;
    } catch (err) {
      console.warn(`⚠️ Primary MongoDB connection failed (${err.message}). Falling back to local MongoDB...`);
    }
  }

  try {
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✓ Local MongoDB connected (${localUri})`);
  } catch (err) {
    console.error('❌ Local MongoDB connection error:', err.message);
    throw err;
  }
}

module.exports = connectDB;
