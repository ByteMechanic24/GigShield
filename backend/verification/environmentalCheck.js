const axios = require('axios');

async function _checkWeather(lat, lng, timestamp) {
  try {
    const tsSeconds = Math.floor(new Date(timestamp).getTime() / 1000);
    const url = `https://api.openweathermap.org/data/3.0/onecall/timemachine`;
    
    const res = await axios.get(url, { 
      params: { lat, lon: lng, dt: tsSeconds, appid: process.env.OPENWEATHERMAP_API_KEY, units: 'metric' }, 
      timeout: 5000 
    });
    
    const data = res.data.data?.[0] || {};
    const rainfallMmhr = data.rain?.["1h"] || 0;
    const tempCelsius = data.temp || null;
    
    // Simulating IMD alert context since it ordinarily requires scraping or official IMD data feeds
    const imdAlert = "NONE"; 
    
    let weatherScore = 0.0;
    if (rainfallMmhr > 20 || imdAlert === "RED") weatherScore = 1.0;
    else if (rainfallMmhr > 10 || imdAlert === "ORANGE") weatherScore = 0.6;

    return { rainfallMmhr, tempCelsius, imdAlert, weatherScore, error: false };
  } catch(e) {
    return { rainfallMmhr: 0, weatherScore: 0, error: true };
  }
}

async function _checkAqi(lat, lng) {
  try {
    const url = `https://api.openaq.org/v3/locations`;
    const res = await axios.get(url, { 
      params: { coordinates: `${lat},${lng}`, radius: 5000, limit: 1 }, 
      timeout: 5000 
    });
    
    const location = res.data.results?.[0];
    let aqiValue = null, stationName = null, aqiScore = 0.0;
    
    if (location) {
       stationName = location.name;
       // Approximate PM2.5 to AQI conversion based on rough limits
       const pm25 = location.parameters?.find(p => p.parameter === 'pm25')?.average || 0; 
       aqiValue = pm25 * 4.5;
       
       if (aqiValue > 400) aqiScore = 1.0;
       else if (aqiValue > 300) aqiScore = 0.5;
    }
    return { aqiValue, aqiScore, stationName, error: false };
  } catch(e) {
    return { aqiValue: null, aqiScore: 0, error: true };
  }
}

async function _checkSocialDisruption(lat, lng, timestamp) {
  try {
    const d = new Date(timestamp);
    
    // GDELT format mapping
    const formatGdelt = (dt) => dt.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    
    const gStart = new Date(d.getTime() - 1.5 * 3600 * 1000);
    const gEnd = new Date(d.getTime() + 1.5 * 3600 * 1000);
    const nStart = new Date(d.getTime() - 3 * 3600 * 1000).toISOString();
    const nEnd = new Date(d.getTime() + 3 * 3600 * 1000).toISOString();

    const gdeltReq = axios.get("https://api.gdeltproject.org/api/v2/doc/doc", {
      params: {
         query: `protest OR strike OR riot OR curfew OR bandh near:${lat},${lng}`,
         mode: "artlist", maxrecords: 10, format: "json",
         startdatetime: formatGdelt(gStart), enddatetime: formatGdelt(gEnd)
      }, timeout: 5000
    });

    const newsReq = axios.get("https://newsapi.org/v2/everything", {
      params: {
         q: "strike OR protest OR riot OR bandh",
         language: "en", from: nStart, to: nEnd, pageSize: 5
      }, headers: { "X-Api-Key": process.env.NEWSAPI_KEY }, timeout: 5000
    });

    const [gRes, nRes] = await Promise.allSettled([gdeltReq, newsReq]);
       
    let gdeltEventCount = 0;
    if (gRes.status === "fulfilled" && gRes.value.data.articles) {
       gdeltEventCount = gRes.value.data.articles.length;
    }
       
    let newsapiArticleCount = 0;
    if (nRes.status === "fulfilled" && nRes.value.data.articles) {
       newsapiArticleCount = nRes.value.data.articles.length;
    }

    const indepCount = (gdeltEventCount > 0 ? 1 : 0) + (newsapiArticleCount > 0 ? 1 : 0);
    
    let socialScore = 0.0;
    if (indepCount >= 2) socialScore = 1.0;
    else if (indepCount === 1) socialScore = 0.4;
       
    return { gdeltEventCount, newsapiArticleCount, independentSourcesCount: indepCount, socialScore, error: false };
  } catch(e) {
    return { gdeltEventCount: 0, newsapiArticleCount: 0, independentSourcesCount: 0, socialScore: 0, error: true };
  }
}

