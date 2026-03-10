const mongoose = require("mongoose");

const notificationLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["expiring_soon", "weekly_check", "expired"],
      required: true,
    },
    recipient: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "failed"],
      required: true,
    },
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("NotificationLog", notificationLogSchema);
