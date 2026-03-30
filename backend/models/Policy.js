const mongoose = require('mongoose');
const { Schema } = mongoose;

const PolicySchema = new Schema({
  workerId: { type: Schema.Types.ObjectId, ref: "Worker", required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", default: null },
  weekStart: { type: Date, required: true },
  weekEnd: { type: Date, required: true },
  premiumAmount: { type: Number, required: true },
  tier: { type: String, required: true },
  riskScore: { type: Number, required: true },
  premiumFeatures: Schema.Types.Mixed,
  coverageLimits: Schema.Types.Mixed,
  status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
  paidAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Policy", PolicySchema);
