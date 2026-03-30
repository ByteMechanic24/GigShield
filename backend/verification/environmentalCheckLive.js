const axios = require('axios');

function asNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof value.value === 'number' && Number.isFinite(value.value)) return value.value;
  if (value && typeof value.degrees === 'number' && Number.isFinite(value.degrees)) return value.degrees;
  if (value && typeof value.percent === 'number' && Number.isFinite(value.percent)) return value.percent;
  if (value && typeof value.quantity === 'number' && Number.isFinite(value.quantity)) return value.quantity;
  return null;
}

function clampScore(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function severityToScore(severity = '') {
  switch (String(severity).toUpperCase()) {
    case 'EXTREME':
      return 1.0;
    case 'SEVERE':
      return 0.85;
    case 'MODERATE':
      return 0.65;
    case 'MINOR':
      return 0.45;
    default:
      return 0;
  }
}

function pickClosestHistoryEntry(hours = [], targetTimestamp) {
  if (!Array.isArray(hours) || hours.length === 0) {
    return null;
  }

  const target = new Date(targetTimestamp).getTime();

  return hours.reduce((closest, candidate) => {
    const candidateTime = new Date(candidate?.interval?.startTime || candidate?.displayDateTime || 0).getTime();
    const closestTime = new Date(closest?.interval?.startTime || closest?.displayDateTime || 0).getTime();

    if (!Number.isFinite(candidateTime)) {
      return closest;
    }

    if (!closest || !Number.isFinite(closestTime)) {
      return candidate;
    }

    return Math.abs(candidateTime - target) < Math.abs(closestTime - target) ? candidate : closest;
  }, null);
}

function buildAlertSummary(alerts = []) {
  const safeAlerts = Array.isArray(alerts) ? alerts : [];
  const severities = safeAlerts.map((alert) => String(alert?.severity || '')).filter(Boolean);

  return {
    count: safeAlerts.length,
    severities,
    eventTypes: safeAlerts.map((alert) => alert?.eventType).filter(Boolean),
    highestSeverityScore: severities.reduce((max, severity) => Math.max(max, severityToScore(severity)), 0),
    alerts: safeAlerts.slice(0, 5).map((alert) => ({
      eventType: alert?.eventType || null,
      severity: alert?.severity || null,
      certainty: alert?.certainty || null,
      urgency: alert?.urgency || null,
      headline: alert?.headline || null,
    })),
  };
}

function computeWeatherScore(disruptionType, weatherMetrics, alertSummary) {
  const rainfallMm = weatherMetrics.rainfallMm ?? 0;
  const precipitationProbability = weatherMetrics.precipitationProbability ?? 0;
  const thunderstormProbability = weatherMetrics.thunderstormProbability ?? 0;
  const temperatureCelsius = weatherMetrics.temperatureCelsius ?? 0;
  const heatIndexCelsius = weatherMetrics.heatIndexCelsius ?? temperatureCelsius;
  const alertScore = alertSummary.highestSeverityScore || 0;

  if (disruptionType === 'flooding') {
    const rainScore = Math.max(
      rainfallMm >= 25 ? 1 : rainfallMm >= 15 ? 0.72 : rainfallMm >= 8 ? 0.45 : 0,
      precipitationProbability >= 85 ? 0.9 : precipitationProbability >= 65 ? 0.6 : 0,
      thunderstormProbability >= 70 ? 0.7 : 0
    );
    return clampScore(Math.max(rainScore, alertScore));
  }

  if (disruptionType === 'heat') {
    const thermalScore = Math.max(
      heatIndexCelsius >= 45 ? 1 : heatIndexCelsius >= 40 ? 0.75 : heatIndexCelsius >= 36 ? 0.45 : 0,
      temperatureCelsius >= 42 ? 0.95 : temperatureCelsius >= 38 ? 0.65 : temperatureCelsius >= 35 ? 0.35 : 0
    );
    return clampScore(Math.max(thermalScore, alertScore));
  }

  return clampScore(Math.max(alertScore, precipitationProbability >= 80 ? 0.55 : 0));
}

async function checkGoogleWeather(lat, lng, timestamp, disruptionType) {
  const apiKey = process.env.GOOGLE_WEATHER_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return {
      provider: 'google_weather_api',
      weatherScore: 0,
      error: true,
      reason: 'MISSING_API_KEY',
    };
  }

  try {
    const claimTime = new Date(timestamp);
    const ageMs = Date.now() - claimTime.getTime();
    const isHistorical = Number.isFinite(ageMs) && ageMs > 90 * 60 * 1000 && ageMs <= 24 * 60 * 60 * 1000;
    const weatherUrl = isHistorical
      ? 'https://weather.googleapis.com/v1/history/hours:lookup'
      : 'https://weather.googleapis.com/v1/currentConditions:lookup';
    const params = {
      'location.latitude': lat,
      'location.longitude': lng,
      unitsSystem: 'METRIC',
      key: apiKey,
    };

    if (isHistorical) {
      params.hours = Math.max(1, Math.min(24, Math.ceil(ageMs / (60 * 60 * 1000)) + 1));
    }

    const [weatherRes, alertsRes] = await Promise.all([
      axios.get(weatherUrl, { params, timeout: 7000 }),
      axios
        .get('https://weather.googleapis.com/v1/publicAlerts:lookup', {
          params: {
            'location.latitude': lat,
            'location.longitude': lng,
            pageSize: 5,
            key: apiKey,
          },
          timeout: 7000,
        })
        .catch(() => ({ data: { alerts: [] } })),
    ]);

    const weatherPayload = weatherRes.data || {};
    const conditionSource = isHistorical
      ? pickClosestHistoryEntry(weatherPayload.hours || weatherPayload.historyHours || [], claimTime)
      : (weatherPayload.currentConditions || weatherPayload);
    const alertSummary = buildAlertSummary(alertsRes.data?.alerts || alertsRes.data?.publicAlerts || []);

    const weatherMetrics = {
      rainfallMm: asNumber(
        conditionSource?.precipitation?.qpf ||
        conditionSource?.qpf ||
        conditionSource?.currentConditionsHistory?.qpf
      ),
      precipitationProbability: asNumber(conditionSource?.precipitation?.probability),
      thunderstormProbability: asNumber(conditionSource?.thunderstormProbability),
      temperatureCelsius: asNumber(conditionSource?.temperature),
      heatIndexCelsius: asNumber(conditionSource?.heatIndex),
      relativeHumidity: asNumber(conditionSource?.relativeHumidity),
    };

    const weatherCondition = conditionSource?.weatherCondition || {};
    return {
      provider: 'google_weather_api',
      endpointUsed: isHistorical ? 'history.hours.lookup' : 'currentConditions.lookup',
      observedAt:
        conditionSource?.interval?.startTime ||
        conditionSource?.currentTime ||
        conditionSource?.displayDateTime ||
        claimTime.toISOString(),
      weatherCondition: {
        type: weatherCondition?.type || null,
        description: weatherCondition?.description?.text || weatherCondition?.description || null,
      },
      ...weatherMetrics,
      alertSummary,
      weatherScore: computeWeatherScore(disruptionType, weatherMetrics, alertSummary),
      error: false,
    };
  } catch (error) {
    return {
      provider: 'google_weather_api',
      weatherScore: 0,
      error: true,
      reason: error?.response?.data?.error?.message || error.message || 'WEATHER_LOOKUP_FAILED',
    };
  }
}

