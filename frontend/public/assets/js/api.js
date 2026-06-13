/* ============================================
   AgriLink — API Communication Layer
   api.js — Fetch wrapper with auth headers
   ============================================ */

const API_BASE = window.location.origin + '/api';

/**
 * Central API fetch wrapper
 * Automatically attaches JWT token and handles errors
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('agrilink_token');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  // If body is FormData, remove Content-Type to let browser set boundary
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);

    if (res.status === 401) {
      // Token expired or invalid — redirect to login
      localStorage.removeItem('agrilink_token');
      localStorage.removeItem('agrilink_user');
      if (!window.location.hash.includes('login')) {
        window.location.hash = '#/login';
        showToast('Session expired. Please login again.', 'error');
      }
      throw new Error('Unauthorized');
    }

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      console.error('API Error:', error.message);
    }
    throw error;
  }
}

/**
 * Convenience methods
 */
export const api = {
  get: (endpoint) => apiFetch(endpoint),
  post: (endpoint, body) => apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) => apiFetch(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: (endpoint) => apiFetch(endpoint, { method: 'DELETE' }),
  upload: (endpoint, formData) => apiFetch(endpoint, { method: 'POST', body: formData }),
};

/**
 * Toast notification system
 */
let toastContainer = null;

export function showToast(message, type = 'success', duration = 4000) {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${icons[type] || ''}</span>
    <span class="toast-message">${message}</span>
    <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Make showToast globally available
window.showToast = showToast;
