const { mongoose, connectDB } = require('../db/mongo');

require('../models/Policy');

(async () => {
  try {
    await connectDB();
    const Policy = mongoose.model('Policy');

    const duplicates = await Policy.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$workerId',
          count: { $sum: 1 },
          policyIds: { $push: '$_id' },
        },
      },
      { $match: { count: { $gt: 1 } } },
    ]);

    console.log(
      JSON.stringify(
        {
          duplicateActiveWorkers: duplicates.length,
          duplicates,
        },
        null,
        2
      )
    );

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
    try {
      await mongoose.disconnect();
    } catch (_) {}
    process.exit(1);
  }
})();
