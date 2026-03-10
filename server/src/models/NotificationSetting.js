const mongoose = require("mongoose");

const notificationSettingSchema = new mongoose.Schema(
  {
    recipients: {
      type: [String],
      default: [],
    },
    expiringDays: {
      type: Number,
      default: 30,
    },
    scheduleTime: {
      type: String,
      default: "08:00",
    },
    enabledTypes: {
      expiringSoon: { type: Boolean, default: true },
      weeklyCheck: { type: Boolean, default: true },
      expired: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "NotificationSetting",
  notificationSettingSchema,
);
