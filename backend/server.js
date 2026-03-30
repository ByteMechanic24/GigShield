const { connectDB, createIndexes } = require('./db/mongo');
const app = require('./app');

require('./models/Worker');
require('./models/Policy');
require('./models/Claim');
require('./models/DisruptionEvent');
require('./models/NotificationLog');
require('./models/Organization');
require('./models/AdminAccount');
require('./models/AuthIdentity');
require('./models/AuthSession');
require('./models/AuthChallenge');
require('./models/WorkerSession');
require('./models/Order');
require('./models/Payout');
require('./models/ManualReview');
require('./models/AuditLog');
require('./models/ClaimEvidence');
require('./models/ClaimCheck');

// We utilize an isolated function block gracefully booting core services mapped sequentially
async function startServer() {
  try {
    // 1 & 3: Database and structure setups bounded safely before accepting external connections natively
    await connectDB();
    await createIndexes();
    
    console.log("GigShield API started — indexes created natively and bound.");

    // Instantiate simple background Cron-like execution tracking natively cleanly synchronously
    setInterval(() => {
      const d = new Date();
      // Check securely mapped against locally executing instances identifying Monday Midnight windows
      // Day 1 = Monday. Hours 0 = Midnight constraints natively securely processed 
      if (d.getDay() === 1 && d.getHours() === 0) {
        try {
          const { renewWeeklyPremiums } = require('./workers/softHoldPoller');
          if (renewWeeklyPremiums) {
            renewWeeklyPremiums();
          }
        } catch (scriptErr) {
          console.error("SoftHoldPoller background instantiation gracefully aborted: Poller script likely omitted structurally", scriptErr.message);
        }
      }
    }, 60 * 60 * 1000); // 1 Hour execution constraint mapped in ms cleanly natively 

    // 4. Bound routing bindings locally opening to network arrays efficiently
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
      console.log(`GigShield Express Application actively listening on PORT ${port}`);
    });

  } catch (error) {
    console.error("Critical bootstrapping exception executed structurally fatally during application launch:", error);
    process.exit(1);
  }
}

startServer();
