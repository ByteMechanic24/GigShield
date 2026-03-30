const mongoose = require('mongoose');
const { Schema } = mongoose;

const AuthSessionSchema = new Schema({
  subjectType: { type: String, enum: ['worker', 'admin'], required: true },
  subjectId: { type: Schema.Types.ObjectId, required: true },
  refreshTokenHash: { type: String, required: true, unique: true },
  deviceId: String,
  deviceFingerprint: String,
  ipAddress: String,
  userAgent: String,
  sessionStatus: { type: String, enum: ['active', 'revoked', 'expired'], default: 'active' },
  issuedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  revokedAt: Date,
  lastSeenAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AuthSession', AuthSessionSchema);
