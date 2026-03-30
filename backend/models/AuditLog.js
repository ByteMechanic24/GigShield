const mongoose = require('mongoose');
const { Schema } = mongoose;

const AuditLogSchema = new Schema({
  actorType: { type: String, enum: ['worker', 'admin', 'system'], required: true },
  actorId: Schema.Types.Mixed,
  entityType: { type: String, required: true },
  entityId: Schema.Types.Mixed,
  action: { type: String, required: true },
  before: Schema.Types.Mixed,
  after: Schema.Types.Mixed,
  metadata: { type: Schema.Types.Mixed, default: {} },
  ipAddress: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
