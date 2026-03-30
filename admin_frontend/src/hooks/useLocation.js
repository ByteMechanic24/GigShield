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

      const [gpsResult, networkResult] = await Promise.allSettled([
        getPosition({ enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }),
        getPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }),
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
            }
          : null;

      if (!gpsCoords && !networkCoords) {
        update({
          gpsCoords: null,
          networkCoords: null,
          isLoading: false,
          error: 'Allow location access to attach stronger evidence to this claim.',
        });
        return;
      }

      update({
        gpsCoords: gpsCoords || networkCoords,
        networkCoords: networkCoords || gpsCoords,
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
