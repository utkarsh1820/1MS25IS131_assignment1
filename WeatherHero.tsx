import React from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Snowflake,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from 'lucide-react';
import { WeatherData, WeatherType, TempUnit } from '../types/weather';
import { convertTemp } from '../utils/weatherMath';

interface WeatherHeroProps {
  weather: WeatherData;
  unit: TempUnit;
  cinemaMode: boolean;
  onExitCinema: () => void;
}

const WEATHER_ICONS: Record<WeatherType, React.ReactNode> = {
  sunny: <Sun className="w-6 h-6 text-amber-300" />,
  cloudy: <Cloud className="w-6 h-6 text-sky-200" />,
  rainy: <CloudRain className="w-6 h-6 text-blue-300" />,
  storm: <CloudLightning className="w-6 h-6 text-yellow-300" />,
  windy: <Wind className="w-6 h-6 text-teal-200" />,
  snow: <Snowflake className="w-6 h-6 text-cyan-200" />,
};

export const WeatherHero: React.FC<WeatherHeroProps> = ({ weather, unit, cinemaMode, onExitCinema }) => {
  const currentTemp = convertTemp(weather.temp, unit);
  const feelsLike = convertTemp(weather.feelsLike, unit);
  const tempHigh = convertTemp(weather.tempMax, unit);
  const tempLow = convertTemp(weather.tempMin, unit);

  return (
    <div className="relative w-full pt-6 pb-4 sm:pt-10 sm:pb-8 flex flex-col items-center justify-center text-center select-none">
      {/* 3D Atmosphere Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/60 backdrop-blur-md border border-white/15 text-slate-200 text-xs sm:text-sm font-medium mb-3 shadow-lg shadow-black/30">
        <span className="p-1 rounded-full bg-cyan-500/20 text-cyan-300">
          {WEATHER_ICONS[weather.weatherType] || <Sparkles className="w-4 h-4" />}
        </span>
        <span className="font-semibold text-white tracking-wide">
          {weather.condition}
        </span>
        <span className="w-1 h-1 rounded-full bg-cyan-400" />
        <span className="text-slate-300 text-xs uppercase tracking-wider">
          {weather.weatherType}
        </span>
      </div>

      {/* Massive Futuristic Temperature Display */}
      <div className="flex items-start justify-center">
        <h1
          className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tighter text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)] font-mono leading-none"
          aria-label={`Current temperature ${currentTemp} degrees ${unit}`}
        >
          {currentTemp}
        </h1>
        <div className="flex flex-col items-start ml-2 mt-2 sm:mt-4">
          <span className="text-2xl sm:text-4xl font-extralight text-cyan-300 drop-shadow">
            °{unit}
          </span>
        </div>
      </div>

      {/* Atmospheric Narrative Description */}
      <p className="mt-2 text-sm sm:text-base font-normal text-slate-200/90 max-w-md px-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
        {weather.description}
      </p>

      {/* Feels Like & High/Low Range Pill */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-slate-200">
        <div className="px-3 py-1 rounded-lg bg-slate-900/50 backdrop-blur-md border border-white/10 shadow-sm">
          <span>Feels like </span>
          <span className="font-semibold text-white">{feelsLike}°{unit}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/50 backdrop-blur-md border border-white/10 shadow-sm">
          <div className="flex items-center text-rose-400">
            <ArrowUp className="w-3.5 h-3.5" />
            <span className="font-semibold">{tempHigh}°</span>
          </div>
          <span className="text-slate-500">/</span>
          <div className="flex items-center text-sky-400">
            <ArrowDown className="w-3.5 h-3.5" />
            <span className="font-semibold">{tempLow}°</span>
          </div>
        </div>
      </div>

      {/* Zen Mode Dismiss Pill */}
      {cinemaMode && (
        <button
          onClick={onExitCinema}
          aria-label="Exit Zen view"
          className="mt-6 px-4 py-2 rounded-full bg-cyan-500/80 hover:bg-cyan-500 text-white text-xs font-semibold backdrop-blur-md shadow-lg shadow-cyan-500/30 transition cursor-pointer flex items-center gap-1.5 animate-bounce-subtle"
        >
          <span>Exit Zen View</span>
        </button>
      )}
    </div>
  );
};
