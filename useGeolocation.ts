import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
  lat: number | null;
  lon: number | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

// Fallback to San Francisco if geolocation is blocked or unavailable
const DEFAULT_COORDS = { lat: 37.7749, lon: -122.4194 };

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lon: null,
    loading: true,
    error: null,
    permissionDenied: false,
  });

  const requestLocation = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (!('geolocation' in navigator)) {
      setState({
        lat: DEFAULT_COORDS.lat,
        lon: DEFAULT_COORDS.lon,
        loading: false,
        error: 'Geolocation is not supported by your browser.',
        permissionDenied: true,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          loading: false,
          error: null,
          permissionDenied: false,
        });
      },
      (err) => {
        console.warn('Geolocation access failed or denied:', err.message);
        // Fallback default coordinates
        setState({
          lat: DEFAULT_COORDS.lat,
          lon: DEFAULT_COORDS.lon,
          loading: false,
          error: err.code === 1 ? 'Location permission was denied.' : 'Unable to determine exact location.',
          permissionDenied: err.code === 1,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000, // 10 minutes cache
      }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const setManualCoords = useCallback((lat: number, lon: number) => {
    setState({
      lat,
      lon,
      loading: false,
      error: null,
      permissionDenied: false,
    });
  }, []);

  return {
    ...state,
    refreshLocation: requestLocation,
    setManualCoords,
  };
}
