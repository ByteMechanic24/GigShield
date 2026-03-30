const { connectDB, mongoose } = require('../db/mongo');
const Organization = require('../models/Organization');
const Worker = require('../models/Worker');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const AuthIdentity = require('../models/AuthIdentity');
const Payout = require('../models/Payout');
const ManualReview = require('../models/ManualReview');
const ClaimEvidence = require('../models/ClaimEvidence');
const ClaimCheck = require('../models/ClaimCheck');
const { upsertWorkerIdentity } = require('../services/auth');

async function ensureDefaultOrganization() {
  return Organization.findOneAndUpdate(
    { slug: 'gigshield-default' },
    {
      name: 'GigShield Default Org',
      slug: 'gigshield-default',
      status: 'active',
      settings: { seeded: true },
      updatedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function migrateWorkers(defaultOrg) {
  const workers = await Worker.find({});
  for (const worker of workers) {
    let changed = false;
    if (!worker.organizationId) {
      worker.organizationId = defaultOrg._id;
      changed = true;
    }
    if (!worker.accountStatus) {
      worker.accountStatus = 'active';
      changed = true;
    }
    if (worker.phoneVerified === undefined) {
      worker.phoneVerified = true;
      changed = true;
    }
    if (worker.upiVerified === undefined) {
      worker.upiVerified = true;
      changed = true;
    }
    if (changed) {
      worker.updatedAt = new Date();
      await worker.save();
    }
    await upsertWorkerIdentity(worker);
  }
}

async function migratePoliciesAndClaims(defaultOrg) {
  await Policy.updateMany(
    { organizationId: { $exists: false } },
    { $set: { organizationId: defaultOrg._id, updatedAt: new Date() } }
  );

  const claims = await Claim.find({});
  for (const claim of claims) {
    const update = {};
    if (!claim.organizationId) update.organizationId = defaultOrg._id;
    if (!claim.intakeStatus) update.intakeStatus = 'submitted';
    if (!claim.reviewStatus) {
      update.reviewStatus = claim.decision === 'MANUAL_REVIEW' ? 'manual_review' : 'completed';
    }
    if (!claim.payoutStatus) {
      if (claim.payment?.status === 'PAID') update.payoutStatus = 'paid';
      else if (claim.payment?.status === 'INITIATED') update.payoutStatus = 'initiated';
      else if (claim.payment?.status === 'FAILED') update.payoutStatus = 'failed';
      else update.payoutStatus = 'pending';
    }
    if (!claim.disruptionEventId) update.disruptionEventId = null;

    if (Object.keys(update).length > 0) {
      update.updatedAt = new Date();
      await Claim.updateOne({ _id: claim._id }, { $set: update });
    }

    if (claim.payment || claim.payout) {
      await Payout.findOneAndUpdate(
        { claimId: claim._id },
        {
          workerId: claim.workerId,
          policyId: claim.policyId,
          organizationId: defaultOrg._id,
          amount: claim.payout?.total || 0,
          currency: claim.payout?.currency || 'INR',
          upiHandle: claim.payment?.upiHandle || null,
          providerPayoutId: claim.payment?.razorpayPayoutId || null,
          status: mapPayoutStatus(claim.payment?.status),
          failureReason: claim.payment?.failureReason || null,
          initiatedAt: claim.payment?.initiatedAt || null,
          completedAt: claim.payment?.completedAt || null,
          updatedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    if (claim.manualReview) {
      await ManualReview.findOneAndUpdate(
        { claimId: claim._id },
        {
          assignedAt: claim.manualReview.assignedAt || null,
          status: claim.manualReview.resolvedAt ? 'resolved' : (claim.manualReview.assignedAt ? 'assigned' : 'queued'),
          resolution: mapManualReviewResolution(claim.manualReview.resolution),
          notes: claim.manualReview.notes || null,
          resolvedAt: claim.manualReview.resolvedAt || null,
          updatedAt: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    await ClaimEvidence.findOneAndUpdate(
      { claimId: claim._id },
      {
        workerId: claim.workerId,
        organizationId: claim.organizationId || defaultOrg._id,
        gps: claim.gps || null,
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (Array.isArray(claim.checkResults) && claim.checkResults.length > 0) {
      await ClaimCheck.deleteMany({ claimId: claim._id });
      await ClaimCheck.insertMany(
        claim.checkResults.map((result) => ({
          claimId: claim._id,
          workerId: claim.workerId,
          organizationId: claim.organizationId || defaultOrg._id,
          checkName: result.checkName,
          weight: result.weight,
          score: result.score,
          confidence: result.confidence || 'NONE',
          hardReject: Boolean(result.hardReject),
          flags: result.flags || [],
          data: result.data || null,
          completedAt: result.completedAt || null,
          updatedAt: new Date(),
        }))
      );
    }
  }
}

function mapPayoutStatus(status) {
  switch (status) {
    case 'PAID':
      return 'paid';
    case 'INITIATED':
      return 'initiated';
    case 'FAILED':
      return 'failed';
    default:
      return 'pending';
  }
}

function mapManualReviewResolution(resolution) {
  if (resolution === 'APPROVED') return 'approved';
  if (resolution === 'REJECTED') return 'rejected';
  return undefined;
}

async function main() {
  await connectDB();
  const defaultOrg = await ensureDefaultOrganization();
  await migrateWorkers(defaultOrg);
  await migratePoliciesAndClaims(defaultOrg);

  const summary = {
    organizations: await Organization.countDocuments(),
    workers: await Worker.countDocuments(),
    authIdentities: await AuthIdentity.countDocuments(),
    payouts: await Payout.countDocuments(),
    manualReviews: await ManualReview.countDocuments(),
    claimEvidence: await ClaimEvidence.countDocuments(),
    claimChecks: await ClaimCheck.countDocuments(),
  };

  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
