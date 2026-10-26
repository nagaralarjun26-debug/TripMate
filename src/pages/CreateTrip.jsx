// src/pages/CreateTrip.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { PlusCircle, Edit3, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api.js';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';

/**
 * CreateTrip Component
 * Allows users to create a new trip or edit an existing one when the `?edit=tripId`
 * query parameter is detected.
 */
export default function CreateTrip() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editTripId = searchParams.get('edit');
  const isEditing = Boolean(editTripId);

  // Form input states
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    startDate: '',
    endDate: '',
    budgetTotal: '',
    description: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  // Fetch existing trip data if in edit mode
  const fetchTripForEdit = useCallback(async () => {
    if (!editTripId) return;
    setInitialLoading(true);
    setGeneralError(null);
    try {
      const data = await api.get(`/api/trips/${editTripId}`);
      const trip = data?.trip || data;
      if (trip) {
        setFormData({
          name: trip.name || '',
          destination: trip.destination || '',
          startDate: trip.startDate || trip.start_date || '',
          endDate: trip.endDate || trip.end_date || '',
          budgetTotal: trip.budgetTotal || trip.budget || '',
          description: trip.description || '',
        });
      }
    } catch (err) {
      setGeneralError(err.message || 'Failed to fetch trip details for editing.');
    } finally {
      setInitialLoading(false);
    }
  }, [editTripId]);

  useEffect(() => {
    if (isEditing) {
      fetchTripForEdit();
    }
  }, [isEditing, fetchTripForEdit]);

  // Handle generic input changes
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for that field as user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // Validate form inputs
  const validate = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Trip name is required.';
    }

    if (!formData.destination.trim()) {
      errors.destination = 'Destination is required.';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required.';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required.';
    }

    // Validation: endDate >= startDate
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        errors.endDate = 'End date must be on or after start date.';
      }
    }

    // Validation: budgetTotal > 0
    const budgetNum = Number(formData.budgetTotal);
    if (!formData.budgetTotal || isNaN(budgetNum) || budgetNum <= 0) {
      errors.budgetTotal = 'Budget must be a number greater than 0.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission (POST for create, PUT for edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    const payload = {
      name: formData.name.trim(),
      destination: formData.destination.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      budgetTotal: Number(formData.budgetTotal),
      description: formData.description.trim(),
    };

    try {
      if (isEditing) {
        await api.put(`/api/trips/${editTripId}`, payload);
      } else {
        await api.post('/api/trips', payload);
      }
      // On success, navigate to /trips
      navigate('/trips');
    } catch (err) {
      setGeneralError(err.message || 'Failed to save trip. Please check your data and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render loading state while pre-filling form
  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
        <p className="mt-4 text-gray-500 font-medium">Loading trip details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Back button link */}
      <Link
        to={isEditing ? `/trips/${editTripId}` : '/trips'}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        {isEditing ? 'Back to Trip Details' : 'Back to My Trips'}
      </Link>

      {/* Main Form Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        {/* Title */}
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
          <div className="p-2.5 bg-blue-50 text-primary rounded-lg">
            {isEditing ? <Edit3 size={24} /> : <PlusCircle size={24} />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Trip' : 'Create a New Trip'}
            </h1>
            <p className="text-sm text-gray-500">
              {isEditing
                ? 'Update your travel details and budget.'
                : 'Fill in your trip details to get started with planning.'}
            </p>
          </div>
        </div>

        {/* Global error banner */}
        {generalError && (
          <ErrorBanner
            message={generalError}
            onRetry={isEditing ? fetchTripForEdit : undefined}
          />
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Trip Name */}
          <Input
            label="Trip Name"
            id="trip-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Summer Vacation in Europe"
            required
            error={fieldErrors.name}
          />

          {/* Destination */}
          <Input
            label="Destination"
            id="trip-destination"
            type="text"
            value={formData.destination}
            onChange={(e) => handleChange('destination', e.target.value)}
            placeholder="e.g. Paris, France"
            required
            error={fieldErrors.destination}
          />

          {/* Dates Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              id="trip-start-date"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              required
              error={fieldErrors.startDate}
            />

            <Input
              label="End Date"
              id="trip-end-date"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              required
              error={fieldErrors.endDate}
            />
          </div>

          {/* Budget Total */}
          <Input
            label="Total Budget ($)"
            id="trip-budget"
            type="number"
            value={formData.budgetTotal}
            onChange={(e) => handleChange('budgetTotal', e.target.value)}
            placeholder="e.g. 2500"
            required
            error={fieldErrors.budgetTotal}
          />

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="trip-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="trip-description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Add details, notes, or highlights about this adventure..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Link to="/trips">
              <Button variant="secondary" disabled={submitting}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  {isEditing ? 'Updating Trip...' : 'Creating Trip...'}
                </span>
              ) : isEditing ? (
                'Update Trip'
              ) : (
                'Create Trip'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
