const mongoose = require('mongoose');
const { Schema } = mongoose;

const OrderSchema = new Schema({
  externalOrderId: { type: String, required: true, unique: true, trim: true },
  workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  platform: { type: String, enum: ['zomato', 'swiggy'], required: true },
  platformOrderPayload: Schema.Types.Mixed,
  pickupLocation: Schema.Types.Mixed,
  dropLocation: Schema.Types.Mixed,
  earnings: Number,
  status: { type: String, enum: ['created', 'accepted', 'in_transit', 'delivered', 'cancelled'], default: 'created' },
  acceptedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', OrderSchema);
