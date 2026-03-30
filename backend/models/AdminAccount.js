const mongoose = require('mongoose');
const { Schema } = mongoose;

const AdminAccountSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['super_admin', 'ops_admin', 'reviewer', 'finance'], default: 'ops_admin' },
  permissions: { type: [String], default: [] },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  lastLoginAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AdminAccount', AdminAccountSchema);
