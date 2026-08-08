const mongoose = require('mongoose');

/**
 * Connect to MongoDB using the URI from environment variables.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/fragy';

  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✓ MongoDB connected (${uri.includes('mongodb+srv') ? 'Cloud Atlas' : 'Local'})`);
  } catch (err) {
    if (uri.includes('mongodb+srv')) {
      console.warn('⚠️ Cloud MongoDB connection timed out. Falling back to local MongoDB...');
      const localUri = 'mongodb://127.0.0.1:27017/fragy';
      await mongoose.connect(localUri);
      console.log('✓ MongoDB connected (Local Fallback)');
    } else {
      throw err;
    }
  }
}

module.exports = connectDB;
