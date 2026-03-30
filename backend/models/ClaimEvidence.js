const mongoose = require('mongoose');
const { Schema } = mongoose;

const GpsEvidenceSchema = new Schema({
  lat: Number,
  lng: Number,
  accuracy_metres: Number,
  network_lat: Number,
  network_lng: Number,
  network_accuracy_metres: Number,
  cell_gps_divergence_metres: Number,
  google_geoloc_used: { type: Boolean, default: false },
}, { _id: false });

const PhotoEvidenceSchema = new Schema({
  name: String,
  mimeType: String,
  sizeBytes: Number,
  capturedAt: Date,
  dataUrl: String,
}, { _id: false });

const ClaimEvidenceSchema = new Schema({
  claimId: { type: Schema.Types.ObjectId, ref: 'Claim', required: true, unique: true },
  workerId: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
  gps: { type: GpsEvidenceSchema, default: null },
  photos: { type: [PhotoEvidenceSchema], default: [] },
  platformLastGps: Schema.Types.Mixed,
  routePolyline: String,
  environmentSnapshot: Schema.Types.Mixed,
  satelliteSnapshot: Schema.Types.Mixed,
  sourcePayloads: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ClaimEvidence', ClaimEvidenceSchema);
