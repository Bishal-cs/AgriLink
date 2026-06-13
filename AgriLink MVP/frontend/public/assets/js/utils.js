/* ============================================
   AgriLink — Utilities
   utils.js — Date, number, DOM helpers
   ============================================ */

/**
 * Format date to locale string
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format to relative time (e.g., "2 hours ago")
 */
export function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now - date) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count > 0) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
}

/**
 * Format currency (INR)
 */
export function formatCurrency(amount) {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
  if (num == null) return '—';
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Format quantity with unit
 */
export function formatQuantity(qty, unit) {
  return `${formatNumber(qty)} ${unit || 'kg'}`;
}

/**
 * Get urgency badge class
 */
export function getUrgencyBadge(urgency) {
  return `badge badge-urgency-${urgency}`;
}

/**
 * Get urgency label
 */
export function getUrgencyLabel(urgency) {
  const labels = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
  return labels[urgency] || urgency;
}

/**
 * Get status badge class
 */
export function getStatusBadge(status) {
  const map = {
    active: 'badge-success',
    sold: 'badge-info',
    expired: 'badge-neutral',
    cancelled: 'badge-neutral',
    pending: 'badge-warning',
    accepted: 'badge-success',
    rejected: 'badge-danger',
    confirmed: 'badge-success',
    pickup_scheduled: 'badge-info',
    in_transit: 'badge-warning',
    delivered: 'badge-success',
    completed: 'badge-success',
  };
  return `badge ${map[status] || 'badge-neutral'}`;
}

/**
 * Format status label
 */
export function formatStatus(status) {
  if (!status) return '—';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Get initials from name
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Crop emoji by type
 */
export function getCropEmoji(cropType) {
  const map = {
    tomato: '🍅',
    onion: '🧅',
    wheat: '🌾',
    rice: '🍚',
    cotton: '🏔️',
    chilli: '🌶️',
    potato: '🥔',
    sugarcane: '🎋',
    mango: '🥭',
    grapes: '🍇',
    carrot: '🥕',
    mustard: '🌻',
    corn: '🌽',
    apple: '🍎',
    banana: '🍌',
  };
  const key = cropType?.toLowerCase().split(' ')[0] || '';
  return map[key] || '🌱';
}

/**
 * Calculate capacity percentage
 */
export function getCapacityPercent(used, total) {
  if (!total) return 0;
  return Math.round((used / total) * 100);
}

/**
 * Get capacity bar color class
 */
export function getCapacityColor(percent) {
  if (percent >= 90) return 'danger';
  if (percent >= 70) return 'warning';
  return '';
}

/**
 * Debounce function
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate a unique ID
 */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Make key utilities globally available
window.formatDate = formatDate;
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
window.timeAgo = timeAgo;