async function _checkRoads(routeStart, routeEnd, timestamp) {
  try {
    const origin = `${routeStart.lat},${routeStart.lng}`;
    const destination = `${routeEnd.lat},${routeEnd.lng}`;
    const departure = Math.floor(new Date(timestamp).getTime() / 1000);
    
    const res = await axios.get("https://maps.googleapis.com/maps/api/directions/json", {
      params: { 
        origin, 
        destination, 
        departure_time: departure, 
        key: process.env.GOOGLE_MAPS_API_KEY, 
        traffic_model: "best_guess" 
      },
      timeout: 5000
    });

    if (res.data.status === "ZERO_RESULTS" || !res.data.routes || res.data.routes.length === 0) {
      return { roadStatus: "ROUTE_NOT_FOUND", durationFactor: 0, roadScore: 1.0, error: false };
    }
    
    const leg = res.data.routes[0].legs[0];
    const duration = leg.duration?.value || 1;
    const durationInTraffic = leg.duration_in_traffic?.value || duration;
    const durationFactor = durationInTraffic / duration;
    
    let roadScore = 0.0;
    if (durationFactor > 2.5) roadScore = 0.7;

    return { roadStatus: "ROUTE_FOUND", durationFactor, roadScore, error: false };
  } catch(e) {
    return { roadStatus: "UNKNOWN", durationFactor: 0, roadScore: 0, error: true };
  }
}

async function _checkCwcFlood(lat, lng) {
  // TODO Phase 3: Replace with real CWC API at http://cwc.gov.in
  try {
     const month = new Date().getMonth(); // 0-based; June is 5, September is 8
     const isMonsoon = (month >= 5 && month <= 8);
     
     // Hardcode Mumbai flood-prone zone bounding boxes
     const zones = [
        { name: "Andheri", minLat: 19.10, maxLat: 19.14, minLng: 72.83, maxLng: 72.90 },
        { name: "Kurla", minLat: 19.05, maxLat: 19.09, minLng: 72.87, maxLng: 72.91 },
        { name: "Dharavi", minLat: 19.03, maxLat: 19.06, minLng: 72.84, maxLng: 72.87 },
        { name: "Sion", minLat: 19.03, maxLat: 19.05, minLng: 72.86, maxLng: 72.90 }
     ];
     
     let inZone = false;
     let nearZone = false;
     const pad = 0.018; // Approx 2km padding roughly equating to 0.018 deg
     
     for (const z of zones) {
        if (lat >= z.minLat && lat <= z.maxLat && lng >= z.minLng && lng <= z.maxLng) {
           inZone = true;
        } else if (lat >= z.minLat - pad && lat <= z.maxLat + pad && lng >= z.minLng - pad && lng <= z.maxLng + pad) {
           nearZone = true;
        }
     }
     
     const floodStageExceeded = inZone && isMonsoon;
     let cwcScore = 0.0;
     
     // Assigning structural scoring parameters based on localized zoning
     if (floodStageExceeded) cwcScore = 1.0;
     else if (nearZone && isMonsoon) cwcScore = 0.7; 
     
     return { floodStageExceeded, cwcScore, error: false };
  } catch(e) {
     return { floodStageExceeded: false, cwcScore: 0, error: true };
  }
}

/**
 * Check 3: Environmental and System Disruption Signals
 * Resolves five simultaneous independent structural and meteorological signals.
 */
async function checkEnvironmentalSignals(routeCoords, claimTimestamp, disruptionType) {
  // Standardize coordinate entry parameters from varied struct inputs
  const lat = routeCoords.lat || (routeCoords.pickupCoords && routeCoords.pickupCoords.lat);
  const lng = routeCoords.lng || (routeCoords.pickupCoords && routeCoords.pickupCoords.lng);
  
  const routeStart = routeCoords.pickupCoords || { lat, lng };
  const routeEnd = routeCoords.dropCoords || { lat, lng };

  // Executes the entire 5 parameter verification spectrum functionally concurrently 
  const [ weatherRes, aqiRes, socialRes, roadsRes, cwcRes ] = await Promise.allSettled([
    _checkWeather(lat, lng, claimTimestamp),
    _checkAqi(lat, lng),
    _checkSocialDisruption(lat, lng, claimTimestamp),
    _checkRoads(routeStart, routeEnd, claimTimestamp),
    _checkCwcFlood(lat, lng)
  ]);

  const extract = (res) => (res.status === 'fulfilled' && !res.value.error ? res.value : Object.assign({}, res.value || {}, { error: true }));

  const weather = extract(weatherRes);
  const aqi = extract(aqiRes);
  const social = extract(socialRes);
  const roads = extract(roadsRes);
  const cwc = extract(cwcRes);

  const scores = [weather.weatherScore, aqi.aqiScore, social.socialScore, roads.roadScore, cwc.cwcScore].map(s => s || 0);
  
  const allFailed = weather.error && aqi.error && social.error && roads.error && cwc.error;
  
  // High Watermark principle — highest credible validated disruption forms the basis of environmental support
  const compositeScore = Math.max(...scores);
  
  let confidence = "LOW";
  if (compositeScore >= 0.7) confidence = "HIGH";
  else if (compositeScore >= 0.4) confidence = "MEDIUM";

  const flags = [];
  if (allFailed) flags.push("ALL_CHECKS_FAILED");

  return {
    checkName: "environmental",
    weight: 0.25,
    score: compositeScore,
    confidence,
    hardReject: false,
    flags,
    data: { 
      weather, 
      aqi, 
      social, 
      roads, 
      cwc 
    },
    completedAt: new Date()
  };
}

module.exports = {
  checkEnvironmentalSignals,
  _checkWeather,
  _checkAqi,
  _checkSocialDisruption,
  _checkRoads,
  _checkCwcFlood
};
