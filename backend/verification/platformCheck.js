const axios = require('axios');

/**
 * Check 1: Verifies the claim against the platform API (Zomato/Swiggy).
 *
 * @param {string} orderId 
 * @param {string} workerId 
 * @param {Date|string|number} claimTimestamp 
 * @param {string} platform - "zomato" or "swiggy"
 * @returns {object} checkResult
 */
async function checkPlatformApi(orderId, workerId, claimTimestamp, platform) {
  const checkName = "platform_api";
  const weight = 0.40;
  const baseUrl = process.env.PLATFORM_API_URL || 'http://localhost:8002';

  try {
    const params = {};
    if (typeof workerId === 'string' && workerId.startsWith('WRK-')) {
      params.workerId = workerId;
    }

    const response = await axios.get(`${baseUrl}/${platform}/orders/${orderId}`, {
      params,
      timeout: 5000 // 5 seconds timeout
    });

    const order = response.data;

    // Hard reject: order status
    if (order.status !== "IN_TRANSIT") {
      return {
        checkName,
        weight,
        score: 0.0,
        confidence: "NONE",
        hardReject: true,
        flags: ["NOT_IN_TRANSIT"],
        data: { reason: "Order status is not IN_TRANSIT", orderStatus: order.status },
        completedAt: new Date()
      };
    }

    // Time delta calculation
    const claimTime = new Date(claimTimestamp).getTime();
    const acceptTime = new Date(order.acceptanceTimestamp).getTime();
    const timeDeltaSeconds = Math.abs((claimTime - acceptTime) / 1000);

    // Hard reject: time delta exceeds 7200 seconds
    if (timeDeltaSeconds > 7200) {
      return {
        checkName,
        weight,
        score: 0.0,
        confidence: "NONE",
        hardReject: true,
        flags: ["TIME_DELTA_EXCEEDED"],
        data: { reason: "Acceptance timestamp > 7200s from claim", timeDeltaSeconds },
        completedAt: new Date()
      };
    }

    // Score calculation
    let score = 0;
    if (timeDeltaSeconds < 3600) {
      score = 1.0;
    } else {
      score = Math.max(0.3, 1 - (timeDeltaSeconds / 7200));
    }

    // Confidence assignment
    let confidence = "LOW";
    if (score > 0.7) confidence = "HIGH";
    else if (score > 0.4) confidence = "MEDIUM";

    return {
      checkName,
      weight,
      score,
      confidence,
      hardReject: false,
      flags: [],
      data: {
        orderStatus: order.status,
        orderEarnings: order.workerPayout,
        routePolyline: order.routePolyline,
        platformLastGps: order.lastKnownLocation,
        pickupCoords: order.pickupCoords,
        dropCoords: order.dropCoords,
        timeDeltaSeconds
      },
      completedAt: new Date()
    };

  } catch (error) {
    // 404 or 403 hard rejects
    if (error.response && (error.response.status === 404 || error.response.status === 403)) {
      return {
        checkName,
        weight,
        score: 0.0,
        confidence: "NONE",
        hardReject: true,
        flags: [`HTTP_${error.response.status}_REJECT`],
        data: { reason: error.response.data?.error || "Order not found or worker mismatch" },
        completedAt: new Date()
      };
    }

    // Timeout handled explicitly
    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      return {
        checkName,
        weight,
        score: 0.3,
        confidence: "LOW",
        hardReject: false,
        flags: ["PLATFORM_API_TIMEOUT"],
        data: null,
        completedAt: new Date()
      };
    }

    // All other errors handled as generic fail
    return {
      checkName,
      weight,
      score: 0.0,
      confidence: "NONE",
      hardReject: false,
      flags: ["PLATFORM_API_ERROR"],
      data: { error: error.message },
      completedAt: new Date()
    };
  }
}

module.exports = { checkPlatformApi };
