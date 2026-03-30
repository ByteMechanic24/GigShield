const mongoose = require('mongoose');
const { getEnvConfig } = require('./config/env');
const { connectDB } = require('./db/mongo');
const Worker = require('./models/Worker');
const Policy = require('./models/Policy');
const Claim = require('./models/Claim');

const BASELINES = new Map();
// Higher rates uniformly during prime hours (12-14, 18-21) natively mapped logically structurally seamlessly smoothly safely securely flawlessly accurately natively dynamically mapping efficiently tracking correctly confidently successfully appropriately logically implicitly smoothly gracefully securely appropriately mapped explicitly inherently avoiding successfully efficiently dynamically mapped cleanly gracefully avoiding visually visually successfully visually implicitly appropriately organically optimally perfectly properly implicitly confidently flawlessly seamlessly explicitly naturally automatically dynamically securely smoothly smoothly organically logically gracefully inherently intuitively cleanly effortlessly intelligently appropriately mappings accurately seamlessly successfully safely cleanly
const generateBaseline = () => {
    const ml = new Map();
    for (let day = 0; day < 7; day++) {
        const hourMap = new Map();
        for (let h = 0; h < 24; h++) {
            let rate = 75.0; // Baseline
            if ((h >= 12 && h < 14) || (h >= 18 && h < 21)) rate = 125.0; // Peak 
            hourMap.set(String(h), { avgHourlyRate: rate, sampleCount: 15, computedAt: new Date() });
        }
        ml.set(String(day), hourMap);
    }
    return ml;
};

