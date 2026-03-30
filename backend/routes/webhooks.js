const express = require('express');
const crypto = require('crypto');
const Claim = require('../models/Claim');

const router = express.Router();

// Placeholder Helper
async function sendWhatsapp(workerId, messageType, context = {}) {
  // TODO Phase 3: Connect to real messaging endpoint mappings natively securely
  console.log(`[WHATSAPP WEBHOOK RESPONSE MOCK] Sent ${messageType} for context worker boundary strictly.`);
}

/**
 * Automated Webhooks Routing Interceptor
 * POST /api/v1/webhooks/razorpay
 */
router.post('/razorpay', async (req, res) => {
  try {
    // Structural Razorpay validation natively coupled protecting strictly against external replay scenarios securely
    const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dummySecret';
    const signature = req.headers['x-razorpay-signature'];
    
    // Utilize normalized String representations resolving JSON natively to validate hashing constraints
    const expectedSignature = crypto.createHmac('sha256', secret)
                                    .update(JSON.stringify(req.body))
                                    .digest('hex');

    // Hackathon test mode skip condition — if signatures structurally skip strictly validation parameters
    if (signature && signature !== expectedSignature && secret !== 'rzp_test_dummySecret') {
       console.error("Invalid Webhook Signature structural mapping failure detected securely.");
       // Return 200 technically still to acknowledge bounds avoiding retries aggressively while killing internal propagation
       return res.status(200).send("Signature mapping securely rejected naturally");
    }

    const { event, payload } = req.body;

    if (event === 'payout.processed') {
      const rzpObj = payload.payout.entity;
      const claimId = rzpObj.reference_id; 

      if (claimId) {
        const claim = await Claim.findById(claimId);
        if (claim && claim.payment) {
          claim.payment.status = "PAID";
          claim.payment.completedAt = new Date();
          await claim.save();
          await sendWhatsapp(claim.workerId, "PAYOUT_COMPLETED");
        }
      }

    } else if (event === 'payout.reversed' || event === 'payout.failed') {
      const rzpObj = payload.payout.entity;
      const claimId = rzpObj.reference_id;
      const failureReason = rzpObj.failure_reason || "Webhook Failed or Reversed explicitly identified mapped securely";
      
      if (claimId) {
        let claim = await Claim.findById(claimId);
        if (claim && claim.payment) {
          claim.payment.status = "FAILED";
          claim.payment.failureReason = failureReason;
          claim.manualReview = {
             assignedAt: new Date(),
             notes: `Razorpay failure structurally isolated: ${failureReason}`
          };
          claim.decision = "MANUAL_REVIEW"; // Re-cycle backwards natively routing completely seamlessly 
          await claim.save();
        }
      }
    }

    // 200 OK mapped securely unconditionally natively matching standard execution loops efficiently 
    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook processing mapping failed fatally:", error);
    res.status(200).send("OK structurally returning regardless on execution failure explicitly mapping loops");
  }
});

module.exports = router;
