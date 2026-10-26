// src/pages/TripDetails.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Edit,
  Trash2,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  ArrowLeft,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../lib/api.js';
import Button from '../components/Button.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatCurrency } from '../lib/formatCurrency.js';

/**
 * TripDetails Component
 * Displays comprehensive details for a specific trip, including budget progress bar,
 * quick navigation links to Itinerary, Expenses, and Settlements, as well as Edit/Delete actions.
 */
export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch trip details and expenses
  const fetchTripDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch trip metadata
      const tripData = await api.get(`/api/trips/${id}`);
      const normalizedTrip = tripData?.trip || tripData;
      setTrip(normalizedTrip);

      // 2. Fetch trip expenses
      try {
        const expensesData = await api.get(`/api/trips/${id}/expenses`);
        const safeExpenses = Array.isArray(expensesData)
          ? expensesData
          : expensesData?.expenses || [];
        setExpenses(safeExpenses);
      } catch {
        // Fallback to empty expenses if route returns 404 or fails
        setExpenses([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load trip details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTripDetails();
  }, [fetchTripDetails]);

  // Handle trip deletion
  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${trip?.name || 'this trip'}"? All associated itinerary items and expenses will be permanently removed.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.delete(`/api/trips/${id}`);
      navigate('/trips');
    } catch (err) {
      alert(err.message || 'Failed to delete trip. Please try again.');
      setDeleting(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-500 font-medium">Loading trip details...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-6">
        <ErrorBanner message={error} onRetry={fetchTripDetails} />
        <div className="mt-4">
          <Link to="/trips" className="text-primary hover:underline flex items-center gap-2">
            <ArrowLeft size={16} /> Return to My Trips
          </Link>
        </div>
      </div>
    );
  }

  // Render empty state if trip not found
  if (!trip) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white p-8 rounded-xl shadow-sm text-center">
        <EmptyState
          title="Trip Not Found"
          description="We couldn't find the requested trip. It may have been removed."
        />
        <div className="mt-6 flex justify-center">
          <Link to="/trips">
            <Button variant="primary">Return to Trips</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Financial calculations
  const budget = Number(trip.budgetTotal || trip.budget || 0);
  const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remainingBudget = budget - totalSpent;
  const spentPercent = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;
  const visualPercent = Math.min(100, Math.max(0, spentPercent));

  // Determine progress bar color based on percentage
  let progressBarColor = 'bg-emerald-500';
  let badgeTextColor = 'text-emerald-700 bg-emerald-50';
  if (spentPercent >= 100) {
    progressBarColor = 'bg-red-500';
    badgeTextColor = 'text-red-700 bg-red-50';
  } else if (spentPercent >= 70) {
    progressBarColor = 'bg-amber-500';
    badgeTextColor = 'text-amber-700 bg-amber-50';
  }

  const startDate = trip.startDate || trip.start_date;
  const endDate = trip.endDate || trip.end_date;

  return (
    <div className="max-w-5xl mx-auto pb-14 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/trips"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Back to My Trips
        </Link>

        {/* Action Buttons: Edit & Delete */}
        <div className="flex items-center gap-3">
          <Link to={`/trips/create?edit=${id}`}>
            <Button variant="secondary">
              <span className="flex items-center gap-1.5">
                <Edit size={16} />
                Edit Trip
              </span>
            </Button>
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
          >
            <Trash2 size={16} />
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Hero / Trip Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {trip.imageSrc || trip.imageUrl ? (
          <img
            src={trip.imageSrc || trip.imageUrl}
            alt={trip.name}
            className="w-full h-56 object-cover"
          />
        ) : null}

        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{trip.name}</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-600 text-sm">
                <span className="flex items-center gap-1.5 font-medium text-primary">
                  <MapPin size={16} />
                  {trip.destination || 'Unspecified destination'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={16} />
                  {startDate ? (
                    <>
                      {startDate} {endDate ? `→ ${endDate}` : ''}
                    </>
                  ) : (
                    'Dates not set'
                  )}
                </span>
              </div>
            </div>

            <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${badgeTextColor}`}>
              {spentPercent >= 100 ? 'Budget Exceeded' : spentPercent >= 70 ? 'Near Budget Limit' : 'Within Budget'}
            </div>
          </div>

          {/* Trip Description */}
          {trip.description && (
            <p className="mt-4 text-gray-600 text-sm sm:text-base leading-relaxed border-t border-gray-100 pt-4">
              {trip.description}
            </p>
          )}

          {/* Budget & Spending Section */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <DollarSign size={16} className="text-gray-400" />
                Budget Utilization
              </span>
              <span className="text-sm font-bold text-gray-900">{spentPercent}% spent</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${progressBarColor}`}
                style={{ width: `${visualPercent}%` }}
              />
            </div>

            {/* Financial Stat Breakdown */}
            <div className="grid grid-cols-3 gap-4 mt-4 text-center">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase">Allocated Budget</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5"> {formatCurrency(budget)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase">Total Spent</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{formatCurrency(totalSpent)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs font-medium text-gray-500 uppercase">Remaining</p>
                <p
                  className={`text-lg font-bold mt-0.5 ${
                    remainingBudget >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  ${remainingBudget.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Feature Cards (Itinerary, Expenses, Settlements) */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Trip Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Itinerary Link Card */}
          <Link
            to={`/trips/${id}/itinerary`}
            className="group block p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Clock size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
              Itinerary Planner
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Organize day-by-day schedules, activities, and timings for this trip.
            </p>
          </Link>

          {/* Expenses Link Card */}
          <Link
            to={`/trips/${id}/expenses`}
            className="group block p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <CreditCard size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
              Expenses & Budget
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Log expenditures, monitor category breakdowns, and stay on budget.
            </p>
          </Link>

          {/* Settlements Link Card */}
          <Link
            to={`/trips/${id}/settlements`}
            className="group block p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
              Group Settlements
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Split group costs, see who owes whom, and settle debts with friends.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
