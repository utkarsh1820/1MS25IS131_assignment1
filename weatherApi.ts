import { WeatherData, WeatherType } from '../types/weather';

export const DEMO_PRESETS: Record<WeatherType, Partial<WeatherData>> = {
  sunny: {
    city: 'Miami',
    country: 'US',
    temp: 29,
    feelsLike: 31,
    tempMin: 24,
    tempMax: 30,
    condition: 'Sunny',
    weatherType: 'sunny',
    description: 'Clear sunny sky with warm ocean breeze',
    humidity: 48,
    windSpeed: 14,
    windDirection: 110,
    windGust: 18,
    visibility: 10,
    pressure: 1016,
    uvIndex: 8,
    sunrise: new Date(Date.now() - 5 * 3600000).toISOString(),
    sunset: new Date(Date.now() + 7 * 3600000).toISOString(),
    isDay: true,
  },
  cloudy: {
    city: 'London',
    country: 'GB',
    temp: 16,
    feelsLike: 15,
    tempMin: 12,
    tempMax: 17,
    condition: 'Partly Cloudy',
    weatherType: 'cloudy',
    description: 'Scattered cumulus clouds with soft sunlight',
    humidity: 68,
    windSpeed: 18,
    windDirection: 240,
    windGust: 25,
    visibility: 9,
    pressure: 1012,
    uvIndex: 3,
    sunrise: new Date(Date.now() - 4 * 3600000).toISOString(),
    sunset: new Date(Date.now() + 6 * 3600000).toISOString(),
    isDay: true,
  },
  rainy: {
    city: 'Seattle',
    country: 'US',
    temp: 13,
    feelsLike: 11,
    tempMin: 9,
    tempMax: 14,
    condition: 'Rainy Showers',
    weatherType: 'rainy',
    description: 'Steady raindrops with atmospheric mist',
    humidity: 89,
    windSpeed: 22,
    windDirection: 195,
    windGust: 32,
    visibility: 6,
    pressure: 1005,
    uvIndex: 1,
    sunrise: new Date(Date.now() - 3 * 3600000).toISOString(),
    sunset: new Date(Date.now() + 7 * 3600000).toISOString(),
    isDay: true,
  },
  storm: {
    city: 'Singapore',
    country: 'SG',
    temp: 26,
    feelsLike: 29,
    tempMin: 24,
    tempMax: 28,
    condition: 'Thunderstorm',
    weatherType: 'storm',
    description: 'Intense lightning flashes, thunder, and heavy downpour',
    humidity: 94,
    windSpeed: 38,
    windDirection: 280,
    windGust: 52,
    visibility: 3,
    pressure: 998,
    uvIndex: 1,
    sunrise: new Date(Date.now() - 6 * 3600000).toISOString(),
    sunset: new Date(Date.now() + 6 * 3600000).toISOString(),
    isDay: true,
  },
  windy: {
    city: 'Chicago',
    country: 'US',
    temp: 18,
    feelsLike: 15,
    tempMin: 12,
    tempMax: 20,
    condition: 'High Winds',
    weatherType: 'windy',
    description: 'Brisk wind streams and dynamic atmospheric flow',
    humidity: 52,
    windSpeed: 46,
    windDirection: 310,
    windGust: 64,
    visibility: 10,
    pressure: 1010,
    uvIndex: 4,
    sunrise: new Date(Date.now() - 4 * 3600000).toISOString(),
    sunset: new Date(Date.now() + 8 * 3600000).toISOString(),
    isDay: true,
  },
  snow: {
    city: 'Reykjavik',
    country: 'IS',
    temp: -3,
    feelsLike: -8,
    tempMin: -6,
    tempMax: 0,
    condition: 'Crisp Snowfall',
    weatherType: 'snow',
    description: 'Gentle falling snowflakes in crisp winter air',
    humidity: 82,
    windSpeed: 20,
    windDirection: 45,
    windGust: 28,
    visibility: 5,
    pressure: 1022,
    uvIndex: 1,
    sunrise: new Date(Date.now() - 2 * 3600000).toISOString(),
    sunset: new Date(Date.now() + 4 * 3600000).toISOString(),
    isDay: true,
  },
};

export function generateForecastForPreset(preset: Partial<WeatherData>): { hourly: any[]; daily: any[] } {
  const baseTemp = preset.temp || 20;
  const now = new Date();

  const hourly = Array.from({ length: 24 }).map((_, i) => {
    const time = new Date(now.getTime() + i * 3600000);
    const tempDelta = Math.sin((i - 6) / 24 * Math.PI * 2) * 4;
    return {
      time: time.toISOString(),
      temp: Math.round(baseTemp + tempDelta),
      condition: preset.condition || 'Sunny',
      weatherType: preset.weatherType || 'sunny',
      description: preset.description || '',
      pop: preset.weatherType === 'rainy' ? 85 : preset.weatherType === 'storm' ? 95 : preset.weatherType === 'snow' ? 70 : 10,
      isDay: time.getHours() >= 6 && time.getHours() <= 19,
    };
  });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daily = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(now.getTime() + i * 86400000);
    const dayName = i === 0 ? 'Today' : days[date.getDay()];
    return {
      date: date.toISOString().split('T')[0],
      day: dayName,
      condition: preset.condition || 'Clear',
      weatherType: preset.weatherType || 'sunny',
      tempMax: Math.round(baseTemp + 3 - i * 0.5),
      tempMin: Math.round(baseTemp - 4 - i * 0.5),
      pop: preset.weatherType === 'rainy' ? 80 : preset.weatherType === 'storm' ? 90 : 15,
      rainProbability: preset.weatherType === 'rainy' ? 80 : preset.weatherType === 'storm' ? 90 : 15,
    };
  });

  return { hourly, daily };
}

export async function fetchCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
  const res = await fetch(`/api/weather/current?lat=${lat}&lon=${lon}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export async function fetchForecast(lat: number, lon: number): Promise<{ hourly: any[]; daily: any[] }> {
  const res = await fetch(`/api/weather/forecast?lat=${lat}&lon=${lon}`);
  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}`);
  }
  return res.json();
}

export async function searchWeatherByCity(city: string): Promise<WeatherData> {
  const res = await fetch(`/api/weather/search?city=${encodeURIComponent(city)}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `City "${city}" could not be found.`);
  }
  return res.json();
}
