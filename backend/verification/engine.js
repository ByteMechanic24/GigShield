const Worker = require('../models/Worker');
const { checkPlatformApi } = require('./platformCheck');
const { checkGpsRouteConsistency, haversine } = require('./gpsCheck');
const { checkEnvironmentalSignals } = require('./environmentalCheckLive');
const { checkFraudAnomalyScore } = require('./fraudCheck');
const { checkPhotoEvidence } = require('./photoCheck');
const { computeCompositeScore } = require('../scoring/composite');

/**
 * Orchestrator: Central Verification Engine
 * Sequentially gates Platform API requirements, subsequently branching instantly to multi-lateral asynchronous checks returning composite payloads securely.
 */
async function runVerification(claim, db, redisClient) {
  // 1. Extract from claim strictly avoiding unsafe structure injection mutations
  const { orderId, platform, workerId } = claim;
  const claimedGps = { lat: claim.gps.lat, lng: claim.gps.lng };
  
  let networkGps = null;
  if (claim.gps.network_lat !== undefined && claim.gps.network_lat !== null) {
    networkGps = {
      lat: claim.gps.network_lat,
      lng: claim.gps.network_lng,
      accuracy_metres: claim.gps.network_accuracy_metres
    };
  }
  
  const claimTimestamp = claim.claimTimestamp ? new Date(claim.claimTimestamp) : new Date();

  // 2. Gate Check: Executing Check 1 independently 
  // Required since further paths require reliable telemetry directly captured structurally from platform API responses
  const check1Result = await checkPlatformApi(orderId, workerId.toString(), claimTimestamp, platform);
  
  if (check1Result.hardReject) {
    return {
      compositeScore: 0.0,
      decision: "REJECT",
      checkResults: [check1Result]
    };
  }

  // 3. Extract baseline verification targets mapped dynamically to Check 1 payload 
  const routePolyline = check1Result.data?.routePolyline;
  const platformLastGps = check1Result.data?.platformLastGps;
  const platformGpsDivergence = haversine(claimedGps, platformLastGps);

  // 4. Fetch the isolated physical security footprint securely querying Mongo models locally mapped against parameters
  let workerDeviceFp = "unknown";
  try {
    const WorkerModel = (db && db.models && db.models.Worker) ? db.models.Worker : Worker;
    const workerDoc = await WorkerModel.findById(workerId, "deviceFingerprint").exec();
    if (workerDoc && workerDoc.deviceFingerprint) {
      workerDeviceFp = workerDoc.deviceFingerprint;
    }
  } catch(e) {
    // defaults silently maintaining isolated structural parameters instead of halting processing
  }

  // 5. Fire Remaining 4 Check engines completely independently synchronously wrapped via Promise.allSettled
  const [gpsRes, envRes, fraudRes, photoRes] = await Promise.allSettled([
    checkGpsRouteConsistency(claimedGps, networkGps, routePolyline, platformLastGps),
    checkEnvironmentalSignals(claimedGps, claimTimestamp, claim.disruptionType),
    checkFraudAnomalyScore(workerId, orderId, workerDeviceFp, platformGpsDivergence, db, redisClient),
    checkPhotoEvidence(claim.photos)
  ]);

  const assembleFallback = (checkName, weight) => ({
    checkName,
    weight,
    score: 0.4,
    confidence: "NONE",
    hardReject: false,
    flags: ["CHECK_EXECUTION_ERROR"],
    data: null,
    completedAt: new Date()
  });

  const check2 = gpsRes.status === "fulfilled" ? gpsRes.value : assembleFallback("gps_route", 0.20);
  const check3 = envRes.status === "fulfilled" ? envRes.value : assembleFallback("environmental", 0.25);
  const check4 = fraudRes.status === "fulfilled" ? fraudRes.value : assembleFallback("fraud_anomaly", 0.10);
  const check5 = photoRes.status === "fulfilled" ? photoRes.value : assembleFallback("photo_evidence", 0.05);

  // 6. Output normalization
  const checkResults = [check1Result, check2, check3, check4, check5];

  // 7. Scoring and determination
  const { compositeScore, decision } = computeCompositeScore(checkResults);

  return {
    compositeScore,
    decision,
    checkResults
  };
}

module.exports = {
  runVerification
};