async function checkAqi(lat, lng) {
  try {
    const res = await axios.get('https://api.openaq.org/v3/locations', {
      params: { coordinates: `${lat},${lng}`, radius: 5000, limit: 1 },
      timeout: 5000,
    });

    const location = res.data.results?.[0];
    let aqiValue = null;
    let stationName = null;
    let aqiScore = 0;

    if (location) {
      stationName = location.name;
      const pm25 = location.parameters?.find((parameter) => parameter.parameter === 'pm25')?.average || 0;
      aqiValue = pm25 * 4.5;

      if (aqiValue > 400) aqiScore = 1;
      else if (aqiValue > 300) aqiScore = 0.5;
    }

    return { aqiValue, aqiScore, stationName, error: false };
  } catch {
    return { aqiValue: null, aqiScore: 0, error: true };
  }
}

async function checkSocialDisruption(lat, lng, timestamp) {
  try {
    const date = new Date(timestamp);
    const formatGdelt = (value) => value.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const gdeltStart = new Date(date.getTime() - 1.5 * 3600 * 1000);
    const gdeltEnd = new Date(date.getTime() + 1.5 * 3600 * 1000);
    const newsStart = new Date(date.getTime() - 3 * 3600 * 1000).toISOString();
    const newsEnd = new Date(date.getTime() + 3 * 3600 * 1000).toISOString();

    const gdeltReq = axios.get('https://api.gdeltproject.org/api/v2/doc/doc', {
      params: {
        query: `protest OR strike OR riot OR curfew OR bandh near:${lat},${lng}`,
        mode: 'artlist',
        maxrecords: 10,
        format: 'json',
        startdatetime: formatGdelt(gdeltStart),
        enddatetime: formatGdelt(gdeltEnd),
      },
      timeout: 5000,
    });

    const newsReq = axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: 'strike OR protest OR riot OR bandh',
        language: 'en',
        from: newsStart,
        to: newsEnd,
        pageSize: 5,
      },
      headers: { 'X-Api-Key': process.env.NEWSAPI_KEY },
      timeout: 5000,
    });

    const [gdeltRes, newsRes] = await Promise.allSettled([gdeltReq, newsReq]);
    const gdeltEventCount =
      gdeltRes.status === 'fulfilled' && gdeltRes.value.data.articles ? gdeltRes.value.data.articles.length : 0;
    const newsapiArticleCount =
      newsRes.status === 'fulfilled' && newsRes.value.data.articles ? newsRes.value.data.articles.length : 0;
    const independentSourcesCount = (gdeltEventCount > 0 ? 1 : 0) + (newsapiArticleCount > 0 ? 1 : 0);

    let socialScore = 0;
    if (independentSourcesCount >= 2) socialScore = 1;
    else if (independentSourcesCount === 1) socialScore = 0.4;

    return { gdeltEventCount, newsapiArticleCount, independentSourcesCount, socialScore, error: false };
  } catch {
    return { gdeltEventCount: 0, newsapiArticleCount: 0, independentSourcesCount: 0, socialScore: 0, error: true };
  }
}

