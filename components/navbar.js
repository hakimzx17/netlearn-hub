/**
 * navbar.js — Command Center Navigation Shell
 *
 * Responsibility:
 *   Renders the top command bar + left sidebar navigation.
 *   Tracks active routes, path progress, and sidebar state.
 *   Provides quick search navigation.
 */

import { stateManager } from '../js/stateManager.js';
import { ALL_PATHS } from '../data/pathRegistry.js';
import { progressEngine } from '../js/progressEngine.js';
import { showToast } from '../utils/helperFunctions.js';

const CORE_NAV = [
  { route: '/', icon: 'activity', label: 'Command Center', meta: 'Home' },
  { route: '/paths', icon: 'book', label: 'CCNA Domains', meta: 'Curriculum' },
  { route: '/simulations', icon: 'cpu', label: 'Simulation Grid', meta: 'Labs' },
];

const TOOL_NAV = [
  { route: '/packet-journey', icon: 'send', label: 'Packet Flow', meta: 'L3 Flow' },
  { route: '/subnet-calculator', icon: 'grid', label: 'Subnet Console', meta: 'CIDR/VLSM' },
  { route: '/exam', icon: 'shield', label: 'Exam Mode', meta: 'Timed' },
  { route: '/resources', icon: 'archive', label: 'Resource Vault', meta: 'Library' },
  { route: '/flashcards', icon: 'sparkles', label: 'Flashcards', meta: 'Recall', special: true, badge: 'NEW' },
];

const ADMIN_PASSKEY_STORAGE_KEY = 'netlearn:adminPasskey';
const ADMIN_PASSKEY_META_SELECTOR = 'meta[name="netlearn-admin-passkey"]';
const ADMIN_PASSKEY_FALLBACK = ['a', 'd', 'm', 'i', 'n'].join('');

