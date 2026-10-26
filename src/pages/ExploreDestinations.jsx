// src/pages/ExploreDestinations.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, MapPin, Globe, Compass, Tag, Sparkles } from 'lucide-react';
import { api } from '../lib/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Button from '../components/Button.jsx';

/**
 * ExploreDestinations Component
 * Showcases world destinations with high-quality imagery, descriptions,
 * highlight tags, and interactive instant search by city name or country.
 */
export default function ExploreDestinations() {
  const [destinations, setDestinations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all destinations from the API
  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/destinations');
      const safeDestinations = Array.isArray(data) ? data : data?.destinations || [];
      setDestinations(safeDestinations);
    } catch (err) {
      setError(err.message || 'Failed to fetch destinations. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  // Client-side filtering by name or country
  const filteredDestinations = useMemo(() => {
    if (!searchQuery.trim()) return destinations;
    const q = searchQuery.toLowerCase().trim();
    return destinations.filter((dest) => {
      const nameMatch = dest.name && dest.name.toLowerCase().includes(q);
      const countryMatch = dest.country && dest.country.toLowerCase().includes(q);
      const descriptionMatch = dest.description && dest.description.toLowerCase().includes(q);
      const highlightsMatch =
        Array.isArray(dest.highlights) &&
        dest.highlights.some((h) => String(h).toLowerCase().includes(q));

      return nameMatch || countryMatch || descriptionMatch || highlightsMatch;
    });
  }, [destinations, searchQuery]);

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-500 font-medium">Discovering world destinations...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-6">
        <ErrorBanner message={error} onRetry={fetchDestinations} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-8">
      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-8 sm:p-12 text-white shadow-lg overflow-hidden">
        {/* Background decorative glows */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-black/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Compass size={14} /> Explore the World
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Find Your Next Unforgettable Journey
          </h1>
          <p className="mt-2 text-white/80 text-sm sm:text-base leading-relaxed">
            Browse iconic cities, natural wonders, and culture-rich hotspots. Plan your next adventure with TripMate.
          </p>

          {/* Search Bar inside Hero */}
          <div className="mt-6 relative max-w-lg">
            <Search
              size={20}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, country, or highlight (e.g. Paris, Japan, Beaches)..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-white/80 transition-shadow"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-700 bg-gray-100 px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Featured Destinations</h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Showing {filteredDestinations.length} of {destinations.length} destinations
          </p>
        </div>
      </div>

      {/* Destinations Grid */}
      {filteredDestinations.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm text-center max-w-xl mx-auto">
          <EmptyState
            title="No Destinations Found"
            description={`No destinations match "${searchQuery}". Try searching for another country, city, or interest.`}
          />
          {searchQuery && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={() => setSearchQuery('')}>
                Clear Search Filter
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDestinations.map((dest) => {
            const imageSrc =
              dest.image ||
              dest.imageUrl ||
              dest.imageSrc ||
              'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80';

            // Highlights normalized to an array
            const highlightsList = Array.isArray(dest.highlights)
              ? dest.highlights
              : typeof dest.highlights === 'string'
              ? dest.highlights.split(',').map((h) => h.trim())
              : [];

            return (
              <div
                key={dest.id || dest.name}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col group"
              >
                {/* Destination Image */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <img
                    src={imageSrc}
                    alt={dest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Country Badge */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-gray-800 flex items-center gap-1 shadow-sm">
                    <Globe size={13} className="text-primary" />
                    <span>{dest.country}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
                      <MapPin size={14} />
                      <span>{dest.country}</span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                      {dest.name}
                    </h3>

                    {dest.description && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-3 leading-relaxed">
                        {dest.description}
                      </p>
                    )}
                  </div>

                  {/* Highlights Tags */}
                  {highlightsList.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                        <Sparkles size={12} className="text-amber-500" />
                        Highlights
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {highlightsList.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <Tag size={10} className="text-blue-500" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
