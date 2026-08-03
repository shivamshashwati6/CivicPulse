import React from 'react';

export function Input({
  label,
  error,
  type = 'text',
  className = '',
  id,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors ${
          error ? 'border-rose-500 focus:ring-rose-500' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
}
