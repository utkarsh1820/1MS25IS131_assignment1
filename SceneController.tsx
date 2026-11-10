import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Snowflake,
  Navigation,
  Sliders,
  Sparkles,
  Gauge,
} from 'lucide-react';
import { WeatherType } from '../types/weather';

interface SceneControllerProps {
  activePreset: WeatherType | 'live';
  currentWeatherType: WeatherType;
  windIntensity: number;
  onWindIntensityChange: (intensity: number) => void;
  onSelectPreset: (type: WeatherType) => void;
  onReturnToLive: () => void;
}

const PRESETS: { id: WeatherType; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'sunny', label: 'Sunny', icon: <Sun className="w-4 h-4" />, color: 'from-amber-400 to-orange-500' },
  { id: 'cloudy', label: 'Cloudy', icon: <Cloud className="w-4 h-4" />, color: 'from-sky-300 to-slate-400' },
  { id: 'rainy', label: 'Rainy', icon: <CloudRain className="w-4 h-4" />, color: 'from-blue-400 to-indigo-500' },
  { id: 'storm', label: 'Storm', icon: <CloudLightning className="w-4 h-4" />, color: 'from-yellow-400 to-amber-600' },
  { id: 'windy', label: 'Windy', icon: <Wind className="w-4 h-4" />, color: 'from-teal-300 to-emerald-500' },
  { id: 'snow', label: 'Snow', icon: <Snowflake className="w-4 h-4" />, color: 'from-cyan-200 to-blue-400' },
];

export const SceneController: React.FC<SceneControllerProps> = ({
  activePreset,
  currentWeatherType,
  windIntensity,
  onWindIntensityChange,
  onSelectPreset,
  onReturnToLive,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Dynamic context interaction hint
  const interactionHints: Record<WeatherType, string> = {
    rainy: 'Click anywhere on the surface to trigger localized water ripples & splashes',
    windy: 'Move cursor across the scene or click to whip foliage and gust autumn leaves',
    storm: 'Click anywhere to summon an interactive lightning strike directly to that point',
    sunny: 'Move cursor or click to radiate gentle atmospheric dust motes & sunlight waves',
    cloudy: 'Move pointer across the horizon to tilt camera parallax through cloud layers',
    snow: 'Move pointer or click to swirl cold crystalline snowflakes & ground sparkles',
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 max-w-[96vw] sm:max-w-2xl w-full flex flex-col items-center pointer-events-auto transition-transform duration-300">
      {/* Collapse / Expand Toggle Button with subtle hint */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={isExpanded ? 'Collapse 3D scene controls' : 'Expand 3D scene controls'}
        className="px-3.5 py-1 rounded-t-xl bg-slate-900/95 hover:bg-slate-800 backdrop-blur-md border border-b-0 border-white/15 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 shadow-md cursor-pointer transition-colors"
      >
        <Sliders className="w-3.5 h-3.5 text-cyan-400" />
        <span>3D Weather Environments & Interaction</span>
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {/* Control Dock Panel */}
      {isExpanded && (
        <div className="w-full p-2.5 sm:p-3 rounded-2xl bg-slate-950/90 backdrop-blur-md border border-white/15 shadow-2xl shadow-black/40 flex flex-col gap-2">
          {/* Top Row: Presets & Live GPS */}
          <div className="flex items-center justify-between gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {/* Live GPS Button */}
            <button
              onClick={onReturnToLive}
              aria-label="Live GPS Real Weather"
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                activePreset === 'live'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400/50'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Live GPS</span>
            </button>

            <div className="w-[1px] h-6 bg-white/10 shrink-0 mx-0.5" />

            {/* 6 3D Scene Preset Buttons */}
            <div className="flex items-center gap-1.5">
              {PRESETS.map((p) => {
                const isSelected = activePreset === p.id || (activePreset === 'live' && currentWeatherType === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPreset(p.id)}
                    aria-label={`Preview 3D ${p.label} weather scene`}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white border border-white/30 shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className={isSelected ? 'text-cyan-300' : 'text-slate-400'}>
                      {p.icon}
                    </span>
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-bar: Wind Intensity (when windy) and Interaction Hint */}
          <div className="pt-1.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-cyan-300/90 truncate">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">
                {interactionHints[currentWeatherType] || 'Click anywhere in the 3D scene to interact'}
              </span>
            </div>

            {/* Wind Intensity Selector (visible for Windy scene) */}
            {currentWeatherType === 'windy' && (
              <div className="flex items-center gap-2 ml-auto shrink-0 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <Gauge className="w-3.5 h-3.5 text-teal-300" />
                <span className="text-slate-300 text-xs font-medium">Foliage Sway:</span>
                <div className="flex items-center gap-1">
                  {[
                    { label: 'Breeze', val: 0.8 },
                    { label: 'Moderate', val: 1.4 },
                    { label: 'Gale', val: 2.2 },
                  ].map((level) => (
                    <button
                      key={level.label}
                      onClick={() => onWindIntensityChange(level.val)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                        Math.abs(windIntensity - level.val) < 0.3
                          ? 'bg-teal-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
