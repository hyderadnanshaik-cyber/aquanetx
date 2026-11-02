const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true, index: true },
  email: String,
  displayName: String,
  defaultLocation: {
    name: { type: String, default: 'Hyderabad, Telangana, India' },
    lat: { type: Number, default: 17.3850 },
    lon: { type: Number, default: 78.4867 },
  },
  onboardingComplete: { type: Boolean, default: false },
  notificationPreferences: {
    floodAlerts: { type: Boolean, default: true },
    weatherAlerts: { type: Boolean, default: true },
    emergencyAlerts: { type: Boolean, default: true },
    waterAlerts: { type: Boolean, default: false },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserProfile', userProfileSchema);
