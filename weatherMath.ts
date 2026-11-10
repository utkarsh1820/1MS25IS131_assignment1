import { WeatherType, TempUnit } from '../types/weather';

export function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return Math.round(((fahrenheit - 32) * 5) / 9);
}

export function convertTemp(tempC: number, unit: TempUnit): number {
  if (unit === 'F') {
    return celsiusToFahrenheit(tempC);
  }
  return Math.round(tempC);
}

export function formatTemp(tempC: number, unit: TempUnit): string {
  return `${convertTemp(tempC, unit)}°${unit}`;
}

export function getCardinalDirection(degrees: number): string {
  const normalized = ((degrees % 360) + 360) % 360;
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

export function mapWeatherConditionToType(
  conditionText: string,
  windSpeedKmH: number = 0
): WeatherType {
  const lower = conditionText.toLowerCase();

  if (windSpeedKmH >= 38 && !lower.includes('rain') && !lower.includes('snow') && !lower.includes('thunder')) {
    return 'windy';
  }
  if (lower.includes('storm') || lower.includes('thunder') || lower.includes('lightning') || lower.includes('cyclone') || lower.includes('squall')) {
    return 'storm';
  }
  if (lower.includes('snow') || lower.includes('blizzard') || lower.includes('ice') || lower.includes('sleet') || lower.includes('flurr')) {
    return 'snow';
  }
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower') || lower.includes('pour')) {
    return 'rainy';
  }
  if (lower.includes('wind') || lower.includes('breeze') || lower.includes('gale') || windSpeedKmH >= 38) {
    return 'windy';
  }
  if (lower.includes('cloud') || lower.includes('overcast') || lower.includes('fog') || lower.includes('mist') || lower.includes('haze')) {
    return 'cloudy';
  }
  return 'sunny';
}

export interface SunPositionResult {
  progress: number; // 0.0 (sunrise) to 1.0 (sunset)
  isDay: boolean;
  angleDeg: number; // 0 to 180 during day
  daylightHours: number;
}

export function calculateSunPosition(
  sunriseStr: string,
  sunsetStr: string,
  referenceTime?: Date
): SunPositionResult {
  const now = referenceTime || new Date();
  const sunrise = new Date(sunriseStr);
  const sunset = new Date(sunsetStr);

  const sunriseMs = sunrise.getTime();
  const sunsetMs = sunset.getTime();
  const nowMs = now.getTime();

  const totalDaylightMs = Math.max(1, sunsetMs - sunriseMs);
  const daylightHours = +(totalDaylightMs / (1000 * 60 * 60)).toFixed(1);

  if (nowMs < sunriseMs) {
    return {
      progress: 0,
      isDay: false,
      angleDeg: 0,
      daylightHours,
    };
  } else if (nowMs > sunsetMs) {
    return {
      progress: 1,
      isDay: false,
      angleDeg: 180,
      daylightHours,
    };
  }

  const progress = Math.min(1, Math.max(0, (nowMs - sunriseMs) / totalDaylightMs));
  const angleDeg = Math.round(progress * 180);

  return {
    progress,
    isDay: true,
    angleDeg,
    daylightHours,
  };
}

export function getUVDescriptor(uv: number): { label: string; color: string; desc: string } {
  if (uv <= 2) return { label: 'Low', color: 'text-emerald-400', desc: 'No protection required' };
  if (uv <= 5) return { label: 'Moderate', color: 'text-amber-400', desc: 'Protection recommended' };
  if (uv <= 7) return { label: 'High', color: 'text-orange-400', desc: 'Seek shade during midday' };
  if (uv <= 10) return { label: 'Very High', color: 'text-rose-400', desc: 'Avoid sun exposure' };
  return { label: 'Extreme', color: 'text-purple-400', desc: 'Extra precautions vital' };
}

export function getVisibilityDescriptor(km: number): { label: string; desc: string } {
  if (km >= 10) return { label: 'Clear', desc: 'Crystal clear horizon' };
  if (km >= 6) return { label: 'Good', desc: 'Minor atmospheric haze' };
  if (km >= 3) return { label: 'Moderate', desc: 'Reduced distant visibility' };
  return { label: 'Poor', desc: 'Dense haze, fog, or precipitation' };
}

export function formatTimeShort(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
