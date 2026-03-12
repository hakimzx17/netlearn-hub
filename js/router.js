/**
 * router.js — Hash-Based Client-Side Router
 *
 * Responsibility:
 *   Maps URL hash fragments to module loaders.
 *   Enforces module lifecycle: init → active → destroy.
 *   Dynamically imports modules on demand (lazy loading).
 *   Injects rendered module into #view-root.
 *
 * Module Lifecycle Contract:
 *   Every module MUST implement: init(el), start(), reset(), destroy()
 *   Router calls destroy() on current before loading next.
 *
 * Depends on: eventBus.js, stateManager.js
 */

import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';

/**
 * Route definitions map.
 * Key: hash path (without #)
 * Value: () => dynamic import promise returning default export
 *
 * Dynamic imports mean modules are ONLY loaded when navigated to.
 * This keeps initial page load fast.
 */
const ROUTES = {
  '/': () => import('../modules/dashboard.js'),
  '/ipv4-header': () => import('../modules/ipv4HeaderGame.js'),
  '/ethernet-frame': () => import('../modules/ethernetFrameGame.js'),
  '/osi-tcpip': () => import('../modules/osiTcpipVisualizer.js'),
  '/ip-classes': () => import('../modules/ipClassesExplorer.js'),
  '/packet-journey': () => import('../modules/packetJourneySimulator.js'),
  '/ttl-simulation': () => import('../modules/ttlRouterSimulation.js'),
  '/arp-simulation': () => import('../modules/arpSimulation.js'),
  '/mac-table': () => import('../modules/macTableSimulation.js'),
  '/routing-table': () => import('../modules/routingTableSimulator.js'),
  '/subnet-practice': () => import('../modules/subnetPracticeEngine.js'),
  '/vlsm-design': () => import('../modules/vlsmDesignEngine.js'),
  '/subnet-calculator': () => import('../modules/subnetCalculator.js'),
  '/exam': () => import('../modules/examModeEngine.js'),
  '/resources': () => import('../modules/resourceLibrary.js'),
};

class Router {
  constructor() {
    this._currentModule = null;   // Active module instance
    this._currentRoute = null;   // Active route key
    this._viewRoot = null;   // #view-root DOM element
    this._isNavigating = false;  // Prevent concurrent navigation
  }

  /**
   * Initialize the router.
   * Called once by app.js after DOM is ready.
   * Binds hashchange listener and loads the initial route.
   */
  init() {
    this._viewRoot = document.getElementById('view-root');

    if (!this._viewRoot) {
      console.error('[Router] #view-root element not found in DOM');
      return;
    }

    // Listen for browser back/forward navigation
    window.addEventListener('hashchange', () => this._onHashChange());

    // Listen for programmatic navigation from components
    eventBus.on('nav:route-change', ({ route }) => this.navigate(route));

    // Load initial route from current URL
    this._onHashChange();
  }

  /**
   * Navigate programmatically to a route.
   * Updates the URL hash — triggers _onHashChange via hashchange event.
   *
   * @param {string} route — e.g. '/packet-journey'
   */
  navigate(route) {
    const target = route.startsWith('/') ? route : `/${route}`;
    window.location.hash = target;
  }

  // ─── Private Methods ───────────────────────

  /**
   * Handle hash change events from the browser.
   * Extracts the route key and triggers module load.
   */
  _onHashChange() {
    // Parse hash: '#/packet-journey' → '/packet-journey'
    const hash = window.location.hash;
    const route = hash.startsWith('#') ? hash.slice(1) : '/';
    const routeKey = route || '/';

    // Skip if already on this route
    if (routeKey === this._currentRoute) return;

    this._loadRoute(routeKey);
  }

