/**
 * Computes deterministic weighting to return composite validation limits
 * and categorical operational decisions safely mapping against structural verifications.
 */
function computeCompositeScore(checkResults) {
  const hasHardReject = checkResults.some(r => r.hardReject);
  if (hasHardReject) {
    return { 
      compositeScore: 0.0, 
      decision: "REJECT" 
    };
  }

  const weightedSum = checkResults.reduce((sum, r) => sum + (r.score * r.weight), 0);
  
  let decision = "MANUAL_REVIEW";
  if (weightedSum >= 0.60) {
    decision = "APPROVE";
  } else if (weightedSum >= 0.20) {
    decision = "SOFT_HOLD";
  } else {
    decision = "REJECT";
  }

  return {
    compositeScore: weightedSum,
    decision
  };
}

module.exports = {
  computeCompositeScore
};