async function checkRoads(routeStart, routeEnd, timestamp) {
  try {
    const origin = `${routeStart.lat},${routeStart.lng}`;
    const destination = `${routeEnd.lat},${routeEnd.lng}`;
    const departure = Math.floor(new Date(timestamp).getTime() / 1000);

    const res = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin,
        destination,
        departure_time: departure,
        key: process.env.GOOGLE_MAPS_API_KEY,
        traffic_model: 'best_guess',
      },
      timeout: 5000,
    });

    if (res.data.status === 'ZERO_RESULTS' || !res.data.routes || res.data.routes.length === 0) {
      return { roadStatus: 'ROUTE_NOT_FOUND', durationFactor: 0, roadScore: 1, error: false };
    }

    const leg = res.data.routes[0].legs[0];
    const duration = leg.duration?.value || 1;
    const durationInTraffic = leg.duration_in_traffic?.value || duration;
    const durationFactor = durationInTraffic / duration;

    let roadScore = 0;
    if (durationFactor > 2.5) roadScore = 0.7;

    return { roadStatus: 'ROUTE_FOUND', durationFactor, roadScore, error: false };
  } catch {
    return { roadStatus: 'UNKNOWN', durationFactor: 0, roadScore: 0, error: true };
  }
}

async function checkFloodContext(lat, lng) {
  try {
    const month = new Date().getMonth();
    const isMonsoon = month >= 5 && month <= 8;
    const zones = [
      { name: 'Andheri', minLat: 19.1, maxLat: 19.14, minLng: 72.83, maxLng: 72.9 },
      { name: 'Kurla', minLat: 19.05, maxLat: 19.09, minLng: 72.87, maxLng: 72.91 },
      { name: 'Dharavi', minLat: 19.03, maxLat: 19.06, minLng: 72.84, maxLng: 72.87 },
      { name: 'Sion', minLat: 19.03, maxLat: 19.05, minLng: 72.86, maxLng: 72.9 },
    ];
    const pad = 0.018;

    let inZone = false;
    let nearZone = false;
    for (const zone of zones) {
      if (lat >= zone.minLat && lat <= zone.maxLat && lng >= zone.minLng && lng <= zone.maxLng) {
        inZone = true;
      } else if (
        lat >= zone.minLat - pad &&
        lat <= zone.maxLat + pad &&
        lng >= zone.minLng - pad &&
        lng <= zone.maxLng + pad
      ) {
        nearZone = true;
      }
    }

    const floodStageExceeded = inZone && isMonsoon;
    let cwcScore = 0;
    if (floodStageExceeded) cwcScore = 1;
    else if (nearZone && isMonsoon) cwcScore = 0.7;

    return { floodStageExceeded, cwcScore, error: false };
  } catch {
    return { floodStageExceeded: false, cwcScore: 0, error: true };
  }
}