  /**
   * Core routing logic.
   * Destroys current module, imports new one, initializes it.
   *
   * @param {string} routeKey — Route identifier e.g. '/arp-simulation'
   */
  async _loadRoute(routeKey) {
    // Guard against concurrent navigations
    if (this._isNavigating) return;
    this._isNavigating = true;

    try {
      // 1. Destroy current module (prevents memory leaks)
      await this._destroyCurrentModule();

      // 2. Show loading state in view root
      this._showLoading();

      // 3. Resolve route — fall back to 404 if not found
      const loader = ROUTES[routeKey];
      if (!loader) {
        this._showNotFound(routeKey);
        this._isNavigating = false;
        return;
      }

      // 4. Dynamic import — module JS is fetched only now
      const moduleExport = await loader();
      const moduleInstance = moduleExport.default;

      // 5. Validate module implements the lifecycle contract
      if (!this._validateModule(moduleInstance, routeKey)) {
        this._isNavigating = false;
        return;
      }

      // 6. Clear loading state, prepare container
      this._viewRoot.innerHTML = '';
      const container = document.createElement('div');
      container.className = 'module-view';
      container.setAttribute('data-route', routeKey);
      this._viewRoot.appendChild(container);

      // 7. Initialize module — module renders its own HTML into container
      await moduleInstance.init(container);

      // 8. Store reference for cleanup on next navigation
      this._currentModule = moduleInstance;
      this._currentRoute = routeKey;

      // 9. Update global state
      stateManager.setState('currentRoute', routeKey);
      stateManager.resetVolatile();

      // 10. Notify all listeners (navbar highlights active link)
      eventBus.emit('router:module-loaded', { route: routeKey });

      // 11. Scroll to top
      this._viewRoot.scrollTop = 0;
      window.scrollTo(0, 0);

    } catch (err) {
      console.error(`[Router] Failed to load route "${routeKey}":`, err);
      this._showError(err);
    } finally {
      this._isNavigating = false;
    }
  }

  /**
   * Destroy the currently active module.
   * Calls destroy() and clears reference.
   * Errors during destroy are caught so navigation still proceeds.
   */
  async _destroyCurrentModule() {
    if (!this._currentModule) return;

    try {
      if (typeof this._currentModule.destroy === 'function') {
        await this._currentModule.destroy();
      }
    } catch (err) {
      console.warn('[Router] Error during module destroy:', err);
    }

    this._currentModule = null;
  }

  /**
   * Validate that an imported module satisfies the lifecycle contract.
   * Warns (not errors) for missing optional methods.
   *
   * @param {Object} mod — Module default export
   * @param {string} routeKey — For error messages
   * @returns {boolean} Whether module is valid enough to load
   */
  _validateModule(mod, routeKey) {
    if (!mod) {
      console.error(`[Router] Module for "${routeKey}" has no default export`);
      return false;
    }

    const required = ['init', 'destroy'];
    const optional = ['start', 'reset', 'step'];

    const missing = required.filter(m => typeof mod[m] !== 'function');
    if (missing.length > 0) {
      console.error(`[Router] Module "${routeKey}" missing required methods: ${missing.join(', ')}`);
      return false;
    }

    optional
      .filter(m => typeof mod[m] !== 'function')
      .forEach(m => console.debug(`[Router] Module "${routeKey}" has no optional method: ${m}()`));

    return true;
  }

  /**
   * Render a loading spinner while the module JS is fetching.
   */
  _showLoading() {
    this._viewRoot.innerHTML = `
      <div class="loading-screen">
        <div class="loading-spinner"></div>
        <p class="text-muted text-sm text-mono">Loading module...</p>
      </div>
    `;
  }

  /**
   * Render a 404 page for unrecognized routes.
   * @param {string} routeKey
   */
  _showNotFound(routeKey) {
    this._currentRoute = routeKey;
    this._viewRoot.innerHTML = `
      <div class="loading-screen">
        <div style="text-align:center; padding: 2rem;">
          <p class="text-mono" style="font-size:4rem; color:var(--color-text-muted)">404</p>
          <h2 style="margin: 1rem 0 0.5rem;">Route not found</h2>
          <p class="text-secondary">No module registered for <code>${routeKey}</code></p>
          <a href="#/" class="btn btn-secondary" style="margin-top:1.5rem; display:inline-flex;">
            ← Return to Dashboard
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Render an error state when module loading fails.
   * @param {Error} err
   */
  _showError(err) {
    this._viewRoot.innerHTML = `
      <div class="loading-screen">
        <div style="text-align:center; padding: 2rem;">
          <p style="font-size:3rem; margin-bottom:1rem;">⚠️</p>
          <h2 style="margin-bottom:0.5rem; color:var(--color-error)">Module Load Error</h2>
          <p class="text-secondary">${err.message || 'An unexpected error occurred.'}</p>
          <a href="#/" class="btn btn-ghost" style="margin-top:1.5rem; display:inline-flex;">
            ← Return to Dashboard
          </a>
        </div>
      </div>
    `;
  }

  /**
   * Return the current active route key.
   * @returns {string|null}
   */
  getCurrentRoute() {
    return this._currentRoute;
  }

  /**
   * Return all registered route keys.
   * Used by navbar to build navigation links.
   * @returns {string[]}
   */
  getRoutes() {
    return Object.keys(ROUTES);
  }
}

export const router = new Router();
