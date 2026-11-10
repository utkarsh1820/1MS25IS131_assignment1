import React from 'react';
import { Sunrise, Sunset, SunMedium } from 'lucide-react';
import { calculateSunPosition, formatTimeShort } from '../utils/weatherMath';

interface SunPathProps {
  sunrise: string;
  sunset: string;
}

export const SunPath: React.FC<SunPathProps> = ({ sunrise, sunset }) => {
  const { progress, isDay, daylightHours } = calculateSunPosition(sunrise, sunset);

  // SVG dimensions for the semi-circle trajectory arc
  const width = 300;
  const height = 110;
  const cx = width / 2;
  const cy = height;
  const r = 115;

  // Arc path: semi-circle from (cx - r, cy) to (cx + r, cy)
  // Angle: PI (left, sunrise) to 0 (right, sunset)
  const sunAngle = Math.PI - progress * Math.PI;
  const sunX = cx + r * Math.cos(sunAngle);
  const sunY = cy - r * Math.sin(sunAngle);

  // Partial path for the illuminated arc
  // SVG arc command: M (cx-r, cy) A r r 0 0 1 sunX sunY
  const sunriseLabel = formatTimeShort(sunrise);
  const sunsetLabel = formatTimeShort(sunset);

  return (
    <div className="w-full p-4 sm:p-5 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20 flex flex-col justify-between">
      <div className="flex items-center justify-between text-slate-300 mb-2">
        <div className="flex items-center gap-2">
          <SunMedium className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs sm:text-sm font-semibold tracking-wide uppercase">
            Solar Trajectory
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {daylightHours}h Daylight
        </span>
      </div>

      {/* SVG Arc Visualization */}
      <div className="relative w-full flex items-center justify-center my-1">
        <svg
          viewBox={`0 0 ${width} ${height + 20}`}
          className="w-full max-w-[280px] overflow-visible"
        >
          <defs>
            <linearGradient id="sunArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
            </linearGradient>
            <radialGradient id="sunGlowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="40%" stopColor="#fde047" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Horizon Line */}
          <line
            x1="10"
            y1={cy}
            x2={width - 10}
            y2={cy}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Background Arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="3"
            strokeDasharray="3 3"
          />

          {/* Traveled Daytime Arc */}
          {progress > 0 && (
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${sunX} ${sunY}`}
              fill="none"
              stroke="url(#sunArcGrad)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}

          {/* Sun Orb at current position */}
          <circle
            cx={sunX}
            cy={sunY}
            r="14"
            fill="url(#sunGlowGrad)"
            className={isDay ? 'animate-pulse' : ''}
          />
          <circle
            cx={sunX}
            cy={sunY}
            r="5"
            fill="#ffffff"
          />
        </svg>
      </div>

      {/* Sunrise & Sunset Timings */}
      <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Sunrise className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Sunrise</div>
            <div className="font-mono font-medium text-white">{sunriseLabel}</div>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400">
          {isDay ? (
            <span className="text-amber-300 font-medium">Daytime in progress</span>
          ) : (
            <span className="text-slate-400">Nighttime</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-slate-300 text-right">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Sunset</div>
            <div className="font-mono font-medium text-white">{sunsetLabel}</div>
          </div>
          <Sunset className="w-4 h-4 text-orange-400" />
        </div>
      </div>
    </div>
  );
};
