// src/pages/Expenses.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  PieChart as PieChartIcon,
  Plus,
  Trash2,
  DollarSign,
  ArrowLeft,
  Calendar,
  Tag,
  User,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../lib/api.js';
import { formatCurrency } from '../lib/formatCurrency.js';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';

// Predefined category color palette for the pie chart
const CATEGORY_COLORS = {
  Food: '#EF4444',
  Transport: '#3B82F6',
  Accommodation: '#8B5CF6',
  Activities: '#10B981',
  Shopping: '#F59E0B',
  Other: '#6B7280',
};

const CATEGORIES = [
  'Food',
  'Transport',
  'Accommodation',
  'Activities',
  'Shopping',
  'Other',
];

/**
 * Expenses Component
 * Tracks all spending for a trip, presents a categorical spending PieChart,
 * compares spent vs budget, and allows logging and deleting expenses.
 */
export default function Expenses() {
  const { id, tripId } = useParams();
  const effectiveTripId = tripId || id;
  const { user } = useAuth();

  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add expense form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);
  const [formError, setFormError] = useState(null);

  // Fetch trip details and expenses
  const fetchData = useCallback(async () => {
    if (!effectiveTripId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch trip details for budget information
      const tripData = await api.get(`/api/trips/${effectiveTripId}`);
      setTrip(tripData?.trip || tripData);

      // 2. Fetch all expenses for this trip
      const expensesData = await api.get(`/api/trips/${effectiveTripId}/expenses`);
      const safeExpenses = Array.isArray(expensesData)
        ? expensesData
        : expensesData?.expenses || [];
      setExpenses(safeExpenses);
    } catch (err) {
      setError(err.message || 'Failed to load expense data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [effectiveTripId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle adding an expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setFormError(null);

    const amountNum = parseFloat(newExpense.amount);
    if (!newExpense.description.trim()) {
      setFormError('Please enter a description for this expense.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }

    setSubmittingExpense(true);
    try {
      const payload = {
        description: newExpense.description.trim(),
        amount: amountNum,
        category: newExpense.category,
        date: newExpense.date || new Date().toISOString().split('T')[0],
        payerName: user?.name || user?.email || 'Me',
      };

      const created = await api.post(`/api/trips/${effectiveTripId}/expenses`, payload);
      const savedRecord = created?.expense || created;

      // Update local state with new expense
      setExpenses((prev) => [savedRecord, ...prev]);

      // Reset form
      setNewExpense({
        description: '',
        amount: '',
        category: 'Food',
        date: new Date().toISOString().split('T')[0],
      });
      setShowAddForm(false);
    } catch (err) {
      setFormError(err.message || 'Failed to add expense.');
    } finally {
      setSubmittingExpense(false);
    }
  };

  // Handle deleting an expense
  const handleDeleteExpense = async (expenseId) => {
    const confirmed = window.confirm('Are you sure you want to delete this expense?');
    if (!confirmed) return;

    try {
      // Try specific expense endpoint or trip-nested endpoint
      try {
        await api.delete(`/api/expenses/${expenseId}`);
      } catch {
        await api.delete(`/api/trips/${effectiveTripId}/expenses/${expenseId}`);
      }
      setExpenses((prev) => prev.filter((item) => (item.id || item._id) !== expenseId));
    } catch (err) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  // Calculations
  const totalBudget = Number(trip?.budgetTotal || trip?.budget || 0);
  const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const remaining = totalBudget - totalSpent;

  // Prepare PieChart data grouped by category
  const categoryMap = expenses.reduce((acc, exp) => {
    const cat = exp.category || 'Other';
    acc[cat] = (acc[cat] || 0) + Number(exp.amount || 0);
    return acc;
  }, {});

  const pieChartData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2)),
  }));

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-500 font-medium">Loading expenses...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-6">
        <ErrorBanner message={error} onRetry={fetchData} />
        <Link
          to={`/trips/${effectiveTripId}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft size={16} /> Return to Trip Details
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            to={`/trips/${effectiveTripId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary mb-2 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Trip Details
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Expenses & Budget</h1>
          <p className="text-sm text-gray-500 mt-1">
            Log and review all spending for {trip?.name ? `"${trip.name}"` : 'your trip'}.
          </p>
        </div>

        <Button
          variant={showAddForm ? 'secondary' : 'primary'}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <span className="flex items-center gap-2">
            <Plus size={18} />
            {showAddForm ? 'Cancel' : 'Add Expense'}
          </span>
        </Button>
      </div>

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Budget */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Budget</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">
            ${totalBudget.toLocaleString()}
          </h3>
          <p className="text-xs text-gray-400 mt-1">Total planned allocation</p>
        </div>

        {/* Total Spent */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Spent</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">
            ${totalSpent.toLocaleString()}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}% of budget utilized` : 'No budget set'}
          </p>
        </div>

        {/* Remaining Budget */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Remaining</p>
          <h3
            className={`text-2xl font-bold mt-1 ${
              remaining >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            ${remaining.toLocaleString()}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {remaining >= 0 ? 'Within budget' : 'Over budget limit'}
          </p>
        </div>
      </div>

      {/* Add Expense Form Collapsible Card */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-primary/20 p-6 transition-all">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign size={20} className="text-primary" />
            Add New Expense
          </h2>

          {formError && (
            <div className="mb-4">
              <ErrorBanner message={formError} />
            </div>
          )}

          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Description"
                id="expense-description"
                type="text"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                placeholder="e.g. Dinner at Bistro, Train Tickets"
                required
              />

              <Input
                label="Amount ($)"
                id="expense-amount"
                type="number"
                step="0.01"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                placeholder="e.g. 45.50"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="expense-category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="expense-category"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border bg-white"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Date"
                id="expense-date"
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submittingExpense}>
                {submittingExpense ? 'Saving...' : 'Save Expense'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Spending Breakdown Chart (when expenses exist) */}
      {pieChartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-gray-900">Spending by Category</h2>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={CATEGORY_COLORS[entry.name] || '#9CA3AF'}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Expenses Table / List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Expenses Log</h2>
          <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
            {expenses.length} records
          </span>
        </div>

        {expenses.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              title="No Expenses Recorded"
              description="Keep track of your spending on food, hotels, transport, and attractions by adding your first expense."
            />
            <div className="mt-4 flex justify-center">
              <Button variant="primary" onClick={() => setShowAddForm(true)}>
                <span className="flex items-center gap-2">
                  <Plus size={18} /> Add First Expense
                </span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3.5 px-4 sm:px-6">Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Paid By</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {expenses.map((expense) => {
                  const expId = expense.id || expense._id;
                  const category = expense.category || 'Other';
                  const categoryBadgeColor =
                    CATEGORY_COLORS[category] || '#6B7280';
                  const payerName =
                    expense.payer?.name ||
                    expense.payerName ||
                    expense.payer_name ||
                    'Traveler';

                  return (
                    <tr key={expId} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-medium text-gray-900">
                        {expense.description}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: categoryBadgeColor }}
                        >
                          <Tag size={10} />
                          {category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-xs">
                          <Calendar size={13} className="text-gray-400" />
                          {expense.date || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-xs">
                          <User size={13} className="text-gray-400" />
                          {payerName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900 text-right whitespace-nowrap">
                        ${Number(expense.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(expId)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
