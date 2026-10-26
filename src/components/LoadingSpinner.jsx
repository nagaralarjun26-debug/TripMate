// src/components/LoadingSpinner.jsx
import React from 'react';
import { Loader } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader className="animate-spin text-primary" size={48} />
    </div>
  );
}
