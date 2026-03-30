const mongoose = require('mongoose');
const { Schema } = mongoose;

const WorkerSessionSchema = new Schema({
  workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  status: { type: String, enum: ['active', 'paused', 'ended'], default: 'active' },
  zone: { type: String, trim: true },
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  source: { type: String, enum: ['app', 'platform_sync', 'manual'], default: 'app' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('WorkerSession', WorkerSessionSchema);
