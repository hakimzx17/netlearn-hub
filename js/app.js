/**
 * app.js — Application Bootstrap
 *
 * Responsibility:
 *   Orchestrates startup in strict dependency order.
 *   Wires all core systems together.
 *   Handles global errors.
 *   Starts the router.
 *
 * Boot sequence (order matters):
 *   1. eventBus       — no dependencies, must be first
 *   2. stateManager   — depends on eventBus
 *   3. router         — depends on eventBus + stateManager
 *   4. navbar         — depends on router + eventBus
 *   5. modalSystem    — depends on eventBus
 *   6. router.init()  — parse hash, load first module
 *
 * Depends on: eventBus, stateManager, router, navbar, modalSystem
 */

import { eventBus }    from './eventBus.js';
import { stateManager} from './stateManager.js';
import { router }      from './router.js';
import { navbar }      from '../components/navbar.js';
import { modalSystem } from '../components/modalSystem.js';

/**
 * Main bootstrap function.
 * Runs after DOMContentLoaded to ensure mount points exist.
 */
async function bootstrap() {
  try {
    console.info('[NetLearn] Starting bootstrap...');

    // ── Step 1: Apply persisted theme ────────────────
    const savedTheme = stateManager.getState('theme');
    document.documentElement.setAttribute('data-theme', savedTheme || 'dark');

    // ── Step 2: Initialize Modal System ──────────────
    // Must be ready before any module renders (modules may open modals)
    modalSystem.init();

    // ── Step 3: Initialize Navbar ─────────────────────
    navbar.init();

    // ── Step 4: Initialize Router ─────────────────────
    // This parses the current URL hash and loads the initial module.
    // Must run AFTER navbar so active link can be set on first load.
    router.init();

    // ── Step 5: Set up global state subscriptions ─────
    _bindGlobalStateHandlers();

    // ── Step 6: Register global keyboard shortcuts ────
    _bindGlobalShortcuts();

    console.info('[NetLearn] Bootstrap complete ✓');

    // Emit app-ready event — any listener can now safely call router APIs
    eventBus.emit('app:ready', { timestamp: Date.now() });

  } catch (err) {
    console.error('[NetLearn] Bootstrap failed:', err);
    _renderBootstrapError(err);
  }
}

/**
 * Bind global state change handlers.
 * These live at the app level because they affect the whole application.
 */
function _bindGlobalStateHandlers() {
  // Theme change → update data-theme attribute
  stateManager.subscribe('theme', (newTheme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
  });

  // Route change → update document title
  stateManager.subscribe('currentRoute', (route) => {
    const titleMap = {
      '/':                  'Dashboard',
      '/ipv4-header':       'IPv4 Header Game',
      '/ethernet-frame':    'Ethernet Frame Game',
      '/osi-tcpip':         'OSI / TCP-IP Visualizer',
      '/ip-classes':        'IP Address Classes',
      '/packet-journey':    'Packet Journey Simulator',
      '/ttl-simulation':    'TTL Router Simulation',
      '/arp-simulation':    'ARP Resolution Simulator',
      '/mac-table':         'MAC Table Learning',
      '/routing-table':     'Routing Table Simulator',
      '/subnet-practice':   'Subnetting Practice',
      '/vlsm-design':       'VLSM Design Engine',
      '/subnet-calculator': 'Subnet Calculator',
      '/exam':              'CCNA Exam Mode',
      '/resources':         'Resource Library',
    };
    const name = titleMap[route] || 'NetLearn';
    document.title = `${name} — NetLearn`;
  });

  // Sidebar toggle state → CSS class on app-shell
  stateManager.subscribe('sidebarOpen', (isOpen) => {
    const shell = document.getElementById('app-shell');
    if (shell) shell.classList.toggle('sidebar-collapsed', !isOpen);
    const sidebar = document.getElementById('sidebar-root');
    if (sidebar) sidebar.classList.toggle('is-open', isOpen);
  });
}

/**
 * Register application-wide keyboard shortcuts.
 */
function _bindGlobalShortcuts() {
  document.addEventListener('keydown', (e) => {
    // ESC → close any open modal
    if (e.key === 'Escape') {
      eventBus.emit('modal:close');
      return;
    }

    // Ctrl/Cmd + / → go to home
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      router.navigate('/');
      return;
    }

    // Ctrl/Cmd + E → go to exam
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      router.navigate('/exam');
      return;
    }
  });
}

/**
 * Render a full-page error when bootstrap itself fails.
 * This is the last line of defense — no framework dependencies.
 * @param {Error} err
 */
function _renderBootstrapError(err) {
  document.body.innerHTML = `
    <div style="
      display:flex; align-items:center; justify-content:center;
      min-height:100vh; background:#080d14; color:#e8f4fd;
      font-family: 'JetBrains Mono', monospace; padding: 2rem; text-align:center;
    ">
      <div>
        <div style="font-size:3rem; margin-bottom:1rem">⚠</div>
        <h1 style="font-size:1.5rem; color:#ff4444; margin-bottom:0.5rem">
          Application Failed to Start
        </h1>
        <p style="color:#7fa8c9; margin-bottom:1.5rem; max-width:480px">
          ${err.message || 'An unexpected error prevented the application from loading.'}
        </p>
        <p style="font-size:0.75rem; color:#4a6d8a">
          Check the browser console for details, then refresh the page.
        </p>
        <button
          onclick="window.location.reload()"
          style="
            margin-top:1.5rem; padding:0.5rem 1.5rem;
            background:#00d4ff; color:#080d14; border:none;
            border-radius:6px; font-weight:700; cursor:pointer;
          "
        >Reload</button>
      </div>
    </div>
  `;
}

// ── Entry Point ─────────────────────────────────────
// Wait for DOM to be ready before bootstrapping.
// 'type="module"' scripts are deferred by default, but this
// guard handles edge cases where the script loads very early.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
