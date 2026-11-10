import React from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Snowflake,
  Clock,
  Droplets,
} from 'lucide-react';
import { HourlyForecastItem, WeatherType, TempUnit } from '../types/weather';
import { convertTemp } from '../utils/weatherMath';

interface HourlyForecastProps {
  hourly: HourlyForecastItem[];
  unit: TempUnit;
}

const CONDITION_ICONS: Record<WeatherType, React.ReactNode> = {
  sunny: <Sun className="w-5 h-5 text-amber-300" />,
  cloudy: <Cloud className="w-5 h-5 text-sky-200" />,
  rainy: <CloudRain className="w-5 h-5 text-blue-300" />,
  storm: <CloudLightning className="w-5 h-5 text-yellow-300" />,
  windy: <Wind className="w-5 h-5 text-teal-200" />,
  snow: <Snowflake className="w-5 h-5 text-cyan-200" />,
};

export const HourlyForecast: React.FC<HourlyForecastProps> = ({ hourly, unit }) => {
  if (!hourly || hourly.length === 0) return null;

  return (
    <div className="w-full p-4 sm:p-5 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20">
      <div className="flex items-center gap-2 mb-3.5 text-slate-300">
        <Clock className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase">
          24-Hour Forecast
        </h3>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x">
        {hourly.slice(0, 24).map((item, index) => {
          const tempVal = convertTemp(item.temp, unit);
          const dateObj = new Date(item.time);
          const timeLabel =
            index === 0
              ? 'Now'
              : dateObj.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  hour12: true,
                });

          return (
            <div
              key={item.time || index}
              className={`flex-shrink-0 flex flex-col items-center justify-between p-3 rounded-xl transition duration-200 min-w-[76px] snap-center ${
                index === 0
                  ? 'bg-cyan-500/20 border border-cyan-400/30'
                  : 'bg-white/5 hover:bg-white/10 border border-white/5'
              }`}
            >
              <span className="text-xs font-medium text-slate-300 mb-2 whitespace-nowrap">
                {timeLabel}
              </span>

              <div className="my-1.5 p-1 rounded-full bg-white/5">
                {CONDITION_ICONS[item.weatherType] || <Sun className="w-5 h-5 text-amber-300" />}
              </div>

              <span className="text-base font-bold text-white font-mono my-1">
                {tempVal}°
              </span>

              {/* Rain Probability */}
              <div className="flex items-center gap-1 text-[11px] font-medium text-cyan-300 mt-1">
                <Droplets className="w-3 h-3 text-cyan-400" />
                <span>{item.pop}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
