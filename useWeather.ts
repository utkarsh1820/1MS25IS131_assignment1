import { useState, useEffect, useCallback, useRef } from 'react';
import { WeatherData, WeatherType, TempUnit } from '../types/weather';
import { fetchCurrentWeather, searchWeatherByCity, DEMO_PRESETS, generateForecastForPreset } from '../services/weatherApi';

export function useWeather(initialLat: number | null, initialLon: number | null) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [unit, setUnit] = useState<TempUnit>('C');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<WeatherType | 'live'>('live');
  const [lastCoords, setLastCoords] = useState<{ lat: number; lon: number } | null>(null);
  const hasInitialLoadedRef = useRef(false);

  const loadWeather = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCurrentWeather(lat, lon);
      setWeather(data);
      setLastCoords({ lat, lon });
      setActivePreset('live');
    } catch (err: any) {
      console.error('Error fetching live weather:', err);
      setError(err?.message || 'Failed to fetch weather data');
      setWeather((prev) => {
        if (!prev) {
          const fallback = DEMO_PRESETS.sunny;
          const forecasts = generateForecastForPreset(fallback);
          return {
            ...(fallback as WeatherData),
            hourly: forecasts.hourly,
            daily: forecasts.daily,
          };
        }
        return prev;
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLat !== null && initialLon !== null && !hasInitialLoadedRef.current) {
      hasInitialLoadedRef.current = true;
      loadWeather(initialLat, initialLon);
    }
  }, [initialLat, initialLon, loadWeather]);

  const searchCity = useCallback(async (cityName: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchWeatherByCity(cityName);
      setWeather(data);
      setLastCoords({ lat: data.lat, lon: data.lon });
      setActivePreset('live');
    } catch (err: any) {
      setError(err?.message || `Failed to find weather for "${cityName}"`);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const selectPreset = useCallback((preset: WeatherType) => {
    setActivePreset(preset);
    const base = DEMO_PRESETS[preset];
    const fc = generateForecastForPreset(base);
    setWeather({
      ...(base as WeatherData),
      lat: 0,
      lon: 0,
      hourly: fc.hourly,
      daily: fc.daily,
    });
    setError(null);
  }, []);

  const returnToLive = useCallback(() => {
    if (lastCoords) {
      loadWeather(lastCoords.lat, lastCoords.lon);
    } else if (initialLat !== null && initialLon !== null) {
      loadWeather(initialLat, initialLon);
    }
  }, [lastCoords, initialLat, initialLon, loadWeather]);

  const refreshWeather = useCallback(() => {
    if (activePreset === 'live' && lastCoords) {
      loadWeather(lastCoords.lat, lastCoords.lon);
    } else if (activePreset !== 'live') {
      selectPreset(activePreset as WeatherType);
    }
  }, [activePreset, lastCoords, loadWeather, selectPreset]);

  const toggleUnit = useCallback(() => {
    setUnit((prev) => (prev === 'C' ? 'F' : 'C'));
  }, []);

  return {
    weather,
    unit,
    loading,
    error,
    activePreset,
    toggleUnit,
    searchCity,
    selectPreset,
    returnToLive,
    refreshWeather,
  };
}
