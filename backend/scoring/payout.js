/**
 * GigShield - Payout Calculation Service
 * Deterministically constructs payout composites matching the structured tier definitions and historical baseline values.
 */

/**
 * Calculates the final payout components using baseline compensation and parametric boundaries.
 */
function calculatePayout(strandedHours, workerId, claimTimestamp, tier, checkResults, dbWorker) {
  // 1. Extract base order earnings from Check 1 payloads
  let orderEarnings = 0;
  const platformCheck = checkResults.find(r => r.checkName === 'platform_api');
  if (platformCheck && platformCheck.data && platformCheck.data.orderEarnings) {
    orderEarnings = platformCheck.data.orderEarnings;
  }

  // 2. Extract structured hourly baseline values traversing Mongoose Maps
  const ts = new Date(claimTimestamp);
  const dayOfWeek = String(ts.getDay());
  const hourBand = String(ts.getHours());

  let hourlyBaseline = 75.0; // Global fallback mapping

  if (dbWorker && dbWorker.earningsBaseline && typeof dbWorker.earningsBaseline.get === 'function') {
    const dayData = dbWorker.earningsBaseline.get(dayOfWeek);
    if (dayData) {
      // Handle both Native JS objects and Deep-Nested Mongoose Maps natively
      if (typeof dayData.get === 'function') {
         const hourData = dayData.get(hourBand);
         if (hourData && hourData.avgHourlyRate !== undefined) hourlyBaseline = hourData.avgHourlyRate;
      } else {
         if (dayData[hourBand] && dayData[hourBand].avgHourlyRate !== undefined) hourlyBaseline = dayData[hourBand].avgHourlyRate;
      }
    }
  }

  // 3. Setup Tier parameters limiters
  let tierMultiplier = 0.75;
  let maxStrandedHours = 1.0;

  const normalizedTier = (tier || 'basic').toLowerCase();
  if (normalizedTier === 'standard') {
    tierMultiplier = 0.90;
    maxStrandedHours = 3.0;
  } else if (normalizedTier === 'premium') {
    tierMultiplier = 1.00;
    maxStrandedHours = Infinity;
  }

  // 4. Cap operational bounds
  const cappedHours = Math.min(strandedHours, maxStrandedHours);

  // 5. Build isolated calculation components
  const strandedCompensation = cappedHours * hourlyBaseline * tierMultiplier;

  // 6. Setup hard-coded consecutive rules natively mapped (Premium Only)
  const consecutiveDayBonus = (normalizedTier === 'premium' && strandedHours >= 4) ? 100.0 : 0.0;

  // 7. Establish clean integer composite outputs natively handling fractions
  const total = Math.round(orderEarnings + strandedCompensation + consecutiveDayBonus);

  // 8. Return strict structure matching database PayoutBreakdown requirements
  return {
    orderEarnings,
    strandedHours: cappedHours, // Record the capped structural representation 
    hourlyBaseline,
    tierMultiplier,
    strandedCompensation,
    consecutiveDayBonus,
    total,
    currency: "INR"
  };
}

/**
 * Derives structurally probable stranded durations from localized structural signals.
 * TODO Phase 3: Replace simulation with actual disruption duration from event log
 */
async function estimateStrandedHours(claimTimestamp, disruptionType, environmentalCheckResult) {
  let baseHours = 1.0;
  
  // Categorical defaults
  switch(disruptionType) {
    case 'flooding':
      baseHours = 2.0;
      break;
    case 'heat':
      baseHours = 3.0;
      break;
    case 'aqi':
      baseHours = 4.0;
      break;
    case 'strike':
      baseHours = 2.5;
      break;
    case 'road_closure':
      baseHours = 1.5;
      break;
    case 'other':
    default:
      baseHours = 1.0;
  }

  const confidence = environmentalCheckResult ? environmentalCheckResult.confidence : 'LOW';

  let scalar = 0.50; // LOW defaults safely
  if (confidence === 'HIGH') {
    scalar = 1.0;
  } else if (confidence === 'MEDIUM') {
    scalar = 0.75;
  }

  return baseHours * scalar;
}

module.exports = {
  calculatePayout,
  estimateStrandedHours
};
