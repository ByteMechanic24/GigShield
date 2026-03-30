const mongoose = require('mongoose');

const disruptionEventSchema = new mongoose.Schema({
  eventType: { type: String, required: true },
  city: { type: String, required: true },
  zone: { type: String },
  severity: { type: String },
  bbox: { type: mongoose.Schema.Types.Mixed },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date },
  sources: [String],
  affectedClaimsCount: { type: Number, default: 0 },
  satelliteConfirmed: { type: Boolean, default: false },
  satelliteSceneId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('DisruptionEvent', disruptionEventSchema);
