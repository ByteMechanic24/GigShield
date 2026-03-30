import { useEffect, useState } from 'react';

export default function useLocation() {
  const [locationData, setLocationData] = useState({
    gpsCoords: null,
    networkCoords: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const update = (next) => {
      if (isMounted) {
        setLocationData(next);
      }
    };

    const getPosition = (options) =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

    const getGoogleNetworkLocation = async () => {
      const apiKey = import.meta.env.VITE_GOOGLE_GEOLOCATION_API_KEY;
      if (!apiKey) {
        return null;
      }

      const response = await fetch(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ considerIp: false }),
        }
      );

      if (!response.ok) {
        throw new Error('Google network location request failed.');
      }

      const data = await response.json();
      if (!data?.location) {
        return null;
      }

      return {
        lat: data.location.lat,
        lng: data.location.lng,
        accuracy: Math.round(data.accuracy ?? 0),
        googleGeolocUsed: true,
      };
    };

    const fetchLocation = async () => {
      if (!navigator.geolocation) {
        update({
          gpsCoords: null,
          networkCoords: null,
          isLoading: false,
          error: 'Location is not available in this browser.',
        });
        return;
      }

      const [gpsResult, networkResult, googleResult] = await Promise.allSettled([
        getPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }),
        getPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }),
        getGoogleNetworkLocation(),
      ]);

      const gpsCoords =
        gpsResult.status === 'fulfilled'
          ? {
              lat: gpsResult.value.coords.latitude,
              lng: gpsResult.value.coords.longitude,
              accuracy: Math.round(gpsResult.value.coords.accuracy),
            }
          : null;

      const networkCoords =
        networkResult.status === 'fulfilled'
          ? {
              lat: networkResult.value.coords.latitude,
              lng: networkResult.value.coords.longitude,
              accuracy: Math.round(networkResult.value.coords.accuracy),
              googleGeolocUsed: false,
            }
          : null;

      const googleCoords =
        googleResult.status === 'fulfilled' && googleResult.value
          ? googleResult.value
          : null;

      const resolvedNetworkCoords = googleCoords || networkCoords;

      if (!gpsCoords && !resolvedNetworkCoords) {
        update({
          gpsCoords: null,
          networkCoords: null,
          isLoading: false,
          error: 'Allow location access to attach stronger evidence to this claim.',
        });
        return;
      }

      update({
        gpsCoords: gpsCoords || resolvedNetworkCoords,
        networkCoords: resolvedNetworkCoords || gpsCoords,
        isLoading: false,
        error: null,
      });
    };

    fetchLocation().catch(() => {
      update({
        gpsCoords: null,
        networkCoords: null,
        isLoading: false,
        error: 'Unable to capture location right now.',
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return locationData;
}
