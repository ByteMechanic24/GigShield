const mongoose = require('mongoose');
const { Schema } = mongoose;

const AuthChallengeSchema = new Schema({
  subjectType: { type: String, enum: ['worker', 'admin'], required: true },
  authType: { type: String, enum: ['phone_otp'], required: true },
  identifier: { type: String, required: true, trim: true, lowercase: true },
  codeHash: { type: String, required: true },
  channel: { type: String, enum: ['sms'], default: 'sms' },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  expiresAt: { type: Date, required: true },
  consumedAt: Date,
  metadata: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AuthChallenge', AuthChallengeSchema);
