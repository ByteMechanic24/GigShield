const CITY_PROFILES = {
  Mumbai: {
    baseLat: 19.1136,
    baseLng: 72.8697,
    zones: {
      Andheri: { lat: 19.1136, lng: 72.8697 },
      Bandra: { lat: 19.0544, lng: 72.8407 },
      Powai: { lat: 19.1176, lng: 72.9060 },
      'South Mumbai': { lat: 18.9388, lng: 72.8354 },
      Borivali: { lat: 19.2290, lng: 72.8570 },
    },
  },
  Delhi: {
    baseLat: 28.6139,
    baseLng: 77.2090,
    zones: {
      'Connaught Place': { lat: 28.6315, lng: 77.2167 },
      'South Extension': { lat: 28.5671, lng: 77.2197 },
      Dwarka: { lat: 28.5921, lng: 77.0460 },
      Rohini: { lat: 28.7495, lng: 77.0565 },
      'Vasant Kunj': { lat: 28.5246, lng: 77.1544 },
    },
  },
  'Greater Noida': {
    baseLat: 28.4744,
    baseLng: 77.5040,
    zones: {
      'Knowledge Park': { lat: 28.4744, lng: 77.5040 },
      'Pari Chowk': { lat: 28.4680, lng: 77.5037 },
      'Alpha 1': { lat: 28.4801, lng: 77.5152 },
      'Beta 1': { lat: 28.4915, lng: 77.5236 },
      'Gamma 1': { lat: 28.5005, lng: 77.5380 },
    },
  },
  Bangalore: {
    baseLat: 12.9716,
    baseLng: 77.5946,
    zones: {
      Indiranagar: { lat: 12.9784, lng: 77.6408 },
      Koramangala: { lat: 12.9352, lng: 77.6245 },
      Whitefield: { lat: 12.9698, lng: 77.7499 },
      Jayanagar: { lat: 12.9250, lng: 77.5938 },
      'HSR Layout': { lat: 12.9116, lng: 77.6474 },
    },
  },
  Chennai: {
    baseLat: 13.0827,
    baseLng: 80.2707,
    zones: {
      'T Nagar': { lat: 13.0418, lng: 80.2337 },
      Adyar: { lat: 13.0067, lng: 80.2574 },
      'Anna Nagar': { lat: 13.0878, lng: 80.2102 },
      Velachery: { lat: 12.9766, lng: 80.2206 },
      OMR: { lat: 12.9308, lng: 80.2295 },
    },
  },
  Hyderabad: {
    baseLat: 17.3850,
    baseLng: 78.4867,
    zones: {
      'Banjara Hills': { lat: 17.4126, lng: 78.4347 },
      'Jubilee Hills': { lat: 17.4326, lng: 78.4071 },
      'HITEC City': { lat: 17.4435, lng: 78.3772 },
      Gachibowli: { lat: 17.4401, lng: 78.3489 },
      Madhapur: { lat: 17.4483, lng: 78.3915 },
    },
  },
  Pune: {
    baseLat: 18.5204,
    baseLng: 73.8567,
    zones: {
      Kothrud: { lat: 18.5074, lng: 73.8077 },
      'Viman Nagar': { lat: 18.5679, lng: 73.9143 },
      Hinjewadi: { lat: 18.5912, lng: 73.7389 },
      Baner: { lat: 18.5590, lng: 73.7868 },
      'Koregaon Park': { lat: 18.5362, lng: 73.8950 },
    },
  },
  Kolkata: {
    baseLat: 22.5726,
    baseLng: 88.3639,
    zones: {
      'Salt Lake': { lat: 22.5867, lng: 88.4172 },
      'New Town': { lat: 22.5752, lng: 88.4796 },
      'Park Street': { lat: 22.5534, lng: 88.3528 },
      Ballygunge: { lat: 22.5230, lng: 88.3657 },
      Alipore: { lat: 22.5319, lng: 88.3327 },
    },
  },
};

