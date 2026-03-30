const mongoose = require('mongoose');
const { Schema } = mongoose;

const AuthIdentitySchema = new Schema({
  subjectType: { type: String, enum: ['worker', 'admin'], required: true },
  subjectId: { type: Schema.Types.ObjectId, required: true },
  authType: { type: String, enum: ['phone_upi', 'phone_otp', 'email_password', 'api_key', 'google_oauth'], required: true },
  identifier: { type: String, required: true, trim: true, lowercase: true },
  secretHash: { type: String, required: true },
  verifiedAt: Date,
  lastUsedAt: Date,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AuthIdentity', AuthIdentitySchema);
