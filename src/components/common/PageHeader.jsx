import React from 'react';

export function PageHeader({ title, description, badge, action }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
      <div>
        {badge && <div className="mb-2">{badge}</div>}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600 max-w-2xl">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
