// src/components/EmptyState.jsx
import React from 'react';
import { Coffee } from 'lucide-react';

export default function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Coffee className="text-primary/60 mb-4" size={64} />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      {description && <p className="text-gray-600 max-w-md">{description}</p>}
    </div>
  );
}
