// Utility helper functions

import { ISSUE_STATUSES } from './constants';

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function getStatusBadgeStyle(statusKey) {
  return ISSUE_STATUSES[statusKey]?.color || 'bg-slate-100 text-slate-800 border-slate-200';
}

export function getStatusLabel(statusKey) {
  return ISSUE_STATUSES[statusKey]?.label || statusKey;
}

export function truncateText(text, maxLength = 80) {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}
