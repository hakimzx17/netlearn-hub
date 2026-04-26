/**
 * PathsOverview.js — CCNA Domains Overview Page
 * Shows all available domains with progression and final-exam status.
 */

import { progressEngine } from '../../js/progressEngine.js';
import { ALL_PATHS }      from '../../data/pathRegistry.js';
import { renderTokenIcon } from '../../utils/tokenIcons.js';

class PathsOverview {
  constructor() {
    this.container = null;
    this.selectedIndex = 0;
    this._onDomainClick = this._onDomainClick.bind(this);
  }

  init(containerEl) {
    this.container = containerEl;
    this._render();
  }

  _render() {
    this.container.innerHTML = `
      <div class="paths-overview">
        <div class="module-header">
          <div class="module-header__breadcrumb">
            <a href="#/">Home</a> › <span>CCNA Domains</span>
          </div>
          <h1 class="module-header__title">CCNA Domains</h1>
          <p class="module-header__description">
            The curriculum is now structured as six CCNA domains. Each domain contains
            sequential topics, hands-on labs where available, and a required final exam.
          </p>
        </div>

        <div class="domains-linear" aria-label="CCNA domain progression">
          <div class="domains-linear__rail" aria-hidden="true"></div>
          <div class="domains-linear__nodes" role="tablist" aria-label="Select a CCNA domain for details">
            ${ALL_PATHS.map((path, i) => this._renderDomainNode(path, i)).join('')}
          </div>
          <div class="domains-linear__info" role="tabpanel" aria-live="polite">
            ${this._renderInfoPanel(this.selectedIndex)}
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _getDomainViewModel(path) {
    const isUnlocked = progressEngine.isPathUnlocked(path, ALL_PATHS);
    const pathDone   = path.modules.filter((module) => progressEngine.isTopicComplete(module.id)).length;
    const pathTotal  = path.topicCount || path.modules.length;
    const pct        = pathTotal > 0 ? Math.round((pathDone / pathTotal) * 100) : 0;
    const finalPassed = progressEngine.isDomainFinalPassed(path.id);
    const isComplete = progressEngine.isPathComplete(path);
    const finalUnlocked = progressEngine.isDomainFinalUnlocked(path);
    const prereqTitles = (path.prerequisites || [])
      .map((preId) => ALL_PATHS.find((candidate) => candidate.id === preId)?.title || preId)
      .join(', ');

    return { isUnlocked, pathDone, pathTotal, pct, finalPassed, isComplete, finalUnlocked, prereqTitles };
  }

  _renderDomainNode(path, i) {
    const vm = this._getDomainViewModel(path);
    const isSelected = i === this.selectedIndex;
    const status = vm.isComplete ? 'complete' : vm.isUnlocked ? 'available' : 'locked';
    const isGlowing = vm.isUnlocked;

    return `
      <button class="domain-dot ${isSelected ? 'domain-dot--active' : ''} domain-dot--locked ${isGlowing ? 'domain-dot--glowing' : ''}"
              type="button"
              role="tab"
              aria-selected="${isSelected}"
              aria-controls="domain-info-panel"
              data-domain-index="${i}"
              style="--path-color: ${path.color}; animation-delay: ${i * 0.07}s">
        <span class="domain-dot__light" aria-hidden="true"></span>
        <span class="domain-dot__number">${i + 1}</span>
        <span class="domain-dot__label">${path.title}</span>
        <span class="domain-dot__meta">${vm.pct}% · ${path.examWeight}% exam</span>
      </button>
    `;
  }

  _renderInfoPanel(index) {
    const path = ALL_PATHS[index] || ALL_PATHS[0];
    const vm = this._getDomainViewModel(path);
    const actionText = vm.isComplete ? 'Review domain' : vm.pathDone > 0 ? 'Continue domain' : 'Start domain';
    const difficultyClass = path.difficulty === 'beginner' ? 'success' : path.difficulty === 'intermediate' ? 'amber' : 'error';
    const finalStatus = vm.finalPassed ? 'Passed' : vm.finalUnlocked ? 'Unlocked' : 'Locked';

    return `
      <article class="domain-info-panel" id="domain-info-panel" style="--path-color: ${path.color}">
        <div class="domain-info-panel__mark" aria-hidden="true">
          ${renderTokenIcon(path.icon, 'learning-token-icon')}
        </div>
        <div class="domain-info-panel__content">
          <div class="domain-info-panel__eyebrow">Domain ${index + 1} · ${path.examWeight}% CCNA weight</div>
          <h2>${path.title}</h2>
          <p>${path.description}</p>

          <div class="domain-info-panel__stats">
            <span class="badge badge-${difficultyClass}">${path.difficulty}</span>
            <span>${vm.pathDone}/${vm.pathTotal} topics complete</span>
            <span>~${path.estimatedHours}h</span>
            <span>Final: ${path.finalExam.questionCount}Q · ${finalStatus}</span>
          </div>

          <div class="domain-info-panel__progress" aria-label="${path.title} progress ${vm.pct}%">
            <span style="width:${vm.pct}%"></span>
          </div>

          ${vm.isUnlocked ? `
            <a href="#/paths/${path.id}" class="domain-btn domain-btn--${vm.isComplete ? 'complete' : vm.pathDone > 0 ? 'continue' : 'start'}"
               style="--path-color: ${path.color}">${actionText}</a>
          ` : `
            <div class="domain-info-panel__locked">
              ${renderTokenIcon('LOCK', 'path-status-icon')}
              Complete ${vm.prereqTitles} final exam first.
            </div>
          `}
        </div>
      </article>
    `;
  }

  _bindEvents() {
    this.container
      ?.querySelectorAll('[data-domain-index]')
      .forEach((button) => button.addEventListener('click', this._onDomainClick));
  }

  _onDomainClick(event) {
    const nextIndex = Number.parseInt(event.currentTarget.dataset.domainIndex, 10);
    if (!Number.isInteger(nextIndex) || nextIndex === this.selectedIndex) return;
    this.selectedIndex = nextIndex;

    this.container.querySelectorAll('[data-domain-index]').forEach((button, i) => {
      const isSelected = i === this.selectedIndex;
      button.classList.toggle('domain-dot--active', isSelected);
      button.setAttribute('aria-selected', String(isSelected));
    });

    const info = this.container.querySelector('.domains-linear__info');
    if (info) info.innerHTML = this._renderInfoPanel(this.selectedIndex);
  }

  start() {}
  step() {}
  reset() { this._render(); }
  destroy() {
    this.container
      ?.querySelectorAll('[data-domain-index]')
      .forEach((button) => button.removeEventListener('click', this._onDomainClick));
    this.container = null;
  }
}

export default new PathsOverview();
