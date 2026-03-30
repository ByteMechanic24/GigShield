const mongoose = require('mongoose');
const { Schema } = mongoose;

const WorkerSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", default: null },
  name: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
  avatarUrl: { type: String, trim: true },
  passwordHash: { type: String },
  phone: { type: String, required: true, unique: true, trim: true },
  upiHandle: { type: String, unique: true, sparse: true, trim: true },
  deviceFingerprint: { type: String, default: 'pending_device' },
  phoneVerified: { type: Boolean, default: false },
  upiVerified: { type: Boolean, default: false },
  tier: { type: String, enum: ["basic", "standard", "premium"] },
  city: { type: String },
  operatingZones: [String],
  activePolicyId: { type: Schema.Types.ObjectId, ref: "Policy", default: null },
  earningsBaseline: { type: Map, of: Schema.Types.Mixed, default: {} },
  baselineUpdatedAt: Date,
  claimCount30d: { type: Number, default: 0 },
  claimCountAllTime: { type: Number, default: 0 },
  tenureDays: { type: Number, default: 0 },
  fraudFlags: { type: [String], default: [] },
  accountStatus: { type: String, enum: ["active", "suspended", "inactive"], default: "active" },
  onboardingCompleted: { type: Boolean, default: false },
  lastLoginAt: Date,
  enrolledAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Worker", WorkerSchema);