function clampCoordinate(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeCityName(city) {
  if (!city) {
    return null;
  }

  const trimmed = String(city).trim().toLowerCase();
  if (trimmed === 'greater noida' || trimmed === 'greater-noida') {
    return 'Greater Noida';
  }

  return Object.keys(CITY_PROFILES).find((key) => key.toLowerCase() === trimmed) || null;
}

function pickZone(profile, preferredZones = []) {
  const availableZones = Object.keys(profile.zones || {});
  const normalizedPreferred = preferredZones
    .map((zone) => String(zone).trim().toLowerCase())
    .filter(Boolean);

  const preferredMatch = availableZones.find((zone) => normalizedPreferred.includes(zone.toLowerCase()));
  if (preferredMatch) {
    return preferredMatch;
  }

  return availableZones[Math.floor(Math.random() * availableZones.length)] || null;
}

function resolveCityProfile({ city, preferredZones = [], anchor = {} } = {}) {
  const normalizedCity = normalizeCityName(city);
  const fallbackProfile = CITY_PROFILES[normalizedCity || 'Mumbai'] || CITY_PROFILES.Mumbai;
  const fallbackZone = pickZone(fallbackProfile, preferredZones);
  const fallbackCoords = fallbackZone ? fallbackProfile.zones[fallbackZone] : fallbackProfile;
  const baseLat = clampCoordinate(anchor.lat, fallbackCoords.lat || fallbackProfile.baseLat);
  const baseLng = clampCoordinate(anchor.lng, fallbackCoords.lng || fallbackProfile.baseLng);

  return {
    city: normalizedCity || 'Mumbai',
    zone: fallbackZone || Object.keys(fallbackProfile.zones || {})[0] || 'Andheri',
    baseLat,
    baseLng,
  };
}

function randomOffset(max = 0.0035) {
  return (Math.random() - 0.5) * max;
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

  return points
    .map((point) => {
      const lat = Math.round(point.lat * 1e5);
      const lng = Math.round(point.lng * 1e5);
      const encodedLat = encodeCoordinate(lat - previousLat);
      const encodedLng = encodeCoordinate(lng - previousLng);
      previousLat = lat;
      previousLng = lng;
      return `${encodedLat}${encodedLng}`;
    })
    .join('');
}

function buildOrderGeometry(baseLat, baseLng) {
  const pickupCoords = {
    lat: baseLat + randomOffset(0.0035),
    lng: baseLng + randomOffset(0.0035),
  };
  const dropCoords = {
    lat: baseLat + (Math.random() > 0.5 ? 0.002 : -0.002) + Math.random() * 0.0015,
    lng: baseLng + (Math.random() > 0.5 ? 0.002 : -0.002) + Math.random() * 0.0015,
  };
  const midPoint = {
    lat: (pickupCoords.lat + dropCoords.lat) / 2 + randomOffset(0.0009),
    lng: (pickupCoords.lng + dropCoords.lng) / 2 + randomOffset(0.0009),
  };

  return {
    pickupCoords,
    dropCoords,
    routePolyline: encodePolyline([pickupCoords, midPoint, dropCoords]),
    lastKnownLocation: {
      lat: baseLat + randomOffset(0.006),
      lng: baseLng + randomOffset(0.006),
    },
  };
}

function createSeedOrders({
  total,
  statuses,
  prefix,
  datePart,
  platform,
  cityRotation = ['Mumbai', 'Delhi', 'Greater Noida', 'Bangalore'],
}) {
  const orders = [];

  for (let i = 1; i <= total; i += 1) {
    const city = cityRotation[(i - 1) % cityRotation.length];
    const profile = resolveCityProfile({ city });
    const geometry = buildOrderGeometry(profile.baseLat, profile.baseLng);
    const padUrlId = String(i).padStart(6, '0');

    orders.push({
      orderId: `${prefix}-${datePart}-${padUrlId}`,
      status: statuses[i - 1],
      assignedWorkerId: `WRK-0000${(i % 5) + 1}`,
      workerPayout: 65 + Math.floor(Math.random() * 76),
      acceptanceTimestamp: new Date(Date.now() - Math.floor(Math.random() * 7200000)).toISOString(),
      routePolyline: geometry.routePolyline,
      lastKnownLocation: geometry.lastKnownLocation,
      pickupCoords: geometry.pickupCoords,
      dropCoords: geometry.dropCoords,
      platform,
      city: profile.city,
      zone: profile.zone,
    });
  }

  return orders;
}

function orderMatchesContext(order, { city, preferredZones = [] } = {}) {
  const normalizedCity = normalizeCityName(city);
  const normalizedZones = preferredZones.map((zone) => String(zone).trim().toLowerCase()).filter(Boolean);

  if (normalizedCity && String(order.city || '').toLowerCase() !== normalizedCity.toLowerCase()) {
    return false;
  }

  if (normalizedZones.length && !normalizedZones.includes(String(order.zone || '').toLowerCase())) {
    return false;
  }

  return true;
}

module.exports = {
  CITY_PROFILES,
  createSeedOrders,
  resolveCityProfile,
  buildOrderGeometry,
  orderMatchesContext,
  normalizeCityName,
};
