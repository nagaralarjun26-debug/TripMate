// src/components/ErrorBanner.jsx
import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
      <AlertCircle className="mr-2 flex-shrink-0" size={20} />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="ml-4 underline">
          Retry
        </button>
      )}
    </div>
  );
}
