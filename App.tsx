import React, { useState } from 'react';
import { useGeolocation } from './hooks/useGeolocation';
import { useWeather } from './hooks/useWeather';
import { WeatherCanvas } from './scenes/WeatherCanvas';
import { Navbar } from './components/Navbar';
import { WeatherHero } from './components/WeatherHero';
import { WeatherCards } from './components/WeatherCards';
import { HourlyForecast } from './components/HourlyForecast';
import { WeeklyForecast } from './components/WeeklyForecast';
import { SunPath } from './components/SunPath';
import { SceneController } from './components/SceneController';
import { SearchModal } from './components/SearchModal';
import { Loader2, MapPinOff, Sparkles, Search } from 'lucide-react';

export default function App() {
  const {
    lat,
    lon,
    loading: geoLoading,
    permissionDenied,
    refreshLocation,
  } = useGeolocation();

  const {
    weather,
    unit,
    loading: weatherLoading,
    error: weatherError,
    activePreset,
    toggleUnit,
    searchCity,
    selectPreset,
    returnToLive,
    refreshWeather,
  } = useWeather(lat, lon);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [windIntensity, setWindIntensity] = useState(1.2);

  const isLoading = (geoLoading || weatherLoading) && !weather;

  return (
    <div className="relative min-h-screen text-white bg-slate-950 flex flex-col font-sans selection:bg-cyan-500 selection:text-white overflow-x-hidden">
      {/* 3D Immersive Animated Weather Canvas (Background) */}
      {weather && (
        <WeatherCanvas
          weatherType={weather.weatherType}
          isDay={weather.isDay}
          windIntensity={windIntensity}
        />
      )}

      {/* Top Navigation */}
      <Navbar
        weather={weather}
        unit={unit}
        onToggleUnit={toggleUnit}
        onOpenSearch={() => setIsSearchOpen(true)}
        onRefresh={refreshWeather}
        isLoading={weatherLoading}
        activePreset={activePreset}
        onSelectPreset={selectPreset}
        onReturnToLive={returnToLive}
        cinemaMode={cinemaMode}
        onToggleCinemaMode={() => setCinemaMode(!cinemaMode)}
      />

      {/* Geolocation Permission Banner (Graceful notification if denied) */}
      {permissionDenied && activePreset === 'live' && (
        <div className="w-full bg-slate-900/80 backdrop-blur-md border-b border-amber-500/20 px-4 py-2.5 text-xs text-amber-200/90 flex flex-wrap items-center justify-center gap-2 z-30">
          <MapPinOff className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Location access was not enabled. Showing default location. You can search any city worldwide:
          </span>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold transition cursor-pointer flex items-center gap-1"
          >
            <Search className="w-3 h-3" />
            <span>Search City</span>
          </button>
          <span className="text-slate-500">or</span>
          <button
            onClick={refreshLocation}
            className="underline hover:text-white transition cursor-pointer"
          >
            Retry Geolocation
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 sm:px-6 pb-24 z-20 w-full max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Initializing 3D Atmosphere
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Detecting coordinates & synthesizing real-time environment...
              </p>
            </div>
          </div>
        ) : weather ? (
          <>
            {/* Hero Section */}
            <WeatherHero
              weather={weather}
              unit={unit}
              cinemaMode={cinemaMode}
              onExitCinema={() => setCinemaMode(false)}
            />

            {/* Dashboard Cards & Forecasts (Collapsible in Zen Mode) */}
            {!cinemaMode && (
              <div className="w-full flex flex-col gap-4 sm:gap-6 mt-2 transition-all duration-500 animate-fade-in">
                {/* 6 Metric Information Cards */}
                <WeatherCards weather={weather} unit={unit} />

                {/* 24-Hour Forecast */}
                <HourlyForecast hourly={weather.hourly} unit={unit} />

                {/* Grid: 7-Day Forecast & Solar Trajectory Sun Path */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="lg:col-span-2">
                    <WeeklyForecast daily={weather.daily} unit={unit} />
                  </div>
                  <div className="lg:col-span-1">
                    <SunPath sunrise={weather.sunrise} sunset={weather.sunset} />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
            <p className="text-sm text-slate-300">
              {weatherError || 'Weather data unavailable'}
            </p>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-medium text-sm transition shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Search a City</span>
            </button>
          </div>
        )}
      </main>

      {/* Sleek Collapsible Bottom Dock for 3D Weather Scene Previews */}
      {weather && (
        <SceneController
          activePreset={activePreset}
          currentWeatherType={weather.weatherType}
          windIntensity={windIntensity}
          onWindIntensityChange={setWindIntensity}
          onSelectPreset={selectPreset}
          onReturnToLive={returnToLive}
        />
      )}

      {/* Global Location Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={searchCity}
      />
    </div>
  );
}