async function checkEnvironmentalSignals(routeCoords, claimTimestamp, disruptionType) {
  const lat = routeCoords.lat || routeCoords.pickupCoords?.lat;
  const lng = routeCoords.lng || routeCoords.pickupCoords?.lng;
  const routeStart = routeCoords.pickupCoords || { lat, lng };
  const routeEnd = routeCoords.dropCoords || { lat, lng };

  const [weatherRes, aqiRes, socialRes, roadsRes, floodRes] = await Promise.allSettled([
    checkGoogleWeather(lat, lng, claimTimestamp, disruptionType),
    checkAqi(lat, lng),
    checkSocialDisruption(lat, lng, claimTimestamp),
    checkRoads(routeStart, routeEnd, claimTimestamp),
    checkFloodContext(lat, lng),
  ]);

  const extract = (result) =>
    result.status === 'fulfilled' && !result.value.error ? result.value : Object.assign({}, result.value || {}, { error: true });

  const weather = extract(weatherRes);
  const aqi = extract(aqiRes);
  const social = extract(socialRes);
  const roads = extract(roadsRes);
  const flood = extract(floodRes);

  let compositeScore = 0;
  if (disruptionType === 'flooding') {
    compositeScore = Math.max(weather.weatherScore || 0, flood.cwcScore || 0, roads.roadScore || 0);
  } else if (disruptionType === 'heat') {
    compositeScore = weather.weatherScore || 0;
  } else if (disruptionType === 'aqi') {
    compositeScore = Math.max(aqi.aqiScore || 0, weather.alertSummary?.highestSeverityScore || 0);
  } else if (disruptionType === 'strike') {
    compositeScore = social.socialScore || 0;
  } else if (disruptionType === 'road_closure') {
    compositeScore = Math.max(roads.roadScore || 0, social.socialScore || 0);
  } else {
    compositeScore = Math.max(
      weather.weatherScore || 0,
      aqi.aqiScore || 0,
      social.socialScore || 0,
      roads.roadScore || 0,
      flood.cwcScore || 0
    );
  }

  const allFailed = weather.error && aqi.error && social.error && roads.error && flood.error;
  const flags = [];
  if (allFailed) flags.push('ALL_CHECKS_FAILED');
  if (weather.error) flags.push('WEATHER_SIGNAL_UNAVAILABLE');

  let confidence = 'LOW';
  if (compositeScore >= 0.7) confidence = 'HIGH';
  else if (compositeScore >= 0.4) confidence = 'MEDIUM';

  return {
    checkName: 'environmental',
    weight: 0.25,
    score: compositeScore,
    confidence,
    hardReject: false,
    flags,
    data: {
      provider: 'hybrid_environmental',
      disruptionType,
      weather,
      aqi,
      social,
      roads,
      cwc: flood,
    },
    completedAt: new Date(),
  };
}

module.exports = {
  checkEnvironmentalSignals,
  checkGoogleWeather,
  checkAqi,
  checkSocialDisruption,
  checkRoads,
  checkFloodContext,
};
