const axios = require('axios');
const Worker = require('../models/Worker');

/**
 * Check 5: Fraud Anomaly Scoring
 * Calls the Python ML Isolation Forest endpoint and applies hard rule deductions for structural spoof patterns.
 */
async function checkFraudAnomalyScore(workerId, orderId, deviceFingerprint, platformGpsDivergenceMetres, db, redisClient) {
  // 1. Fetch worker document
  let worker;
  try {
    // If db parameter is passed as mongoose instance natively use it, normally fallback cleanly:
    const WorkerModel = (db && db.models && db.models.Worker) ? db.models.Worker : Worker;
    worker = await WorkerModel.findById(workerId);
  } catch (err) {
    worker = null;
  }

  if (!worker) {
    return {
      checkName: "fraud_anomaly",
      weight: 0.10,
      score: 0.0,
      confidence: "NONE",
      hardReject: true,
      flags: ["WORKER_NOT_FOUND"],
      data: null,
      completedAt: new Date()
    };
  }

  // 2. Fetch zone peer average claim count from Redis
  let zonePeerAvg = 2.5;
  try {
    if (redisClient && typeof redisClient.getJson === 'function') {
      const cityQueryKey = worker.city ? worker.city.trim().toLowerCase() : "unknown";
      const val = await redisClient.getJson(`zone_avg_claims_30d:${cityQueryKey}`);
      if (val !== null && val !== undefined) {
        zonePeerAvg = parseFloat(val);
      }
    }
  } catch (e) {
    // defaults safely to 2.5 on redis miss
  }

  // 3. Count other accounts on identical device
  const WorkerModel = (db && db.models && db.models.Worker) ? db.models.Worker : Worker;
  const deviceAccountCount = await WorkerModel.countDocuments({
    deviceFingerprint: deviceFingerprint,
    _id: { $ne: workerId }
  });

  // 4. Build feature object required to seed Isolation Forest ML Model
  const features = {
    claims_last_30d: worker.claimCount30d || 0,
    claims_per_peer_ratio: (worker.claimCount30d || 0) / zonePeerAvg,
    days_since_enrollment: worker.tenureDays || 0,
    enrollment_days_before_storm: 999, // default un-contextualized
    device_account_count: deviceAccountCount,
    gps_trajectory_variance: 0.1,      // default pre-ML fallback metric
    route_type_match: 0.8,             // default pre-ML fallback metric
    platform_gps_divergence_metres: platformGpsDivergenceMetres
  };

  // 6. Define Rule-based mapping flags
  const flags = [];
  let totalReduction = 0;
  let hasHardFlags = false;

  // Strict evaluation based on prompt criteria:
  if (deviceAccountCount > 1) {
    flags.push("MULTI_ACCOUNT_DEVICE");
    totalReduction += 0.25;
    hasHardFlags = true;
  }

  if (worker.tenureDays < 3) {
    flags.push("PRE_STORM_ENROLLMENT");
    totalReduction += 0.25;
    hasHardFlags = true;
  }

  if (features.claims_per_peer_ratio > 3) {
    flags.push("HIGH_CLAIM_FREQUENCY");
    totalReduction += 0.25;
    hasHardFlags = true;
  }

  if (worker.tenureDays < 14) {
    flags.push("NEW_ENROLLEE_UNVERIFIED");
    totalReduction += 0.10;
  }

  // 5. Call API Model POST route
  let mlScoreRaw = null;
  let mlSuccess = false;
  let finalScore = 0;

  try {
    const mlUrl = `${process.env.ML_SERVICE_URL || 'http://localhost:8001'}/predict/fraud-score`;
    const res = await axios.post(mlUrl, features, { timeout: 3000 });
    
    if (res.data && res.data.fraudScore !== undefined) {
      mlScoreRaw = parseFloat(res.data.fraudScore);
      mlSuccess = true;
    }
  } catch (err) {
    mlSuccess = false;
  }

  // 7 & 8. Evaluate logical fallback structure cleanly mapped from constraints
  if (mlSuccess) {
    finalScore = Math.max(0, mlScoreRaw - totalReduction);
  } else {
    flags.push("ML_SERVICE_UNAVAILABLE");
    if (hasHardFlags) {
      finalScore = 0.3;
    } else {
      finalScore = 0.6;
    }
  }

  // 9. Assign return structures
  const confidence = (flags.length === 0) ? "HIGH" : "MEDIUM";

  return {
    checkName: "fraud_anomaly",
    weight: 0.10,
    score: finalScore,
    confidence,
    hardReject: false,
    flags,
    data: {
      features,
      mlScoreRaw
    },
    completedAt: new Date()
  };
}

module.exports = {
  checkFraudAnomalyScore
};
