/**
 * navbar.js — Application Navigation Bar
 *
 * Responsibility:
 *   Renders top navbar and sidebar navigation.
 *   Highlights active route. Emits navigation events.
 *   Full implementation in Phase 5.
 *
 * Depends on: eventBus.js, router.js (for route list)
 */

import { eventBus } from '../js/eventBus.js';
import { stateManager } from '../js/stateManager.js';

// Navigation structure — mirrors router ROUTES
const NAV_STRUCTURE = [
  {
    section: 'Protocol Headers',
    items: [
      { route: '/ipv4-header', icon: '📦', label: 'IPv4 Header Game' },
      { route: '/ethernet-frame', icon: '🔗', label: 'Ethernet Frame' },
      { route: '/osi-tcpip', icon: '📚', label: 'OSI / TCP-IP' },
      { route: '/ip-classes', icon: '🗂', label: 'IP Classes' },
    ]
  },
  {
    section: 'Simulations',
    items: [
      { route: '/packet-journey', icon: '🚀', label: 'Packet Journey' },
      { route: '/ttl-simulation', icon: '⏱', label: 'TTL Simulation' },
      { route: '/arp-simulation', icon: '📡', label: 'ARP Simulator' },
      { route: '/mac-table', icon: '🔀', label: 'MAC Table' },
      { route: '/routing-table', icon: '🗺', label: 'Routing Table' },
    ]
  },
  {
    section: 'Subnetting',
    items: [
      { route: '/subnet-practice', icon: '🧮', label: 'Subnet Practice' },
      { route: '/vlsm-design', icon: '📐', label: 'VLSM Design' },
      { route: '/subnet-calculator', icon: '🔢', label: 'Calculator' },
    ]
  },
  {
    section: 'Exam & Resources',
    items: [
      { route: '/exam', icon: '📝', label: 'CCNA Exam Mode' },
      { route: '/resources', icon: '📖', label: 'Resource Library' },
    ]
  },
];

class Navbar {
  constructor() {
    this._navbarRoot = null;
    this._sidebarRoot = null;
    this._currentRoute = '/';
    this._routeUnsub = null;
    this._progressUnsub = null;
    this._sidebarUnsub = null;
  }

  init() {
    this._navbarRoot = document.getElementById('navbar-root');
    this._sidebarRoot = document.getElementById('sidebar-root');

    if (!this._navbarRoot || !this._sidebarRoot) {
      console.error('[Navbar] Mount points not found');
      return;
    }

    this._renderNavbar();
    this._renderSidebar();
    this._bindEvents();

    // Highlight the initial active route
    const initial = stateManager.getState('currentRoute');
    this._setActiveLink(initial || '/');
  }

