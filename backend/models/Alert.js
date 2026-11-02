const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  type: {
    type: String,
    enum: ['Flood', 'Weather', 'Water Shortage', 'Infrastructure', 'Emergency'],
    default: 'Flood',
  },
  location: { type: String, required: true },
  source: { type: String, default: 'Hydrological & Disaster Management Network' },
  description: { type: String, required: true },
  recommendation: { type: String, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
});

module.exports = mongoose.model('Alert', alertSchema);
