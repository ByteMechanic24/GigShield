const express = require('express');
const axios = require('axios');
const Policy = require('../models/Policy');
const Worker = require('../models/Worker');
const AuditLog = require('../models/AuditLog');
const { requireWorker } = require('../middleware/auth');
const {
  buildCacheKey,
  deleteByPatterns,
  getOrSetJson,
  workerPolicyPattern,
} = require('../services/cache');

const router = express.Router();

function getNextWeekBounds() {
  const d = new Date();
  const day = d.getDay() || 7; 
  d.setHours(0, 0, 0, 0);
  const start = new Date(d);
  start.setDate(d.getDate() - day + 1 + 7); // Following Monday
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/**
 * POST /api/v1/policies/renew
 */
router.post('/renew', requireWorker, async (req, res) => {
  try {
    const worker = await Worker.findById(req.workerId);
    if (!worker) return res.status(404).json({ error: "Worker Missing" });

    // ML Integration: dynamically retrieving the updated baseline scoring metric strictly modeled securely
    let computedPremium = 30;
    try {
      const mlUrl = `${process.env.ML_SERVICE_URL || 'http://localhost:8001'}/predict/premium`;
      const mlRes = await axios.post(mlUrl, { city: worker.city, tier: worker.tier }, { timeout: 3000 });
      if (mlRes.data && mlRes.data.premium) computedPremium = mlRes.data.premium;
    } catch(e) {
      // Proceed safely assigning minimum bounds on timeout vectors implicitly mapping continuity seamlessly
    }

    const { start, end } = getNextWeekBounds();
    const policy = new Policy({
      workerId: worker._id,
      organizationId: worker.organizationId || null,
      tier: worker.tier,
      premiumAmount: computedPremium,
      riskScore: 0.5,
      weekStart: start,
      weekEnd: end,
      status: "active",
      coverageLimits: {
         maxPayoutPerWeek: worker.tier === 'premium' ? 20000 : (worker.tier === 'standard' ? 10000 : 5000)
      }
    });

    await policy.save();

    // Map backwards implicitly replacing the worker doc linkage strictly securing state bounds efficiently
    worker.activePolicyId = policy._id;
    await worker.save();
    await deleteByPatterns([workerPolicyPattern(worker._id)]);
    await AuditLog.create({
      actorType: 'worker',
      actorId: worker._id,
      entityType: 'policy',
      entityId: policy._id,
      action: 'policy_renewed',
      metadata: { tier: policy.tier, premiumAmount: policy.premiumAmount },
      ipAddress: req.ip,
    });

    res.json(policy);
  } catch (error) {
    res.status(500).json({ error: "Manual Override Renewal mapping exception structural routing failed" });
  }
});

/**
 * GET /api/v1/policies/
 */
router.get('/', requireWorker, async (req, res) => {
  try {
    const policies = await Policy.find({ workerId: req.workerId }).sort({ weekStart: -1 });
    res.json(policies);
  } catch(e) {
    res.status(500).json({ error: "Pipeline failure" });
  }
});

/**
 * GET /api/v1/policies/current
 */
router.get('/current', requireWorker, async (req, res) => {
  try {
    const now = new Date();
    const cacheKey = buildCacheKey('policy:current', {
      workerId: req.workerId,
      isoMinute: now.toISOString().slice(0, 16),
    });
    const { value: activePolicy, cacheHit } = await getOrSetJson(cacheKey, 60, async () => {
      const result = await Policy.findOne({
        workerId: req.workerId,
        status: "active",
        weekStart: { $lte: now },
        weekEnd: { $gte: now }
      }).lean();
      return result;
    });

    if (!activePolicy) return res.status(404).json({ error: "No currently bounded active policy mapped." });

    res.set('X-Cache', cacheHit ? 'HIT' : 'MISS');
    res.json(activePolicy);
  } catch(e) {
    res.status(500).json({ error: "Failure extracting current constraints" });
  }
});

module.exports = router;
