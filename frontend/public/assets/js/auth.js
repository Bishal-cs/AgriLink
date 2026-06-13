/* ============================================
   AgriLink — Auth Module
   auth.js — Login, Register, Token management
   ============================================ */

import { api, showToast } from './api.js';

/**
 * Login user
 */
export async function loginUser(email, password) {
  const data = await api.post('/auth/login', { email, password });
  localStorage.setItem('agrilink_token', data.token);
  localStorage.setItem('agrilink_user', JSON.stringify(data.user));
  return data.user;
}

/**
 * Register user
 */
export async function registerUser(userData) {
  const data = await api.post('/auth/register', userData);
  localStorage.setItem('agrilink_token', data.token);
  localStorage.setItem('agrilink_user', JSON.stringify(data.user));
  return data.user;
}

/**
 * Logout
 */
export function logoutUser() {
  localStorage.removeItem('agrilink_token');
  localStorage.removeItem('agrilink_user');
  window.location.hash = '#/login';
  showToast('Logged out successfully', 'success');
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem('agrilink_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Check if user is logged in
 */
export function isLoggedIn() {
  return !!localStorage.getItem('agrilink_token');
}

/**
 * Get token
 */
export function getToken() {
  return localStorage.getItem('agrilink_token');
}

/**
 * Get dashboard route based on user role
 */
export function getDashboardRoute(role) {
  const routes = {
    farmer: '#/farmer/dashboard',
    distributor: '#/distributor/dashboard',
    storage_owner: '#/storage/dashboard',
    admin: '#/admin/dashboard',
  };
  return routes[role] || '#/';
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email) {
  return api.post('/auth/reset-password', { email });
}

// Make auth functions globally available
window.logoutUser = logoutUser;
