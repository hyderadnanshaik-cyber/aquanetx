const mongoose = require('mongoose');

const citizenReportSchema = new mongoose.Schema({
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Flooding', 'Waterlogging', 'Drainage Blockage', 'Water Shortage', 'Contaminated Water', 'Damaged Infrastructure', 'Other'],
    default: 'Flooding',
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  location: {
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    address: { type: String, default: 'Unspecified location' },
  },
  photoUrl: { type: String, default: null },
  status: {
    type: String,
    enum: ['submitted', 'verified', 'dispatched', 'resolved'],
    default: 'submitted',
  },
  reporter: {
    uid: { type: String, default: null },
    name: { type: String, default: 'Anonymous Citizen' },
  },
  localReportId: { type: String, index: true }, // For offline deduplication
  createdAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date, default: null },
});

module.exports = mongoose.model('CitizenReport', citizenReportSchema);