  _renderNavbar() {
    this._navbarRoot.innerHTML = `
      <nav class="navbar">
        <a href="#/" class="navbar__brand">
          <svg width="200" height="46" viewBox="0 0 520 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="navbar__logo-svg">
            <defs>
              <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <linearGradient id="node-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#22D3EE"/>
                <stop offset="100%" stop-color="#38BDF8"/>
              </linearGradient>
            </defs>
            <g class="logo-group" style="cursor:pointer;">
              <g transform="translate(10, 10)">
                <rect class="logo-bg" width="100" height="100" rx="20" fill="#020617" style="transition:all 0.3s ease;"></rect>
                
                <g class="routing-line-group" stroke="#1E293B" stroke-width="2.5" stroke-linecap="round">
                  <path class="route-line route-line-1" d="M50 20V80"></path>
                  <path class="route-line route-line-2" d="M20 50H80"></path>
                  <path class="route-line route-line-3" d="M30 30L70 70"></path>
                  <path class="route-line route-line-4" d="M70 30L30 70"></path>
                </g>

                <g stroke="#38BDF8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" filter="url(#logo-glow)">
                  <path d="M30 70V30L50 50L70 30V70" class="routing-line transition-colors duration-300"></path>
                  <path d="M30 50H70" stroke="#22D3EE" opacity="0.5"></path>
                </g>

                <g fill="#1E293B" class="nodes">
                  <circle cx="50" cy="50" r="6" fill="url(#node-gradient)" class="node central-node"></circle>
                  <circle cx="30" cy="30" r="4" class="node satellite-node"></circle>
                  <circle cx="70" cy="30" r="4" class="node satellite-node"></circle>
                  <circle cx="30" cy="70" r="4" class="node satellite-node"></circle>
                  <circle cx="70" cy="70" r="4" class="node satellite-node"></circle>
                  <circle cx="50" cy="20" r="3" fill="#38BDF8" class="node"></circle>
                  <circle cx="50" cy="80" r="3" fill="#38BDF8" class="node"></circle>
                </g>
              </g>

              <text x="130" y="68" font-family="'Plus Jakarta Sans', sans-serif" font-size="52" font-weight="800" fill="#FFFFFF" letter-spacing="-0.03em" class="logo-text">
                Net<tspan fill="#22D3EE" class="logo-highlight">Learn</tspan><tspan fill="#FFFFFF">Hub</tspan>
              </text>
              
              <text x="133" y="92" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700" fill="#475569" letter-spacing="0.4em" class="logo-subtext">
                NETWORK.TOPOLOGY.ENGINE
              </text>
            </g>
          </svg>
        </a>

        <div class="navbar__search">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input type="text" class="search-input" placeholder="Search modules, topics..." id="navbar-search">
          <kbd class="search-kbd">⌘K</kbd>
          <div class="search-results" id="search-results"></div>
        </div>

        <div class="navbar__actions">
          <div class="navbar__status">
            <div class="status-dot"></div>
            <span class="status-text">CCNA Study Platform</span>
          </div>
          <a href="#/exam" class="btn btn-primary navbar__exam-btn">
            📝 Exam Mode
          </a>
          <div class="navbar__profile" id="navbar-profile">
            <button class="profile-trigger" id="profile-trigger">
              <div class="profile-avatar">S</div>
              <svg class="profile-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div class="profile-dropdown" id="profile-dropdown">
              <div class="profile-header">
                <div class="profile-avatar-lg">S</div>
                <div class="profile-info">
                  <div class="profile-name">Student</div>
                  <div class="profile-email">student@netlearn.local</div>
                </div>
              </div>
              <hr class="profile-divider">
              <a href="#/profile" class="profile-menu-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                My Profile
              </a>
              <a href="#/progress" class="profile-menu-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                Progress
              </a>
              <a href="#/settings" class="profile-menu-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
                </svg>
                Settings
              </a>
              <hr class="profile-divider">
              <button class="profile-menu-item profile-logout">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Sign Out
              </button>
            </div>
          </div>
          <button class="navbar__toggle" id="sidebar-toggle" aria-label="Toggle sidebar" aria-controls="sidebar-root" aria-expanded="${stateManager.getState('sidebarOpen') ? 'true' : 'false'}">
            ☰
          </button>
        </div>
      </nav>
    `;

    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      const isOpen = stateManager.getState('sidebarOpen');
      stateManager.setState('sidebarOpen', !isOpen);
    });

    this._initSearch();
    this._initProfileDropdown();
    this._initLogoAnimations();
  }

  _renderSidebar() {
    const sectionsHtml = NAV_STRUCTURE.map(section => `
      <div class="sidebar__section">
        <div class="sidebar__section-label">${section.section}</div>
        ${section.items.map(item => `
          <a href="#${item.route}"
             class="sidebar__nav-item"
             data-route="${item.route}">
            <span class="sidebar__icon">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        `).join('')}
      </div>
      <hr class="sidebar__divider" />
    `).join('');

    this._sidebarRoot.innerHTML = `
      <nav class="sidebar">
        <div class="sidebar__section" style="padding: 0.5rem 0 0.25rem;">
          <a href="#/" class="sidebar__nav-item" data-route="/">
            <span class="sidebar__icon">🏠</span>
            <span>Dashboard</span>
          </a>
        </div>
        <hr class="sidebar__divider" />
        ${sectionsHtml}
      </nav>
    `;
  }

  _setActiveLink(route) {
    this._currentRoute = route;
    const allLinks = document.querySelectorAll('.sidebar__nav-item');
    allLinks.forEach(link => {
      const linkRoute = link.getAttribute('data-route');
      link.classList.toggle('is-active', linkRoute === route);
    });
  }

  _bindEvents() {
    // Update active link whenever route changes
    this._routeUnsub = stateManager.subscribe('currentRoute', (route) => {
      this._setActiveLink(route);
    });

    // Update completion dots when progress changes
    this._progressUnsub = stateManager.subscribe('userProgress', () => {
      this._updateCompletionDots();
    });

    // Update sidebar toggle ARIA state
    this._sidebarUnsub = stateManager.subscribe('sidebarOpen', (isOpen) => {
      const toggle = document.getElementById('sidebar-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Set initial completion dots
    this._updateCompletionDots();
  }

  _updateCompletionDots() {
    const progress = stateManager.getState('userProgress');
    const completed = new Set(progress.completedModules || []);
    document.querySelectorAll('.sidebar__nav-item[data-route]').forEach(link => {
      const route = link.getAttribute('data-route');
      link.setAttribute('data-completed', completed.has(route));
    });
  }

  _initSearch() {
    const searchInput = document.getElementById('navbar-search');
    const searchResults = document.getElementById('search-results');
    if (!searchInput || !searchResults) return;

    const searchItems = [
      { route: '/ipv4-header', label: 'IPv4 Header Game', category: 'Protocol Headers' },
      { route: '/ethernet-frame', label: 'Ethernet Frame', category: 'Protocol Headers' },
      { route: '/osi-tcpip', label: 'OSI / TCP-IP', category: 'Protocol Headers' },
      { route: '/ip-classes', label: 'IP Classes', category: 'Protocol Headers' },
      { route: '/packet-journey', label: 'Packet Journey', category: 'Simulations' },
      { route: '/ttl-simulation', label: 'TTL Simulation', category: 'Simulations' },
      { route: '/arp-simulation', label: 'ARP Simulator', category: 'Simulations' },
      { route: '/mac-table', label: 'MAC Table', category: 'Simulations' },
      { route: '/routing-table', label: 'Routing Table', category: 'Simulations' },
      { route: '/subnet-practice', label: 'Subnet Practice', category: 'Subnetting' },
      { route: '/vlsm-design', label: 'VLSM Design', category: 'Subnetting' },
      { route: '/subnet-calculator', label: 'Subnet Calculator', category: 'Subnetting' },
      { route: '/exam', label: 'CCNA Exam Mode', category: 'Exam' },
      { route: '/resources', label: 'Resource Library', category: 'Resources' },
    ];

    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = e.target.value.toLowerCase().trim();
        if (query.length < 2) {
          searchResults.classList.remove('active');
          return;
        }
        const results = searchItems.filter(item => 
          item.label.toLowerCase().includes(query) || 
          item.category.toLowerCase().includes(query)
        ).slice(0, 6);
        
        if (results.length > 0) {
          searchResults.innerHTML = results.map(item => `
            <a href="#${item.route}" class="search-result-item">
              <span class="search-result-icon">📄</span>
              <div class="search-result-content">
                <span class="search-result-label">${item.label}</span>
                <span class="search-result-category">${item.category}</span>
              </div>
            </a>
          `).join('');
          searchResults.classList.add('active');
        } else {
          searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
          searchResults.classList.add('active');
        }
      }, 150);
    });

    searchInput.addEventListener('blur', () => {
      setTimeout(() => searchResults.classList.remove('active'), 200);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length >= 2) {
        searchResults.classList.add('active');
      }
    });

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  _initProfileDropdown() {
    const trigger = document.getElementById('profile-trigger');
    const dropdown = document.getElementById('profile-dropdown');
    if (!trigger || !dropdown) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('active');
      trigger.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('active');
      trigger.classList.remove('active');
    });

    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  _initLogoAnimations() {
    const svg = document.querySelector('.navbar__logo-svg');
    if (!svg) return;

    svg.addEventListener('mouseenter', () => {
      svg.classList.add('hovered');
    });

    svg.addEventListener('mouseleave', () => {
      svg.classList.remove('hovered');
    });
  }

  destroy() {
    if (this._routeUnsub) this._routeUnsub();
    if (this._progressUnsub) this._progressUnsub();
    if (this._sidebarUnsub) this._sidebarUnsub();
  }
}

export const navbar = new Navbar();
