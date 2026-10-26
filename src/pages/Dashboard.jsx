// src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  MapPin,
  DollarSign,
  TrendingUp,
  Calendar,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { api } from '../lib/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { formatCurrency } from '../lib/formatCurrency.js';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Button from '../components/Button.jsx';

/**
 * Dashboard Component
 * Displays trip overview statistics, a budget vs. spent comparison chart,
 * and upcoming trips scheduled for the user.
 */
export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [tripStats, setTripStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all trips and their associated expenses
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch all trips
      const tripsData = await api.get('/api/trips');
      const safeTrips = Array.isArray(tripsData) ? tripsData : tripsData?.trips || [];
      setTrips(safeTrips);

      // 2. Fetch expenses for each trip in parallel to calculate total spent
      const statsPromises = safeTrips.map(async (trip) => {
        const tripId = trip.id || trip._id;
        const tripBudget = Number(trip.budgetTotal || trip.budget || 0);
        try {
          const expensesData = await api.get(`/api/trips/${tripId}/expenses`);
          const expenses = Array.isArray(expensesData) ? expensesData : expensesData?.expenses || [];
          const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

          return {
            id: tripId,
            name: trip.name,
            destination: trip.destination,
            startDate: trip.startDate || trip.start_date,
            endDate: trip.endDate || trip.end_date,
            budget: tripBudget,
            spent: totalSpent,
          };
        } catch {
          // If expenses endpoint fails for this trip, fallback to 0 spent
          return {
            id: tripId,
            name: trip.name,
            destination: trip.destination,
            startDate: trip.startDate || trip.start_date,
            endDate: trip.endDate || trip.end_date,
            budget: tripBudget,
            spent: 0,
          };
        }
      });

      const resolvedStats = await Promise.all(statsPromises);
      setTripStats(resolvedStats);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Overall calculations
  const totalTrips = trips.length;
  const totalBudget = tripStats.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = tripStats.reduce((sum, item) => sum + item.spent, 0);

  // Filter upcoming trips (startDate >= today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTrips = tripStats
    .filter((trip) => {
      if (!trip.startDate) return false;
      const tripDate = new Date(trip.startDate);
      return tripDate >= today;
    })
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

  // Chart data formatting
  const chartData = tripStats.map((item) => ({
    name: item.name.length > 15 ? `${item.name.substring(0, 13)}...` : item.name,
    Budget: item.budget,
    Spent: item.spent,
  }));

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-500 font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-6">
        <ErrorBanner message={error} onRetry={fetchDashboardData} />
      </div>
    );
  }

  // Render empty state if no trips exist
  if (totalTrips === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-12 bg-white p-8 rounded-xl shadow-sm text-center">
        <EmptyState
          title="No Trips Found"
          description="You haven't created any trips yet. Start planning your next journey now!"
        />
        <div className="mt-6 flex justify-center">
          <Link to="/trips/create">
            <Button variant="primary">
              <span className="flex items-center gap-2">
                <Plus size={18} />
                Create Your First Trip
              </span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your travels, analyze trip expenses, and stay on top of your budget.
          </p>
        </div>
        <Link to="/trips/create">
          <Button variant="primary">
            <span className="flex items-center gap-2">
              <Plus size={18} />
              New Trip
            </span>
          </Button>
        </Link>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Trips */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Trips</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalTrips}</h3>
            <p className="text-xs text-gray-400 mt-1">All planned & past travels</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <MapPin size={24} />
          </div>
        </div>

        {/* Total Budget */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Budget</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">
              {formatCurrency(totalBudget)}
            </h3>
            <p className="text-xs text-gray-400 mt-1">Planned budget across trips</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Spent</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">
              {formatCurrency(totalSpent)}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}% of total budget` : 'No budget set'}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Budget vs Spent Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Budget vs. Spent per Trip</h2>
          <p className="text-sm text-gray-500">Comparison of allocated budget against total actual expenditures.</p>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [formatCurrency(value), '']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.5rem',
                  borderColor: '#e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="Budget" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Budget ($)" />
              <Bar dataKey="Spent" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Spent ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming Trips List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Upcoming Trips</h2>
            <p className="text-sm text-gray-500">Trips scheduled starting today or later.</p>
          </div>
          <Link to="/trips" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
            View all trips <ArrowRight size={16} />
          </Link>
        </div>

        {upcomingTrips.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Calendar className="mx-auto text-gray-400 mb-2" size={36} />
            <p className="text-gray-600 font-medium">No upcoming trips scheduled.</p>
            <p className="text-sm text-gray-400 mt-1">Ready for a new getaway?</p>
            <div className="mt-4">
              <Link to="/trips/create">
                <Button variant="secondary">Plan a Trip</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTrips.map((trip) => (
              <Link
                key={trip.id}
                to={`/trips/${trip.id}`}
                className="group block p-4 rounded-lg border border-gray-100 hover:border-primary/50 hover:shadow-md transition-all bg-gray-50/50"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-primary transition-colors">
                    {trip.name}
                  </h3>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 font-semibold rounded-full">
                    Upcoming
                  </span>
                </div>
                <div className="mt-2 space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{trip.destination || 'Destination not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                    <span>{trip.startDate} {trip.endDate ? `to ${trip.endDate}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 font-medium text-gray-700">
                    <DollarSign size={16} className="text-emerald-500 flex-shrink-0" />
                    <span>Budget: ${trip.budget.toLocaleString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
