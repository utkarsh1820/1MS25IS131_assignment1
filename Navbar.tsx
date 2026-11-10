import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  RotateCw,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Snowflake,
  Eye,
  EyeOff,
  Navigation,
} from 'lucide-react';
import { WeatherData, WeatherType, TempUnit } from '../types/weather';

interface NavbarProps {
  weather: WeatherData | null;
  unit: TempUnit;
  onToggleUnit: () => void;
  onOpenSearch: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  activePreset: WeatherType | 'live';
  onSelectPreset: (preset: WeatherType) => void;
  onReturnToLive: () => void;
  cinemaMode: boolean;
  onToggleCinemaMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  weather,
  unit,
  onToggleUnit,
  onOpenSearch,
  onRefresh,
  isLoading,
  activePreset,
  onSelectPreset,
  onReturnToLive,
  cinemaMode,
  onToggleCinemaMode,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const presets: { id: WeatherType; label: string; icon: React.ReactNode }[] = [
    { id: 'sunny', label: 'Sunny', icon: <Sun className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'cloudy', label: 'Cloudy', icon: <Cloud className="w-3.5 h-3.5 text-sky-300" /> },
    { id: 'rainy', label: 'Rainy', icon: <CloudRain className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'storm', label: 'Storm', icon: <CloudLightning className="w-3.5 h-3.5 text-yellow-400" /> },
    { id: 'windy', label: 'Windy', icon: <Wind className="w-3.5 h-3.5 text-teal-300" /> },
    { id: 'snow', label: 'Snow', icon: <Snowflake className="w-3.5 h-3.5 text-indigo-300" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/60 border-b border-white/10 px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Location */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
              <Compass className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white text-base sm:text-lg">
                  Atmosphere <span className="text-cyan-400 font-extrabold">3D</span>
                </span>
                <span className="hidden md:inline-block text-[10px] tracking-wider uppercase font-semibold px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                  WebGL
                </span>
              </div>
              <div className="text-xs text-slate-400 hidden sm:block">
                {timeStr || 'Live Weather'}
              </div>
            </div>
          </div>

          {/* Location Badge & Search Button */}
          <button
            onClick={onOpenSearch}
            aria-label="Search city or location"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs sm:text-sm font-medium transition cursor-pointer shadow-sm group"
          >
            <Navigation className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="max-w-[130px] sm:max-w-[200px] truncate text-white">
              {weather?.city ? `${weather.city}${weather.country ? `, ${weather.country}` : ''}` : 'Locating...'}
            </span>
            <Search className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>
        </div>

        {/* 3D Scene Preset Switcher Pill (Desktop/Tablet) */}
        <div className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
          <button
            onClick={onReturnToLive}
            aria-label="Live GPS Weather"
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activePreset === 'live'
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Navigation className="w-3 h-3" />
            <span>Live</span>
          </button>
          <div className="w-[1px] h-3.5 bg-white/10 mx-0.5" />
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPreset(p.id)}
              aria-label={`Preview ${p.label} weather`}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activePreset === p.id
                  ? 'bg-white/15 text-white ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {p.icon}
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Right Controls: Unit Toggle, Refresh, Cinema Mode */}
        <div className="flex items-center gap-2">
          {/* Unit Toggle */}
          <button
            onClick={onToggleUnit}
            aria-label={`Switch temperature unit to ${unit === 'C' ? 'Fahrenheit' : 'Celsius'}`}
            className="flex items-center p-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition cursor-pointer"
          >
            <span
              className={`px-2 py-1 rounded-md transition ${
                unit === 'C' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              °C
            </span>
            <span
              className={`px-2 py-1 rounded-md transition ${
                unit === 'F' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              °F
            </span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh weather data"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
            title="Refresh weather"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Cinema / Zen Mode Toggle */}
          <button
            onClick={onToggleCinemaMode}
            aria-label={cinemaMode ? 'Show Dashboard Cards' : 'Zen View 3D Mode'}
            title={cinemaMode ? 'Show Dashboard Cards' : 'Zen View (Unobstructed 3D)'}
            className={`p-2 rounded-lg border transition cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
              cinemaMode
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {cinemaMode ? <Eye className="w-4 h-4 text-cyan-300" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden sm:inline">{cinemaMode ? 'Exit Zen' : 'Zen View'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
