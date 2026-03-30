const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  claimId: { type: mongoose.Schema.Types.ObjectId, ref: 'Claim' },
  channel: { type: String, enum: ['WHATSAPP', 'SMS'], required: true },
  messageType: { type: String, required: true },
  status: { type: String, enum: ['SENT', 'DELIVERED', 'FAILED'], default: 'SENT' },
  providerMessageId: { type: String },
  sentAt: { type: Date, default: Date.now },
  deliveredAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
