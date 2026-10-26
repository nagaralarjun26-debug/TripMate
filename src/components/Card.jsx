// src/components/Card.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Card({ to, imageSrc, title, subtitle, children }) {
  return (
    <Link to={to} className="block rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow bg-white">
      {imageSrc && (
        <img src={imageSrc} alt={title} className="w-full h-40 object-cover" />
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        {children}
      </div>
    </Link>
  );
}
