const mongoose = require('mongoose');

let mongoServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/study_streak_rescue';

  try {
    // Attempt connecting to the configured URI first
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick timeout to fallback if mongod isn't running
    });
    console.log(`[MongoDB] Connected to database at: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
  } catch (err) {
    console.warn(`[MongoDB] Local/External connection to ${uri} failed (${err.message}).`);
    console.log('[MongoDB] Launching automated in-memory MongoDB server (mongodb-memory-server) for zero-config operation...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[MongoDB] Successfully connected to In-Memory MongoDB at ${memoryUri}`);
    } catch (memErr) {
      console.error('[MongoDB] Fatal: Could not connect to in-memory MongoDB:', memErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