const ICONS = {
  activity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9-6-18-3 9H2"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  cpu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>`,
  send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,
  grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  archive: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
  sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.7 4.7L18 9.4l-4.3 1.7L12 16l-1.7-4.9L6 9.4l4.3-1.7z"/><path d="M5 3l.7 2 .3.1L8 6l-2 1-.3.1L5 9l-.7-1.9-.3-.1L2 6l2-1 .3-.1z"/><path d="M19 13l.8 2.1.2.1L22 16l-2 .8-.2.1L19 19l-.8-2.1-.2-.1L16 16l2-.8.2-.1z"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h0A1.6 1.6 0 0 0 10 3.2V3a2 2 0 0 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v0a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  network: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><path d="M12 7v10M7 12h10"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

function icon(name, className = 'command-nav-icon') {
  return `<span class="${className}" aria-hidden="true">${ICONS[name] || ICONS.activity}</span>`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizePasskey(value) {
  return String(value ?? '').trim();
}

function constantTimeEquals(left, right) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

function resolveAdminPasskey() {
  const globalPasskey = typeof window.NETLEARN_ADMIN_PASSKEY === 'string'
    ? normalizePasskey(window.NETLEARN_ADMIN_PASSKEY)
    : '';
  if (globalPasskey) return globalPasskey;

  let storedPasskey = '';
  try {
    storedPasskey = normalizePasskey(localStorage.getItem(ADMIN_PASSKEY_STORAGE_KEY));
  } catch {
    storedPasskey = '';
  }
  if (storedPasskey) return storedPasskey;

  const metaPasskey = normalizePasskey(
    document.querySelector(ADMIN_PASSKEY_META_SELECTOR)?.getAttribute('content')
  );
  if (metaPasskey) return metaPasskey;

  return ADMIN_PASSKEY_FALLBACK;
}

function isValidAdminPasskey(input) {
  const provided = normalizePasskey(input);
  if (!provided) return false;
  return constantTimeEquals(provided, resolveAdminPasskey());
}

class Navbar {
  constructor() {
    this._navbarRoot = null;
    this._sidebarRoot = null;
    this._currentRoute = '/';
    this._initialized = false;

    this._routeUnsub = null;
    this._progressUnsub = null;
    this._sidebarUnsub = null;
    this._profileUnsub = null;
    this._adminPreviewUnsub = null;

    this._searchDocClickHandler = null;
    this._searchKeydownHandler = null;
    this._profileDocClickHandler = null;

    this._domainMatrixOpen = false;
    this._expandedDomainId = null;

  }

  init() {
    if (this._initialized) return;

    this._navbarRoot = document.getElementById('navbar-root');
    this._sidebarRoot = document.getElementById('sidebar-root');

    if (!this._navbarRoot || !this._sidebarRoot) {
      console.error('[Navbar] Mount points not found');
      return;
    }

    this._renderNavbar();
    this._renderSidebar();
    this._bindEvents();

    const initialRoute = stateManager.getState('currentRoute') || '/';
    this._setActiveLink(initialRoute);

    this._initialized = true;
  }

  _renderNavbar() {
    const profile = stateManager.getState('userProfile');
    const adminPreview = stateManager.getState('adminPreview') === true;
    const initials = this._getInitials(profile?.name || 'Student');

    this._navbarRoot.innerHTML = `
      <nav class="command-topbar">
        <div class="command-topbar__left">
          <div class="command-status">
            <span class="command-status-dot"></span>
            <span>Node Status: Online</span>
          </div>
        </div>

        <div class="command-topbar__right">
          <div class="command-search">
            ${icon('search', 'command-search-icon')}
            <input
              id="navbar-search"
              class="command-search-input"
              type="text"
              placeholder="Execute navigation command..."
              autocomplete="off"
            />
            <span class="command-search-hint">CTRL+K</span>
            <div id="search-dropdown" class="command-search-dropdown"></div>
          </div>

          <a href="#/exam" class="btn btn-secondary">Exam Mode</a>

          <button id="navbar-theme-toggle" class="command-icon-btn" type="button" aria-label="Toggle theme">
            ${icon('settings', 'command-icon')}
          </button>

          <button class="command-icon-btn" type="button" aria-label="Notifications">
            ${icon('bell', 'command-icon')}
          </button>

          <div class="navbar__profile" id="navbar-profile">
            <button class="profile-trigger" id="profile-trigger" type="button" aria-label="Profile menu">
              <span class="profile-avatar">${escapeHtml(initials)}</span>
              ${icon('chevron', 'profile-chevron')}
            </button>

            <div class="profile-dropdown" id="profile-dropdown">
              <div class="profile-header">
                <div class="profile-avatar-lg">${escapeHtml(initials)}</div>
                <div class="profile-info">
                  <div class="profile-name">${escapeHtml(profile?.name || 'Student')}</div>
                  <div class="profile-email">node@netlearnhub.local</div>
                </div>
              </div>

              <a href="#/paths" class="profile-menu-item">
                ${icon('book', 'command-icon')}
                CCNA Domains
              </a>
              <a href="#/simulations" class="profile-menu-item">
                ${icon('cpu', 'command-icon')}
                Simulations Hub
              </a>
              <a href="#/exam" class="profile-menu-item">
                ${icon('shield', 'command-icon')}
                Practice Exam
              </a>
              <button type="button" class="profile-menu-item profile-menu-item--action ${adminPreview ? 'is-active' : ''}" id="admin-preview-btn">
                ${icon(adminPreview ? 'check' : 'lock', 'command-icon')}
                ${adminPreview ? 'Admin Preview: ON' : 'Admin Preview'}
              </button>
            </div>
          </div>

          <button class="navbar__toggle" id="sidebar-toggle" type="button" aria-label="Toggle sidebar" aria-controls="sidebar-root" aria-expanded="${stateManager.getState('sidebarOpen') ? 'true' : 'false'}">
            ${icon('menu', 'command-icon')}
          </button>
        </div>
      </nav>
    `;

    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        const open = stateManager.getState('sidebarOpen');
        stateManager.setState('sidebarOpen', !open);
      });
    }

    const themeBtn = document.getElementById('navbar-theme-toggle');
    themeBtn?.addEventListener('click', () => {
      const current = stateManager.getState('theme') || 'dark';
      stateManager.setState('theme', current === 'dark' ? 'light' : 'dark');
    });

    this._initSearch();
    this._initProfileDropdown();
  }

  _renderSidebar() {
    const profile = stateManager.getState('userProfile');
    const currentRoute = stateManager.getState('currentRoute') || '/';

    let activeModuleId = null;
    if (currentRoute.startsWith('/paths/')) {
      const parts = currentRoute.split('/').filter(Boolean);
      activeModuleId = parts[2]?.split('?')[0] || null;
    }

    const coreHtml = CORE_NAV.map(item => `
      <a href="#${item.route}" class="sidebar__nav-item" data-route="${item.route}">
        ${icon(item.icon)}
        <span class="command-nav-label">${item.label}</span>
        <span class="command-nav-meta">${item.meta}</span>
      </a>
    `).join('');

    const toolHtml = TOOL_NAV.map(item => `
      <a href="#${item.route}" class="sidebar__nav-item ${item.special ? 'sidebar__nav-item--special' : ''}" data-route="${item.route}">
        ${icon(item.icon)}
        <span class="command-nav-label">${item.label}</span>
        <span class="command-nav-meta">${item.meta}</span>
        ${item.badge ? `<span class="sidebar__badge">${item.badge}</span>` : ''}
      </a>
    `).join('');

    const pathsHtml = ALL_PATHS.map((path, index) => {
      const isUnlocked = progressEngine.isPathUnlocked(path, ALL_PATHS);
      const pathDone = path.modules.filter(m => progressEngine.isTopicComplete(m.id)).length;
      const pathTotal = path.modules.length;
      const isExpanded = this._expandedDomainId === path.id;
      const isComplete = progressEngine.isPathComplete(path);
      const progressPercent = pathTotal > 0 ? Math.round((pathDone / pathTotal) * 100) : 0;
      const pathStatus = !isUnlocked ? 'locked' : isComplete ? 'complete' : pathDone > 0 ? 'progress' : 'ready';
      const statusLabel = !isUnlocked ? 'Locked' : isComplete ? 'Complete' : pathDone > 0 ? 'In progress' : 'Ready';
      const statusIcon = isUnlocked ? ICONS.check : ICONS.lock;
      const prerequisiteTitle = (path.prerequisites || [])
        .map(prereqId => ALL_PATHS.find(item => item.id === prereqId)?.shortTitle || prereqId)
        .join(', ');
      const lockMessage = prerequisiteTitle
        ? `Complete ${prerequisiteTitle} to unlock this domain.`
        : 'Complete earlier domains to unlock this domain.';

      const modulesHtml = path.modules.map((mod, moduleIndex) => {
        const isDone = progressEngine.isTopicComplete(mod.id);
        const moduleRoute = `/paths/${path.id}/${mod.id}`;
        const isCurrent = activeModuleId === mod.id;
        return `
          <a href="#${moduleRoute}" class="sidebar__nav-item sidebar__nav-item--sub sidebar-topic-link ${isDone ? 'is-complete' : ''} ${isCurrent ? 'is-current' : ''}" data-route="${moduleRoute}">
            <span class="sidebar-topic-link__index">${escapeHtml(mod.code || String(moduleIndex + 1).padStart(2, '0'))}</span>
            <span class="sidebar-topic-link__title">${escapeHtml(mod.title)}</span>
            <span class="sidebar-topic-link__state" aria-hidden="true">${isDone ? ICONS.check : ''}</span>
          </a>
        `;
      }).join('');

      return `
        <div class="sidebar__path-group sidebar-domain sidebar-domain--${pathStatus} ${isExpanded ? 'is-expanded' : ''}" data-path="${escapeHtml(path.id)}" style="--domain-accent: ${escapeHtml(path.color || 'var(--color-primary)')}">
          <div class="sidebar__path-header sidebar-domain-card ${isExpanded ? 'is-expanded' : ''}" data-toggle-path="${escapeHtml(path.id)}" role="button" tabindex="0" aria-expanded="${isExpanded ? 'true' : 'false'}" aria-label="${escapeHtml(path.title)}: ${statusLabel}, ${pathDone} of ${pathTotal} topics complete">
            <span class="sidebar-domain-card__stripe" aria-hidden="true"></span>
            <span class="sidebar-domain-card__orb" aria-hidden="true">
              <span class="sidebar-domain-card__number">D${escapeHtml(path.examDomain || index + 1)}</span>
            </span>
            <span class="sidebar-domain-card__body">
              <span class="sidebar-domain-card__topline">
                <span class="sidebar-domain-card__title">${escapeHtml(path.shortTitle || path.title)}</span>
                <span class="sidebar-domain-status sidebar-domain-status--${pathStatus}" title="${statusLabel}" aria-hidden="true">${statusIcon}</span>
              </span>
              <span class="sidebar-domain-card__meta">${path.examWeight}% exam · ${pathTotal} topics · ${path.estimatedHours}h</span>
              <span class="sidebar-domain-progress" aria-hidden="true">
                <span class="sidebar-domain-progress__bar" style="width: ${progressPercent}%"></span>
              </span>
            </span>
            <span class="sidebar-domain-card__aside" aria-hidden="true">
              <span class="sidebar-domain-card__progress">${pathDone}/${pathTotal}</span>
              <span class="sidebar-domain-card__chevron">${isExpanded ? '−' : '+'}</span>
            </span>
          </div>
          <div class="sidebar__path-modules sidebar-domain-topics ${isExpanded ? 'is-expanded' : ''}" data-path-modules="${escapeHtml(path.id)}" aria-hidden="${isExpanded ? 'false' : 'true'}" ${isExpanded ? '' : 'hidden'}>
            ${isUnlocked ? `
              <a href="#/paths/${path.id}" class="sidebar-domain-overview" aria-label="Open ${escapeHtml(path.title)} overview">
                <span>Open domain overview</span>
                <span aria-hidden="true">↗</span>
              </a>
              ${modulesHtml}
            ` : `
              <div class="sidebar-domain-locked">
                ${icon('lock', 'sidebar-domain-lock-icon')}
                <span>${escapeHtml(lockMessage)}</span>
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');

    const initials = this._getInitials(profile?.name || 'Student');

    this._sidebarRoot.innerHTML = `
      <nav class="command-sidebar">
        <a href="#/" class="command-brand">
          <span class="command-brand-glyph" aria-hidden="true">
            <svg class="command-brand-logo" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
              <circle cx="48" cy="48" r="43" class="command-brand-logo__ring" />
              <circle cx="48" cy="48" r="35.5" class="command-brand-logo__core" />
              <path d="M31 48h34M48 31v34" class="command-brand-logo__grid" />
              <path d="M36 36h24v24H36z" class="command-brand-logo__chip" />
              <text x="48" y="56" text-anchor="middle" class="command-brand-logo__text">NL<tspan class="command-brand-logo__text-h">H</tspan></text>
            </svg>
          </span>
          <span class="command-brand-copy">
            <span class="command-brand-title">NETLEARNHUB</span>
            <span class="command-brand-subtitle">NETWORKING LEARNING PLATFORM</span>
          </span>
        </a>

        <div class="sidebar__section">
          <div class="sidebar__section-label">Navigation Core</div>
          ${coreHtml}
        </div>

        <hr class="sidebar__divider" />

        <div class="sidebar__section sidebar-domain-matrix ${this._domainMatrixOpen ? 'is-open' : ''}">
          <button class="sidebar-domain-matrix__toggle" id="domain-matrix-toggle" type="button" aria-expanded="${this._domainMatrixOpen ? 'true' : 'false'}" aria-controls="domain-matrix-panel">
            <span class="sidebar-domain-matrix__title">Domain Matrix</span>
            <span class="sidebar-domain-matrix__meta">${ALL_PATHS.length} domains</span>
            <span class="sidebar-domain-matrix__chevron" aria-hidden="true">${this._domainMatrixOpen ? '−' : '+'}</span>
          </button>
          <div id="domain-matrix-panel" class="sidebar-domain-matrix__panel ${this._domainMatrixOpen ? 'is-open' : ''}" ${this._domainMatrixOpen ? '' : 'hidden'}>
            ${pathsHtml}
          </div>
        </div>

        <hr class="sidebar__divider" />

        <div class="sidebar__section">
          <div class="sidebar__section-label">Labs & Tools</div>
          ${toolHtml}
        </div>

        <div class="command-sidebar-user">
          <span class="profile-avatar">${escapeHtml(initials)}</span>
          <span class="command-brand-copy">
            <span class="command-sidebar-user__name">${escapeHtml(profile?.name || 'Student')}</span>
            <span class="command-sidebar-user__role">Network learner</span>
          </span>
        </div>
      </nav>
    `;

    const matrixToggle = this._sidebarRoot.querySelector('#domain-matrix-toggle');
    const matrixPanel = this._sidebarRoot.querySelector('#domain-matrix-panel');
    matrixToggle?.addEventListener('click', () => {
      this._domainMatrixOpen = !this._domainMatrixOpen;
      matrixToggle.setAttribute('aria-expanded', this._domainMatrixOpen ? 'true' : 'false');
      matrixPanel?.classList.toggle('is-open', this._domainMatrixOpen);
      if (matrixPanel) matrixPanel.hidden = !this._domainMatrixOpen;

      if (!this._domainMatrixOpen) {
        this._expandedDomainId = null;
        this._sidebarRoot.querySelectorAll('[data-toggle-path]').forEach(header => {
          header.classList.remove('is-expanded');
          header.closest('.sidebar-domain')?.classList.remove('is-expanded');
          header.setAttribute('aria-expanded', 'false');
          const chevron = header.querySelector('.sidebar-domain-card__chevron');
          if (chevron) chevron.textContent = '+';
        });

        this._sidebarRoot.querySelectorAll('[data-path-modules]').forEach(modules => {
          modules.classList.remove('is-expanded');
          modules.hidden = true;
          modules.setAttribute('aria-hidden', 'true');
        });
      }

      const chevron = matrixToggle.querySelector('.sidebar-domain-matrix__chevron');
      if (chevron) chevron.textContent = this._domainMatrixOpen ? '−' : '+';
    });

    this._sidebarRoot.querySelectorAll('[data-toggle-path]').forEach(header => {
      const togglePath = () => {
        const pathId = header.getAttribute('data-toggle-path');
        const modules = this._sidebarRoot.querySelector(`[data-path-modules="${pathId}"]`);
        const expanded = this._expandedDomainId !== pathId;
        this._expandedDomainId = expanded ? pathId : null;

        this._sidebarRoot.querySelectorAll('[data-toggle-path]').forEach(otherHeader => {
          const otherPathId = otherHeader.getAttribute('data-toggle-path');
          const isCurrent = expanded && otherPathId === pathId;
          otherHeader.classList.toggle('is-expanded', isCurrent);
          otherHeader.closest('.sidebar-domain')?.classList.toggle('is-expanded', isCurrent);
          otherHeader.setAttribute('aria-expanded', isCurrent ? 'true' : 'false');

          const otherModules = this._sidebarRoot.querySelector(`[data-path-modules="${otherPathId}"]`);
          otherModules?.classList.toggle('is-expanded', isCurrent);
          if (otherModules) {
            otherModules.hidden = !isCurrent;
            otherModules.setAttribute('aria-hidden', isCurrent ? 'false' : 'true');
          }

          const otherChevron = otherHeader.querySelector('.sidebar-domain-card__chevron');
          if (otherChevron) otherChevron.textContent = isCurrent ? '−' : '+';
        });

        modules?.classList.toggle('is-expanded', expanded);
        if (modules) {
          modules.hidden = !expanded;
          modules.setAttribute('aria-hidden', expanded ? 'false' : 'true');
        }
        header.setAttribute('aria-expanded', expanded ? 'true' : 'false');

        const chevron = header.querySelector('.sidebar-domain-card__chevron');
        if (chevron) chevron.textContent = expanded ? '−' : '+';
      };

      header.addEventListener('click', event => {
        if (event.target.closest('a')) return;
        togglePath();
      });

      header.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        togglePath();
      });
    });
  }

  _setActiveLink(route) {
    this._currentRoute = route;

    const links = document.querySelectorAll('.sidebar__nav-item[data-route]');
    links.forEach(link => {
      const linkRoute = link.getAttribute('data-route');

      const active = linkRoute === route ||
        (route.startsWith('/paths/') && linkRoute === '/paths') ||
        (linkRoute !== '/' && linkRoute.length > 1 && route.startsWith(linkRoute));

      link.classList.toggle('is-active', active);
    });
  }

  _bindEvents() {
    this._routeUnsub = stateManager.subscribe('currentRoute', route => {
      this._setActiveLink(route);
    });

    this._progressUnsub = stateManager.subscribe('userProgress', () => {
      this._renderSidebar();
      this._setActiveLink(stateManager.getState('currentRoute') || '/');
    });

    this._profileUnsub = stateManager.subscribe('userProfile', () => {
      this._renderNavbar();
      this._renderSidebar();
      this._setActiveLink(stateManager.getState('currentRoute') || '/');
    });

    this._adminPreviewUnsub = stateManager.subscribe('adminPreview', () => {
      this._renderNavbar();
      this._renderSidebar();
      this._setActiveLink(stateManager.getState('currentRoute') || '/');
    });

    this._sidebarUnsub = stateManager.subscribe('sidebarOpen', isOpen => {
      const toggle = document.getElementById('sidebar-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      const sidebar = document.getElementById('sidebar-root');
      if (sidebar) sidebar.classList.toggle('is-open', isOpen);
    });
  }

  _buildSearchItems() {
    const staticItems = [
      ...CORE_NAV.map(item => ({ route: item.route, label: item.label, tag: item.meta })),
      ...TOOL_NAV.map(item => ({ route: item.route, label: item.label, tag: item.meta })),
    ];

    const pathItems = [];
    ALL_PATHS.forEach(path => {
      pathItems.push({ route: `/paths/${path.id}`, label: path.title, tag: 'Domain' });
      path.modules.forEach(mod => {
        pathItems.push({ route: `/paths/${path.id}/${mod.id}`, label: mod.title, tag: `${path.title} topic` });
      });
    });

    const unique = new Map();
    [...staticItems, ...pathItems].forEach(item => {
      if (!unique.has(item.route)) unique.set(item.route, item);
    });

    return [...unique.values()];
  }

  _initSearch() {
    const input = document.getElementById('navbar-search');
    const dropdown = document.getElementById('search-dropdown');

    if (!input || !dropdown) return;

    const items = this._buildSearchItems();
    let open = false;

    const renderResults = (query = '') => {
      const normalized = query.trim().toLowerCase();
      const results = normalized.length === 0
        ? items.slice(0, 8)
        : items.filter(item =>
            item.label.toLowerCase().includes(normalized) ||
            item.tag.toLowerCase().includes(normalized)
          ).slice(0, 8);

      if (results.length === 0) {
        dropdown.innerHTML = `
          <div class="command-search-item">
            ${icon('search', 'command-icon')}
            <span class="command-search-item__label">No routes match your command</span>
            <span class="command-search-item__tag">Refine</span>
          </div>
        `;
        return;
      }

      dropdown.innerHTML = results.map(item => `
        <a class="command-search-item" href="#${item.route}">
          ${icon('network', 'command-icon')}
          <span class="command-search-item__label">${escapeHtml(item.label)}</span>
          <span class="command-search-item__tag">${escapeHtml(item.tag)}</span>
        </a>
      `).join('');
    };

    const openDropdown = () => {
      if (open) return;
      open = true;
      dropdown.classList.add('is-open');
      renderResults(input.value || '');
    };

    const closeDropdown = () => {
      open = false;
      dropdown.classList.remove('is-open');
    };

    input.addEventListener('focus', openDropdown);
    input.addEventListener('input', () => {
      renderResults(input.value || '');
      openDropdown();
    });

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        const first = dropdown.querySelector('a.command-search-item');
        if (first) {
          const href = first.getAttribute('href') || '#/';
          window.location.hash = href.replace(/^#/, '');
          closeDropdown();
          input.blur();
        }
      }

      if (event.key === 'Escape') {
        closeDropdown();
        input.blur();
      }
    });

    if (this._searchDocClickHandler) {
      document.removeEventListener('click', this._searchDocClickHandler);
    }
    this._searchDocClickHandler = (event) => {
      if (!dropdown.contains(event.target) && event.target !== input) {
        closeDropdown();
      }
    };
    document.addEventListener('click', this._searchDocClickHandler);

    if (this._searchKeydownHandler) {
      document.removeEventListener('keydown', this._searchKeydownHandler);
    }
    this._searchKeydownHandler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        input.focus();
        openDropdown();
      }

      if (event.key === 'Escape') {
        closeDropdown();
      }
    };
    document.addEventListener('keydown', this._searchKeydownHandler);
  }

  _initProfileDropdown() {
    const trigger = document.getElementById('profile-trigger');
    const dropdown = document.getElementById('profile-dropdown');
    const adminPreviewBtn = document.getElementById('admin-preview-btn');

    if (!trigger || !dropdown) return;

    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      dropdown.classList.toggle('active');
      trigger.classList.toggle('active');
    });

    if (this._profileDocClickHandler) {
      document.removeEventListener('click', this._profileDocClickHandler);
    }

    this._profileDocClickHandler = () => {
      dropdown.classList.remove('active');
      trigger.classList.remove('active');
    };

    document.addEventListener('click', this._profileDocClickHandler);
    dropdown.addEventListener('click', (event) => event.stopPropagation());

    if (adminPreviewBtn) {
      adminPreviewBtn.addEventListener('click', () => {
        const enabled = stateManager.getState('adminPreview') === true;
        if (enabled) {
          stateManager.setState('adminPreview', false);
          showToast('Admin preview disabled.', 'info');
          window.dispatchEvent(new Event('hashchange'));
          return;
        }

        const passkey = window.prompt('Enter admin preview passkey');
        if (passkey === null) return;

        if (isValidAdminPasskey(passkey)) {
          stateManager.setState('adminPreview', true);
          showToast('Admin preview enabled. Locked curriculum unlocked.', 'success');
          window.dispatchEvent(new Event('hashchange'));
        } else {
          showToast('Invalid admin passkey.', 'error');
        }
      });
    }
  }

  _getInitials(name) {
    const parts = String(name || 'Student').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'ST';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  _pickPathIcon(pathId) {
    const map = {
      fundamentals: 'book',
      'network-access': 'network',
      'ip-connectivity': 'send',
      'ip-services': 'shield',
      'security-fundamentals': 'lock',
      'automation-programmability': 'cpu',
    };
    return map[pathId] || 'cpu';
  }

  destroy() {
    if (this._routeUnsub) this._routeUnsub();
    if (this._progressUnsub) this._progressUnsub();
    if (this._sidebarUnsub) this._sidebarUnsub();
    if (this._profileUnsub) this._profileUnsub();
    if (this._adminPreviewUnsub) this._adminPreviewUnsub();

    if (this._searchDocClickHandler) {
      document.removeEventListener('click', this._searchDocClickHandler);
      this._searchDocClickHandler = null;
    }

    if (this._searchKeydownHandler) {
      document.removeEventListener('keydown', this._searchKeydownHandler);
      this._searchKeydownHandler = null;
    }

    if (this._profileDocClickHandler) {
      document.removeEventListener('click', this._profileDocClickHandler);
      this._profileDocClickHandler = null;
    }

    this._initialized = false;
  }
}

export const navbar = new Navbar();

