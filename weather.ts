export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'storm' | 'windy' | 'snow';

export interface HourlyForecastItem {
  time: string;
  temp: number;
  feelsLike?: number;
  condition: string;
  weatherType: WeatherType;
  description: string;
  pop: number; // Precipitation probability 0-100%
  humidity?: number;
  isDay: boolean;
}

export interface DailyForecastItem {
  date: string;
  day: string;
  condition: string;
  weatherType: WeatherType;
  tempMax: number;
  tempMin: number;
  pop: number;
  rainProbability: number;
}

export interface WeatherData {
  city: string;
  country: string;
  lat: number;
  lon: number;
  timezone?: string;
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  condition: string;
  weatherType: WeatherType;
  description: string;
  humidity: number;
  windSpeed: number; // km/h
  windDirection: number; // degrees
  windGust?: number; // km/h
  visibility: number; // km
  pressure: number; // hPa
  uvIndex: number;
  sunrise: string;
  sunset: string;
  isDay: boolean;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  provider?: string;
}

export type TempUnit = 'C' | 'F';
