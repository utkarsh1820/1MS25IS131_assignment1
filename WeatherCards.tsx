import React from 'react';
import {
  Droplets,
  Wind,
  Eye,
  Gauge,
  Sun,
  CloudRain,
  Compass,
} from 'lucide-react';
import { WeatherData, TempUnit } from '../types/weather';
import { getCardinalDirection, getUVDescriptor, getVisibilityDescriptor } from '../utils/weatherMath';

interface WeatherCardsProps {
  weather: WeatherData;
  unit: TempUnit;
}

export const WeatherCards: React.FC<WeatherCardsProps> = ({ weather, unit }) => {
  const cardinal = getCardinalDirection(weather.windDirection);
  const uvInfo = getUVDescriptor(weather.uvIndex);
  const visibilityInfo = getVisibilityDescriptor(weather.visibility);

  // Convert wind speed to mph if unit is F
  const windDisplay = unit === 'F'
    ? `${Math.round(weather.windSpeed * 0.621371)} mph`
    : `${weather.windSpeed} km/h`;

  const gustDisplay = weather.windGust
    ? unit === 'F'
      ? `${Math.round(weather.windGust * 0.621371)} mph`
      : `${weather.windGust} km/h`
    : null;

  const visibilityDisplay = unit === 'F'
    ? `${(weather.visibility * 0.621371).toFixed(1)} mi`
    : `${weather.visibility} km`;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
      {/* 1. Humidity Card */}
      <div className="group relative p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-cyan-500/30 transition-all duration-300 shadow-lg shadow-black/20 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold tracking-wider uppercase">Humidity</span>
          <Droplets className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="my-2">
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {weather.humidity}%
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {weather.humidity > 70 ? 'High humidity' : weather.humidity < 35 ? 'Dry air' : 'Comfortable'}
          </p>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(5, weather.humidity))}%` }}
          />
        </div>
      </div>

      {/* 2. Wind & Direction Card */}
      <div className="group relative p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-cyan-500/30 transition-all duration-300 shadow-lg shadow-black/20 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold tracking-wider uppercase">Wind</span>
          <Wind className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="my-2">
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono truncate">
            {windDisplay}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 mt-0.5">
            <Compass
              className="w-3.5 h-3.5 text-cyan-400 transition-transform duration-500"
              style={{ transform: `rotate(${weather.windDirection}deg)` }}
            />
            <span>{cardinal} ({weather.windDirection}°)</span>
          </div>
        </div>
        {gustDisplay ? (
          <div className="text-[10px] text-slate-400 truncate">
            Gusts up to {gustDisplay}
          </div>
        ) : (
          <div className="text-[10px] text-slate-400">Steady air stream</div>
        )}
      </div>

      {/* 3. Visibility Card */}
      <div className="group relative p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-cyan-500/30 transition-all duration-300 shadow-lg shadow-black/20 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold tracking-wider uppercase">Visibility</span>
          <Eye className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="my-2">
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono truncate">
            {visibilityDisplay}
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5 truncate">
            {visibilityInfo.label}
          </p>
        </div>
        <div className="text-[10px] text-slate-400 truncate">
          {visibilityInfo.desc}
        </div>
      </div>

      {/* 4. Atmospheric Pressure Card */}
      <div className="group relative p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-cyan-500/30 transition-all duration-300 shadow-lg shadow-black/20 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold tracking-wider uppercase">Pressure</span>
          <Gauge className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="my-2">
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono truncate">
            {weather.pressure}
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            hPa
          </p>
        </div>
        <div className="text-[10px] text-slate-400 truncate">
          {weather.pressure < 1005 ? 'Low pressure system' : weather.pressure > 1020 ? 'High pressure system' : 'Standard atmospheric'}
        </div>
      </div>

      {/* 5. UV Index Card */}
      <div className="group relative p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-cyan-500/30 transition-all duration-300 shadow-lg shadow-black/20 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold tracking-wider uppercase">UV Index</span>
          <Sun className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
              {weather.uvIndex}
            </span>
            <span className={`text-xs font-semibold ${uvInfo.color}`}>
              {uvInfo.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5 truncate">
            {uvInfo.desc}
          </p>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 h-full rounded-full"
            style={{ width: `${Math.min(100, (weather.uvIndex / 12) * 100)}%` }}
          />
        </div>
      </div>

      {/* 6. Precipitation / Rain Probability Card */}
      <div className="group relative p-4 rounded-2xl bg-slate-900/40 hover:bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-cyan-500/30 transition-all duration-300 shadow-lg shadow-black/20 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-xs font-semibold tracking-wider uppercase">Precipitation</span>
          <CloudRain className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
        </div>
        <div className="my-2">
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono">
            {weather.daily?.[0]?.pop ?? 15}%
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {weather.daily?.[0]?.pop && weather.daily[0].pop > 50 ? 'Showers expected' : 'Minimal rainfall expected'}
          </p>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-blue-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${weather.daily?.[0]?.pop ?? 15}%` }}
          />
        </div>
      </div>
    </div>
  );
};
