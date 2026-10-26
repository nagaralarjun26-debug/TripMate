// src/pages/ItineraryPlanner.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Clock,
  MapPin,
  ChevronDown,
  ChevronUp,
  Calendar,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import { api } from '../lib/api.js';
import Button from '../components/Button.jsx';
import Input from '../components/Input.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';

/**
 * ItineraryPlanner Component
 * Manages daily travel plans and schedules. Users can create days, add activities
 * per day, expand/collapse timeline days, and delete entries.
 */
export default function ItineraryPlanner() {
  const { id, tripId } = useParams();
  const effectiveTripId = tripId || id;

  const [itineraries, setItineraries] = useState([]);
  const [activitiesMap, setActivitiesMap] = useState({});
  const [expandedDays, setExpandedDays] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Day form state
  const [showAddDayForm, setShowAddDayForm] = useState(false);
  const [newDay, setNewDay] = useState({
    dayNumber: '',
    date: '',
    title: '',
    description: '',
  });
  const [submittingDay, setSubmittingDay] = useState(false);

  // Active inline add activity state: maps dayId -> { name, time, location, notes }
  const [activeActivityForms, setActiveActivityForms] = useState({});
  const [submittingActivityForDay, setSubmittingActivityForDay] = useState(null);

  // Fetch itinerary days and their activities
  const fetchItineraryData = useCallback(async () => {
    if (!effectiveTripId) return;
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch all days for the trip
      const daysData = await api.get(`/api/trips/${effectiveTripId}/itineraries`);
      const days = Array.isArray(daysData) ? daysData : daysData?.itineraries || [];

      // Sort days by dayNumber
      const sortedDays = [...days].sort((a, b) => (Number(a.dayNumber) || 0) - (Number(b.dayNumber) || 0));
      setItineraries(sortedDays);

      // Default expand all days
      const expandedInit = {};
      sortedDays.forEach((d) => {
        const dId = d.id || d._id;
        expandedInit[dId] = true;
      });
      setExpandedDays(expandedInit);

      // 2. Fetch activities for each day in parallel
      const map = {};
      await Promise.all(
        sortedDays.map(async (day) => {
          const dId = day.id || day._id;
          try {
            const actData = await api.get(`/api/itineraries/${dId}/activities`);
            map[dId] = Array.isArray(actData) ? actData : actData?.activities || [];
          } catch {
            map[dId] = [];
          }
        })
      );
      setActivitiesMap(map);
    } catch (err) {
      setError(err.message || 'Failed to load itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [effectiveTripId]);

  useEffect(() => {
    fetchItineraryData();
  }, [fetchItineraryData]);

  // Toggle Day accordion
  const toggleDayExpansion = (dayId) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayId]: !prev[dayId],
    }));
  };

  // Add a new itinerary day
  const handleAddDay = async (e) => {
    e.preventDefault();
    if (!newDay.dayNumber || !newDay.title) {
      alert('Please provide a day number and title.');
      return;
    }

    setSubmittingDay(true);
    try {
      const payload = {
        dayNumber: Number(newDay.dayNumber),
        date: newDay.date || new Date().toISOString().split('T')[0],
        title: newDay.title.trim(),
        description: newDay.description.trim(),
      };
      const createdDay = await api.post(`/api/trips/${effectiveTripId}/itineraries`, payload);
      const dayRecord = createdDay?.itinerary || createdDay;
      const dayRecordId = dayRecord.id || dayRecord._id;

      // Update local state
      setItineraries((prev) => [...prev, dayRecord].sort((a, b) => Number(a.dayNumber) - Number(b.dayNumber)));
      setActivitiesMap((prev) => ({ ...prev, [dayRecordId]: [] }));
      setExpandedDays((prev) => ({ ...prev, [dayRecordId]: true }));

      // Reset form
      setNewDay({ dayNumber: '', date: '', title: '', description: '' });
      setShowAddDayForm(false);
    } catch (err) {
      alert(err.message || 'Failed to add day. Please try again.');
    } finally {
      setSubmittingDay(false);
    }
  };

  // Delete an itinerary day
  const handleDeleteDay = async (dayId, dayTitle) => {
    const confirmed = window.confirm(`Delete "${dayTitle}" and all its activities?`);
    if (!confirmed) return;

    try {
      await api.delete(`/api/itineraries/${dayId}`);
      setItineraries((prev) => prev.filter((d) => (d.id || d._id) !== dayId));
      setActivitiesMap((prev) => {
        const copy = { ...prev };
        delete copy[dayId];
        return copy;
      });
    } catch (err) {
      alert(err.message || 'Failed to delete day.');
    }
  };

  // Toggle inline activity form visibility
  const toggleActivityForm = (dayId) => {
    setActiveActivityForms((prev) => ({
      ...prev,
      [dayId]: prev[dayId] ? null : { name: '', time: '', location: '', notes: '' },
    }));
  };

  // Handle inline activity input change
  const handleActivityInputChange = (dayId, field, value) => {
    setActiveActivityForms((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        [field]: value,
      },
    }));
  };

  // Submit new activity for a specific day
  const handleAddActivity = async (dayId) => {
    const form = activeActivityForms[dayId];
    if (!form || !form.name.trim()) {
      alert('Activity name is required.');
      return;
    }

    setSubmittingActivityForDay(dayId);
    try {
      const payload = {
        name: form.name.trim(),
        time: form.time.trim() || null,
        location: form.location.trim() || null,
        notes: form.notes.trim() || null,
      };

      const result = await api.post(`/api/itineraries/${dayId}/activities`, payload);
      const activityRecord = result?.activity || result;

      // Add to activities list for this day
      setActivitiesMap((prev) => ({
        ...prev,
        [dayId]: [...(prev[dayId] || []), activityRecord],
      }));

      // Close and reset form for this day
      setActiveActivityForms((prev) => ({
        ...prev,
        [dayId]: null,
      }));
    } catch (err) {
      alert(err.message || 'Failed to add activity.');
    } finally {
      setSubmittingActivityForDay(null);
    }
  };

  // Delete an activity
  const handleDeleteActivity = async (dayId, activityId) => {
    const confirmed = window.confirm('Are you sure you want to remove this activity?');
    if (!confirmed) return;

    try {
      await api.delete(`/api/activities/${activityId}`);
      setActivitiesMap((prev) => ({
        ...prev,
        [dayId]: (prev[dayId] || []).filter((a) => a.id !== activityId),
      }));
    } catch (err) {
      alert(err.message || 'Failed to delete activity.');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-500 font-medium">Loading itinerary schedule...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-6">
        <ErrorBanner message={error} onRetry={fetchItineraryData} />
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
    <div className="max-w-4xl mx-auto pb-16 space-y-6">
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
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Itinerary Planner</h1>
          <p className="text-sm text-gray-500 mt-1">
            Organize your trip day-by-day and schedule memorable activities.
          </p>
        </div>

        <Button
          variant={showAddDayForm ? 'secondary' : 'primary'}
          onClick={() => setShowAddDayForm(!showAddDayForm)}
        >
          <span className="flex items-center gap-2">
            <Plus size={18} />
            {showAddDayForm ? 'Close Day Form' : 'Add Day'}
          </span>
        </Button>
      </div>

      {/* Add Day Collapsible Form */}
      {showAddDayForm && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 transition-all">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            Add a New Day to Itinerary
          </h2>

          <form onSubmit={handleAddDay} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Day Number"
                id="day-number"
                type="number"
                value={newDay.dayNumber}
                onChange={(e) => setNewDay({ ...newDay, dayNumber: e.target.value })}
                placeholder="e.g. 1, 2, 3"
                required
              />

              <Input
                label="Date (Optional)"
                id="day-date"
                type="date"
                value={newDay.date}
                onChange={(e) => setNewDay({ ...newDay, date: e.target.value })}
              />
            </div>

            <Input
              label="Day Title"
              id="day-title"
              type="text"
              value={newDay.title}
              onChange={(e) => setNewDay({ ...newDay, title: e.target.value })}
              placeholder="e.g. Arrival & City Walk, Island Tour"
              required
            />

            <div>
              <label htmlFor="day-desc" className="block text-sm font-medium text-gray-700 mb-1">
                Description / Notes
              </label>
              <textarea
                id="day-desc"
                rows={2}
                value={newDay.description}
                onChange={(e) => setNewDay({ ...newDay, description: e.target.value })}
                placeholder="High-level plan or focus for this day..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowAddDayForm(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submittingDay}>
                {submittingDay ? 'Saving...' : 'Save Day'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Itinerary Timeline / List */}
      {itineraries.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow-sm text-center">
          <EmptyState
            title="No Days Planned Yet"
            description="Start building your itinerary by adding Day 1 with activities, sights, and reservations."
          />
          <div className="mt-4 flex justify-center">
            <Button variant="primary" onClick={() => setShowAddDayForm(true)}>
              <span className="flex items-center gap-2">
                <Plus size={18} />
                Add First Day
              </span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative border-l-2 border-primary/30 ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-6">
          {itineraries.map((day) => {
            const dayId = day.id || day._id;
            const isExpanded = expandedDays[dayId];
            const activities = activitiesMap[dayId] || [];
            const isAddingActivity = Boolean(activeActivityForms[dayId]);
            const activityForm = activeActivityForms[dayId] || {};

            return (
              <div key={dayId} className="relative group">
                {/* Timeline node badge */}
                <div className="absolute -left-[29px] sm:-left-[37px] top-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-md">
                  {day.dayNumber}
                </div>

                {/* Day Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Day Header */}
                  <div className="p-4 sm:p-5 flex items-center justify-between bg-gray-50/70 border-b border-gray-100">
                    <div
                      className="flex-1 cursor-pointer select-none"
                      onClick={() => toggleDayExpansion(dayId)}
                    >
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-900 hover:text-primary transition-colors">
                          Day {day.dayNumber}: {day.title}
                        </h2>
                        {day.date && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-medium">
                            {day.date}
                          </span>
                        )}
                      </div>
                      {day.description && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1">
                          {day.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* Delete Day */}
                      <button
                        type="button"
                        onClick={() => handleDeleteDay(dayId, day.title)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                        title="Delete Day"
                      >
                        <Trash2 size={16} />
                      </button>

                      {/* Expand / Collapse toggle */}
                      <button
                        type="button"
                        onClick={() => toggleDayExpansion(dayId)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100 transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Day Content (Activities) */}
                  {isExpanded && (
                    <div className="p-4 sm:p-6 space-y-4">
                      {/* Full description if present */}
                      {day.description && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          {day.description}
                        </p>
                      )}

                      {/* Activities List */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            Activities ({activities.length})
                          </h3>
                          <button
                            type="button"
                            onClick={() => toggleActivityForm(dayId)}
                            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                          >
                            <Plus size={14} />
                            {isAddingActivity ? 'Cancel' : 'Add Activity'}
                          </button>
                        </div>

                        {activities.length === 0 && !isAddingActivity && (
                          <p className="text-sm text-gray-400 italic py-2">
                            No activities scheduled for this day yet.
                          </p>
                        )}

                        <div className="space-y-2">
                          {activities.map((activity) => (
                            <div
                              key={activity.id || activity._id}
                              className="flex items-start justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50/50 transition-all"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900 text-sm">
                                    {activity.name}
                                  </span>
                                  {activity.time && (
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-blue-50 px-2 py-0.5 rounded">
                                      <Clock size={12} className="text-primary" />
                                      {activity.time}
                                    </span>
                                  )}
                                </div>

                                {activity.location && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <MapPin size={12} className="text-red-400" />
                                    <span>{activity.location}</span>
                                  </div>
                                )}

                                {activity.notes && (
                                  <div className="flex items-start gap-1 text-xs text-gray-500 pt-0.5">
                                    <FileText size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                    <span>{activity.notes}</span>
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteActivity(dayId, activity.id || activity._id)}
                                className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors ml-2"
                                title="Delete Activity"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Inline Add Activity Form */}
                      {isAddingActivity && (
                        <div className="mt-4 p-4 rounded-lg bg-blue-50/50 border border-blue-100 space-y-3">
                          <h4 className="text-sm font-semibold text-gray-900">
                            Add Activity to Day {day.dayNumber}
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Input
                              label="Activity Name"
                              id={`act-name-${dayId}`}
                              type="text"
                              value={activityForm.name || ''}
                              onChange={(e) => handleActivityInputChange(dayId, 'name', e.target.value)}
                              placeholder="e.g. Visit Louvre Museum"
                              required
                            />
                            <Input
                              label="Time (Optional)"
                              id={`act-time-${dayId}`}
                              type="text"
                              value={activityForm.time || ''}
                              onChange={(e) => handleActivityInputChange(dayId, 'time', e.target.value)}
                              placeholder="e.g. 10:00 AM"
                            />
                          </div>

                          <Input
                            label="Location (Optional)"
                            id={`act-loc-${dayId}`}
                            type="text"
                            value={activityForm.location || ''}
                            onChange={(e) => handleActivityInputChange(dayId, 'location', e.target.value)}
                            placeholder="e.g. Rue de Rivoli, 75001 Paris"
                          />

                          <div>
                            <label
                              htmlFor={`act-notes-${dayId}`}
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Notes (Optional)
                            </label>
                            <input
                              id={`act-notes-${dayId}`}
                              type="text"
                              value={activityForm.notes || ''}
                              onChange={(e) => handleActivityInputChange(dayId, 'notes', e.target.value)}
                              placeholder="e.g. Pre-booked tickets, entrance at pyramid"
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <Button
                              variant="secondary"
                              onClick={() => toggleActivityForm(dayId)}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              disabled={submittingActivityForDay === dayId}
                              onClick={() => handleAddActivity(dayId)}
                            >
                              {submittingActivityForDay === dayId ? 'Adding...' : 'Save Activity'}
                            </Button>
                          </div>
                        </div>
                      )}
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
