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
          <div class="navbar__logo">NL</div>
          <span class="navbar__title">Net<span>Learn</span></span>
        </a>

        <div class="navbar__actions">
          <div class="flex items-center gap-4" style="font-size:0.8125rem; color:var(--color-text-muted); font-family:var(--font-mono);">
            <div class="status-dot"></div>
            <span>CCNA Study Platform</span>
          </div>
          <a href="#/exam" class="btn btn-primary" style="padding:0.3rem 1rem; font-size:0.75rem;">
            📝 Exam Mode
          </a>
          <button class="navbar__toggle" id="sidebar-toggle" aria-label="Toggle sidebar">
            ☰
          </button>
        </div>
      </nav>
    `;

    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      const isOpen = stateManager.getState('sidebarOpen');
      stateManager.setState('sidebarOpen', !isOpen);
    });
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

  destroy() {
    if (this._routeUnsub) this._routeUnsub();
    if (this._progressUnsub) this._progressUnsub();
  }
}

export const navbar = new Navbar();
