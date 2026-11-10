import React, { useState } from 'react';
import { Search, X, MapPin, Loader2, Globe } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (city: string) => Promise<void>;
}

const POPULAR_CITIES = [
  { name: 'Tokyo', country: 'Japan', condition: 'Sunny / Mild' },
  { name: 'London', country: 'United Kingdom', condition: 'Cloudy / Cool' },
  { name: 'New York', country: 'United States', condition: 'Clear / Crisp' },
  { name: 'Reykjavik', country: 'Iceland', condition: 'Snow / Icy' },
  { name: 'Dubai', country: 'UAE', condition: 'Sunny / Warm' },
  { name: 'Sydney', country: 'Australia', condition: 'Sunny / Coastal' },
  { name: 'Paris', country: 'France', condition: 'Breezy / Mild' },
  { name: 'Singapore', country: 'Singapore', condition: 'Tropical Storm' },
  { name: 'San Francisco', country: 'United States', condition: 'Windy / Coastal' },
];

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSearch }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      await onSearch(trimmed);
      setQuery('');
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'City not found. Please try another name.');
    } finally {
      setLoading(false);
    }
  };

  const handleCityPick = async (cityName: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await onSearch(cityName);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'City not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl bg-slate-900/90 border border-white/15 p-6 shadow-2xl shadow-cyan-950/40 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-cyan-400" />
            <h2 id="search-modal-title" className="text-lg font-bold">
              Search Global Location
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close search dialog"
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSubmit} className="mt-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by city name (e.g. Kyoto, Vancouver, Rome)..."
              autoFocus
              className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search input"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {errorMessage && (
            <p className="mt-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-500/20 px-3 py-2 rounded-lg">
              {errorMessage}
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading || !query.trim()}
              aria-label="Search"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm transition cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Fetching Weather...' : 'Search Weather'}</span>
            </button>
          </div>
        </form>

        {/* Popular Global Destinations */}
        <div className="mt-6">
          <h3 className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2.5">
            Popular Worldwide Cities
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {POPULAR_CITIES.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => handleCityPick(c.name)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/30 text-left transition group cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="truncate">
                  <div className="text-xs font-semibold text-white truncate">{c.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{c.country}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
