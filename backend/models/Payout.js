const mongoose = require('mongoose');
const { Schema } = mongoose;

const PayoutSchema = new Schema({
  claimId: { type: Schema.Types.ObjectId, ref: 'Claim', required: true },
  workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  policyId: { type: Schema.Types.ObjectId, ref: 'Policy', required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  upiHandle: String,
  provider: { type: String, default: 'razorpay' },
  providerPayoutId: String,
  status: { type: String, enum: ['pending', 'initiated', 'paid', 'failed', 'reversed'], default: 'pending' },
  failureReason: String,
  initiatedAt: Date,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payout', PayoutSchema);
