const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn("⚠️  MONGO_URI not set — skipping MongoDB connection");
    // Disable buffering so queries fail immediately with a clear error
    // instead of hanging silently for 10 seconds
    mongoose.set("bufferCommands", false);
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Fail fast: don't buffer queries while disconnected
      bufferCommands: false,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on("disconnected", () => {
      console.warn(
        "⚠️  MongoDB disconnected. Queries will fail until reconnected.",
      );
    });
    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected.");
    });
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.error(
      `❌ Check your MONGO_URI in .env — make sure the cluster is reachable and your IP is whitelisted.`,
    );
    throw error; // Let unhandledRejection handler in server.js shut down gracefully
  }
};

module.exports = connectDB;
