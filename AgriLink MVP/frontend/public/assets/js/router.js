/* ============================================
   AgriLink — Client-Side Router
   router.js — Hash routing + AppState + Page rendering
   ============================================ */

import { getCurrentUser, isLoggedIn, getDashboardRoute, logoutUser } from './auth.js';
import { api, showToast } from './api.js';
import {
  formatDate, formatCurrency, formatNumber, formatQuantity,
  getUrgencyBadge, getUrgencyLabel, getStatusBadge, formatStatus,
  getInitials, getCropEmoji, getCapacityPercent, getCapacityColor,
  timeAgo, debounce
} from './utils.js';

// ==========================================
// APP STATE
// ==========================================
const AppState = {
  currentUser: getCurrentUser(),
  token: localStorage.getItem('agrilink_token'),
  currentPage: '',
  notificationCount: 0,
};

window.AppState = AppState;

// ==========================================
// ROUTE DEFINITIONS
// ==========================================
const routes = {
  '/': { page: 'landing', auth: false },
  '/login': { page: 'login', auth: false },
  '/register': { page: 'register', auth: false },
  '/marketplace': { page: 'marketplace', auth: false },
  '/marketplace/storage': { page: 'storage-marketplace', auth: false },
  '/farmer/dashboard': { page: 'farmer-dashboard', auth: true, role: 'farmer' },
  '/farmer/new-listing': { page: 'farmer-new-listing', auth: true, role: 'farmer' },
  '/distributor/dashboard': { page: 'distributor-dashboard', auth: true, role: 'distributor' },
  '/distributor/new-requirement': { page: 'distributor-new-requirement', auth: true, role: 'distributor' },
  '/storage/dashboard': { page: 'storage-dashboard', auth: true, role: 'storage_owner' },
  '/admin/dashboard': { page: 'admin-dashboard', auth: true, role: 'admin' },
};

// ==========================================
// NOTIFICATION POLLING
// ==========================================
let notificationInterval = null;

async function pollNotifications() {
  if (!isLoggedIn()) return;
  try {
    const data = await api.get('/notifications/unread');
    AppState.notificationCount = data.count;
    const badge = document.getElementById('notification-badge');
    if (badge) {
      badge.textContent = data.count;
      badge.style.display = data.count > 0 ? 'flex' : 'none';
    }
  } catch (e) {
    // Silently fail
  }
}

function startNotificationPolling() {
  if (notificationInterval) clearInterval(notificationInterval);
  pollNotifications();
  notificationInterval = setInterval(pollNotifications, 30000);
}

function stopNotificationPolling() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
}

// ==========================================
// NAVBAR RENDERING
// ==========================================
function renderNavbar() {
  const user = AppState.currentUser;
  const app = document.getElementById('app');

  if (!user) {
    // Public navbar
    return `
      <nav class="navbar" id="main-navbar">
        <div class="nav-container">
          <a href="#/" class="nav-brand">
            <div class="brand-icon">🌾</div>
            AgriLink
          </a>
          <div class="nav-links">
            <a href="#/" class="nav-link">Home</a>
            <a href="#/marketplace" class="nav-link">Marketplace</a>
            <a href="#/marketplace/storage" class="nav-link">Cold Storage</a>
          </div>
          <div class="nav-actions">
            <button class="theme-toggle" onclick="toggleTheme()" title="Toggle dark mode">${document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'}</button>
            <a href="#/login" class="btn btn-secondary btn-sm">Login</a>
            <a href="#/register" class="btn btn-primary btn-sm">Get Started</a>
          </div>
        </div>
      </nav>
    `;
  }

  const roleLabels = { farmer: 'Farmer', distributor: 'Distributor', storage_owner: 'Storage Owner', admin: 'Admin' };

  return `
    <nav class="navbar" id="main-navbar">
      <div class="nav-container">
        <div style="display:flex;align-items:center;gap:var(--space-4)">
          <button class="nav-hamburger" id="hamburger-btn" onclick="toggleSidebar()">☰</button>
          <a href="#/" class="nav-brand">
            <div class="brand-icon">🌾</div>
            AgriLink
          </a>
        </div>
        <div class="nav-actions">
          <button class="theme-toggle" onclick="toggleTheme()" title="Toggle dark mode">${document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'}</button>
          <button class="notification-btn" id="notification-btn" onclick="toggleNotifications()">
            🔔
            <span class="notification-badge" id="notification-badge" style="display:none">0</span>
          </button>
          <div class="dropdown" id="user-dropdown">
            <div class="user-menu" onclick="toggleUserDropdown()">
              <div class="avatar avatar-sm">${getInitials(user.name)}</div>
              <div style="display:flex;flex-direction:column;line-height:1.2">
                <span class="user-name">${user.name}</span>
                <span class="user-role">${roleLabels[user.role] || user.role}</span>
              </div>
            </div>
            <div class="dropdown-menu" id="user-dropdown-menu">
              <div class="dropdown-item" onclick="window.location.hash='#${getDashboardRoute(user.role).slice(1)}'">📊 Dashboard</div>
              <div class="dropdown-item" onclick="openProfileModal()">👤 Profile</div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item" onclick="logoutUser()" style="color:var(--danger-500)">🚪 Logout</div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `;
}