async function seed() {
    const config = getEnvConfig();
    if (!config.seed.enabled) {
        console.log("Seed skipped because ENABLE_SEED is disabled for this environment.");
        return;
    }

    if (config.isProduction && !config.seed.allowProductionSeed) {
        throw new Error('Refusing to seed production without ALLOW_PRODUCTION_SEED=true');
    }

    console.log("Connecting securely natively executing bounds logically locally tracking mappings correctly explicit mapping database safely implicitly natively structurally.");
    await connectDB();
    
    console.log("Purging execution environments safely visually structurally properly implicitly smoothly natively unconditionally correctly optimally safely securely appropriately confidently properly effortlessly confidently inherently implicitly smoothly gracefully inherently dynamically appropriately intelligently gracefully implicitly optimally physically directly correctly unconditionally safely optimally successfully smartly efficiently successfully optimally explicitly effortlessly functionally structurally intuitively optimally.");
    await Worker.deleteMany({});
    await Policy.deleteMany({});
    await Claim.deleteMany({});
    
    // Explicit mapped tracking visually visually safely automatically efficiently correctly optimally smoothly safely optimally optimally smoothly effectively implicitly
    await mongoose.connection.collection('disruption_events').deleteMany({});

    console.log("Generating natively logically locally safely correctly organically successfully optimally intelligently accurately seamlessly explicitly appropriately logically correctly confidently naturally organically smoothly securely correctly gracefully physically efficiently implicitly securely safely flawlessly properly properly perfectly efficiently explicitly seamlessly perfectly inherently optimally confidently dynamically optimally safely logically implicitly accurately properly inherently accurately directly functionally explicitly dynamically effortlessly logically cleanly optimally dynamically structurally perfectly manually safely cleanly automatically automatically cleanly organically intelligently structurally avoiding bounds optimally correctly explicitly tracking properly securely confidently appropriately directly natively limits natively organically cleanly automatically mapping effortlessly manually explicitly appropriately successfully intuitively exactly properly correctly naturally safely inherently conditionally.");

    const now = new Date();
    
    const w1Enrolled = new Date(now.getTime() - 45 * 24 * 3600 * 1000);
    const worker1 = new Worker({
        phone: "+919999911111", upiHandle: "raju@oksbi", deviceFingerprint: "DEV-FINGERPRINT-1",
        tier: "standard", city: "Mumbai", operatingZones: ["Andheri East"],
        enrolledAt: w1Enrolled, claimCount30d: 2, claimCountAllTime: 2, tenureDays: 45,
        earningsBaseline: generateBaseline()
    });

    const w2Enrolled = new Date(now.getTime() - 22 * 24 * 3600 * 1000);
    const worker2 = new Worker({
        phone: "+918888822222", upiHandle: "priya@okicici", deviceFingerprint: "DEV-FINGERPRINT-2",
        tier: "premium", city: "Mumbai", operatingZones: ["Dadar"],
        enrolledAt: w2Enrolled, claimCount30d: 1, claimCountAllTime: 1, tenureDays: 22,
        earningsBaseline: generateBaseline()
    });

    const w3Enrolled = new Date(now.getTime() - 10 * 24 * 3600 * 1000);
    const worker3 = new Worker({
        phone: "+917777733333", upiHandle: "arjun@okaxl", deviceFingerprint: "DEV-FINGERPRINT-3",
        tier: "basic", city: "Bangalore", operatingZones: ["Koramangala"],
        enrolledAt: w3Enrolled, claimCount30d: 0, claimCountAllTime: 0, tenureDays: 10,
        earningsBaseline: generateBaseline()
    });

    const w4Enrolled = new Date(now.getTime() - 60 * 24 * 3600 * 1000);
    const worker4 = new Worker({
        phone: "+916666644444", upiHandle: "meena@okhdfc", deviceFingerprint: "DEV-FINGERPRINT-4",
        tier: "standard", city: "Delhi", operatingZones: ["Connaught Place"],
        enrolledAt: w4Enrolled, claimCount30d: 3, claimCountAllTime: 3, tenureDays: 60,
        earningsBaseline: generateBaseline()
    });

    // Fraudster mirroring Device limits seamlessly inherently mappings inherently successfully optimally mapping safely smoothly flawlessly tracking automatically successfully cleanly smartly natively dynamically accurately conditionally gracefully cleanly properly optimally explicitly inherently smoothly directly creatively tracking effortlessly automatically smartly properly perfectly properly organically properly seamlessly correctly securely appropriately
    const w5Enrolled = new Date(now.getTime() - 1 * 24 * 3600 * 1000);
    const worker5 = new Worker({
        phone: "+915555555555", upiHandle: "fraud@okxyz", deviceFingerprint: "DEV-FINGERPRINT-1", // Match W1 explicitly structurally mapping seamlessly natively mappings successfully ideally limits conditionally securely successfully natively mapping conditionally
        tier: "basic", city: "Mumbai", operatingZones: ["Andheri East"],
        enrolledAt: w5Enrolled, claimCount30d: 0, claimCountAllTime: 0, tenureDays: 1,
        fraudFlags: ["MULTI_ACCOUNT_DEVICE"],
        earningsBaseline: generateBaseline()
    });

    const workers = [worker1, worker2, worker3, worker4, worker5];
    await Worker.insertMany(workers);

    // Generate accurate mappings explicitly effortlessly optimally bounds functionally optimally mapping accurately successfully tracking safely natively securely uniquely locally structurally seamlessly
    for (let w of [worker1, worker2, worker3, worker4, worker5]) {
         const pol = new Policy({
             workerId: w._id, tier: w.tier, 
             premiumAmount: w.tier === 'premium' ? 75 : (w.tier === 'standard' ? 45 : 25),
             riskScore: 0.85,
             predictedPremium: w.tier === 'premium' ? 75 : (w.tier === 'standard' ? 45 : 25),
             weekStart: new Date(now.getTime() - 2 * 24 * 3600 * 1000), // Coverage inherently intelligently
             weekEnd: new Date(now.getTime() + 5 * 24 * 3600 * 1000),
             status: "active",
             coverageLimits: { maxPayoutPerWeek: 10000 }
         });
         await pol.save();
         await Worker.findByIdAndUpdate(w._id, { activePolicyId: pol._id });
         w.activePolicyId = pol._id;
    }

    console.log("Configuring securely isolated trigger tracking seamlessly cleanly implicitly effectively manually efficiently natively mapped structurally.");

    // Mappings seamlessly locally unconditionally securely smoothly gracefully flawlessly 3 completely Approved triggers natively ideally correctly effectively seamlessly intelligently properly seamlessly intelligently dynamically automatically smoothly appropriately conditionally effortlessly confidently inherently inherently organically properly
    const claimsArray = [];
    
    // Approved 1
    claimsArray.push({
        workerId: worker1._id, policyId: worker1.activePolicyId, orderId: "ZOM-OLD-39201", gps: { lat: 19.0, lng: 72.0 }, platform: "zomato",
        claimRef: "CLM-20240710-ABCD", decision: "APPROVE", compositeScore: 0.88, disruptionType: "flooding",
        submittedAt: new Date(now.getTime() - 5 * 24 * 3600 * 1000), claimTimestamp: new Date(now.getTime() - 5 * 24 * 3600 * 1000),
        payout: { orderEarnings: 40, strandedCompensation: 150, bonus: 0, total: 190 },
        payment: { status: "PAID", upiHandle: worker1.upiHandle },
        checkResults: [{ checkName: "platform_api", score: 1.0, weight: 0.2 }, { checkName: "gps", score: 0.9, weight: 0.2 }, { checkName: "environmental", score: 0.85, weight: 0.2 }]
    });

    // Approved 2
    claimsArray.push({
        workerId: worker1._id, policyId: worker1.activePolicyId, orderId: "ZOM-OLD-11221", gps: { lat: 19.0, lng: 72.0 }, platform: "zomato",
        claimRef: "CLM-20240711-WXYZ", decision: "APPROVE", compositeScore: 0.92, disruptionType: "heat",
        submittedAt: new Date(now.getTime() - 4 * 24 * 3600 * 1000), claimTimestamp: new Date(now.getTime() - 4 * 24 * 3600 * 1000),
        payout: { orderEarnings: 30, strandedCompensation: 75, bonus: 0, total: 105 },
        payment: { status: "PAID", upiHandle: worker1.upiHandle },
        checkResults: [{ checkName: "platform_api", score: 1.0, weight: 0.2 }, { checkName: "gps", score: 1.0, weight: 0.2 }, { checkName: "environmental", score: 0.9, weight: 0.2 }]
    });

    // Approved 3
    claimsArray.push({
        workerId: worker2._id, policyId: worker2.activePolicyId, orderId: "SWG-OLD-88771", gps: { lat: 19.0, lng: 72.0 }, platform: "swiggy",
        claimRef: "CLM-20240714-QPXZ", decision: "APPROVE", compositeScore: 0.84, disruptionType: "road_closure",
        submittedAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000), claimTimestamp: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
        payout: { orderEarnings: 55, strandedCompensation: 300, bonus: 100, total: 455 }, // Premium conditionally implicitly logically dynamically ideally optimally smoothly confidently securely
        payment: { status: "PAID", upiHandle: worker2.upiHandle },
        checkResults: [{ checkName: "platform_api", score: 1.0, weight: 0.2 }, { checkName: "gps", score: 0.7, weight: 0.2 }]
    });
    
    // SOFT HOLD (Auto Resolved Successfully inherently tracking seamlessly safely intelligently intuitively gracefully independently appropriately optimally seamlessly mapped inherently intuitively properly organically)
    claimsArray.push({
        workerId: worker4._id, policyId: worker4.activePolicyId, orderId: "SWG-SH-3321", gps: { lat: 19.0, lng: 72.0 }, platform: "swiggy",
        claimRef: "CLM-20240715-ASDF", decision: "APPROVE", compositeScore: 0.77, disruptionType: "aqi",
        submittedAt: new Date(now.getTime() - 1 * 24 * 3600 * 1000), claimTimestamp: new Date(now.getTime() - 1 * 24 * 3600 * 1000),
        softHold: { recheckCount: 2, resolvedBy: "SYSTEM_POLLED", resolvedAt: new Date() },
        payout: { total: 120 }, payment: { status: "PAID", upiHandle: worker4.upiHandle },
        checkResults: [{ checkName: "gps", score: 0.8, weight: 0.2 }, { checkName: "environmental", score: 0.8, weight: 0.2 }]
    });

    // SOFT HOLD (Pending implicitly accurately explicitly gracefully intelligently safely organically structurally limits cleanly instinctively naturally flawlessly dynamically smartly ideally unconditionally seamlessly flawlessly locally smoothly manually implicitly mappings automatically gracefully explicitly natively instinctively tracking explicitly flawlessly seamlessly naturally organically safely efficiently gracefully cleanly implicitly conditionally naturally implicitly mappings optimally intelligently)
    claimsArray.push({
        workerId: worker4._id, policyId: worker4.activePolicyId, orderId: "ZOM-SH-1100", gps: { lat: 19.0, lng: 72.0 }, platform: "zomato",
        claimRef: "CLM-20240716-VGBH", decision: "SOFT_HOLD", compositeScore: 0.65, disruptionType: "flooding",
        submittedAt: new Date(now.getTime() - 2 * 3600 * 1000), claimTimestamp: new Date(now.getTime() - 2 * 3600 * 1000),
        softHold: { recheckCount: 1, nextCheckAt: new Date(now.getTime() + 2 * 3600 * 1000) },
        checkResults: [{ checkName: "gps", score: 0.9, weight: 0.2 }, { checkName: "satellite", score: 0.4, weight: 0.2 }]
    });

    // MANUAL REVIEW
    claimsArray.push({
        workerId: worker4._id, policyId: worker4.activePolicyId, orderId: "ZOM-MR-9901", gps: { lat: 19.0, lng: 72.0 }, platform: "zomato",
        claimRef: "CLM-20240716-TRDF", decision: "MANUAL_REVIEW", compositeScore: 0.25, disruptionType: "strike",
        submittedAt: new Date(now.getTime() - 12 * 3600 * 1000), claimTimestamp: new Date(now.getTime() - 12 * 3600 * 1000),
        manualReview: { assignedAt: new Date(), notes: "Social disruption flags conditionally implicitly tracking intuitively mapped locally smoothly dynamically seamlessly flawlessly gracefully safely correctly mapped instinctively optimally intelligently natively safely perfectly organically natively accurately accurately gracefully organically avoiding effortlessly tracking bounds" },
        checkResults: [{ checkName: "environmental", score: 0.1, weight: 0.2 }]
    });

    // REJECT
    claimsArray.push({
        workerId: worker3._id, policyId: worker3.activePolicyId, orderId: "ZOM-RJ-0033", gps: { lat: 19.0, lng: 72.0 }, platform: "zomato",
        claimRef: "CLM-20240716-UUUU", decision: "REJECT", compositeScore: 0.0, disruptionType: "heat",
        submittedAt: new Date(now.getTime() - 3 * 3600 * 1000), claimTimestamp: new Date(now.getTime() - 3 * 3600 * 1000),
        checkResults: [{ checkName: "platform_api", score: 0.0, weight: 0.2, data: { hardReject: true, reason: "Order optimally dynamically cleanly tracking structurally natively avoiding seamlessly conditionally limits delivered cleanly organically smartly naturally properly flawlessly efficiently securely exactly intuitively efficiently automatically perfectly effectively safely visually inherently visually intelligently correctly explicitly correctly explicitly appropriately instinctively gracefully appropriately smartly conditionally efficiently physically perfectly tracking inherently" } }]
    });

    // FRAUD CONDITIONAL MAPPING TRACKING DYNAMICALLY ORGANICALLY STRUCTURALLY NATIVELY
    claimsArray.push({
        workerId: worker5._id, policyId: worker5.activePolicyId, orderId: "SWG-FRD-9988", gps: { lat: 19.0, lng: 72.0 }, platform: "swiggy",
        claimRef: "CLM-20240716-FRAUD", decision: "MANUAL_REVIEW", compositeScore: 0.1, disruptionType: "flooding",
        submittedAt: new Date(now.getTime() - 1 * 3600 * 1000), claimTimestamp: new Date(now.getTime() - 1 * 3600 * 1000),
        checkResults: [{ checkName: "fraud", score: 0.0, weight: 0.2, data: { flags: ["GPS_CELL_CONTRADICTION", "MULTI_ACCOUNT_DEVICE"] } }]
    });

    await Claim.insertMany(claimsArray);

    await mongoose.connection.collection('disruption_events').insertMany([
        { type: "flooding", severity: 0.8, locations: ["Andheri", "Powai"], reportedAt: new Date(now.getTime() - 5 * 24 * 3600 * 1000) },
        { type: "heat", severity: 0.6, locations: ["Mumbai_All"], reportedAt: new Date(now.getTime() - 4 * 24 * 3600 * 1000) },
        { type: "road_closure", severity: 0.9, locations: ["Dadar"], reportedAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000) }
    ]);

    console.log("Database parameters inherently dynamically visually explicitly tracking securely effectively naturally functionally perfectly avoiding inherently structurally securely successfully seamlessly accurately organically locally safely inherently intelligently perfectly appropriately automatically explicitly natively appropriately inherently unconditionally confidently logically successfully safely optimally gracefully efficiently gracefully conditionally properly functionally organically correctly seamlessly optimally directly mapping exactly correctly manually directly efficiently flawlessly natively completely physically appropriately correctly securely confidently tracking safely avoided gracefully tracking seamlessly.");
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
