import React from 'react';
import {
  Calendar,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Snowflake,
  Droplets,
} from 'lucide-react';
import { DailyForecastItem, WeatherType, TempUnit } from '../types/weather';
import { convertTemp } from '../utils/weatherMath';

interface WeeklyForecastProps {
  daily: DailyForecastItem[];
  unit: TempUnit;
}

const CONDITION_ICONS: Record<WeatherType, React.ReactNode> = {
  sunny: <Sun className="w-4 h-4 text-amber-300" />,
  cloudy: <Cloud className="w-4 h-4 text-sky-200" />,
  rainy: <CloudRain className="w-4 h-4 text-blue-300" />,
  storm: <CloudLightning className="w-4 h-4 text-yellow-300" />,
  windy: <Wind className="w-4 h-4 text-teal-200" />,
  snow: <Snowflake className="w-4 h-4 text-cyan-200" />,
};

export const WeeklyForecast: React.FC<WeeklyForecastProps> = ({ daily, unit }) => {
  if (!daily || daily.length === 0) return null;

  // Calculate week min and max to normalize temperature bar width
  const allMins = daily.map((d) => d.tempMin);
  const allMaxs = daily.map((d) => d.tempMax);
  const weekMin = Math.min(...allMins);
  const weekMax = Math.max(...allMaxs);
  const range = Math.max(1, weekMax - weekMin);

  return (
    <div className="w-full p-4 sm:p-5 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20">
      <div className="flex items-center gap-2 mb-3.5 text-slate-300">
        <Calendar className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase">
          7-Day Forecast
        </h3>
      </div>

      <div className="divide-y divide-white/5">
        {daily.slice(0, 7).map((item, index) => {
          const minVal = convertTemp(item.tempMin, unit);
          const maxVal = convertTemp(item.tempMax, unit);

          // Bar offset and width percentage
          const leftPercent = Math.max(0, ((item.tempMin - weekMin) / range) * 100);
          const barWidth = Math.max(12, ((item.tempMax - item.tempMin) / range) * 100);

          return (
            <div
              key={item.date || index}
              className="py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm hover:bg-white/[0.02] px-1 rounded-lg transition"
            >
              {/* Day Name */}
              <div className="w-16 sm:w-20 font-medium text-slate-200 truncate">
                {index === 0 ? 'Today' : item.day}
              </div>

              {/* Weather Condition Icon & Rain % */}
              <div className="flex items-center gap-2 w-28 sm:w-36">
                <div className="p-1 rounded-md bg-white/5 flex-shrink-0">
                  {CONDITION_ICONS[item.weatherType] || <Sun className="w-4 h-4 text-amber-300" />}
                </div>
                <div className="truncate text-slate-300 text-xs hidden sm:block">
                  {item.condition}
                </div>
                {item.pop > 10 && (
                  <div className="flex items-center gap-0.5 text-[11px] text-cyan-300 font-medium ml-auto">
                    <Droplets className="w-3 h-3 text-cyan-400" />
                    <span>{item.pop}%</span>
                  </div>
                )}
              </div>

              {/* Min Temperature */}
              <div className="w-8 text-right font-mono text-slate-400 text-xs">
                {minVal}°
              </div>

              {/* Visual Temperature Range Bar */}
              <div className="flex-1 max-w-[140px] sm:max-w-[200px] bg-white/10 h-2 rounded-full relative overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-cyan-400 via-amber-300 to-rose-400"
                  style={{
                    left: `${leftPercent}%`,
                    width: `${Math.min(100 - leftPercent, barWidth)}%`,
                  }}
                />
              </div>

              {/* Max Temperature */}
              <div className="w-8 text-left font-mono font-bold text-white text-xs">
                {maxVal}°
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