// ==========================================
// SIDEBAR RENDERING
// ==========================================
function renderSidebar() {
  const user = AppState.currentUser;
  if (!user) return '';

  const links = {
    farmer: [
      { icon: '📊', label: 'Dashboard', hash: '#/farmer/dashboard' },
      { icon: '🌱', label: 'My Listings', hash: '#/farmer/dashboard', section: 'listings' },
      { icon: '➕', label: 'New Listing', hash: '#/farmer/new-listing' },
      { icon: '💰', label: 'Offers', hash: '#/farmer/dashboard', section: 'offers' },
      { icon: '📦', label: 'Orders', hash: '#/farmer/dashboard', section: 'orders' },
      { icon: '📋', label: 'Distributor Requests', hash: '#/farmer/dashboard', section: 'requests' },
      { icon: '❄️', label: 'Storage Bookings', hash: '#/farmer/dashboard', section: 'bookings' },
      { icon: '🏪', label: 'Marketplace', hash: '#/marketplace' },
      { icon: '🧊', label: 'Cold Storage', hash: '#/marketplace/storage' },
    ],
    distributor: [
      { icon: '📊', label: 'Dashboard', hash: '#/distributor/dashboard' },
      { icon: '📋', label: 'Requirements', hash: '#/distributor/dashboard', section: 'requirements' },
      { icon: '➕', label: 'Post Requirement', hash: '#/distributor/new-requirement' },
      { icon: '📝', label: 'My Offers', hash: '#/distributor/dashboard', section: 'offers' },
      { icon: '📦', label: 'Orders', hash: '#/distributor/dashboard', section: 'orders' },
      { icon: '🏪', label: 'Marketplace', hash: '#/marketplace' },
      { icon: '🧊', label: 'Cold Storage', hash: '#/marketplace/storage' },
    ],
    storage_owner: [
      { icon: '📊', label: 'Dashboard', hash: '#/storage/dashboard' },
      { icon: '🏭', label: 'My Facilities', hash: '#/storage/dashboard', section: 'facilities' },
      { icon: '📋', label: 'Bookings', hash: '#/storage/dashboard', section: 'bookings' },
      { icon: '💰', label: 'Revenue', hash: '#/storage/dashboard', section: 'revenue' },
      { icon: '🏪', label: 'Marketplace', hash: '#/marketplace' },
      { icon: '🧊', label: 'Cold Storage', hash: '#/marketplace/storage' },
    ],
    admin: [
      { icon: '📊', label: 'Dashboard', hash: '#/admin/dashboard' },
      { icon: '👥', label: 'Users', hash: '#/admin/dashboard', section: 'users' },
      { icon: '📋', label: 'Listings', hash: '#/admin/dashboard', section: 'listings' },
      { icon: '🚩', label: 'Reports', hash: '#/admin/dashboard', section: 'reports' },
      { icon: '📈', label: 'Analytics', hash: '#/admin/dashboard', section: 'analytics' },
      { icon: '🏪', label: 'Marketplace', hash: '#/marketplace' },
      { icon: '🧊', label: 'Cold Storage', hash: '#/marketplace/storage' },
    ],
  };

  const userLinks = links[user.role] || [];
  const currentHash = window.location.hash;

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-section">
        <div class="sidebar-label">Navigation</div>
        <nav class="sidebar-nav">
          ${userLinks.map(link => `
            <a href="${link.hash}" class="sidebar-link ${currentHash === link.hash ? 'active' : ''}" data-section="${link.section || ''}">
              <span class="link-icon">${link.icon}</span>
              ${link.label}
            </a>
          `).join('')}
        </nav>
      </div>
    </aside>
  `;
}

// ==========================================
// PAGE RENDERERS
// ==========================================

// --- Landing Page ---
function renderLanding() {
  return `
    <div class="landing-page">
      ${renderNavbar()}
      <section class="hero">
        <div class="container">
          <div class="hero-content animate-fade-in-up">
            <div class="hero-badge">🚀 India's Agricultural Supply Chain Platform</div>
            <h1>Connecting <span style="color:var(--accent-300)">Farmers</span> to Fair Markets</h1>
            <p>AgriLink bridges the gap between farmers, distributors, and cold storage facilities — reducing crop wastage and improving farmer income through direct coordination.</p>
            <div class="hero-buttons">
              <a href="#/register" class="btn btn-accent btn-lg">Get Started Free →</a>
              <a href="#/marketplace" class="btn btn-lg" style="background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.25)">Browse Marketplace</a>
            </div>
            <div class="hero-stats">
              <div class="hero-stat"><div class="hero-stat-value">2,500+</div><div class="hero-stat-label">Farmers Connected</div></div>
              <div class="hero-stat"><div class="hero-stat-value">15K</div><div class="hero-stat-label">Tons Saved</div></div>
              <div class="hero-stat"><div class="hero-stat-value">120+</div><div class="hero-stat-label">Storage Partners</div></div>
            </div>
          </div>
        </div>
      </section>

      <section class="how-it-works">
        <div class="container">
          <div class="section-heading" style="text-align:center;margin-bottom:var(--space-12)">
            <h2 style="font-family:var(--font-display);font-size:var(--text-4xl);font-weight:800;margin-bottom:var(--space-4)">How AgriLink Works</h2>
            <p style="color:var(--text-secondary);font-size:var(--text-lg);max-width:600px;margin:0 auto">Three simple steps to connect your harvest with the right buyers</p>
          </div>
          <div class="steps-container">
            <div class="step-card animate-fade-in-up delay-1">
              <div class="step-number">1</div>
              <h3>List Your Produce</h3>
              <p>Farmers create listings with crop details, quantity, expected price, and harvest dates</p>
            </div>
            <div class="step-card animate-fade-in-up delay-2">
              <div class="step-number">2</div>
              <h3>Get Fair Offers</h3>
              <p>Distributors browse listings and send competitive offers. Accept the best deal.</p>
            </div>
            <div class="step-card animate-fade-in-up delay-3">
              <div class="step-number">3</div>
              <h3>Coordinate & Deliver</h3>
              <p>Schedule pickups, book cold storage if needed, and track your order until completion</p>
            </div>
          </div>
        </div>
      </section>

      <section class="features-section">
        <div class="container">
          <div class="section-heading">
            <h2>Built for Every Stakeholder</h2>
            <p>Whether you're a farmer, distributor, or storage owner — AgriLink has you covered</p>
          </div>
          <div class="features-grid">
            <div class="feature-card animate-fade-in-up delay-1">
              <div class="feature-icon" style="background:var(--primary-100);color:var(--primary-600)">🌾</div>
              <h3>For Farmers</h3>
              <p>Create crop listings, receive competitive offers from distributors, and book nearby cold storage — all from one platform.</p>
            </div>
            <div class="feature-card animate-fade-in-up delay-2">
              <div class="feature-icon" style="background:var(--accent-100);color:var(--accent-600)">🚚</div>
              <h3>For Distributors</h3>
              <p>Browse fresh produce listings, send offers directly to farmers, schedule pickups, and manage your procurement pipeline.</p>
            </div>
            <div class="feature-card animate-fade-in-up delay-3">
              <div class="feature-icon" style="background:#dbeafe;color:#2563eb">❄️</div>
              <h3>For Storage Owners</h3>
              <p>List your facilities, manage capacity, accept bookings, and track revenue — everything in one modern dashboard.</p>
            </div>
            <div class="feature-card animate-fade-in-up delay-4">
              <div class="feature-icon" style="background:var(--danger-100);color:var(--danger-600)">🎯</div>
              <h3>Smart Matching</h3>
              <p>Our matching engine suggests the best cold storage facilities based on distance, price, and available capacity.</p>
            </div>
            <div class="feature-card animate-fade-in-up delay-5">
              <div class="feature-icon" style="background:var(--primary-100);color:var(--primary-600)">📍</div>
              <h3>Location-Based</h3>
              <p>Geospatial search finds listings and facilities near you. Reduce logistics costs with proximity-based matching.</p>
            </div>
            <div class="feature-card animate-fade-in-up delay-5">
              <div class="feature-icon" style="background:var(--accent-100);color:var(--accent-600)">⭐</div>
              <h3>Ratings & Trust</h3>
              <p>Verified profiles and post-order ratings build trust across the platform. Report suspicious activity with one click.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="cta-section">
        <div class="container">
          <div class="cta-card">
            <h2>Ready to Transform Your Supply Chain?</h2>
            <p>Join thousands of farmers and distributors already using AgriLink to reduce wastage and increase income.</p>
            <a href="#/register" class="btn btn-accent btn-lg">Create Free Account →</a>
          </div>
        </div>
      </section>

      <footer class="footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <h3>🌾 AgriLink</h3>
              <p>India's digital agricultural supply-chain platform. Connecting farmers, distributors, and cold storage owners for a more efficient food ecosystem.</p>
            </div>
            <div class="footer-section">
              <h4>Platform</h4>
              <a href="#/marketplace">Crop Marketplace</a>
              <a href="#/marketplace/storage">Cold Storage</a>
              <a href="#/register">Get Started</a>
            </div>
            <div class="footer-section">
              <h4>Roles</h4>
              <a href="#/register">For Farmers</a>
              <a href="#/register">For Distributors</a>
              <a href="#/register">For Storage Owners</a>
            </div>
            <div class="footer-section">
              <h4>Contact</h4>
              <a href="#">support@agrilink.com</a>
              <a href="#">+91 98765 43210</a>
              <a href="#">Delhi, India</a>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© 2026 AgriLink. All rights reserved.</span>
            <span>Made with 💚 for Indian Agriculture</span>
          </div>
        </div>
      </footer>
    </div>
  `;
}

// --- Login Page ---
function renderLogin() {
  return `
    <div class="auth-page">
      <div class="auth-left">
        <div class="auth-left-content animate-fade-in-up">
          <h2>Welcome Back to AgriLink</h2>
          <p>Connect with farmers, distributors, and cold storage owners across India. Your agricultural supply chain starts here.</p>
          <div class="hero-stats" style="margin-top:var(--space-8)">
            <div class="hero-stat"><div class="hero-stat-value" style="font-size:var(--text-2xl)">2,500+</div><div class="hero-stat-label">Active Farmers</div></div>
            <div class="hero-stat"><div class="hero-stat-value" style="font-size:var(--text-2xl)">15K</div><div class="hero-stat-label">Tons Traded</div></div>
          </div>
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-form-container animate-fade-in-up">
          <h1>Sign In</h1>
          <p class="auth-subtitle">Enter your credentials to access your dashboard</p>
          <form id="login-form" onsubmit="handleLogin(event)">
            <div class="form-group">
              <label class="form-label" for="login-email">Email Address</label>
              <input class="form-input" type="email" id="login-email" placeholder="you@example.com" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <input class="form-input" type="password" id="login-password" placeholder="Enter your password" required />
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%" id="login-btn">
              Sign In →
            </button>
          </form>
          <div class="auth-footer">
            Don't have an account? <a href="#/register">Create one now</a>
            <br><a href="javascript:void(0)" onclick="openForgotPasswordModal()" style="font-size:var(--text-sm);color:var(--primary-600)">Forgot your password?</a>
          </div>
          <div style="margin-top:var(--space-6);padding:var(--space-4);background:var(--gray-50);border-radius:var(--radius-lg);font-size:var(--text-xs);color:var(--text-muted)">
            <strong>Demo Accounts:</strong><br>
            Farmer: farmer1@agrilink.com / password123<br>
            Distributor: distributor1@agrilink.com / password123<br>
            Storage: storage1@agrilink.com / password123<br>
            Admin: admin@agrilink.com / admin123
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- Register Page ---
function renderRegister() {
  return `
    <div class="auth-page">
      <div class="auth-left">
        <div class="auth-left-content animate-fade-in-up">
          <h2>Join AgriLink Today</h2>
          <p>Choose your role and start connecting with India's agricultural ecosystem. Registration is free and takes less than 2 minutes.</p>
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-form-container animate-fade-in-up">
          <h1>Create Account</h1>
          <p class="auth-subtitle">Select your role and fill in your details</p>
          <form id="register-form" onsubmit="handleRegister(event)">
            <div class="form-group">
              <label class="form-label">I am a...</label>
              <div class="role-selector">
                <div class="role-card selected" data-role="farmer" onclick="selectRole('farmer')">
                  <div class="role-icon">🌾</div>
                  <div class="role-name">Farmer</div>
                </div>
                <div class="role-card" data-role="distributor" onclick="selectRole('distributor')">
                  <div class="role-icon">🚚</div>
                  <div class="role-name">Distributor</div>
                </div>
                <div class="role-card" data-role="storage_owner" onclick="selectRole('storage_owner')">
                  <div class="role-icon">❄️</div>
                  <div class="role-name">Storage Owner</div>
                </div>
              </div>
              <input type="hidden" id="register-role" value="farmer" />
            </div>
            <div class="form-group">
              <label class="form-label" for="register-name">Full Name</label>
              <input class="form-input" type="text" id="register-name" placeholder="Your full name" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="register-email">Email Address</label>
              <input class="form-input" type="email" id="register-email" placeholder="you@example.com" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="register-phone">Phone Number</label>
              <input class="form-input" type="tel" id="register-phone" placeholder="+91 98765 43210" />
            </div>
            <div class="form-group">
              <label class="form-label" for="register-password">Password</label>
              <input class="form-input" type="password" id="register-password" placeholder="Create a strong password" required minlength="6" />
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%" id="register-btn">
              Create Account →
            </button>
          </form>
          <div class="auth-footer">
            Already have an account? <a href="#/login">Sign in</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

// --- Marketplace ---
async function renderMarketplace() {
  let listingsHTML = '<div class="loading"><div class="loading-spinner"></div></div>';

  setTimeout(async () => {
    try {
      const data = await api.get('/listings?status=active&limit=50');
      const container = document.getElementById('listings-container');
      if (!container) return;

      if (data.listings.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">🌱</div>
            <div class="empty-title">No listings available</div>
            <div class="empty-description">Check back soon or register as a farmer to create the first listing!</div>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="listings-grid">
          ${data.listings.map(listing => `
            <div class="listing-card" onclick="viewListing('${listing._id}')">
              <div class="listing-image" style="background:${getGradientForCrop(listing.cropType)}">
                ${listing.imageUrls?.length ? `<img src="${listing.imageUrls[0]}" alt="${listing.cropType}">` : `<span>${getCropEmoji(listing.cropType)}</span>`}
                <div style="position:absolute;top:var(--space-3);right:var(--space-3)">
                  <span class="${getUrgencyBadge(listing.urgency)}">${getUrgencyLabel(listing.urgency)}</span>
                </div>
              </div>
              <div class="listing-content">
                <div class="listing-crop">${getCropEmoji(listing.cropType)} ${listing.cropType}</div>
                <div class="listing-farmer">
                  ${listing.farmerId?.name || 'Unknown'}
                  ${listing.farmerId?.isVerified ? '<span class="verified-badge"></span>' : ''}
                </div>
                <div class="listing-details">
                  <div class="listing-detail">
                    <span class="listing-detail-label">Quantity</span>
                    <span class="listing-detail-value">${formatQuantity(listing.quantity, listing.unit)}</span>
                  </div>
                  <div class="listing-detail">
                    <span class="listing-detail-label">Price</span>
                    <span class="listing-detail-value">${formatCurrency(listing.expectedPrice)}/${listing.unit}</span>
                  </div>
                  <div class="listing-detail">
                    <span class="listing-detail-label">Harvest</span>
                    <span class="listing-detail-value">${formatDate(listing.harvestDate)}</span>
                  </div>
                  <div class="listing-detail">
                    <span class="listing-detail-label">Posted</span>
                    <span class="listing-detail-value">${timeAgo(listing.createdAt)}</span>
                  </div>
                </div>
                <div class="listing-footer">
                  <span class="${getStatusBadge(listing.status)}">${formatStatus(listing.status)}</span>
                  <span style="font-size:var(--text-sm);color:var(--primary-600);font-weight:600">View Details →</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (error) {
      const container = document.getElementById('listings-container');
      if (container) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Failed to load listings</div><div class="empty-description">${error.message}</div></div>`;
      }
    }
  }, 100);

  return `
    ${renderNavbar()}
    <div class="main-content no-sidebar" style="margin-top:var(--navbar-height)">
      <div class="page-header">
        <div>
          <h1 class="page-title">🌾 Crop Marketplace</h1>
          <p class="page-subtitle">Browse fresh produce from verified farmers across India</p>
        </div>
      </div>
      <div class="filter-bar">
        <div class="filter-group">
          <label>Crop Type</label>
          <input type="text" id="filter-crop" placeholder="e.g., Tomato" />
        </div>
        <div class="filter-group">
          <label>Min Price (₹)</label>
          <input type="number" id="filter-min-price" placeholder="Min" min="0" />
        </div>
        <div class="filter-group">
          <label>Max Price (₹)</label>
          <input type="number" id="filter-max-price" placeholder="Max" min="0" />
        </div>
        <div class="filter-group">
          <label>Urgency</label>
          <select id="filter-urgency">
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div class="filter-group" style="flex:0">
          <label>&nbsp;</label>
          <button class="btn btn-primary btn-sm" onclick="applyListingFilters()">Apply</button>
        </div>
      </div>
      <div id="listings-container">${listingsHTML}</div>
    </div>
  `;
}

// --- Storage Marketplace ---
async function renderStorageMarketplace() {
  setTimeout(async () => {
    try {
      const data = await api.get('/storage?available=true&limit=50');
      const container = document.getElementById('storage-container');
      if (!container) return;

      if (data.facilities.length === 0) {
        container.innerHTML = `<div class="empty-state"><div class="empty-icon">❄️</div><div class="empty-title">No facilities available</div></div>`;
        return;
      }

      container.innerHTML = `
        <div class="listings-grid">
          ${data.facilities.map(f => {
            const pct = getCapacityPercent(f.usedCapacity, f.totalCapacity);
            const avail = f.totalCapacity - f.usedCapacity;
            return `
              <div class="facility-card">
                <div class="facility-header">
                  <div>
                    <div class="facility-name">❄️ ${f.name}</div>
                    <div style="font-size:var(--text-sm);color:var(--text-muted);margin-top:var(--space-1)">${f.address || 'Location not specified'}</div>
                  </div>
                  <span class="badge ${f.isAvailable ? 'badge-success' : 'badge-neutral'}">${f.isAvailable ? 'Available' : 'Full'}</span>
                </div>
                <div class="capacity-bar">
                  <div class="capacity-fill ${getCapacityColor(pct)}" style="width:${pct}%;background:${pct >= 90 ? 'var(--danger-500)' : pct >= 70 ? 'var(--accent-500)' : 'var(--primary-500)'}"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-4)">
                  <span>${avail} tons available</span>
                  <span>${pct}% utilized</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-4)">
                  <div><div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase">Capacity</div><div style="font-weight:600">${f.totalCapacity} tons</div></div>
                  <div><div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase">Price</div><div style="font-weight:600">${formatCurrency(f.pricePerTon)}/ton/day</div></div>
                </div>
                ${f.features?.length ? `<div style="display:flex;flex-wrap:wrap;gap:var(--space-2);margin-bottom:var(--space-4)">${f.features.map(feat => `<span class="badge badge-info">${feat}</span>`).join('')}</div>` : ''}
                ${f.isAvailable && isLoggedIn() ? `<button class="btn btn-primary btn-sm" style="width:100%" onclick="openBookingModal('${f._id}', '${f.name.replace(/'/g, "\\'") }', ${f.pricePerTon}, ${avail})">📦 Book Now</button>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (error) {
      const container = document.getElementById('storage-container');
      if (container) container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Failed to load</div></div>`;
    }
  }, 100);

  return `
    ${renderNavbar()}
    <div class="main-content no-sidebar" style="margin-top:var(--navbar-height)">
      <div class="page-header">
        <div>
          <h1 class="page-title">❄️ Cold Storage Marketplace</h1>
          <p class="page-subtitle">Find and book nearby cold storage facilities</p>
        </div>
      </div>
      <div class="filter-bar">
        <div class="filter-group">
          <label>Max Price (₹/ton/day)</label>
          <input type="number" id="filter-storage-price" placeholder="Max price" min="0" />
        </div>
        <div class="filter-group">
          <label>Min Capacity (tons)</label>
          <input type="number" id="filter-storage-cap" placeholder="Min capacity" min="0" />
        </div>
        <div class="filter-group" style="flex:0">
          <label>&nbsp;</label>
          <button class="btn btn-primary btn-sm" onclick="applyStorageFilters()">Apply</button>
        </div>
      </div>
      <div id="storage-container"><div class="loading"><div class="loading-spinner"></div></div></div>
    </div>
  `;
}

// --- Farmer Dashboard ---
async function renderFarmerDashboard() {
  setTimeout(async () => {
    try {
      const [listingsData, ordersData, bookingsData, notifData, reqsData] = await Promise.all([
        api.get('/listings/my'),
        api.get('/orders'),
        api.get('/bookings'),
        api.get('/notifications/unread'),
        api.get('/requirements'),
      ]);

      const listings = listingsData.listings || [];
      const orders = ordersData.orders || [];
      const bookings = bookingsData.bookings || [];
      const requirements = reqsData.requirements || [];

      // Gather all pending offers across farmer's active listings
      let allPendingOffers = [];
      for (const listing of listings.filter(l => l.status === 'active')) {
        try {
          const od = await api.get(`/listings/${listing._id}/offers`);
          const pending = (od.offers || []).filter(o => o.status === 'pending').map(o => ({ ...o, listingCrop: listing.cropType, listingId: listing._id }));
          allPendingOffers = allPendingOffers.concat(pending);
        } catch (e) { /* ignore */ }
      }

      const activeListings = listings.filter(l => l.status === 'active').length;
      const activeOrders = orders.filter(o => o.status !== 'completed').length;

      // Stats
      document.getElementById('farmer-stats').innerHTML = `
        <div class="stat-card animate-fade-in-up delay-1">
          <div class="stat-icon green">🌱</div>
          <div class="stat-value">${activeListings}</div>
          <div class="stat-label">Active Listings</div>
        </div>
        <div class="stat-card animate-fade-in-up delay-2">
          <div class="stat-icon amber">💰</div>
          <div class="stat-value">${notifData.count}</div>
          <div class="stat-label">Pending Offers</div>
        </div>
        <div class="stat-card animate-fade-in-up delay-3">
          <div class="stat-icon blue">📦</div>
          <div class="stat-value">${activeOrders}</div>
          <div class="stat-label">Active Orders</div>
        </div>
        <div class="stat-card animate-fade-in-up delay-4">
          <div class="stat-icon red">❄️</div>
          <div class="stat-value">${bookings.length}</div>
          <div class="stat-label">Storage Bookings</div>
        </div>
      `;

      // Listings table
      document.getElementById('farmer-listings').innerHTML = listings.length ? `
        <div class="table-wrapper">
          <table class="table">
            <thead><tr><th>Crop</th><th>Quantity</th><th>Price</th><th>Urgency</th><th>Status</th><th>Posted</th><th>Actions</th></tr></thead>
            <tbody>
              ${listings.map(l => `
                <tr>
                  <td><strong>${getCropEmoji(l.cropType)} ${l.cropType}</strong></td>
                  <td>${formatQuantity(l.quantity, l.unit)}</td>
                  <td>${formatCurrency(l.expectedPrice)}/${l.unit}</td>
                  <td><span class="${getUrgencyBadge(l.urgency)}">${getUrgencyLabel(l.urgency)}</span></td>
                  <td><span class="${getStatusBadge(l.status)}">${formatStatus(l.status)}</span></td>
                  <td>${timeAgo(l.createdAt)}</td>
                  <td>
                    <div style="display:flex;gap:var(--space-2)">
                      ${l.status === 'active' ? `<button class="btn btn-sm btn-outline" onclick="openEditListingModal('${l._id}','${l.cropType.replace(/'/g, "\\'")}',${l.quantity},'${l.unit}',${l.expectedPrice},'${l.urgency}','${(l.description||'').replace(/'/g, "\\'")}')" title="Edit">✏️</button>` : ''}
                      <button class="btn btn-sm btn-danger" onclick="handleDeleteListing('${l._id}','${l.cropType.replace(/'/g, "\\'")}')" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state"><div class="empty-icon">🌱</div><div class="empty-title">No listings yet</div><div class="empty-description">Create your first crop listing to start receiving offers</div><a href="#/farmer/new-listing" class="btn btn-primary">+ New Listing</a></div>';

      // Orders
      document.getElementById('farmer-orders').innerHTML = orders.length ? `
        <div class="table-wrapper">
          <table class="table">
            <thead><tr><th>Order</th><th>Crop</th><th>Buyer</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td style="font-size:var(--text-xs);color:var(--text-muted)">#${o._id.slice(-6)}</td>
                  <td>${o.listingId?.cropType || '—'}</td>
                  <td>${o.distributorId?.name || '—'}</td>
                  <td>${formatCurrency(o.totalAmount)}</td>
                  <td><span class="${getStatusBadge(o.status)}">${formatStatus(o.status)}</span></td>
                  <td><button class="btn btn-sm btn-outline" onclick="viewOrder('${o._id}')">View</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state" style="padding:var(--space-8)"><div class="empty-icon">📦</div><div class="empty-title">No orders yet</div></div>';

      // Distributor Requests
      document.getElementById('farmer-requests').innerHTML = requirements.length ? `
        <div class="table-wrapper">
          <table class="table">
            <thead><tr><th>Crop Wanted</th><th>Distributor</th><th>Quantity</th><th>Offered Price</th><th>Expires</th><th>Action</th></tr></thead>
            <tbody>
              ${requirements.map(r => `
                <tr>
                  <td><strong>${getCropEmoji(r.cropType)} ${r.cropType}</strong></td>
                  <td>${r.distributorId?.name || '—'} ${r.distributorId?.isVerified ? '<span class="verified-badge"></span>' : ''}</td>
                  <td>${formatQuantity(r.quantity, r.unit)}</td>
                  <td>${formatCurrency(r.offeredPrice)}/${r.unit}</td>
                  <td>${formatDate(r.expiryDate)}</td>
                  <td><button class="btn btn-sm btn-primary" onclick="showToast('Contact feature coming soon', 'info')">Contact</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state" style="padding:var(--space-8)"><div class="empty-icon">📋</div><div class="empty-title">No active requests</div><div class="empty-description">Check back later for new distributor requirements</div></div>';

      // Pending Offers
      document.getElementById('farmer-offers').innerHTML = allPendingOffers.length ? `
        ${allPendingOffers.map(o => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-4);background:var(--bg-primary);border:1px solid var(--border-color);border-radius:var(--radius-lg);margin-bottom:var(--space-3)">
            <div>
              <strong>${o.distributorId?.name || 'Unknown'}</strong>
              ${o.distributorId?.isVerified ? '<span class="verified-badge"></span>' : ''}
              <span style="font-size:var(--text-xs);color:var(--text-muted);margin-left:var(--space-2)">on ${o.listingCrop}</span>
              <div style="font-size:var(--text-sm);color:var(--text-muted);margin-top:var(--space-1)">
                ${formatCurrency(o.offeredPrice)} · ${formatQuantity(o.quantity, 'kg')} · Pickup: ${formatDate(o.pickupDate)}
              </div>
            </div>
            <div style="display:flex;gap:var(--space-2)">
              <button class="btn btn-sm btn-primary" onclick="handleOfferAction('${o._id}', 'accept')">Accept</button>
              <button class="btn btn-sm btn-danger" onclick="handleOfferAction('${o._id}', 'reject')">Reject</button>
            </div>
          </div>
        `).join('')}
      ` : '<div class="empty-state" style="padding:var(--space-8)"><div class="empty-icon">💰</div><div class="empty-title">No pending offers</div><div class="empty-description">Offers from distributors will appear here</div></div>';

      // Storage Bookings
      document.getElementById('farmer-bookings').innerHTML = bookings.length ? `
        <div class="table-wrapper">
          <table class="table">
            <thead><tr><th>Facility</th><th>Quantity</th><th>Duration</th><th>Cost</th><th>Status</th></tr></thead>
            <tbody>
              ${bookings.map(b => `
                <tr>
                  <td>${b.facilityId?.name || '—'}</td>
                  <td>${b.quantity} tons</td>
                  <td>${formatDate(b.startDate)} — ${formatDate(b.endDate)}</td>
                  <td>${formatCurrency(b.totalCost)}</td>
                  <td><span class="${getStatusBadge(b.status)}">${formatStatus(b.status)}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="empty-state" style="padding:var(--space-8)"><div class="empty-icon">❄️</div><div class="empty-title">No storage bookings</div><div class="empty-description">Browse the cold storage marketplace to book a facility</div><a href="#/marketplace/storage" class="btn btn-primary">Browse Storage</a></div>';

    } catch (error) {
      showToast('Failed to load dashboard: ' + error.message, 'error');
    }
  }, 100);

  return `
    ${renderNavbar()}
    ${renderSidebar()}
    <main class="main-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">👋 Welcome, ${AppState.currentUser?.name || 'Farmer'}!</h1>
          <p class="page-subtitle">Here's your farming overview for today</p>
        </div>
        <a href="#/farmer/new-listing" class="btn btn-primary">+ New Listing</a>
      </div>
      <div class="stats-grid" id="farmer-stats"><div class="loading"><div class="loading-spinner"></div></div></div>
      <div class="section"><div class="section-header"><h3 class="section-title">💰 Pending Offers</h3></div><div class="section-body" id="farmer-offers"><div class="loading"><div class="loading-spinner"></div></div></div></div>
      <div class="section"><div class="section-header"><h3 class="section-title">🌱 My Listings</h3></div><div class="section-body" id="farmer-listings"><div class="loading"><div class="loading-spinner"></div></div></div></div>
      <div class="section"><div class="section-header"><h3 class="section-title">📦 My Orders</h3></div><div class="section-body" id="farmer-orders"><div class="loading"><div class="loading-spinner"></div></div></div></div>
      <div class="section"><div class="section-header"><h3 class="section-title">📋 Distributor Requests</h3></div><div class="section-body" id="farmer-requests"><div class="loading"><div class="loading-spinner"></div></div></div></div>
      <div class="section"><div class="section-header"><h3 class="section-title">❄️ Storage Bookings</h3></div><div class="section-body" id="farmer-bookings"><div class="loading"><div class="loading-spinner"></div></div></div></div>
    </main>
  `;
}

// --- Farmer New Listing ---
function renderFarmerNewListing() {
  return `
    ${renderNavbar()}
    ${renderSidebar()}
    <main class="main-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">➕ Create New Listing</h1>
          <p class="page-subtitle">Add your crop details to start receiving offers from distributors</p>
        </div>
        <a href="#/farmer/dashboard" class="btn btn-ghost">← Back to Dashboard</a>
      </div>
      <div class="section">
        <div class="section-body">
          <form id="new-listing-form" onsubmit="handleCreateListing(event)" style="max-width:640px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
              <div class="form-group">
                <label class="form-label" for="crop-type">Crop Type</label>
                <input class="form-input" type="text" id="crop-type" placeholder="e.g., Tomato, Wheat, Onion" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="crop-quantity">Quantity</label>
                <input class="form-input" type="number" id="crop-quantity" placeholder="Enter quantity" required min="0.1" step="0.1" />
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
              <div class="form-group">
                <label class="form-label" for="crop-unit">Unit</label>
                <select class="form-select" id="crop-unit">
                  <option value="kg">Kilograms (kg)</option>
                  <option value="quintal">Quintal</option>
                  <option value="ton">Tons</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="crop-price">Expected Price (₹/unit)</label>
                <input class="form-input" type="number" id="crop-price" placeholder="Price per unit" required min="0" step="0.01" />
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
              <div class="form-group">
                <label class="form-label" for="harvest-date">Harvest Date</label>
                <input class="form-input" type="date" id="harvest-date" required />
              </div>
              <div class="form-group">
                <label class="form-label">Urgency</label>
                <div style="display:flex;gap:var(--space-2);flex-wrap:wrap" id="urgency-selector">
                  <button type="button" class="btn btn-sm btn-outline" data-urgency="low" onclick="selectUrgency('low')" style="border-color:var(--primary-300);color:var(--primary-600)">Low</button>
                  <button type="button" class="btn btn-sm btn-primary" data-urgency="medium" onclick="selectUrgency('medium')">Medium</button>
                  <button type="button" class="btn btn-sm btn-outline" data-urgency="high" onclick="selectUrgency('high')" style="border-color:var(--accent-300);color:var(--accent-600)">High</button>
                  <button type="button" class="btn btn-sm btn-outline" data-urgency="critical" onclick="selectUrgency('critical')" style="border-color:var(--danger-400);color:var(--danger-500)">Critical</button>
                </div>
                <input type="hidden" id="crop-urgency" value="medium" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Crop Images</label>
              <div class="upload-zone" id="upload-zone" onclick="document.getElementById('crop-images').click()">
                <div class="upload-icon">📸</div>
                <div class="upload-text"><strong>Click to upload</strong> or drag & drop<br>PNG, JPG up to 5MB each</div>
              </div>
              <input type="file" id="crop-images" multiple accept="image/*" style="display:none" onchange="handleImagePreview(this)" />
              <div class="upload-previews" id="image-previews"></div>
            </div>
            <div class="form-group">
              <label class="form-label" for="crop-description">Description</label>
              <textarea class="form-textarea" id="crop-description" placeholder="Describe your produce — quality, variety, any special notes..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" id="create-listing-btn">
              🌱 Create Listing
            </button>
          </form>
        </div>
      </div>
    </main>
  `;
}

// --- Distributor Dashboard ---
async function renderDistributorDashboard() {
  setTimeout(async () => {
    try {
      const [offersData, ordersData, reqsData] = await Promise.all([
        api.get('/offers/my'),
        api.get('/orders'),
        api.get('/requirements/my'),
      ]);

      const offers = offersData.offers || [];
      const orders = ordersData.orders || [];
      const reqs = reqsData.requirements || [];

      document.getElementById('dist-stats').innerHTML = `
        <div class="stat-card animate-fade-in-up delay-1"><div class="stat-icon green">📝</div><div class="stat-value">${offers.filter(o => o.status === 'pending').length}</div><div class="stat-label">Pending Offers</div></div>
        <div class="stat-card animate-fade-in-up delay-2"><div class="stat-icon amber">✅</div><div class="stat-value">${offers.filter(o => o.status === 'accepted').length}</div><div class="stat-label">Accepted Offers</div></div>
        <div class="stat-card animate-fade-in-up delay-3"><div class="stat-icon blue">📦</div><div class="stat-value">${orders.filter(o => o.status !== 'completed').length}</div><div class="stat-label">Active Orders</div></div>
        <div class="stat-card animate-fade-in-up delay-4"><div class="stat-icon red">🏆</div><div class="stat-value">${orders.filter(o => o.status === 'completed').length}</div><div class="stat-label">Completed</div></div>
      `;

      document.getElementById('dist-offers').innerHTML = offers.length ? `
        <div class="table-wrapper"><table class="table">
          <thead><tr><th>Crop</th><th>Offered Price</th><th>Quantity</th><th>Status</th><th>Sent</th></tr></thead>
          <tbody>${offers.map(o => `<tr><td>${o.listingId?.cropType || '—'}</td><td>${formatCurrency(o.offeredPrice)}</td><td>${formatQuantity(o.quantity, o.listingId?.unit)}</td><td><span class="${getStatusBadge(o.status)}">${formatStatus(o.status)}</span></td><td>${timeAgo(o.createdAt)}</td></tr>`).join('')}</tbody>
        </table></div>
      ` : '<div class="empty-state" style="padding:var(--space-8)"><div class="empty-icon">📝</div><div class="empty-title">No offers sent yet</div><div class="empty-description">Browse the marketplace and send offers to farmers</div><a href="#/marketplace" class="btn btn-primary">Browse Crops</a></div>';

      document.getElementById('dist-orders').innerHTML = orders.length ? `
        <div class="table-wrapper"><table class="table">
          <thead><tr><th>Order</th><th>Farmer</th><th>Crop</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>${orders.map(o => `<tr><td>#${o._id.slice(-6)}</td><td>${o.farmerId?.name || '—'}</td><td>${o.listingId?.cropType || '—'}</td><td>${formatCurrency(o.totalAmount)}</td><td><span class="${getStatusBadge(o.status)}">${formatStatus(o.status)}</span></td><td><button class="btn btn-sm btn-outline" onclick="viewOrder('${o._id}')">View</button></td></tr>`).join('')}</tbody>
        </table></div>
      ` : '<div class="empty-state" style="padding:var(--space-8)"><div class="empty-icon">📦</div><div class="empty-title">No orders yet</div></div>';

      document.getElementById('dist-reqs').innerHTML = reqs.length ? `
        <div class="table-wrapper"><table class="table">
          <thead><tr><th>Crop</th><th>Quantity</th><th>Price</th><th>Expiry</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>${reqs.map(r => `<tr>
            <td><strong>${getCropEmoji(r.cropType)} ${r.cropType}</strong></td>
            <td>${formatQuantity(r.quantity, r.unit)}</td>
            <td>${formatCurrency(r.offeredPrice)}/${r.unit}</td>
            <td>${formatDate(r.expiryDate)}</td>
            <td><span class="${getStatusBadge(r.status)}">${formatStatus(r.status)}</span></td>
            <td>${r.status === 'active' ? `<button class="btn btn-sm btn-danger" onclick="handleCancelRequirement('${r._id}')">Cancel</button>` : '—'}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      ` : '<div class="empty-state" style="padding:var(--space-8)"><div class="empty-icon">📋</div><div class="empty-title">No requirements posted</div><div class="empty-description">Post a requirement to let farmers know what you need</div><a href="#/distributor/new-requirement" class="btn btn-primary">+ Post Requirement</a></div>';

    } catch (error) {
      showToast('Failed to load: ' + error.message, 'error');
    }
  }, 100);

  return `
    ${renderNavbar()}${renderSidebar()}
    <main class="main-content">
      <div class="page-header"><div><h1 class="page-title">👋 Welcome, ${AppState.currentUser?.name}!</h1><p class="page-subtitle">Your procurement overview</p></div><a href="#/distributor/marketplace" class="btn btn-primary">🛒 Browse Crops</a></div>
      <div class="stats-grid" id="dist-stats"><div class="loading"><div class="loading-spinner"></div></div></div>
      <div class="section"><div class="section-header"><h3 class="section-title">📋 My Requirements</h3></div><div class="section-body" id="dist-reqs"><div class="loading"><div class="loading-spinner"></div></div></div></div>
      <div class="section"><div class="section-header"><h3 class="section-title">📝 My Offers</h3></div><div class="section-body" id="dist-offers"><div class="loading"><div class="loading-spinner"></div></div></div></div>
      <div class="section"><div class="section-header"><h3 class="section-title">📦 My Orders</h3></div><div class="section-body" id="dist-orders"><div class="loading"><div class="loading-spinner"></div></div></div></div>
    </main>
  `;
}

// --- Distributor New Requirement ---
function renderDistributorNewRequirement() {
  return `
    ${renderNavbar()}
    ${renderSidebar()}
    <main class="main-content">
      <div class="page-header">
        <div>
          <h1 class="page-title">➕ Post New Requirement</h1>
          <p class="page-subtitle">Let farmers know what crops you are looking to buy</p>
        </div>
        <a href="#/distributor/dashboard" class="btn btn-ghost">← Back to Dashboard</a>
      </div>
      <div class="section">
        <div class="section-body">
          <form id="new-req-form" onsubmit="handleCreateRequirement(event)" style="max-width:640px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
              <div class="form-group">
                <label class="form-label" for="req-crop">Crop Type</label>
                <input class="form-input" type="text" id="req-crop" placeholder="e.g., Tomato" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="req-qty">Quantity Needed</label>
                <input class="form-input" type="number" id="req-qty" placeholder="Quantity" required min="1" />
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
              <div class="form-group">
                <label class="form-label" for="req-unit">Unit</label>
                <select class="form-select" id="req-unit">
                  <option value="kg">Kilograms (kg)</option>
                  <option value="quintal">Quintal</option>
                  <option value="ton">Tons</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="req-price">Offered Price (₹/unit)</label>
                <input class="form-input" type="number" id="req-price" placeholder="Price" required min="0" step="0.01" />
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
              <div class="form-group">
                <label class="form-label" for="req-expiry">Requirement Expiry Date</label>
                <input class="form-input" type="date" id="req-expiry" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="req-radius">Service Radius (km)</label>
                <input class="form-input" type="number" id="req-radius" placeholder="Distance willing to travel" required value="50" min="5" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="req-desc">Additional Details</label>
              <textarea class="form-textarea" id="req-desc" placeholder="Quality requirements, payment terms..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" id="create-req-btn">
              📋 Post Requirement
            </button>
          </form>
        </div>
      </div>
    </main>
  `;
}

// --- Storage Dashboard ---
async function renderStorageDashboard() {
  setTimeout(async () => {
    try {
      const [facilitiesData, bookingsData] = await Promise.all([
        api.get('/storage/my'),
        api.get('/bookings'),
      ]);

      const facilities = facilitiesData.facilities || [];
      const bookings = bookingsData.bookings || [];

      const totalCap = facilities.reduce((s, f) => s + f.totalCapacity, 0);
      const usedCap = facilities.reduce((s, f) => s + f.usedCapacity, 0);
      const pendingBookings = bookings.filter(b => b.status === 'pending').length;
      const revenue = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((s, b) => s + (b.totalCost || 0), 0);

      document.getElementById('storage-stats').innerHTML = `
        <div class="stat-card animate-fade-in-up delay-1"><div class="stat-icon blue">🏭</div><div class="stat-value">${facilities.length}</div><div class="stat-label">Facilities</div></div>
        <div class="stat-card animate-fade-in-up delay-2"><div class="stat-icon green">📊</div><div class="stat-value">${totalCap ? getCapacityPercent(usedCap, totalCap) : 0}%</div><div class="stat-label">Utilization</div></div>
        <div class="stat-card animate-fade-in-up delay-3"><div class="stat-icon amber">📋</div><div class="stat-value">${pendingBookings}</div><div class="stat-label">Pending Bookings</div></div>
        <div class="stat-card animate-fade-in-up delay-4"><div class="stat-icon red">💰</div><div class="stat-value">${formatCurrency(revenue)}</div><div class="stat-label">Revenue</div></div>
      `;

      document.getElementById('storage-facilities').innerHTML = facilities.length ? facilities.map(f => {
        const pct = getCapacityPercent(f.usedCapacity, f.totalCapacity);
        return `
          <div class="facility-card" style="margin-bottom:var(--space-4)">
            <div class="facility-header">
              <div class="facility-name">❄️ ${f.name}</div>
              <div style="display:flex;gap:var(--space-2);align-items:center;">
                <span class="badge ${f.isAvailable ? 'badge-success' : 'badge-danger'}">${f.isAvailable ? 'Available' : 'Full'}</span>
                <button class="btn btn-sm btn-outline" onclick="handleToggleFacility('${f._id}', ${!f.isAvailable})">Toggle</button>
              </div>
            </div>
            <div class="capacity-bar"><div class="capacity-fill" style="width:${pct}%;background:${pct >= 90 ? 'var(--danger-500)' : pct >= 70 ? 'var(--accent-500)' : 'var(--primary-500)'}"></div></div>
            <div style="display:flex;justify-content:space-between;font-size:var(--text-sm);color:var(--text-muted)">
              <span>${f.usedCapacity}/${f.totalCapacity} tons used</span>
              <span>${formatCurrency(f.pricePerTon)}/ton/day</span>
            </div>
          </div>
        `;
      }).join('') : '<div class="empty-state" style="padding:var(--space-8)"><div class="empty-icon">🏭</div><div class="empty-title">No facilities added</div></div>';

      document.getElementById('storage-bookings').innerHTML = bookings.length ? `
        <div class="table-wrapper"><table class="table">
          <thead><tr><th>Booker</th><th>Facility</th><th>Qty</th><th>Duration</th><th>Cost</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>${bookings.map(b => `<tr>
            <td>${b.bookerId?.name || '—'}</td>
            <td>${b.facilityId?.name || '—'}</td>
            <td>${b.quantity} tons</td>
            <td>${formatDate(b.startDate)} — ${formatDate(b.endDate)}</td>
            <td>${formatCurrency(b.totalCost)}</td>
            <td><span class="${getStatusBadge(b.status)}">${formatStatus(b.status)}</span></td>
            <td>${b.status === 'pending' ? `<button class="btn btn-sm btn-primary" onclick="handleBookingAction('${b._id}', 'accept')">Accept</button> <button class="btn btn-sm btn-danger" onclick="handleBookingAction('${b._id}', 'reject')">Reject</button>` : '—'}</td>
          </tr>`).join('')}</tbody>
        </table></div>
      ` : '<div class="empty-state" style="padding:var(--space-8)"><div class="empty-icon">📋</div><div class="empty-title">No bookings yet</div></div>';

    } catch (error) {
      showToast('Failed to load: ' + error.message, 'error');
    }
  }, 100);

  return `
    ${renderNavbar()}${renderSidebar()}
    <main class="main-content">
      <div class="page-header">
        <div><h1 class="page-title">❄️ Cold Storage Dashboard</h1><p class="page-subtitle">Manage your facilities, bookings, and revenue</p></div>
        <button class="btn btn-primary" onclick="openFacilityModal()">+ Add Facility</button>
      </div>
      <div class="stats-grid" id="storage-stats"><div class="loading"><div class="loading-spinner"></div></div></div>
      <div class="section"><div class="section-header"><h3 class="section-title">🏭 My Facilities</h3></div><div class="section-body" id="storage-facilities"><div class="loading"><div class="loading-spinner"></div></div></div></div>
      <div class="section"><div class="section-header"><h3 class="section-title">📋 Bookings</h3></div><div class="section-body" id="storage-bookings"><div class="loading"><div class="loading-spinner"></div></div></div></div>
    </main>
  `;
}

// --- Admin Dashboard ---
async function renderAdminDashboard() {
  setTimeout(async () => {
    try {
      const [analyticsData, usersData, reportsData] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/users?limit=20'),
        api.get('/admin/reports'),
      ]);

      const a = analyticsData;
      const users = usersData.users || [];
      const reports = reportsData.reports || [];

      document.getElementById('admin-stats').innerHTML = `
        <div class="stat-card animate-fade-in-up delay-1"><div class="stat-icon green">👥</div><div class="stat-value">${a.users.total}</div><div class="stat-label">Total Users</div></div>
        <div class="stat-card animate-fade-in-up delay-2"><div class="stat-icon amber">🌾</div><div class="stat-value">${a.listings.active}</div><div class="stat-label">Active Listings</div></div>
        <div class="stat-card animate-fade-in-up delay-3"><div class="stat-icon blue">📦</div><div class="stat-value">${a.orders.total}</div><div class="stat-label">Total Orders</div></div>
        <div class="stat-card animate-fade-in-up delay-4"><div class="stat-icon red">🆕</div><div class="stat-value">${a.thisWeek.newUsers}</div><div class="stat-label">New This Week</div></div>
      `;

      document.getElementById('admin-users').innerHTML = `
        <div class="table-wrapper"><table class="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>${users.map(u => `<tr>
            <td><div style="display:flex;align-items:center;gap:var(--space-2)"><div class="avatar avatar-sm">${getInitials(u.name)}</div><strong>${u.name}</strong></div></td>
            <td style="font-size:var(--text-sm);color:var(--text-muted)">${u.email}</td>
            <td><span class="badge badge-info">${formatStatus(u.role)}</span></td>
            <td>${u.isVerified ? '✅' : '❌'}</td>
            <td>${u.isSuspended ? '<span class="badge badge-danger">Suspended</span>' : '<span class="badge badge-success">Active</span>'}</td>
            <td>
              ${!u.isVerified ? `<button class="btn btn-sm btn-primary" onclick="handleAdminAction('verify','${u._id}')">Verify</button>` : ''}
              <button class="btn btn-sm ${u.isSuspended ? 'btn-secondary' : 'btn-danger'}" onclick="handleAdminAction('suspend','${u._id}')">${u.isSuspended ? 'Unsuspend' : 'Suspend'}</button>
            </td>
          </tr>`).join('')}</tbody>
        </table></div>
      `;

      document.getElementById('admin-reports').innerHTML = reports.length ? `
        <div class="table-wrapper"><table class="table">
          <thead><tr><th>Reporter</th><th>Reason</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>${reports.map(r => `<tr>
            <td>${r.reporterId?.name || '—'}</td>
            <td><strong>${r.reason}</strong><div style="font-size:var(--text-xs);color:var(--text-muted)">${r.description || ''}</div></td>
            <td><span class="${getStatusBadge(r.status)}">${formatStatus(r.status)}</span></td>
            <td>${formatDate(r.createdAt)}</td>
            <td>
              ${r.status === 'pending' ? `<button class="btn btn-sm btn-primary" onclick="handleReportAction('${r._id}', 'resolved')">Resolve</button> <button class="btn btn-sm btn-outline" onclick="handleReportAction('${r._id}', 'dismissed')">Dismiss</button>` : '—'}
            </td>
          </tr>`).join('')}</tbody>
        </table></div>
      ` : '<div class="empty-state" style="padding:var(--space-8)"><div class="empty-icon">✅</div><div class="empty-title">No pending reports</div></div>';
    } catch (error) {
      showToast('Failed to load: ' + error.message, 'error');
    }
  }, 100);

  return `
    ${renderNavbar()}${renderSidebar()}
    <main class="main-content">
      <div class="page-header"><div><h1 class="page-title">🛡️ Admin Dashboard</h1><p class="page-subtitle">Platform management and analytics</p></div></div>
      <div class="stats-grid" id="admin-stats"><div class="loading"><div class="loading-spinner"></div></div></div>
      <div class="section"><div class="section-header"><h3 class="section-title">👥 Users</h3></div><div class="section-body" id="admin-users"><div class="loading"><div class="loading-spinner"></div></div></div></div>
      <div class="section"><div class="section-header"><h3 class="section-title">🚩 Fraud Reports</h3></div><div class="section-body" id="admin-reports"><div class="loading"><div class="loading-spinner"></div></div></div></div>
    </main>
  `;
}

// ==========================================
// HELPER: Gradient for crop type
// ==========================================
function getGradientForCrop(cropType) {
  const gradients = {
    tomato: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    onion: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    wheat: 'linear-gradient(135deg, #f59e0b 0%, #eab308 100%)',
    rice: 'linear-gradient(135deg, #84cc16 0%, #22c55e 100%)',
    cotton: 'linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%)',
    chilli: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    potato: 'linear-gradient(135deg, #92400e 0%, #d97706 100%)',
    sugarcane: 'linear-gradient(135deg, #16a34a 0%, #4ade80 100%)',
    mango: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    grapes: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
    carrot: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    mustard: 'linear-gradient(135deg, #ca8a04 0%, #fbbf24 100%)',
  };
  const key = cropType?.toLowerCase().split(' ')[0] || '';
  return gradients[key] || 'var(--gradient-primary)';
}

// ==========================================
// GLOBAL EVENT HANDLERS
// ==========================================

window.handleLogin = async function (e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  btn.innerHTML = '<span class="spinner"></span> Signing in...';
  btn.disabled = true;

  try {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const { loginUser } = await import('./auth.js');
    const user = await loginUser(email, password);

    AppState.currentUser = user;
    AppState.token = localStorage.getItem('agrilink_token');

    showToast(`Welcome back, ${user.name}!`, 'success');
    window.location.hash = getDashboardRoute(user.role);
  } catch (error) {
    showToast(error.message || 'Login failed', 'error');
    btn.innerHTML = 'Sign In →';
    btn.disabled = false;
  }
};

window.handleRegister = async function (e) {
  e.preventDefault();
  const btn = document.getElementById('register-btn');
  btn.innerHTML = '<span class="spinner"></span> Creating account...';
  btn.disabled = true;

  try {
    const { registerUser } = await import('./auth.js');
    const user = await registerUser({
      name: document.getElementById('register-name').value,
      email: document.getElementById('register-email').value,
      phone: document.getElementById('register-phone').value,
      password: document.getElementById('register-password').value,
      role: document.getElementById('register-role').value,
    });

    AppState.currentUser = user;
    AppState.token = localStorage.getItem('agrilink_token');

    showToast(`Welcome to AgriLink, ${user.name}!`, 'success');
    window.location.hash = getDashboardRoute(user.role);
  } catch (error) {
    showToast(error.message || 'Registration failed', 'error');
    btn.innerHTML = 'Create Account →';
    btn.disabled = false;
  }
};

window.selectRole = function (role) {
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
  document.querySelector(`[data-role="${role}"]`).classList.add('selected');
  document.getElementById('register-role').value = role;
};

window.selectUrgency = function (urgency) {
  document.querySelectorAll('#urgency-selector .btn').forEach(b => {
    b.className = 'btn btn-sm btn-outline';
  });
  document.querySelector(`[data-urgency="${urgency}"]`).className = 'btn btn-sm btn-primary';
  document.getElementById('crop-urgency').value = urgency;
};

window.handleCreateListing = async function (e) {
  e.preventDefault();
  const btn = document.getElementById('create-listing-btn');
  btn.innerHTML = '<span class="spinner"></span> Creating...';
  btn.disabled = true;

  try {
    await api.post('/listings', {
      cropType: document.getElementById('crop-type').value,
      quantity: Number(document.getElementById('crop-quantity').value),
      unit: document.getElementById('crop-unit').value,
      expectedPrice: Number(document.getElementById('crop-price').value),
      harvestDate: document.getElementById('harvest-date').value,
      urgency: document.getElementById('crop-urgency').value,
      description: document.getElementById('crop-description').value,
    });

    showToast('Listing created successfully! 🌱', 'success');
    window.location.hash = '#/farmer/dashboard';
  } catch (error) {
    showToast(error.message || 'Failed to create listing', 'error');
    btn.innerHTML = '🌱 Create Listing';
    btn.disabled = false;
  }
};

window.handleCreateRequirement = async function (e) {
  e.preventDefault();
  const btn = document.getElementById('create-req-btn');
  btn.innerHTML = '<span class="spinner"></span> Posting...';
  btn.disabled = true;

  try {
    await api.post('/requirements', {
      cropType: document.getElementById('req-crop').value,
      quantity: Number(document.getElementById('req-qty').value),
      unit: document.getElementById('req-unit').value,
      offeredPrice: Number(document.getElementById('req-price').value),
      expiryDate: document.getElementById('req-expiry').value,
      serviceRadius: Number(document.getElementById('req-radius').value),
      description: document.getElementById('req-desc').value,
    });

    showToast('Requirement posted successfully!', 'success');
    window.location.hash = '#/distributor/dashboard';
  } catch (error) {
    showToast(error.message || 'Failed to post requirement', 'error');
    btn.innerHTML = '📋 Post Requirement';
    btn.disabled = false;
  }
};

window.handleCancelRequirement = async function (id) {
  if (!confirm('Are you sure you want to cancel this requirement?')) return;
  try {
    await api.delete(`/requirements/${id}`);
    showToast('Requirement cancelled', 'success');
    navigate(window.location.hash.slice(1));
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.handleBookingAction = async function (bookingId, action) {
  try {
    await api.patch(`/bookings/${bookingId}/${action}`);
    showToast(`Booking ${action}ed successfully`, 'success');
    navigate(window.location.hash.slice(1));
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.handleAdminAction = async function (action, userId) {
  try {
    await api.patch(`/admin/users/${userId}/${action}`);
    showToast(`User ${action === 'verify' ? 'verified' : 'updated'} successfully`, 'success');
    navigate(window.location.hash.slice(1));
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.handleReportAction = async function (reportId, status) {
  try {
    await api.patch(`/admin/reports/${reportId}/status`, { status });
    showToast(`Report marked as ${status}`, 'success');
    navigate(window.location.hash.slice(1));
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.viewListing = async function (id) {
  try {
    const data = await api.get(`/listings/${id}`);
    const listing = data.listing;
    const user = AppState.currentUser;

    // Fetch farmer ratings
    let ratingHtml = '';
    try {
      const ratingsData = await api.get(`/ratings/user/${listing.farmerId._id}`);
      ratingHtml = `<div style="display:flex;align-items:center;gap:var(--space-2)">
        <span>${'⭐'.repeat(Math.round(ratingsData.avgScore))}</span>
        <span style="font-weight:600">${ratingsData.avgScore}/5</span>
        <span style="color:var(--text-muted);font-size:var(--text-xs)">(${ratingsData.totalRatings} reviews)</span>
      </div>`;
    } catch (e) {
      ratingHtml = '<span style="color:var(--text-muted);font-size:var(--text-sm)">No ratings yet</span>';
    }

    // Offer form for distributors
    let offerFormHtml = '';
    if (user && user.role === 'distributor' && listing.status === 'active') {
      offerFormHtml = `
        <div style="margin-top:var(--space-6);padding-top:var(--space-5);border-top:1px solid var(--border-color)">
          <h4 style="margin-bottom:var(--space-3)">📝 Send Offer</h4>
          <form id="offer-form" onsubmit="handleSendOffer(event, '${listing._id}')">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
              <div class="form-group" style="margin-bottom:var(--space-3)">
                <label class="form-label">Offered Price (₹/${listing.unit})</label>
                <input class="form-input" type="number" id="offer-price" placeholder="${listing.expectedPrice}" required min="1" step="0.01" />
              </div>
              <div class="form-group" style="margin-bottom:var(--space-3)">
                <label class="form-label">Quantity (${listing.unit})</label>
                <input class="form-input" type="number" id="offer-qty" placeholder="${listing.quantity}" required min="1" max="${listing.quantity}" />
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3)">
              <div class="form-group" style="margin-bottom:var(--space-3)">
                <label class="form-label">Pickup Date</label>
                <input class="form-input" type="date" id="offer-pickup" required />
              </div>
              <div class="form-group" style="margin-bottom:var(--space-3)">
                <label class="form-label">Notes (optional)</label>
                <input class="form-input" type="text" id="offer-notes" placeholder="Any special requests..." />
              </div>
            </div>
            <button type="submit" class="btn btn-primary" id="send-offer-btn">Send Offer</button>
          </form>
        </div>
      `;
    }

    // Offers inbox for farmers (owner of this listing)
    let offersInboxHtml = '';
    if (user && user.role === 'farmer' && listing.farmerId._id === user._id) {
      try {
        const offersData = await api.get(`/listings/${listing._id}/offers`);
        const offers = offersData.offers || [];
        const pending = offers.filter(o => o.status === 'pending');
        if (pending.length > 0) {
          offersInboxHtml = `
            <div style="margin-top:var(--space-6);padding-top:var(--space-5);border-top:1px solid var(--border-color)">
              <h4 style="margin-bottom:var(--space-3)">💰 Pending Offers (${pending.length})</h4>
              ${pending.map(o => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-3);background:var(--gray-50);border-radius:var(--radius-md);margin-bottom:var(--space-2)">
                  <div>
                    <strong>${o.distributorId?.name || 'Unknown'}</strong>
                    ${o.distributorId?.isVerified ? '<span class="verified-badge"></span>' : ''}
                    <div style="font-size:var(--text-sm);color:var(--text-muted)">
                      ${formatCurrency(o.offeredPrice)}/${listing.unit} · ${formatQuantity(o.quantity, listing.unit)} · Pickup: ${formatDate(o.pickupDate)}
                    </div>
                    ${o.notes ? `<div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:var(--space-1)">"${o.notes}"</div>` : ''}
                  </div>
                  <div style="display:flex;gap:var(--space-2)">
                    <button class="btn btn-sm btn-primary" onclick="handleOfferAction('${o._id}', 'accept')">Accept</button>
                    <button class="btn btn-sm btn-danger" onclick="handleOfferAction('${o._id}', 'reject')">Reject</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `;
        }
      } catch (e) { /* ignore if not authorized */ }
    }

    const modalHtml = `
      <div class="modal-overlay" id="listing-modal">
        <div class="modal-content" style="max-width:700px">
          <div class="modal-header">
            <h3>${getCropEmoji(listing.cropType)} ${listing.cropType}</h3>
            <button class="btn btn-ghost" onclick="document.getElementById('listing-modal').remove()">✕</button>
          </div>
          <div class="modal-body">
            <div style="display:flex;gap:var(--space-4);margin-bottom:var(--space-5)">
              <div style="flex:1;min-height:180px;border-radius:var(--radius-lg);overflow:hidden;background:${getGradientForCrop(listing.cropType)};display:flex;align-items:center;justify-content:center;font-size:4rem">
                ${listing.imageUrls?.length ? `<img src="${listing.imageUrls[0]}" alt="${listing.cropType}" style="width:100%;height:100%;object-fit:cover">` : getCropEmoji(listing.cropType)}
              </div>
              <div style="flex:1">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-4)">
                  <div><div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase">Price</div><div style="font-weight:700;font-size:var(--text-lg)">${formatCurrency(listing.expectedPrice)}/${listing.unit}</div></div>
                  <div><div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase">Quantity</div><div style="font-weight:700;font-size:var(--text-lg)">${formatQuantity(listing.quantity, listing.unit)}</div></div>
                  <div><div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase">Harvest Date</div><div style="font-weight:600">${formatDate(listing.harvestDate)}</div></div>
                  <div><div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase">Urgency</div><div><span class="${getUrgencyBadge(listing.urgency)}">${getUrgencyLabel(listing.urgency)}</span></div></div>
                </div>
                <span class="${getStatusBadge(listing.status)}">${formatStatus(listing.status)}</span>
              </div>
            </div>

            ${listing.description ? `<div style="margin-bottom:var(--space-4)"><h4 style="margin-bottom:var(--space-2)">Description</h4><p style="color:var(--text-secondary);font-size:var(--text-sm)">${listing.description}</p></div>` : ''}

            <div style="padding:var(--space-4);background:var(--gray-50);border-radius:var(--radius-lg);margin-bottom:var(--space-4)">
              <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-2)">
                <div class="avatar avatar-sm">${getInitials(listing.farmerId?.name || 'U')}</div>
                <div>
                  <strong>${listing.farmerId?.name || 'Unknown Farmer'}</strong>
                  ${listing.farmerId?.isVerified ? '<span class="verified-badge"></span>' : ''}
                  <div style="font-size:var(--text-xs);color:var(--text-muted)">${listing.farmerId?.phone || ''}</div>
                </div>
              </div>
              ${ratingHtml}
            </div>

            ${user ? `<button class="btn btn-sm btn-ghost" style="color:var(--danger-500)" onclick="openReportModal('CropListing', '${listing._id}')">🚩 Report this listing</button>` : ''}

            ${offerFormHtml}
            ${offersInboxHtml}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (error) {
    showToast(error.message || 'Failed to load listing', 'error');
  }
};

window.viewOrder = async function (id) {
  try {
    const data = await api.get(`/orders/${id}`);
    const order = data.order;
    
    let actionsHtml = '';
    
    // Distributor can update status
    if (AppState.currentUser?.role === 'distributor' && order.status !== 'completed') {
      const nextStatusMap = {
        'confirmed': 'pickup_scheduled',
        'pickup_scheduled': 'in_transit',
        'in_transit': 'delivered',
        'delivered': 'completed'
      };
      const btnLabels = {
        'pickup_scheduled': 'Mark Pickup Scheduled',
        'in_transit': 'Mark In Transit',
        'delivered': 'Mark Delivered',
        'completed': 'Mark Completed'
      };
      const nextStatus = nextStatusMap[order.status];
      if (nextStatus) {
        actionsHtml = `<button class="btn btn-primary" onclick="updateOrderStatus('${order._id}', '${nextStatus}')">${btnLabels[nextStatus]}</button>`;
      }
    }
    
    // Both can rate if completed
    let ratingHtml = '';
    if (order.status === 'completed') {
      const rateeId = AppState.currentUser.role === 'farmer' ? order.distributorId._id : order.farmerId._id;
      const rateeName = AppState.currentUser.role === 'farmer' ? order.distributorId.name : order.farmerId.name;
      
      ratingHtml = `
        <div style="margin-top:var(--space-6);padding:var(--space-4);background:var(--gray-50);border-radius:var(--radius-md)">
          <h4 style="margin-bottom:var(--space-2)">Rate ${rateeName}</h4>
          <form id="rating-form" onsubmit="submitRating(event, '${order._id}', '${rateeId}')">
            <select id="rating-score" class="form-select" style="margin-bottom:var(--space-2)" required>
              <option value="">Select Score</option>
              <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
              <option value="4">⭐⭐⭐⭐ (4/5)</option>
              <option value="3">⭐⭐⭐ (3/5)</option>
              <option value="2">⭐⭐ (2/5)</option>
              <option value="1">⭐ (1/5)</option>
            </select>
            <textarea id="rating-review" class="form-textarea" placeholder="Leave a short review..." style="margin-bottom:var(--space-2)"></textarea>
            <button type="submit" class="btn btn-sm btn-primary">Submit Rating</button>
          </form>
        </div>
      `;
    }

    const modalHtml = `
      <div class="modal-overlay" id="order-modal">
        <div class="modal-content animate-fade-in-up" style="max-width:600px">
          <div class="modal-header">
            <h3>Order #${order._id.slice(-6)}</h3>
            <button class="btn btn-ghost" onclick="document.getElementById('order-modal').remove()">✕</button>
          </div>
          <div class="modal-body">
            <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-4)">
              <div><strong>Crop:</strong> ${order.listingId?.cropType}</div>
              <div><strong>Amount:</strong> ${formatCurrency(order.totalAmount)}</div>
              <div><span class="${getStatusBadge(order.status)}">${formatStatus(order.status)}</span></div>
            </div>
            
            <h4>Order Timeline</h4>
            <div style="margin-top:var(--space-4);border-left:2px solid var(--gray-200);padding-left:var(--space-4)">
              ${order.timeline.map(t => `
                <div style="margin-bottom:var(--space-3);position:relative">
                  <div style="position:absolute;left:-25px;width:12px;height:12px;border-radius:50%;background:var(--primary-500);top:4px"></div>
                  <div style="font-weight:600;font-size:var(--text-sm)">${formatStatus(t.status)}</div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted)">${formatDate(t.timestamp)}</div>
                  ${t.note ? `<div style="font-size:var(--text-sm);margin-top:var(--space-1)">${t.note}</div>` : ''}
                </div>
              `).join('')}
            </div>
            
            ${actionsHtml ? `<div style="margin-top:var(--space-4)">${actionsHtml}</div>` : ''}
            ${ratingHtml}
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.updateOrderStatus = async function (orderId, newStatus) {
  try {
    await api.patch(`/orders/${orderId}/status`, { status: newStatus });
    showToast('Order status updated', 'success');
    document.getElementById('order-modal')?.remove();
    viewOrder(orderId); // refresh modal
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.submitRating = async function (e, orderId, rateeId) {
  e.preventDefault();
  try {
    await api.post('/ratings', {
      orderId,
      rateeId,
      score: Number(document.getElementById('rating-score').value),
      review: document.getElementById('rating-review').value
    });
    showToast('Rating submitted successfully!', 'success');
    document.getElementById('rating-form').innerHTML = '<div style="color:var(--success-600);font-weight:600">✅ Rating submitted</div>';
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.openFacilityModal = function () {
  const modalHtml = `
    <div class="modal-overlay" id="facility-modal">
      <div class="modal-content animate-fade-in-up" style="max-width:600px">
        <div class="modal-header">
          <h3>Add New Cold Storage Facility</h3>
          <button class="btn btn-ghost" onclick="document.getElementById('facility-modal').remove()">✕</button>
        </div>
        <div class="modal-body">
          <form id="facility-form" onsubmit="handleCreateFacility(event)">
            <div class="form-group">
              <label class="form-label" for="fac-name">Facility Name</label>
              <input class="form-input" type="text" id="fac-name" placeholder="e.g., CoolTech Storage Delhi" required />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
              <div class="form-group">
                <label class="form-label" for="fac-capacity">Total Capacity (tons)</label>
                <input class="form-input" type="number" id="fac-capacity" placeholder="Capacity" required min="10" />
              </div>
              <div class="form-group">
                <label class="form-label" for="fac-price">Price (₹/ton/day)</label>
                <input class="form-input" type="number" id="fac-price" placeholder="Price" required min="1" step="0.5" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="fac-features">Features (comma separated)</label>
              <input class="form-input" type="text" id="fac-features" placeholder="e.g., Temperature Controlled, 24/7 Security" />
            </div>
            <button type="submit" class="btn btn-primary btn-lg" id="create-fac-btn">
              Create Facility
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.handleCreateFacility = async function (e) {
  e.preventDefault();
  const btn = document.getElementById('create-fac-btn');
  btn.innerHTML = '<span class="spinner"></span> Creating...';
  btn.disabled = true;

  try {
    const featuresInput = document.getElementById('fac-features').value;
    const features = featuresInput ? featuresInput.split(',').map(s => s.trim()) : [];

    await api.post('/storage', {
      name: document.getElementById('fac-name').value,
      totalCapacity: Number(document.getElementById('fac-capacity').value),
      pricePerTon: Number(document.getElementById('fac-price').value),
      features,
    });

    showToast('Facility created successfully!', 'success');
    document.getElementById('facility-modal')?.remove();
    navigate('/storage/dashboard');
  } catch (error) {
    btn.innerHTML = 'Create Facility';
    btn.disabled = false;
    showToast(error.message, 'error');
  }
};

window.handleToggleFacility = async function (id, isAvailable) {
  try {
    await api.put(`/storage/${id}`, { isAvailable });
    showToast('Facility availability updated', 'success');
    navigate('/storage/dashboard');
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.openProfileModal = function () {
  const user = AppState.currentUser;
  const modalHtml = `
    <div class="modal-overlay" id="profile-modal">
      <div class="modal-content animate-fade-in-up" style="max-width:500px">
        <div class="modal-header">
          <h3>👤 Edit Profile</h3>
          <button class="btn btn-ghost" onclick="document.getElementById('profile-modal').remove()">✕</button>
        </div>
        <div class="modal-body">
          <form id="profile-form" onsubmit="handleUpdateProfile(event)">
            <div class="form-group">
              <label class="form-label" for="prof-name">Full Name</label>
              <input class="form-input" type="text" id="prof-name" value="${user.name}" required />
            </div>
            <div class="form-group">
              <label class="form-label" for="prof-phone">Phone Number</label>
              <input class="form-input" type="tel" id="prof-phone" value="${user.phone || ''}" />
            </div>
            <button type="submit" class="btn btn-primary btn-lg" id="update-prof-btn">
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.handleUpdateProfile = async function (e) {
  e.preventDefault();
  const btn = document.getElementById('update-prof-btn');
  btn.innerHTML = '<span class="spinner"></span> Saving...';
  btn.disabled = true;

  try {
    const data = await api.put('/auth/profile', {
      name: document.getElementById('prof-name').value,
      phone: document.getElementById('prof-phone').value,
    });
    
    // Update local storage user data
    const { currentUser } = await import('./auth.js');
    localStorage.setItem('agrilink_user', JSON.stringify(data.user));
    AppState.currentUser = data.user;
    
    showToast('Profile updated successfully!', 'success');
    document.getElementById('profile-modal')?.remove();
    navigate(window.location.hash.slice(1)); // refresh view
  } catch (error) {
    showToast(error.message || 'Failed to update profile', 'error');
    btn.innerHTML = 'Save Changes';
    btn.disabled = false;
  }
};

window.toggleNotifications = async function () {
  let panel = document.getElementById('notification-panel');
  if (panel) {
    panel.remove();
    return;
  }

  const notifIcons = { offer: '💰', order: '📦', booking: '❄️', system: '🔔' };

  const panelHtml = `
    <div id="notification-panel" class="notification-panel">
      <div class="notif-header">
        <h4>🔔 Notifications</h4>
        <div style="display:flex;gap:var(--space-2)">
          <button class="btn btn-ghost btn-sm" onclick="markAllRead()" title="Mark all as read">✓ All</button>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('notification-panel').remove()">✕</button>
        </div>
      </div>
      <div class="notif-list" id="notif-list"><div class="loading"><div class="loading-spinner"></div></div></div>
    </div>
  `;
  document.getElementById('main-navbar').insertAdjacentHTML('beforeend', panelHtml);

  try {
    const data = await api.get('/notifications/unread');
    const notifs = data.notifications || [];
    
    const list = document.getElementById('notif-list');
    if (notifs.length === 0) {
      list.innerHTML = '<div class="notif-empty">🎉 All caught up! No new notifications.</div>';
      return;
    }

    list.innerHTML = notifs.map(n => `
      <div class="notif-item" onclick="markNotifRead('${n._id}')">
        <div class="notif-icon ${n.type || 'system'}">${notifIcons[n.type] || '🔔'}</div>
        <div style="flex:1">
          <div class="notif-msg">${n.message}</div>
          <div class="notif-time">${timeAgo(n.createdAt)}</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    document.getElementById('notif-list').innerHTML = '<div class="notif-empty" style="color:var(--danger-500)">Failed to load notifications</div>';
  }
};

window.markAllRead = async function () {
  try {
    await api.patch('/notifications/read-all');
    document.getElementById('notification-panel')?.remove();
    pollNotifications();
    showToast('All notifications marked as read', 'success');
  } catch (e) {
    showToast('Failed to mark all as read', 'error');
  }
};

window.markNotifRead = async function (id) {
  try {
    await api.patch(`/notifications/${id}/read`);
    toggleNotifications(); // close
    pollNotifications(); // update badge
  } catch (e) {
    showToast('Failed to mark read', 'error');
  }
};
// --- Send Offer Handler ---
window.handleSendOffer = async function (e, listingId) {
  e.preventDefault();
  const btn = document.getElementById('send-offer-btn');
  btn.innerHTML = '<span class="spinner"></span> Sending...';
  btn.disabled = true;

  try {
    await api.post('/offers', {
      listingId,
      offeredPrice: Number(document.getElementById('offer-price').value),
      quantity: Number(document.getElementById('offer-qty').value),
      pickupDate: document.getElementById('offer-pickup').value,
      notes: document.getElementById('offer-notes').value,
    });

    showToast('Offer sent successfully!', 'success');
    document.getElementById('listing-modal')?.remove();
  } catch (error) {
    showToast(error.message || 'Failed to send offer', 'error');
    btn.innerHTML = 'Send Offer';
    btn.disabled = false;
  }
};

// --- Offer Accept/Reject Handler ---
window.handleOfferAction = async function (offerId, action) {
  try {
    await api.patch(`/offers/${offerId}/${action}`);
    showToast(`Offer ${action}ed successfully`, 'success');
    document.getElementById('listing-modal')?.remove();
    navigate(window.location.hash.slice(1)); // refresh dashboard
  } catch (error) {
    showToast(error.message, 'error');
  }
};

// --- Storage Booking Modal ---
window.openBookingModal = function (facilityId, facilityName, pricePerTon, availableCapacity) {
  const modalHtml = `
    <div class="modal-overlay" id="booking-modal">
      <div class="modal-content" style="max-width:500px">
        <div class="modal-header">
          <h3>📦 Book Storage — ${facilityName}</h3>
          <button class="btn btn-ghost" onclick="document.getElementById('booking-modal').remove()">✕</button>
        </div>
        <div class="modal-body">
          <form id="booking-form" onsubmit="handleCreateBooking(event, '${facilityId}')">
            <div class="form-group">
              <label class="form-label" for="book-qty">Quantity (tons)</label>
              <input class="form-input" type="number" id="book-qty" placeholder="e.g., 5" required min="1" max="${availableCapacity}" oninput="calcBookingCost(${pricePerTon})" />
              <div class="form-hint">Available: ${availableCapacity} tons</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
              <div class="form-group">
                <label class="form-label" for="book-start">Start Date</label>
                <input class="form-input" type="date" id="book-start" required onchange="calcBookingCost(${pricePerTon})" />
              </div>
              <div class="form-group">
                <label class="form-label" for="book-end">End Date</label>
                <input class="form-input" type="date" id="book-end" required onchange="calcBookingCost(${pricePerTon})" />
              </div>
            </div>
            <div style="padding:var(--space-4);background:var(--gray-50);border-radius:var(--radius-lg);margin-bottom:var(--space-5);text-align:center">
              <div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase;margin-bottom:var(--space-1)">Estimated Cost</div>
              <div id="booking-cost" style="font-family:var(--font-display);font-size:var(--text-2xl);font-weight:800;color:var(--primary-600)">₹ 0</div>
              <div style="font-size:var(--text-xs);color:var(--text-muted)" id="booking-breakdown">Enter details above to see estimate</div>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" id="create-booking-btn" style="width:100%">Confirm Booking</button>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.calcBookingCost = function (pricePerTon) {
  const qty = Number(document.getElementById('book-qty')?.value) || 0;
  const start = document.getElementById('book-start')?.value;
  const end = document.getElementById('book-end')?.value;

  if (qty && start && end) {
    const days = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)));
    const cost = days * qty * pricePerTon;
    document.getElementById('booking-cost').textContent = formatCurrency(cost);
    document.getElementById('booking-breakdown').textContent = `${qty} tons × ${days} days × ${formatCurrency(pricePerTon)}/ton/day`;
  }
};

window.handleCreateBooking = async function (e, facilityId) {
  e.preventDefault();
  const btn = document.getElementById('create-booking-btn');
  btn.innerHTML = '<span class="spinner"></span> Booking...';
  btn.disabled = true;

  try {
    await api.post('/bookings', {
      facilityId,
      quantity: Number(document.getElementById('book-qty').value),
      startDate: document.getElementById('book-start').value,
      endDate: document.getElementById('book-end').value,
    });

    showToast('Booking request sent! The facility owner will confirm soon.', 'success');
    document.getElementById('booking-modal')?.remove();
  } catch (error) {
    showToast(error.message || 'Failed to create booking', 'error');
    btn.innerHTML = 'Confirm Booking';
    btn.disabled = false;
  }
};

// --- Report Modal ---
window.openReportModal = function (targetType, targetId) {
  const modalHtml = `
    <div class="modal-overlay" id="report-modal">
      <div class="modal-content" style="max-width:450px">
        <div class="modal-header">
          <h3>🚩 Report</h3>
          <button class="btn btn-ghost" onclick="document.getElementById('report-modal').remove()">✕</button>
        </div>
        <div class="modal-body">
          <form id="report-form" onsubmit="handleSubmitReport(event, '${targetType}', '${targetId}')">
            <div class="form-group">
              <label class="form-label">Reason</label>
              <select class="form-select" id="report-reason" required>
                <option value="">Select a reason...</option>
                <option value="Fake listing">Fake listing</option>
                <option value="Misleading price">Misleading price</option>
                <option value="Suspicious activity">Suspicious activity</option>
                <option value="Spam">Spam</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Description (optional)</label>
              <textarea class="form-textarea" id="report-desc" placeholder="Provide more details..."></textarea>
            </div>
            <button type="submit" class="btn btn-danger" id="submit-report-btn" style="width:100%">Submit Report</button>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.handleSubmitReport = async function (e, targetType, targetId) {
  e.preventDefault();
  const btn = document.getElementById('submit-report-btn');
  btn.innerHTML = '<span class="spinner"></span> Submitting...';
  btn.disabled = true;

  try {
    await api.post('/reports', {
      targetType,
      targetId,
      reason: document.getElementById('report-reason').value,
      description: document.getElementById('report-desc').value,
    });

    showToast('Report submitted. Our team will review it.', 'success');
    document.getElementById('report-modal')?.remove();
  } catch (error) {
    showToast(error.message || 'Failed to submit report', 'error');
    btn.innerHTML = 'Submit Report';
    btn.disabled = false;
  }
};

// --- Forgot Password Modal ---
window.openForgotPasswordModal = function () {
  const modalHtml = `
    <div class="modal-overlay" id="forgot-modal">
      <div class="modal-content" style="max-width:420px">
        <div class="modal-header">
          <h3>🔑 Reset Password</h3>
          <button class="btn btn-ghost" onclick="document.getElementById('forgot-modal').remove()">✕</button>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-4)">Enter your registered email. We'll send you a reset link.</p>
          <form id="forgot-form" onsubmit="handleForgotPassword(event)">
            <div class="form-group">
              <label class="form-label" for="forgot-email">Email Address</label>
              <input class="form-input" type="email" id="forgot-email" placeholder="you@example.com" required />
            </div>
            <button type="submit" class="btn btn-primary btn-lg" id="forgot-btn" style="width:100%">Send Reset Link</button>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.handleForgotPassword = async function (e) {
  e.preventDefault();
  const btn = document.getElementById('forgot-btn');
  btn.innerHTML = '<span class="spinner"></span> Sending...';
  btn.disabled = true;

  try {
    await api.post('/auth/reset-password', {
      email: document.getElementById('forgot-email').value,
    });
    showToast('If the email exists, a reset link has been sent.', 'success');
    document.getElementById('forgot-modal')?.remove();
  } catch (error) {
    showToast(error.message || 'Something went wrong', 'error');
    btn.innerHTML = 'Send Reset Link';
    btn.disabled = false;
  }
};

// --- Marketplace Filters ---
window.applyListingFilters = async function () {
  const crop = document.getElementById('filter-crop')?.value;
  const minPrice = document.getElementById('filter-min-price')?.value;
  const maxPrice = document.getElementById('filter-max-price')?.value;
  const urgency = document.getElementById('filter-urgency')?.value;

  let query = 'status=active&limit=50';
  if (crop) query += `&cropType=${encodeURIComponent(crop)}`;
  if (minPrice) query += `&minPrice=${minPrice}`;
  if (maxPrice) query += `&maxPrice=${maxPrice}`;
  if (urgency) query += `&urgency=${urgency}`;

  const container = document.getElementById('listings-container');
  container.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';

  try {
    const data = await api.get(`/listings?${query}`);
    if (data.listings.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">No listings match your filters</div></div>';
      return;
    }
    container.innerHTML = `
      <div class="listings-grid">
        ${data.listings.map(listing => `
          <div class="listing-card" onclick="viewListing('${listing._id}')">
            <div class="listing-image" style="background:${getGradientForCrop(listing.cropType)}">
              ${listing.imageUrls?.length ? `<img src="${listing.imageUrls[0]}" alt="${listing.cropType}">` : `<span>${getCropEmoji(listing.cropType)}</span>`}
              <div style="position:absolute;top:var(--space-3);right:var(--space-3)">
                <span class="${getUrgencyBadge(listing.urgency)}">${getUrgencyLabel(listing.urgency)}</span>
              </div>
            </div>
            <div class="listing-content">
              <div class="listing-crop">${getCropEmoji(listing.cropType)} ${listing.cropType}</div>
              <div class="listing-farmer">${listing.farmerId?.name || 'Unknown'} ${listing.farmerId?.isVerified ? '<span class="verified-badge"></span>' : ''}</div>
              <div class="listing-details">
                <div class="listing-detail"><span class="listing-detail-label">Quantity</span><span class="listing-detail-value">${formatQuantity(listing.quantity, listing.unit)}</span></div>
                <div class="listing-detail"><span class="listing-detail-label">Price</span><span class="listing-detail-value">${formatCurrency(listing.expectedPrice)}/${listing.unit}</span></div>
                <div class="listing-detail"><span class="listing-detail-label">Harvest</span><span class="listing-detail-value">${formatDate(listing.harvestDate)}</span></div>
                <div class="listing-detail"><span class="listing-detail-label">Posted</span><span class="listing-detail-value">${timeAgo(listing.createdAt)}</span></div>
              </div>
              <div class="listing-footer">
                <span class="${getStatusBadge(listing.status)}">${formatStatus(listing.status)}</span>
                <span style="font-size:var(--text-sm);color:var(--primary-600);font-weight:600">View Details →</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Failed to load</div><div class="empty-description">${error.message}</div></div>`;
  }
};

window.applyStorageFilters = async function () {
  const maxPrice = document.getElementById('filter-storage-price')?.value;
  const minCap = document.getElementById('filter-storage-cap')?.value;

  let query = 'available=true&limit=50';
  if (maxPrice) query += `&maxPrice=${maxPrice}`;
  if (minCap) query += `&minCapacity=${minCap}`;

  const container = document.getElementById('storage-container');
  container.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';

  try {
    const data = await api.get(`/storage?${query}`);
    if (data.facilities.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">No facilities match your filters</div></div>';
      return;
    }
    container.innerHTML = `
      <div class="listings-grid">
        ${data.facilities.map(f => {
          const pct = getCapacityPercent(f.usedCapacity, f.totalCapacity);
          const avail = f.totalCapacity - f.usedCapacity;
          return `
            <div class="facility-card">
              <div class="facility-header">
                <div>
                  <div class="facility-name">❄️ ${f.name}</div>
                  <div style="font-size:var(--text-sm);color:var(--text-muted);margin-top:var(--space-1)">${f.address || 'Location not specified'}</div>
                </div>
                <span class="badge ${f.isAvailable ? 'badge-success' : 'badge-neutral'}">${f.isAvailable ? 'Available' : 'Full'}</span>
              </div>
              <div class="capacity-bar"><div class="capacity-fill" style="width:${pct}%;background:${pct >= 90 ? 'var(--danger-500)' : pct >= 70 ? 'var(--accent-500)' : 'var(--primary-500)'}"></div></div>
              <div style="display:flex;justify-content:space-between;font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-4)"><span>${avail} tons available</span><span>${pct}% utilized</span></div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-4)">
                <div><div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase">Capacity</div><div style="font-weight:600">${f.totalCapacity} tons</div></div>
                <div><div style="font-size:var(--text-xs);color:var(--text-muted);text-transform:uppercase">Price</div><div style="font-weight:600">${formatCurrency(f.pricePerTon)}/ton/day</div></div>
              </div>
              ${f.features?.length ? `<div style="display:flex;flex-wrap:wrap;gap:var(--space-2);margin-bottom:var(--space-4)">${f.features.map(feat => `<span class="badge badge-info">${feat}</span>`).join('')}</div>` : ''}
              ${f.isAvailable && isLoggedIn() ? `<button class="btn btn-primary btn-sm" style="width:100%" onclick="openBookingModal('${f._id}', '${f.name.replace(/'/g, "\\'")}', ${f.pricePerTon}, ${avail})">📦 Book Now</button>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (error) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Failed to load</div></div>`;
  }
};

window.toggleSidebar = function () {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('open');
};

window.toggleUserDropdown = function () {
  const menu = document.getElementById('user-dropdown-menu');
  if (menu) menu.classList.toggle('active');
};

// Remove the old toggleNotifications
// The new one is defined above

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('#user-dropdown')) {
    const menu = document.getElementById('user-dropdown-menu');
    if (menu) menu.classList.remove('active');
  }
});

// ==========================================
// ROUTER — Navigate
// ==========================================
const pageRenderers = {
  'landing': renderLanding,
  'login': renderLogin,
  'register': renderRegister,
  'marketplace': renderMarketplace,
  'storage-marketplace': renderStorageMarketplace,
  'farmer-dashboard': renderFarmerDashboard,
  'farmer-new-listing': renderFarmerNewListing,
  'distributor-dashboard': renderDistributorDashboard,
  'distributor-new-requirement': renderDistributorNewRequirement,
  'storage-dashboard': renderStorageDashboard,
  'admin-dashboard': renderAdminDashboard,
};

async function navigate(path) {
  const route = routes[path];

  if (!route) {
    // Default to landing or dashboard
    if (isLoggedIn()) {
      window.location.hash = getDashboardRoute(AppState.currentUser?.role);
    } else {
      window.location.hash = '#/';
    }
    return;
  }

  // Auth guard
  if (route.auth && !isLoggedIn()) {
    showToast('Please login to access this page', 'warning');
    window.location.hash = '#/login';
    return;
  }

  // Role guard
  if (route.role && AppState.currentUser?.role !== route.role) {
    showToast('Access denied for your role', 'error');
    window.location.hash = getDashboardRoute(AppState.currentUser?.role);
    return;
  }

  // Redirect logged-in users from auth pages
  if ((path === '/login' || path === '/register') && isLoggedIn()) {
    window.location.hash = getDashboardRoute(AppState.currentUser?.role);
    return;
  }

  AppState.currentPage = route.page;

  const renderer = pageRenderers[route.page];
  if (renderer) {
    const app = document.getElementById('app');
    app.style.opacity = '0';
    const html = await renderer();
    app.innerHTML = html;
    requestAnimationFrame(() => {
      app.style.transition = 'opacity 0.2s ease';
      app.style.opacity = '1';
    });

    // Start notification polling for authenticated pages
    if (isLoggedIn()) {
      startNotificationPolling();
    }
  }
}

// ==========================================
// THEME TOGGLE
// ==========================================
window.toggleTheme = function () {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('agrilink_theme', next);
  // Re-render to update the icon
  const hash = window.location.hash.slice(1) || '/';
  navigate(hash);
};

// ==========================================
// IMAGE UPLOAD PREVIEW
// ==========================================
window.handleImagePreview = function (input) {
  const previews = document.getElementById('image-previews');
  if (!previews) return;
  
  Array.from(input.files).forEach((file, i) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement('div');
      div.className = 'upload-preview';
      div.innerHTML = `<img src="${e.target.result}" alt="Preview" /><button class="remove-btn" onclick="this.parentElement.remove()">✕</button>`;
      previews.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
};

// Drag-and-drop for upload zone
document.addEventListener('dragover', (e) => {
  const zone = document.getElementById('upload-zone');
  if (zone && zone.contains(e.target)) {
    e.preventDefault();
    zone.classList.add('dragover');
  }
});
document.addEventListener('dragleave', (e) => {
  const zone = document.getElementById('upload-zone');
  if (zone) zone.classList.remove('dragover');
});
document.addEventListener('drop', (e) => {
  const zone = document.getElementById('upload-zone');
  if (zone && zone.contains(e.target)) {
    e.preventDefault();
    zone.classList.remove('dragover');
    const input = document.getElementById('crop-images');
    if (input) {
      input.files = e.dataTransfer.files;
      handleImagePreview(input);
    }
  }
});

// ==========================================
// EDIT LISTING MODAL
// ==========================================
window.openEditListingModal = function (id, cropType, quantity, unit, price, urgency, description) {
  const modalHtml = `
    <div class="modal-overlay" id="edit-listing-modal">
      <div class="modal-content animate-fade-in-up" style="max-width:600px">
        <div class="modal-header">
          <h3>✏️ Edit Listing</h3>
          <button class="btn btn-ghost" onclick="document.getElementById('edit-listing-modal').remove()">✕</button>
        </div>
        <div class="modal-body">
          <form id="edit-listing-form" onsubmit="handleEditListing(event, '${id}')">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
              <div class="form-group">
                <label class="form-label">Crop Type</label>
                <input class="form-input" type="text" id="edit-crop-type" value="${cropType}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Quantity</label>
                <input class="form-input" type="number" id="edit-crop-qty" value="${quantity}" required min="0.1" step="0.1" />
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-4)">
              <div class="form-group">
                <label class="form-label">Unit</label>
                <select class="form-select" id="edit-crop-unit">
                  <option value="kg" ${unit === 'kg' ? 'selected' : ''}>Kilograms</option>
                  <option value="quintal" ${unit === 'quintal' ? 'selected' : ''}>Quintal</option>
                  <option value="ton" ${unit === 'ton' ? 'selected' : ''}>Tons</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Expected Price (₹/unit)</label>
                <input class="form-input" type="number" id="edit-crop-price" value="${price}" required min="0" step="0.01" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Urgency</label>
              <select class="form-select" id="edit-crop-urgency">
                <option value="low" ${urgency === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${urgency === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${urgency === 'high' ? 'selected' : ''}>High</option>
                <option value="critical" ${urgency === 'critical' ? 'selected' : ''}>Critical</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-textarea" id="edit-crop-desc">${description}</textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" id="edit-listing-btn">Save Changes</button>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
};

window.handleEditListing = async function (e, id) {
  e.preventDefault();
  const btn = document.getElementById('edit-listing-btn');
  btn.innerHTML = '<span class="spinner"></span> Saving...';
  btn.disabled = true;
  try {
    await api.put(`/listings/${id}`, {
      cropType: document.getElementById('edit-crop-type').value,
      quantity: Number(document.getElementById('edit-crop-qty').value),
      unit: document.getElementById('edit-crop-unit').value,
      expectedPrice: Number(document.getElementById('edit-crop-price').value),
      urgency: document.getElementById('edit-crop-urgency').value,
      description: document.getElementById('edit-crop-desc').value,
    });
    showToast('Listing updated!', 'success');
    document.getElementById('edit-listing-modal')?.remove();
    navigate('/farmer/dashboard');
  } catch (error) {
    btn.innerHTML = 'Save Changes';
    btn.disabled = false;
    showToast(error.message || 'Failed to update', 'error');
  }
};

window.handleDeleteListing = async function (id, cropType) {
  if (!confirm(`Delete your ${cropType} listing? This cannot be undone.`)) return;
  try {
    await api.delete(`/listings/${id}`);
    showToast('Listing deleted', 'success');
    navigate('/farmer/dashboard');
  } catch (error) {
    showToast(error.message || 'Failed to delete', 'error');
  }
};

// ==========================================
// INIT
// ==========================================
function init() {
  // Restore theme from localStorage
  const savedTheme = localStorage.getItem('agrilink_theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  // Refresh AppState
  AppState.currentUser = getCurrentUser();
  AppState.token = localStorage.getItem('agrilink_token');

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1) || '/';
    navigate(hash);
  });

  // Initial navigate
  const hash = window.location.hash.slice(1) || '/';
  navigate(hash);
}

// Start the app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
