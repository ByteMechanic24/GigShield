/**
 * Calculates straight line distance in metres between two points
 * using the Haversine formula.
 */
function haversine(coord1, coord2) {
  if (!coord1 || !coord2 || coord1.lat === undefined || coord2.lat === undefined) return Infinity;

  const R = 6371e3; // Earth radius in metres
  const lat1 = coord1.lat * (Math.PI / 180);
  const lat2 = coord2.lat * (Math.PI / 180);
  const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
  const dLng = (coord2.lng - coord1.lng) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Decodes a Google encoded polyline string into an array of {lat, lng} objects.
 */
function decodePolyline(str, precision = 5) {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates = [];
  const factor = Math.pow(10, precision);

  while (index < str.length) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    coordinates.push({ lat: lat / factor, lng: lng / factor });
  }
  return coordinates;
}

/**
 * Finds distance from a point to a line segment defined by two points.
 * Uses local equirectangular approximation for high performance in JS.
 */
function distanceToSegment(p, v, w) {
  const l2 = haversine(v, w) ** 2;
  if (l2 === 0) return haversine(p, v);

  const R = 6371e3;
  const latRad = v.lat * (Math.PI / 180);
  
  // Convert spherical to local flat cartesian approximation
  const x0 = p.lng * (Math.PI / 180) * Math.cos(latRad) * R;
  const y0 = p.lat * (Math.PI / 180) * R;
  
  const x1 = v.lng * (Math.PI / 180) * Math.cos(latRad) * R;
  const y1 = v.lat * (Math.PI / 180) * R;
  
  const x2 = w.lng * (Math.PI / 180) * Math.cos(latRad) * R;
  const y2 = w.lat * (Math.PI / 180) * R;
  
  const dx = x2 - x1;
  const dy = y2 - y1;
  
  // Projection t scalar
  let t = ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t)); // Bound to segment
  
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  
  return Math.sqrt((x0 - projX) ** 2 + (y0 - projY) ** 2);
}

/**
 * Parses polyline and returns the minimal distance to it from the given point.
 */
function minDistanceToPolyline(point, polylineStr) {
  if (!polylineStr) return Infinity;
  const coords = decodePolyline(polylineStr);
  if (coords.length === 0) return Infinity;
  if (coords.length === 1) return haversine(point, coords[0]);

  let minDist = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const dist = distanceToSegment(point, coords[i], coords[i+1]);
    if (dist < minDist) {
      minDist = dist;
    }
  }
  return minDist;
}

/**
 * Check 2: Verifies GPS route consistency against API and Phone Carrier telemetry.
 * 
 * @param {object} claimedGps - { lat, lng } directly off device GPS chip
 * @param {object} networkGps - { lat, lng, accuracy_metres } from network or Google geolocation
 * @param {string} routePolyline - Encoded path polyline
 * @param {object} platformLastGps - { lat, lng } from platform DB API
 */
async function checkGpsRouteConsistency(claimedGps, networkGps, routePolyline, platformLastGps) {
  const checkName = "gps_route";
  const weight = 0.20;
  
  const routeDistanceMetres = minDistanceToPolyline(claimedGps, routePolyline);
  const platformDivergenceMetres = haversine(claimedGps, platformLastGps);
  
  let cellDivergenceMetres = null;
  let cellScore = null;
  let googleGeolocAccuracy = null;

  if (networkGps && networkGps.lat !== undefined && networkGps.lng !== undefined) {
    cellDivergenceMetres = haversine(claimedGps, networkGps);
    googleGeolocAccuracy = networkGps.accuracy_metres ?? null;
    cellScore = cellDivergenceMetres < 500 ? 1.0 : Math.max(0, 1 - (cellDivergenceMetres / 3000));
  }

  const routeScore = Math.max(0, 1 - (routeDistanceMetres / 2000));
  const platformScore = platformDivergenceMetres < 500 ? 1.0 : Math.max(0, 1 - (platformDivergenceMetres / 5000));

  const flags = [];

  if (platformDivergenceMetres > 3000 && routeDistanceMetres < 200) {
    flags.push("GPS_PLATFORM_CONTRADICTION");
  }

  if (cellDivergenceMetres !== null && cellDivergenceMetres > 2000) {
    flags.push("GPS_CELL_CONTRADICTION");
  }

  if (platformDivergenceMetres > 2000 && cellDivergenceMetres !== null && cellDivergenceMetres > 2000) {
    flags.push("TRIPLE_SOURCE_CONTRADICTION");
  }
  
  let finalScore = 0;
  let confidence = "LOW";

  if (flags.includes("TRIPLE_SOURCE_CONTRADICTION")) {
    finalScore = 0.05;
    confidence = "HIGH";
  } else {
    if (cellScore !== null) {
      finalScore = (routeScore * 0.25) + (platformScore * 0.40) + (cellScore * 0.35);
    } else {
      finalScore = (routeScore * 0.35) + (platformScore * 0.40);
    }
  }

  if (!flags.includes("TRIPLE_SOURCE_CONTRADICTION")) {
    if (finalScore >= 0.70) confidence = "HIGH";
    else if (finalScore >= 0.45) confidence = "MEDIUM";
    else confidence = "LOW";
  }

  const tripleSourceConsistent =
    cellDivergenceMetres !== null &&
    platformDivergenceMetres <= 500 &&
    cellDivergenceMetres <= 500 &&
    routeDistanceMetres <= 200;

  const data = {
    route_distance_metres: routeDistanceMetres,
    platform_gps_divergence_metres: platformDivergenceMetres,
    cell_gps_divergence_metres: cellDivergenceMetres,
    triple_source_consistent: tripleSourceConsistent,
    google_geoloc_accuracy: googleGeolocAccuracy
  };

  return {
    checkName,
    weight,
    score: finalScore,
    confidence,
    hardReject: false,
    flags,
    data,
    completedAt: new Date()
  };
}

module.exports = {
  haversine,
  checkGpsRouteConsistency
};
