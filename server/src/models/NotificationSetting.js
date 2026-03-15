const mongoose = require("mongoose");

const notificationSettingSchema = new mongoose.Schema(
  {
    _singleton: { type: String, default: "default", unique: true },
    recipients: { type: [String], default: [] },
    expiringDays: { type: Number, default: 30 },
    scheduleTime: { type: String, default: "08:00" },
    enabledTypes: {
      expiringSoon: { type: Boolean, default: true },
      weeklyCheck: { type: Boolean, default: true },
      expired: { type: Boolean, default: true },
    },
    testMode: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("NotificationSetting", notificationSettingSchema);
