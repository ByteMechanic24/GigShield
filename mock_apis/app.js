const express = require('express');
const cors = require('cors');

const zomatoOrders = require('./zomato_mock');
const swiggyOrders = require('./swiggy_mock');

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

function clampCoordinate(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function encodeCoordinate(value) {
  let coordinate = value < 0 ? ~(value << 1) : (value << 1);
  let output = '';

  while (coordinate >= 0x20) {
    output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
    coordinate >>= 5;
  }

  output += String.fromCharCode(coordinate + 63);
  return output;
}

function encodePolyline(points) {
  let previousLat = 0;
  let previousLng = 0;

  return points.map((point) => {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);
    const encodedLat = encodeCoordinate(lat - previousLat);
    const encodedLng = encodeCoordinate(lng - previousLng);
    previousLat = lat;
    previousLng = lng;
    return `${encodedLat}${encodedLng}`;
  }).join('');
}

function buildDemoOrder(platform, anchor = {}) {
  const normalizedPlatform = platform === 'swiggy' ? 'swiggy' : 'zomato';
  const prefix = normalizedPlatform === 'swiggy' ? 'SWG' : 'ZOM';
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const randomPart = `${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 900 + 100)}`;
  const baseLat = clampCoordinate(anchor.lat, 19.1136);
  const baseLng = clampCoordinate(anchor.lng, 72.8697);
  const pickupCoords = {
    lat: baseLat + (Math.random() - 0.5) * 0.004,
    lng: baseLng + (Math.random() - 0.5) * 0.004,
  };
  const dropCoords = {
    lat: baseLat + (Math.random() > 0.5 ? 0.002 : -0.002) + Math.random() * 0.0015,
    lng: baseLng + (Math.random() > 0.5 ? 0.002 : -0.002) + Math.random() * 0.0015,
  };
  const midPoint = {
    lat: (pickupCoords.lat + dropCoords.lat) / 2 + (Math.random() - 0.5) * 0.001,
    lng: (pickupCoords.lng + dropCoords.lng) / 2 + (Math.random() - 0.5) * 0.001,
  };
  const routePolyline = encodePolyline([pickupCoords, midPoint, dropCoords]);

  return {
    orderId: `${prefix}-${datePart}-${randomPart}`,
    status: 'IN_TRANSIT',
    assignedWorkerId: null,
    workerPayout: 70 + Math.floor(Math.random() * 50),
    acceptanceTimestamp: new Date(Date.now() - Math.floor(Math.random() * 20 * 60 * 1000)).toISOString(),
    routePolyline,
    lastKnownLocation: {
      lat: baseLat + (Math.random() - 0.5) * 0.008,
      lng: baseLng + (Math.random() - 0.5) * 0.008,
    },
    pickupCoords,
    dropCoords,
    platform: normalizedPlatform,
    isDemoGenerated: true,
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
  const extractIds = order => order.orderId;
  res.json({
    zomato: zomatoOrders.filter(order => order.status === 'IN_TRANSIT').map(extractIds),
    swiggy: swiggyOrders.filter(order => order.status === 'IN_TRANSIT').map(extractIds)
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
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Mock APIs running on port ${PORT}`);
});
