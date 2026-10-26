// src/pages/MyTrips.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, MapPin, Calendar, DollarSign } from 'lucide-react';
import { api } from '../lib/api.js';
import { formatCurrency } from '../lib/formatCurrency.js';
import Button from '../components/Button.jsx';
import Card from '../components/Card.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';

/**
 * MyTrips Component
 * Lists all trips belonging to the user as an interactive grid of cards.
 * Enables navigation to trip details and provides the ability to delete trips.
 */
export default function MyTrips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch all trips from the API
  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/trips');
      // Normalize trips data whether it's an array directly or inside an object
      const safeTrips = Array.isArray(data) ? data : data?.trips || [];
      setTrips(safeTrips);
    } catch (err) {
      setError(err.message || 'Failed to load trips. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Handle trip deletion with confirmation
  const handleDeleteTrip = async (e, tripId, tripName) => {
    // Prevent the Card's Link from triggering navigation
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(`Are you sure you want to delete "${tripName}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(tripId);
    try {
      await api.delete(`/api/trips/${tripId}`);
      // Remove the deleted trip from state
      setTrips((prev) => prev.filter((trip) => (trip.id || trip._id) !== tripId));
    } catch (err) {
      alert(err.message || 'Failed to delete trip. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-500 font-medium">Fetching your trips...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-6">
        <ErrorBanner message={error} onRetry={fetchTrips} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Trips</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse, manage, and explore all your planned journeys.
          </p>
        </div>
        <Link to="/trips/create">
          <Button variant="primary">
            <span className="flex items-center gap-2">
              <Plus size={18} />
              Create Trip
            </span>
          </Button>
        </Link>
      </div>

      {/* Empty State when no trips exist */}
      {trips.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow-sm text-center max-w-2xl mx-auto mt-10">
          <EmptyState
            title="No Trips Yet"
            description="You don't have any trips saved. Start planning your next dream getaway!"
          />
          <div className="mt-6 flex justify-center">
            <Link to="/trips/create">
              <Button variant="primary">
                <span className="flex items-center gap-2">
                  <Plus size={18} />
                  Plan Your First Trip
                </span>
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Trips Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => {
            const tripId = trip.id || trip._id;
            const startDate = trip.startDate || trip.start_date;
            const endDate = trip.endDate || trip.end_date;
            const budget = Number(trip.budgetTotal || trip.budget || 0);

            return (
              <div key={tripId} className="relative group">
                <Card
                  to={`/trips/${tripId}`}
                  imageSrc={trip.imageSrc || trip.imageUrl || null}
                  title={trip.name}
                  subtitle={trip.destination}
                >
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm text-gray-600">
                    {/* Destination info if subtitle wasn't present or for extra clarity */}
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-primary flex-shrink-0" />
                      <span className="truncate font-medium">{trip.destination || 'Unspecified destination'}</span>
                    </div>

                    {/* Dates */}
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                      <span>
                        {startDate ? (
                          <>
                            {startDate} {endDate ? `→ ${endDate}` : ''}
                          </>
                        ) : (
                          'Dates TBD'
                        )}
                      </span>
                    </div>

                    {/* Budget & Action Row */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1 font-semibold text-emerald-600">
                        <DollarSign size={16} />
                        <span>{budget > 0 ? formatCurrency(budget) : 'No budget set'}</span>
                      </div>

                      {/* Delete button with confirmation */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTrip(e, tripId, trip.name)}
                        disabled={deletingId === tripId}
                        title="Delete Trip"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        aria-label={`Delete trip ${trip.name}`}
                      >
                        <Trash2 size={18} className={deletingId === tripId ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
