const express = require('express');
const cors = require('cors');

const zomatoOrders = require('./zomato_mock');
const swiggyOrders = require('./swiggy_mock');
const {
  buildOrderGeometry,
  orderMatchesContext,
  resolveCityProfile,
} = require('./orderFactory');

const app = express();
const PORT = 8002;

app.use(cors());
app.use(express.json());

function hydrateOrder(order) {
  if (!order) {
    return null;
  }

  if (order.status !== 'IN_TRANSIT') {
    return order;
  }

  return {
    ...order,
    acceptanceTimestamp: new Date(Date.now() - Math.floor(Math.random() * 45 * 60 * 1000)).toISOString(),
  };
}

function buildDemoOrder(platform, anchor = {}) {
  const normalizedPlatform = platform === 'swiggy' ? 'swiggy' : 'zomato';
  const prefix = normalizedPlatform === 'swiggy' ? 'SWG' : 'ZOM';
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const randomPart = `${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 900 + 100)}`;
  const profile = resolveCityProfile({
    city: anchor.city,
    preferredZones: anchor.operatingZones || [],
    anchor,
  });
  const geometry = buildOrderGeometry(profile.baseLat, profile.baseLng);

  return {
    orderId: `${prefix}-${datePart}-${randomPart}`,
    status: 'IN_TRANSIT',
    assignedWorkerId: null,
    workerPayout: 70 + Math.floor(Math.random() * 50),
    acceptanceTimestamp: new Date(Date.now() - Math.floor(Math.random() * 20 * 60 * 1000)).toISOString(),
    routePolyline: geometry.routePolyline,
    lastKnownLocation: geometry.lastKnownLocation,
    pickupCoords: geometry.pickupCoords,
    dropCoords: geometry.dropCoords,
    platform: normalizedPlatform,
    isDemoGenerated: true,
    city: profile.city,
    zone: profile.zone,
  };
}

function getOrderCollection(platform) {
  return platform === 'swiggy' ? swiggyOrders : zomatoOrders;
}

// Main health heartbeat
app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

// Zomato Get Order
app.get('/zomato/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const { workerId } = req.query;

  const order = zomatoOrders.find(o => o.orderId === orderId);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (workerId && order.assignedWorkerId !== workerId) {
    return res.status(403).json({ error: "Worker ID mismatch" });
  }

  res.json(hydrateOrder(order));
});

// Swiggy Get Order
app.get('/swiggy/orders/:orderId', (req, res) => {
  const { orderId } = req.params;
  const { workerId } = req.query;

  const order = swiggyOrders.find(o => o.orderId === orderId);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  if (workerId && order.assignedWorkerId !== workerId) {
    return res.status(403).json({ error: "Worker ID mismatch" });
  }

  res.json(hydrateOrder(order));
});

// Location Simulation Post
app.post('/zomato/worker/:workerId/location', (req, res) => {
  const { workerId } = req.params;
  const { lat, lng } = req.body;

  if (lat === undefined || lng === undefined) {
    return res.status(400).json({ error: "lat and lng must be provided in body" });
  }

  // Simulate a slight tracking divergence/offset
  const simulatedLat = Number(lat) + (Math.random() - 0.5) * 0.001;
  const simulatedLng = Number(lng) + (Math.random() - 0.5) * 0.001;

  res.json({
    workerId,
    timestamp: new Date().toISOString(),
    lastKnownLocation: {
      lat: simulatedLat,
      lng: simulatedLng
    }
  });
});

// Generic List Route for easy UI / dev testing
app.get('/orders/list', (req, res) => {
  const city = req.query?.city;
  const preferredZones = String(req.query?.zones || '')
    .split(',')
    .map((zone) => zone.trim())
    .filter(Boolean);
  const matchingZomato = zomatoOrders.filter((order) => order.status === 'IN_TRANSIT' && orderMatchesContext(order, { city, preferredZones }));
  const matchingSwiggy = swiggyOrders.filter((order) => order.status === 'IN_TRANSIT' && orderMatchesContext(order, { city, preferredZones }));
  const fallbackZomato = zomatoOrders.filter((order) => order.status === 'IN_TRANSIT');
  const fallbackSwiggy = swiggyOrders.filter((order) => order.status === 'IN_TRANSIT');
  const extractIds = (order) => ({
    orderId: order.orderId,
    city: order.city,
    zone: order.zone,
  });

  res.json({
    zomato: (matchingZomato.length ? matchingZomato : fallbackZomato).map(extractIds),
    swiggy: (matchingSwiggy.length ? matchingSwiggy : fallbackSwiggy).map(extractIds),
  });
});

app.post('/orders/demo-generate', (req, res) => {
  const platform = req.body?.platform === 'swiggy' ? 'swiggy' : 'zomato';
  const collection = getOrderCollection(platform);
  const order = buildDemoOrder(platform, req.body?.anchor || {});
  collection.unshift(order);

  res.json({
    orderId: order.orderId,
    platform: order.platform,
    acceptedAt: order.acceptanceTimestamp,
    city: order.city,
    zone: order.zone,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Mock APIs running on port ${PORT}`);
});
