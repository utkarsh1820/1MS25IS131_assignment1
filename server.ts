import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware
app.use(express.json());

// In-memory cache with 10-minute TTL
interface CacheItem<T> {
  data: T;
  expiry: number;
}
const cache = new Map<string, CacheItem<unknown>>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  return item.data as T;
}

function setCache<T>(key: string, data: T) {
  cache.set(key, {
    data,
    expiry: Date.now() + CACHE_TTL_MS,
  });
}

// Convert Open-Meteo weather code to condition string and weatherType
export function parseWmoWeatherCode(code: number, windSpeedKmh: number = 0): { condition: string; weatherType: string; description: string } {
  // If high winds regardless of minor clouds, categorize as windy
  if (windSpeedKmh > 35 && code <= 3) {
    return { condition: 'Windy', weatherType: 'windy', description: 'Strong atmospheric winds' };
  }

  if (code === 0) {
    return { condition: 'Sunny', weatherType: 'sunny', description: 'Clear blue skies' };
  } else if (code === 1) {
    return { condition: 'Mainly Clear', weatherType: 'sunny', description: 'Mainly clear skies' };
  } else if (code === 2) {
    return { condition: 'Partly Cloudy', weatherType: 'cloudy', description: 'Scattered cumulus clouds' };
  } else if (code === 3) {
    return { condition: 'Overcast', weatherType: 'cloudy', description: 'Dense overcast cloud cover' };
  } else if (code >= 45 && code <= 48) {
    return { condition: 'Foggy', weatherType: 'cloudy', description: 'Low visibility fog and mist' };
  } else if (code >= 51 && code <= 55) {
    return { condition: 'Drizzle', weatherType: 'rainy', description: 'Light atmospheric drizzle' };
  } else if (code >= 61 && code <= 67) {
    return { condition: 'Rainy', weatherType: 'rainy', description: 'Steady rainfall' };
  } else if (code >= 71 && code <= 77) {
    return { condition: 'Snowy', weatherType: 'snow', description: 'Crisp falling snow' };
  } else if (code >= 80 && code <= 82) {
    return { condition: 'Heavy Showers', weatherType: 'rainy', description: 'Passing rain showers' };
  } else if (code >= 85 && code <= 86) {
    return { condition: 'Snow Showers', weatherType: 'snow', description: 'Cold snow showers' };
  } else if (code >= 95 && code <= 99) {
    return { condition: 'Thunderstorm', weatherType: 'storm', description: 'Severe thunderstorm with lightning' };
  }
  return { condition: 'Clear', weatherType: 'sunny', description: 'Fair weather conditions' };
}

export function parseOwmWeather(id: number, main: string, description: string, windSpeedKmh: number = 0) {
  if (windSpeedKmh > 35 && (id >= 800 && id <= 802)) {
    return { condition: 'Windy', weatherType: 'windy', description: 'Strong gusts and wind streams' };
  }
  if (id >= 200 && id < 300) {
    return { condition: 'Thunderstorm', weatherType: 'storm', description };
  } else if (id >= 300 && id < 600) {
    return { condition: 'Rainy', weatherType: 'rainy', description };
  } else if (id >= 600 && id < 700) {
    return { condition: 'Snowy', weatherType: 'snow', description };
  } else if (id >= 700 && id < 800) {
    return { condition: 'Atmospheric Haze', weatherType: 'cloudy', description };
  } else if (id === 800) {
    return { condition: 'Sunny', weatherType: 'sunny', description: 'Clear skies' };
  } else if (id === 801 || id === 802) {
    return { condition: 'Partly Cloudy', weatherType: 'cloudy', description };
  } else {
    return { condition: 'Overcast', weatherType: 'cloudy', description };
  }
}

