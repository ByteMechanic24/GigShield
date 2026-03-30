const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClaimCheckSchema = new Schema({
  claimId: { type: Schema.Types.ObjectId, ref: 'Claim', required: true },
  workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
  checkName: { type: String, required: true },
  weight: { type: Number, required: true },
  score: { type: Number, required: true },
  confidence: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW', 'NONE'], default: 'NONE' },
  hardReject: { type: Boolean, default: false },
  flags: { type: [String], default: [] },
  data: Schema.Types.Mixed,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ClaimCheck', ClaimCheckSchema);
