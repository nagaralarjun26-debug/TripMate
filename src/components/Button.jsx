// src/components/Button.jsx
import React from 'react';

export default function Button({ children, onClick, variant = 'primary', disabled = false, type = 'button' }) {
  const base = 'font-medium py-2 px-4 rounded transition-colors';
  const styles = {
    primary: `bg-primary text-white hover:bg-primary/80 disabled:bg-primary/50 ${base}`,
    secondary: `bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100 ${base}`,
  }[variant];

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={styles}>
      {children}
    </button>
  );
}
