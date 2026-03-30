const { mongoose, connectDB } = require('../db/mongo');

require('../models/Worker');
require('../models/Policy');

async function repairActivePolicies() {
  const Worker = mongoose.model('Worker');
  const Policy = mongoose.model('Policy');

  const workers = await Worker.find({
    $or: [
      { activePolicyId: { $ne: null } },
      { onboardingCompleted: true },
    ],
  }).exec();

  let workersFixed = 0;
  let duplicatePoliciesCancelled = 0;

  for (const worker of workers) {
    const activePolicies = await Policy.find({
      workerId: worker._id,
      status: 'active',
    })
      .sort({ createdAt: -1, _id: -1 })
      .exec();

    if (activePolicies.length === 0) {
      if (worker.activePolicyId) {
        worker.activePolicyId = null;
        worker.updatedAt = new Date();
        await worker.save();
        workersFixed += 1;
      }
      continue;
    }

    const [primaryPolicy, ...duplicates] = activePolicies;

    if (duplicates.length > 0) {
      await Policy.updateMany(
        { _id: { $in: duplicates.map((policy) => policy._id) } },
        {
          $set: {
            status: 'cancelled',
            updatedAt: new Date(),
          },
        }
      );
      duplicatePoliciesCancelled += duplicates.length;
    }

    if (!worker.activePolicyId || worker.activePolicyId.toString() !== primaryPolicy._id.toString()) {
      worker.activePolicyId = primaryPolicy._id;
      worker.updatedAt = new Date();
      await worker.save();
      workersFixed += 1;
    }
  }

  return {
    scannedWorkers: workers.length,
    workersFixed,
    duplicatePoliciesCancelled,
  };
}

(async () => {
  try {
    await connectDB();
    const result = await repairActivePolicies();
    console.log(JSON.stringify(result, null, 2));
    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
})();
