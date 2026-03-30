const orders = [];
const statuses = [
  ...Array(15).fill("IN_TRANSIT"),
  ...Array(3).fill("DELIVERED"),
  ...Array(2).fill("CANCELLED")
];

for (let i = 1; i <= 20; i++) {
  const padUrlId = String(i).padStart(6, '0');
  
  // Base coordinate for Mumbai (Andheri East)
  const baseLat = 19.1136;
  const baseLng = 72.8697;
  
  orders.push({
    orderId: `ZOM-20240716-${padUrlId}`,
    status: statuses[i - 1],
    assignedWorkerId: `WRK-0000${(i % 5) + 1}`,
    workerPayout: 65 + Math.floor(Math.random() * 76), // 65 to 140
    // Recent timestamp within last 2 hours (2 * 60 * 60 * 1000 ms)
    acceptanceTimestamp: new Date(Date.now() - Math.floor(Math.random() * 7200000)).toISOString(),
    routePolyline: "kyw|B_{z}LhDeAd@i@]x@c@dA{@r@u@XQTSf@o@",
    lastKnownLocation: {
      lat: baseLat + (Math.random() - 0.5) * 0.01,
      lng: baseLng + (Math.random() - 0.5) * 0.01
    },
    pickupCoords: {
      lat: baseLat + (Math.random() - 0.5) * 0.005,
      lng: baseLng + (Math.random() - 0.5) * 0.005
    },
    dropCoords: {
      // roughly 100-500m away (0.001 deg is ~111m)
      lat: baseLat + (Math.random() > 0.5 ? 0.002 : -0.002) + (Math.random() * 0.002),
      lng: baseLng + (Math.random() > 0.5 ? 0.002 : -0.002) + (Math.random() * 0.002)
    },
    platform: "zomato"
  });
}

module.exports = orders;
