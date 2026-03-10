const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn("⚠️  MONGO_URI not set — skipping MongoDB connection");
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`⚠️  MongoDB connection failed: ${error.message}`);
    console.warn("⚠️  Server will continue without MongoDB");
  }
};

module.exports = connectDB;
