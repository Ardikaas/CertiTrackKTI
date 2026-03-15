const mongoose = require("mongoose");

const notificationLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["expiring_soon", "weekly_check", "expired", "test_preview", "test_scheduled"],
      required: true,
    },
    recipient: { type: String, required: true },
    message:   { type: String, required: true },
    status:    { type: String, enum: ["sent", "failed"], required: true },
    error:     { type: String, default: null },
    metadata:  { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

notificationLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("NotificationLog", notificationLogSchema);
