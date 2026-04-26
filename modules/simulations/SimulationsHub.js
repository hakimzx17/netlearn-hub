/**
 * SimulationsHub.js — Browse & Filter All Simulations
 * Standalone page to access any simulation as a sandbox.
 */

import { stateManager } from '../../js/stateManager.js';
import { getAllSimulations, SIMULATION_ROUTE_MAP } from '../../data/pathRegistry.js';
import { renderTokenIcon } from '../../utils/tokenIcons.js';

class SimulationsHub {
  constructor() {
    this.container = null;
  }

  init(containerEl) {
    this.container = containerEl;
    this._render();
  }

  _render() {
    const sims = getAllSimulations();
    const progress = stateManager.getState('userProgress');
    const completed = new Set(progress.completedModules || []);

    // Unique paths for filter
    const paths = [...new Set(sims.map(s => s.pathName))];

    this.container.innerHTML = `
      <div class="sim-hub">
        <div class="module-header">
          <div class="module-header__breadcrumb">
            <a href="#/">Home</a> › <span>Simulations Hub</span>
          </div>
          <h1 class="module-header__title">${renderTokenIcon('LAB', 'module-header__title-icon')}Simulations Hub</h1>
          <p class="module-header__description">
            Practice any simulation from the CCNA domain architecture. Implemented labs launch directly; planned labs open their topic blueprint.
          </p>
        </div>

        <div class="sim-hub__filters">
          <button class="btn btn-primary sim-filter-btn active" data-filter="all">All</button>
          ${paths.map(p => `
            <button class="btn btn-ghost sim-filter-btn" data-filter="${p}">${p}</button>
          `).join('')}
        </div>

        <div class="sim-hub__grid" id="sim-grid">
          ${sims.map(sim => {
            const route = sim.launchRoute || SIMULATION_ROUTE_MAP[sim.id] || '#';
            const isModuleDone = completed.has(sim.moduleId);
            return `
              <a href="#${route}" class="sim-card" data-path="${sim.pathName}" style="--sim-color:${sim.pathColor}">
                <div class="sim-card__icon">${renderTokenIcon(sim.icon, 'learning-token-icon')}</div>
                <div class="sim-card__body">
                  <h3 class="sim-card__title">${sim.label}</h3>
                  <p class="sim-card__meta">
                    <span class="badge" style="background:${sim.pathColor}22;color:${sim.pathColor};border:1px solid ${sim.pathColor}44">${sim.pathName}</span>
                    <span class="text-muted text-xs">L${sim.difficulty}</span>
                    <span class="text-muted text-xs">${sim.implemented ? 'Implemented' : 'Blueprint'}</span>
                  </p>
                  <p class="sim-card__module text-muted text-xs">From: ${sim.moduleName}</p>
                </div>
                ${isModuleDone ? `<div class="sim-card__done">${renderTokenIcon('OK', 'sim-card__done-icon')}</div>` : ''}
              </a>
            `;
          }).join('')}
        </div>
      </div>
    `;

    this._bindFilters();
  }

  _bindFilters() {
    const buttons = this.container.querySelectorAll('.sim-filter-btn');
    const cards   = this.container.querySelectorAll('.sim-card');

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => {
          b.classList.remove('active', 'btn-primary');
          b.classList.add('btn-ghost');
        });
        btn.classList.add('active', 'btn-primary');
        btn.classList.remove('btn-ghost');

        const filter = btn.getAttribute('data-filter');
        cards.forEach(card => {
          if (filter === 'all' || card.getAttribute('data-path') === filter) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  start() {}
  step() {}
  reset() { this._render(); }
  destroy() { this.container = null; }
}

export default new SimulationsHub();