// Fetch reverse geocode location name
async function fetchLocationName(lat: number, lon: number): Promise<{ city: string; country: string }> {
  const cacheKey = `geo:${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = getCached<{ city: string; country: string }>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (apiKey && apiKey !== 'your_openweather_api_key_here') {
    try {
      const res = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const loc = {
            city: data[0].name || 'Current Location',
            country: data[0].country || '',
          };
          setCache(cacheKey, loc);
          return loc;
        }
      }
    } catch {
      // Fall through to open-meteo/nominatim fallback
    }
  }

  // Fallback reverse geocoding via bigdatacloud or nominatim (free, open)
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision;
      if (city) {
        const country = data.countryName || data.countryCode || '';
        const loc = { city, country };
        setCache(cacheKey, loc);
        return loc;
      }
    }
  } catch {
    // fallback
  }

  // OpenStreetMap Nominatim reverse geocode
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
      headers: { 'User-Agent': 'Atmosphere3D-WeatherApp/1.0' }
    });
    if (res.ok) {
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || data.address?.county;
      if (city) {
        const country = data.address?.country_code?.toUpperCase() || '';
        const loc = { city, country };
        setCache(cacheKey, loc);
        return loc;
      }
    }
  } catch {
    // fallback
  }

  // If default San Francisco coordinates
  if (Math.abs(lat - 37.7749) < 0.1 && Math.abs(lon - (-122.4194)) < 0.1) {
    return { city: 'San Francisco', country: 'US' };
  }

  return { city: `Lat ${lat.toFixed(2)}°, Lon ${lon.toFixed(2)}°`, country: '' };
}

// Fetch live weather data using OpenWeatherMap or Open-Meteo
async function fetchLiveWeather(lat: number, lon: number) {
  const cacheKey = `weather:${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.OPENWEATHER_API_KEY;
  const loc = await fetchLocationName(lat, lon);

  // If OpenWeatherMap API key is set and valid, use it
  if (apiKey && apiKey !== 'your_openweather_api_key_here') {
    try {
      const [curRes, fcRes] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`),
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`),
      ]);

      if (curRes.ok && fcRes.ok) {
        const cur = await curRes.json();
        const fc = await fcRes.json();

        const windSpeedKmh = Math.round((cur.wind?.speed || 0) * 3.6);
        const parsed = parseOwmWeather(
          cur.weather?.[0]?.id || 800,
          cur.weather?.[0]?.main || 'Clear',
          cur.weather?.[0]?.description || 'Clear sky',
          windSpeedKmh
        );

        // Map hourly forecast
        const hourly = (fc.list || []).slice(0, 24).map((item: any) => {
          const itemSpeedKmh = Math.round((item.wind?.speed || 0) * 3.6);
          const p = parseOwmWeather(item.weather?.[0]?.id || 800, item.weather?.[0]?.main || 'Clear', item.weather?.[0]?.description || '', itemSpeedKmh);
          return {
            time: item.dt_txt || new Date(item.dt * 1000).toISOString(),
            temp: Math.round(item.main?.temp || 0),
            feelsLike: Math.round(item.main?.feels_like || 0),
            condition: p.condition,
            weatherType: p.weatherType,
            description: p.description,
            pop: Math.round((item.pop || 0) * 100),
            humidity: item.main?.humidity || 50,
            isDay: (item.sys?.pod === 'd'),
          };
        });

        // Group into daily forecast
        const dailyMap = new Map<string, any>();
        for (const item of (fc.list || [])) {
          const dayKey = item.dt_txt?.split(' ')[0] || new Date(item.dt * 1000).toISOString().split('T')[0];
          if (!dailyMap.has(dayKey)) {
            dailyMap.set(dayKey, {
              date: dayKey,
              tempMin: item.main?.temp_min || item.main?.temp,
              tempMax: item.main?.temp_max || item.main?.temp,
              conditions: [item.weather?.[0]?.main],
              weatherIds: [item.weather?.[0]?.id || 800],
              pops: [item.pop || 0],
            });
          } else {
            const existing = dailyMap.get(dayKey);
            existing.tempMin = Math.min(existing.tempMin, item.main?.temp_min || item.main?.temp);
            existing.tempMax = Math.max(existing.tempMax, item.main?.temp_max || item.main?.temp);
            existing.weatherIds.push(item.weather?.[0]?.id || 800);
            existing.pops.push(item.pop || 0);
          }
        }

        const daily = Array.from(dailyMap.values()).slice(0, 7).map((d: any) => {
          const midId = d.weatherIds[Math.floor(d.weatherIds.length / 2)] || 800;
          const p = parseOwmWeather(midId, 'Clear', 'Clear');
          const maxPop = Math.round(Math.max(...d.pops) * 100);
          const dateObj = new Date(d.date);
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

          return {
            date: d.date,
            day: dayName,
            condition: p.condition,
            weatherType: p.weatherType,
            tempMax: Math.round(d.tempMax),
            tempMin: Math.round(d.tempMin),
            pop: maxPop,
            rainProbability: maxPop,
          };
        });

        const weatherPayload = {
          city: cur.name || loc.city,
          country: cur.sys?.country || loc.country,
          lat,
          lon,
          temp: Math.round(cur.main?.temp || 0),
          feelsLike: Math.round(cur.main?.feels_like || 0),
          tempMin: Math.round(cur.main?.temp_min || cur.main?.temp || 0),
          tempMax: Math.round(cur.main?.temp_max || cur.main?.temp || 0),
          condition: parsed.condition,
          weatherType: parsed.weatherType,
          description: parsed.description,
          humidity: cur.main?.humidity || 50,
          windSpeed: windSpeedKmh,
          windDirection: cur.wind?.deg || 0,
          windGust: Math.round((cur.wind?.gust || cur.wind?.speed || 0) * 3.6),
          visibility: cur.visibility ? Math.round(cur.visibility / 1000) : 10,
          pressure: cur.main?.pressure || 1013,
          uvIndex: 4, // Default estimate if not in v2.5
          sunrise: new Date((cur.sys?.sunrise || Date.now() / 1000) * 1000).toISOString(),
          sunset: new Date((cur.sys?.sunset || (Date.now() / 1000) + 43200) * 1000).toISOString(),
          isDay: cur.weather?.[0]?.icon ? cur.weather[0].icon.includes('d') : true,
          hourly,
          daily,
          provider: 'openweathermap',
        };

        setCache(cacheKey, weatherPayload);
        return weatherPayload;
      }
    } catch (err) {
      console.warn('OpenWeatherMap API request failed, falling back to Open-Meteo:', err);
    }
  }

  // Open-Meteo Fallback (High-precision, global, zero API key needed)
  const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`;

  const omRes = await fetch(openMeteoUrl);
  if (!omRes.ok) {
    throw new Error(`Weather data provider responded with status ${omRes.status}`);
  }

  const omData = await omRes.json();
  const current = omData.current || {};
  const currentSpeed = Math.round(current.wind_speed_10m || 0);
  const parsed = parseWmoWeatherCode(current.weather_code || 0, currentSpeed);

  // Hourly mapping (24 hours from current time)
  const hourlyTimes: string[] = omData.hourly?.time || [];
  const hourlyTemps: number[] = omData.hourly?.temperature_2m || [];
  const hourlyCodes: number[] = omData.hourly?.weather_code || [];
  const hourlyPops: number[] = omData.hourly?.precipitation_probability || [];
  const hourlyIsDay: number[] = omData.hourly?.is_day || [];

  const nowIso = new Date().toISOString();
  let startIndex = hourlyTimes.findIndex((t) => t >= nowIso.slice(0, 13));
  if (startIndex < 0) startIndex = 0;

  const hourly = [];
  for (let i = startIndex; i < Math.min(startIndex + 24, hourlyTimes.length); i++) {
    const code = hourlyCodes[i] || 0;
    const p = parseWmoWeatherCode(code);
    hourly.push({
      time: hourlyTimes[i],
      temp: Math.round(hourlyTemps[i] || 0),
      condition: p.condition,
      weatherType: p.weatherType,
      description: p.description,
      pop: Math.round(hourlyPops[i] || 0),
      isDay: hourlyIsDay[i] === 1,
    });
  }

  // Daily mapping (7 days)
  const dailyTimes: string[] = omData.daily?.time || [];
  const dailyMax: number[] = omData.daily?.temperature_2m_max || [];
  const dailyMin: number[] = omData.daily?.temperature_2m_min || [];
  const dailyCodes: number[] = omData.daily?.weather_code || [];
  const dailyPops: number[] = omData.daily?.precipitation_probability_max || [];

  const daily = [];
  for (let i = 0; i < Math.min(7, dailyTimes.length); i++) {
    const code = dailyCodes[i] || 0;
    const p = parseWmoWeatherCode(code);
    const dateObj = new Date(dailyTimes[i]);
    const dayName = i === 0 ? 'Today' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const popVal = Math.round(dailyPops[i] || 0);

    daily.push({
      date: dailyTimes[i],
      day: dayName,
      condition: p.condition,
      weatherType: p.weatherType,
      tempMax: Math.round(dailyMax[i] || 0),
      tempMin: Math.round(dailyMin[i] || 0),
      pop: popVal,
      rainProbability: popVal,
    });
  }

  const sunrise = omData.daily?.sunrise?.[0] || new Date().toISOString();
  const sunset = omData.daily?.sunset?.[0] || new Date(Date.now() + 43200000).toISOString();
  const uvIndex = Math.round(omData.daily?.uv_index_max?.[0] || 4);

  const weatherPayload = {
    city: loc.city,
    country: loc.country,
    lat,
    lon,
    timezone: omData.timezone || 'UTC',
    temp: Math.round(current.temperature_2m || 0),
    feelsLike: Math.round(current.apparent_temperature || current.temperature_2m || 0),
    tempMin: Math.round(omData.daily?.temperature_2m_min?.[0] || current.temperature_2m || 0),
    tempMax: Math.round(omData.daily?.temperature_2m_max?.[0] || current.temperature_2m || 0),
    condition: parsed.condition,
    weatherType: parsed.weatherType,
    description: parsed.description,
    humidity: Math.round(current.relative_humidity_2m || 55),
    windSpeed: currentSpeed,
    windDirection: Math.round(current.wind_direction_10m || 0),
    windGust: Math.round(current.wind_gusts_10m || currentSpeed),
    visibility: 10,
    pressure: Math.round(current.surface_pressure || 1013),
    uvIndex,
    sunrise,
    sunset,
    isDay: current.is_day === 1,
    hourly,
    daily,
    provider: 'open-meteo',
  };

  setCache(cacheKey, weatherPayload);
  return weatherPayload;
}

// REST API Endpoints

// 1. GET /api/weather/current?lat={lat}&lon={lon}
app.get('/api/weather/current', async (req: Request, res: Response) => {
  try {
    const latStr = req.query.lat as string;
    const lonStr = req.query.lon as string;

    if (!latStr || !lonStr) {
      res.status(400).json({ error: 'Latitude (lat) and longitude (lon) query parameters are required.' });
      return;
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      res.status(400).json({ error: 'Invalid coordinates. lat must be between -90 and 90, lon between -180 and 180.' });
      return;
    }

    const weather = await fetchLiveWeather(lat, lon);
    res.json(weather);
  } catch (err: any) {
    console.error('Error in /api/weather/current:', err);
    res.status(500).json({ error: 'Failed to retrieve current weather data.', message: err?.message });
  }
});

// 2. GET /api/weather/forecast?lat={lat}&lon={lon}
app.get('/api/weather/forecast', async (req: Request, res: Response) => {
  try {
    const latStr = req.query.lat as string;
    const lonStr = req.query.lon as string;

    if (!latStr || !lonStr) {
      res.status(400).json({ error: 'Latitude (lat) and longitude (lon) query parameters are required.' });
      return;
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      res.status(400).json({ error: 'Invalid coordinates.' });
      return;
    }

    const weather: any = await fetchLiveWeather(lat, lon);
    res.json({
      city: weather.city,
      country: weather.country,
      lat,
      lon,
      hourly: weather.hourly,
      daily: weather.daily,
    });
  } catch (err: any) {
    console.error('Error in /api/weather/forecast:', err);
    res.status(500).json({ error: 'Failed to retrieve forecast data.', message: err?.message });
  }
});

// 3. GET /api/weather/location?lat={lat}&lon={lon}
app.get('/api/weather/location', async (req: Request, res: Response) => {
  try {
    const latStr = req.query.lat as string;
    const lonStr = req.query.lon as string;

    if (!latStr || !lonStr) {
      res.status(400).json({ error: 'Coordinates required' });
      return;
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      res.status(400).json({ error: 'Invalid coordinates' });
      return;
    }

    const loc = await fetchLocationName(lat, lon);
    res.json(loc);
  } catch (err: any) {
    console.error('Error in /api/weather/location:', err);
    res.status(500).json({ error: 'Failed to resolve location', message: err?.message });
  }
});

// 4. GET /api/weather/search?city={city}
app.get('/api/weather/search', async (req: Request, res: Response) => {
  try {
    const city = (req.query.city as string)?.trim();
    if (!city) {
      res.status(400).json({ error: 'City name query parameter is required.' });
      return;
    }

    const cacheKey = `search:${city.toLowerCase()}`;
    const cached = getCached<unknown>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    // Geocode city query
    const apiKey = process.env.OPENWEATHER_API_KEY;
    let foundLat: number | null = null;
    let foundLon: number | null = null;
    let cityName = city;
    let countryCode = '';

    if (apiKey && apiKey !== 'your_openweather_api_key_here') {
      try {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`);
        if (geoRes.ok) {
          const list = await geoRes.json();
          if (Array.isArray(list) && list.length > 0) {
            foundLat = list[0].lat;
            foundLon = list[0].lon;
            cityName = list[0].name;
            countryCode = list[0].country;
          }
        }
      } catch {
        // Fall back to open-meteo geocoding
      }
    }

    if (foundLat === null || foundLon === null) {
      const omGeoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
      if (omGeoRes.ok) {
        const omGeo = await omGeoRes.json();
        if (omGeo.results && omGeo.results.length > 0) {
          const r = omGeo.results[0];
          foundLat = r.latitude;
          foundLon = r.longitude;
          cityName = r.name;
          countryCode = r.country_code || r.country || '';
        }
      }
    }

    if (foundLat === null || foundLon === null) {
      res.status(404).json({ error: `City "${city}" could not be located. Please check spelling.` });
      return;
    }

    const weather: any = await fetchLiveWeather(foundLat, foundLon);
    weather.city = cityName;
    if (countryCode) weather.country = countryCode;

    setCache(cacheKey, weather);
    res.json(weather);
  } catch (err: any) {
    console.error('Error in /api/weather/search:', err);
    res.status(500).json({ error: 'Failed to search weather.', message: err?.message });
  }
});

// Vite dev server middleware or static production serve
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Atmosphere 3D] Full-stack Server listening on port ${PORT}`);
  });
}

startServer();
