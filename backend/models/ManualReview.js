const mongoose = require('mongoose');
const { Schema } = mongoose;

const ManualReviewSchema = new Schema({
  claimId: { type: Schema.Types.ObjectId, ref: 'Claim', required: true, unique: true },
  assignedToAdminId: { type: Schema.Types.ObjectId, ref: 'AdminAccount' },
  assignedAt: Date,
  status: { type: String, enum: ['queued', 'assigned', 'resolved'], default: 'queued' },
  resolution: { type: String, enum: ['approved', 'rejected'] },
  notes: String,
  resolvedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ManualReview', ManualReviewSchema);
