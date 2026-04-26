/**
 * dashboard.js — Command Center Dashboard
 *
 * Implements the "Immersive Tactical HUD" rework.
 * Preserves existing learning/progress logic while presenting
 * a redesigned mission-focused interface.
 */

import { stateManager } from '../js/stateManager.js';
import { progressEngine } from '../js/progressEngine.js';
import { eventBus } from '../js/eventBus.js';
import { ALL_PATHS, findPathForModule, getAllSimulations, getCurriculumStats } from '../data/pathRegistry.js';
import { ACHIEVEMENTS } from '../data/achievements.js';

const ICONS = {
  network: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><path d="M12 7v10M7 12h10"/></svg>`,
  zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
  activity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9-6-18-3 9H2"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`,
  sparkles: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.7 4.7L18 9.4l-4.3 1.7L12 16l-1.7-4.9L6 9.4l4.3-1.7z"/><path d="M5 3l.7 2 .3.1L8 6l-2 1-.3.1L5 9l-.7-1.9-.3-.1L2 6l2-1 .3-.1z"/><path d="M19 13l.8 2.1.2.1L22 16l-2 .8-.2.1L19 19l-.8-2.1-.2-.1L16 16l2-.8.2-.1z"/></svg>`,
  bot: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01"/></svg>`,
  external: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3h7v7"/><path d="M10 14 21 3"/><path d="M21 14v7h-7"/><path d="M3 10V3h7"/><path d="M3 21h7v-7"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  cpu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  flask: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.3L4.2 19A2 2 0 0 0 6 22h12a2 2 0 0 0 1.8-3L14 9.3V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>`,
};

function icon(name, className = '') {
  return `<span class="${className}">${ICONS[name] || ICONS.activity}</span>`;
}

class Dashboard {
  constructor() {
    this.container = null;
    this._lastModel = null;
  }

  init(containerEl) {
    this.container = containerEl;
    this._render();
  }

  _render() {
    const model = this._buildModel();
    this._lastModel = model;

    const runwayHtml = this._renderRunway(ALL_PATHS);

    const telemetryHtml = `
      <aside class="hud-telemetry">
        <article class="hud-card">
          <div class="hud-card__label">
            <span>Curriculum Coverage</span>
            <span>${model.completionRate}%</span>
          </div>
          <div class="hud-stat-row">
            <div class="hud-stat-value">${model.completedCount}<span class="hud-stat-unit">/${model.totalModules}</span></div>
            <div class="ops-stat-icon">${icon('book')}</div>
          </div>
          <div class="ops-progress-bar ops-progress-bar--thin" role="progressbar" aria-label="Curriculum coverage" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${model.completionRate}">
            <div class="ops-progress-fill" style="width:${model.completionRate}%"></div>
          </div>
          <div class="ops-snapshot-card__meta">${model.completedDomains}/${model.curriculumStats.domainCount} Domains Clear</div>
        </article>

        <article class="hud-card">
          <div class="hud-card__label">
            <span>Simulation Ledger</span>
            <span>${model.simulationRate}%</span>
          </div>
          <div class="hud-stat-row">
            <div class="hud-stat-value">${model.completedLabs}<span class="hud-stat-unit">/${model.curriculumStats.simulationCount}</span></div>
            <div class="ops-stat-icon">${icon('flask')}</div>
          </div>
          <div class="ops-snapshot-card__meta">${model.liveSimulationCount} Active Engines Online</div>
        </article>

        <article class="hud-card">
          <div class="hud-card__label">
            <span>Level Sync</span>
            <span>${model.level.title}</span>
          </div>
          <div class="hud-stat-row">
            <div class="hud-stat-value">L${model.level.level}</div>
            <div class="ops-stat-icon">${icon('shield')}</div>
          </div>
          <div class="ops-progress-bar ops-progress-bar--thin" role="progressbar" aria-label="Level progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${model.levelProgress}">
            <div class="ops-progress-fill" style="width:${model.levelProgress}%"></div>
          </div>
          <div class="ops-snapshot-card__meta">${model.xpToNext} XP to L${model.level.level + 1}</div>
        </article>

        <article class="hud-card hud-card--activity">
          <div class="hud-card__label">System Activity</div>
          <div class="ops-log-list hud-log-list--compact">
            ${model.logs.slice(0, 3).map(log => `
              <div class="ops-log-item hud-log-item--compact ${log.muted ? 'ops-log-item--muted' : ''}">
                <div class="ops-log-title hud-log-title--compact">${log.title}</div>
              </div>
            `).join('')}
          </div>
          <div class="ops-actions-list hud-card__actions">
             <button id="dash-flashcard-btn" type="button" class="ops-action-link ops-action-link--compact">${icon('sparkles')} Flashcard Sprint</button>
             <a href="#/exam" class="ops-action-link ops-action-link--compact">${icon('shield')} Launch Exam Session</a>
          </div>
        </article>
      </aside>
    `;

    this.container.innerHTML = `
      <div class="hud-container">
        <main class="hud-terminal">
          <div class="hud-terminal__inner">
            <div class="hud-terminal__kicker">
              ACTIVE MISSION: ${model.pathName.toUpperCase()}
            </div>

            <div class="hud-terminal__status-row">
              <span class="hud-terminal__status-pill">${model.commandStatus}</span>
              <span class="hud-terminal__status-pill hud-terminal__status-pill--muted">${model.pathDone}/${model.pathTotal} modules cleared</span>
              <span class="hud-terminal__status-pill hud-terminal__status-pill--muted">L${model.level.level} ${model.level.title}</span>
            </div>

            <h1 class="hud-terminal__title">${model.commandHeadline.toUpperCase()}</h1>
            <p class="hud-terminal__desc">${model.commandCopy}</p>

            <div class="hud-terminal__mission-grid">
              <article class="hud-terminal__mission-card">
                <span class="hud-terminal__mission-label">Current objective</span>
                <strong class="hud-terminal__mission-value">${(model.missionModule || model.missionTitle).toUpperCase()}</strong>
                <span class="hud-terminal__mission-meta">${model.resumeMeta} · ${model.pathName}</span>
              </article>

              <article class="hud-terminal__mission-card">
                <span class="hud-terminal__mission-label">Path completion</span>
                <div class="hud-terminal__mission-meter" role="progressbar" aria-label="Path completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${model.pathProgress}">
                  <span style="width:${model.pathProgress}%"></span>
                </div>
                <span class="hud-terminal__mission-meta">${model.pathProgress}% clear · ${model.pathDone}/${model.pathTotal} modules online</span>
              </article>
            </div>

            <div class="hud-terminal__actions">
              <a href="${model.resumeRoute}" class="hud-launch-btn">
                <span class="hud-launch-btn__label">${model.resumeLabel.toUpperCase()}</span>
                ${icon('send', 'hud-launch-btn__icon')}
              </a>

              <a href="${model.missionHubRoute}" class="hud-support-btn">
                ${icon('chevron', 'hud-support-btn__icon')}
                <span>VIEW DOMAIN RUNWAY</span>
              </a>
            </div>

            <div class="ops-brief-tags hud-terminal__tags">
              <span class="ops-data-chip">${icon('activity')} ${model.resumeMeta}</span>
              <span class="ops-data-chip">${icon('shield')} ${model.streak > 0 ? `${model.streak}-Day Cadence` : 'Cadence: Initializing'}</span>
              <span class="ops-data-chip">${icon('flask')} ${model.relatedSimulation.label}</span>
            </div>
          </div>
        </main>

        ${telemetryHtml}

        <section class="hud-runway">
          ${runwayHtml}
        </section>
      </div>
    `;

    this._bindEvents();
  }

  _renderRunway(paths) {
    return paths.map((path, index) => {
      const total = path.modules.length;
      const done = path.modules.filter(mod => progressEngine.isTopicComplete(mod.id)).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const isUnlocked = progressEngine.isPathUnlocked(path, ALL_PATHS);
      const isComplete = progressEngine.isPathComplete(path);
      const firstPending = path.modules.find(mod => !progressEngine.isTopicComplete(mod.id));

      const href = isUnlocked
        ? (firstPending ? `#/paths/${path.id}/${firstPending.id}` : `#/paths/${path.id}`)
        : '#/paths';

      return `
        <a href="${href}" class="hud-runway-item ${isUnlocked ? '' : 'is-locked'} ${isComplete ? 'is-complete' : ''} ${pct > 0 && pct < 100 ? 'is-active' : ''}">
          <div class="hud-runway-head">
            <span class="hud-runway-icon" style="color: ${isUnlocked ? path.color : 'var(--color-text-muted)'}">
              ${icon(this._pickPathIcon(path.id))}
            </span>
            ${isComplete ? `<span class="hud-runway-check">${icon('check')}</span>` : ''}
          </div>
          <div class="hud-runway-title">${path.title}</div>
          <div class="hud-runway-progress">
            <div class="hud-runway-fill" style="width: ${pct}%; background: ${path.color}"></div>
          </div>
        </a>
      `;
    }).join('');
  }

  _buildModel() {
    const profile = stateManager.getState('userProfile');
    const progress = stateManager.getState('userProgress');
    const learning = stateManager.getState('learningState');

    const completed = new Set(progress.completedModules || []);
    const level = progressEngine.getLevelForXP(profile.xp);
    const weakAreas = progressEngine.getWeakAreas();
    const simulations = getAllSimulations();
    const curriculumStats = getCurriculumStats();

    const mission = this._resolveMission(learning, completed);
    const totalModules = ALL_PATHS.reduce((sum, path) => sum + path.modules.length, 0);
    const pathDone = mission.path ? mission.path.modules.filter(mod => progressEngine.isTopicComplete(mod.id)).length : 0;
    const pathTotal = mission.path ? mission.path.modules.length : 1;
    const pathProgress = Math.round((pathDone / pathTotal) * 100);

    const completedLabs = simulations.filter(sim => completed.has(sim.moduleId)).length;
    const liveSimulationCount = simulations.filter(sim => sim.implemented).length;
    const simulationRate = curriculumStats.simulationCount > 0
      ? Math.round((completedLabs / curriculumStats.simulationCount) * 100)
      : 0;
    const completedDomains = ALL_PATHS.filter(path => progressEngine.isPathComplete(path)).length;

    const completionRate = totalModules > 0 ? Math.round((completed.size / totalModules) * 100) : 0;
    const uptimeValue = Math.min(99.9, 97.1 + Math.max(0, profile.streak || 0) * 0.24).toFixed(1);

    const activeNodes = 96 + completed.size * 2;
    const achievementCount = (profile.achievements || []).length;
    const achievementRate = Math.round((achievementCount / ACHIEVEMENTS.length) * 100);

    const logs = this._buildSystemLogs({ mission, profile, weakAreas, completedLabs, completionRate });
    const weakTarget = this._resolveWeakTarget(weakAreas);
    const recommendedSimulations = this._selectRecommendedSimulations(mission, simulations);
    const relatedSimulation = this._resolveRelatedSimulation(mission, recommendedSimulations, simulations);
    const nextLevelXP = progressEngine.getNextLevelXP(profile.xp);
    const currentLevelXP = level.xp || 0;
    const levelSpan = Math.max(1, nextLevelXP - currentLevelXP);
    const levelProgress = nextLevelXP > currentLevelXP
      ? Math.min(100, Math.max(0, Math.round(((profile.xp - currentLevelXP) / levelSpan) * 100)))
      : 100;
    const xpToNext = Math.max(0, nextLevelXP - profile.xp);
    const resumeLabel = this._getResumeLabel(mission);

    return {
      level,
      curriculumStats,
      missionRoute: mission.route,
      missionTitle: mission.title,
      missionModule: mission.moduleTitle,
      missionCopy: mission.copy,
      pathName: mission.pathName,
      missionHubRoute: mission.path ? `#/paths/${mission.path.id}` : '#/paths',
      missionKind: mission.kind,
      resumeRoute: mission.route,
      resumeLabel,
      resumeMeta: this._getResumeMeta(mission),
      commandHeadline: this._buildCommandHeadline(mission),
      commandCopy: this._buildCommandCopy(mission, resumeLabel),
      commandStatus: this._buildCommandStatus(profile, weakTarget),
      pathProgress,
      pathDone,
      pathTotal,
      activeNodes,
      nodeTrend: `+${Math.max(2, Math.round(completedLabs / 2))}`,
      achievementCount,
      achievementRate,
      completedCount: completed.size,
      completedDomains,
      completedLabs,
      simulationRate,
      liveSimulationCount,
      completionRate,
      uptime: `${uptimeValue}%`,
      logs,
      weakAreas,
      weakTarget,
      recommendedSimulations,
      relatedSimulation,
      levelProgress,
      xpToNext,
      streak: profile.streak || 0,
      totalModules,
    };
  }

  _resolveMission(learning, completed) {
    if (learning.lastModuleId) {
      const located = findPathForModule(learning.lastModuleId);
      if (located) {
        const route = this._buildLessonRoute(located.path.id, located.module.id, learning.lastPosition);
        return {
          kind: 'module',
          route,
          title: `${located.path.title}: Active Study Cycle`,
          moduleTitle: located.module.title,
          pathName: located.path.title,
          path: located.path,
          module: located.module,
          position: learning.lastPosition || 'theory',
          copy: `Resume your tracked progression with a focus on applied packet-flow reasoning and validation.`
        };
      }
    }

    for (const path of ALL_PATHS) {
      const next = path.modules.find(mod => !progressEngine.isTopicComplete(mod.id));
      if (next) {
        return {
          kind: 'module',
          route: this._buildLessonRoute(path.id, next.id, 'theory'),
          title: `${path.title}: Mission Queue`,
          moduleTitle: next.title,
          pathName: path.title,
          path,
          module: next,
          position: 'theory',
          copy: `This route is the next unlocked objective in your sequence. Start with one clean run and document each decision hop.`
        };
      }

      if (!progressEngine.isDomainFinalPassed(path.id)) {
        return {
          kind: 'final',
          route: `#/paths/${path.id}`,
          title: `${path.title}: Final Exam Ready`,
          moduleTitle: path.finalExam?.title || 'Domain Final Exam',
          pathName: path.title,
          path,
          module: null,
          position: 'final-exam',
          copy: 'All topic gates are satisfied. Review the domain landing page and prepare the final exam blueprint for the next implementation phase.',
        };
      }
    }

    const fallbackPath = ALL_PATHS[0];
    return {
      kind: 'review',
      route: '#/simulations',
      title: 'Mastery Loop: Advanced Review',
      moduleTitle: 'Simulation Grid',
      pathName: fallbackPath?.title || 'All Domains',
      path: fallbackPath || null,
      module: null,
      position: 'simulation',
      copy: 'All tracked modules are complete. Switch to review simulations and exam drills to lock in retention.'
    };
  }

  _buildLessonRoute(pathId, moduleId, position = 'theory') {
    const baseRoute = `#/paths/${pathId}/${moduleId}`;
    if (position === 'simulation') return `${baseRoute}?tab=simulation`;
    if (position === 'quiz') return `${baseRoute}?tab=quiz`;
    return baseRoute;
  }

  _buildCommandHeadline(mission) {
    if (mission.kind === 'final') return `Prepare ${mission.pathName} Final`;
    if (mission.kind === 'review') return 'Shift Into Advanced Review';
    return `Continue ${mission.moduleTitle}`;
  }

  _buildCommandCopy(mission, resumeLabel) {
    if (mission.kind === 'final') {
      return `All topic gates inside ${mission.pathName} are satisfied. Review the domain runway, tighten weak spots, and launch the final assessment when the sequence feels clean.`;
    }

    if (mission.kind === 'review') {
      return 'Your tracked module queue is clear. Rotate into simulations, flashcards, and exam drills to keep packet flow, subnetting, and troubleshooting fresh under time pressure.';
    }

    const resumePhrase = mission.position === 'simulation'
      ? 'the simulation checkpoint'
      : mission.position === 'quiz'
        ? 'the quiz checkpoint'
        : 'the lesson flow';

    return `${mission.copy} Resume from ${resumePhrase} inside ${mission.pathName}, then push the next topic gate forward.`;
  }

  _buildCommandStatus(profile, weakTarget) {
    const streak = profile.streak || 0;
    if (weakTarget) {
      return streak > 0 ? `Recovery queue active • ${streak}-day cadence` : 'Recovery queue active';
    }
    if (streak >= 7) return `${streak}-day cadence active`;
    if (streak > 0) return `${streak}-day learning cadence`;
    return 'Fresh session ready';
  }

  _getResumeLabel(mission) {
    if (mission.kind === 'final') return 'Open Domain Final';
    if (mission.kind === 'review') return 'Open Simulation Grid';
    if (mission.position === 'simulation') return 'Resume Simulation';
    if (mission.position === 'quiz') return 'Resume Quiz';
    return 'Resume Lesson';
  }

  _getResumeMeta(mission) {
    if (mission.kind === 'final') return 'Domain final assessment';
    if (mission.kind === 'review') return 'Advanced review cycle';

    const labelMap = {
      theory: 'Theory checkpoint',
      simulation: 'Simulation checkpoint',
      quiz: 'Quiz checkpoint',
    };

    return labelMap[mission.position] || 'Lesson checkpoint';
  }

  _resolveWeakTarget(weakAreas) {
    if (!Array.isArray(weakAreas) || weakAreas.length === 0) return null;

    const target = weakAreas[0];
    const found = findPathForModule(target.moduleId);
    if (!found) {
      return {
        title: target.moduleId,
        averageScore: target.averageScore,
        pathName: 'Quiz Review',
        route: '#/paths',
      };
    }

    return {
      title: found.module.title,
      averageScore: target.averageScore,
      pathName: found.path.title,
      route: `#/paths/${found.path.id}/${found.module.id}?tab=quiz`,
    };
  }

  _selectRecommendedSimulations(mission, simulations) {
    const ranked = [];

    if (mission.module) {
      const exactMatch = simulations.find((sim) => sim.moduleId === mission.module.id);
      if (exactMatch) ranked.push(exactMatch);
    }

    if (mission.path?.id) {
      simulations
        .filter((sim) => sim.pathId === mission.path.id && !ranked.some((item) => item.id === sim.id))
        .forEach((sim) => ranked.push(sim));
    }

    simulations.forEach((sim) => {
      if (!ranked.some((item) => item.id === sim.id)) ranked.push(sim);
    });

    return ranked.slice(0, 4);
  }

  _resolveRelatedSimulation(mission, recommendedSimulations, simulations) {
    const preferred = recommendedSimulations[0] || simulations[0] || null;
    if (!preferred) {
      return {
        route: '#/simulations',
        label: 'Simulation Grid',
        meta: 'Browse every available drill and lab engine',
        ctaLabel: 'Open Drill Grid',
      };
    }

    return {
      route: `#${preferred.launchRoute}`,
      label: preferred.label,
      meta: `${preferred.moduleName} • ${preferred.implemented ? 'Live simulator' : 'Guided lesson lab'}`,
      ctaLabel: preferred.implemented ? 'Run Related Lab' : 'Open Guided Lab',
    };
  }

  _buildSystemLogs({ mission, profile, weakAreas, completedLabs, completionRate }) {
    const logs = [];

    logs.push({
      title: `Mission pointer synced to ${mission.moduleTitle}`,
      meta: `${mission.pathName} • just now`
    });

    logs.push({
      title: `Simulation ledger updated: ${completedLabs} labs completed`,
      meta: `Completion index ${completionRate}% • 4m ago`
    });

    if (weakAreas.length > 0) {
      const target = weakAreas[0];
      const found = findPathForModule(target.moduleId);
      logs.push({
        title: `Weak-signal detected in ${found ? found.module.title : target.moduleId}`,
        meta: `Avg ${target.averageScore}% • remediation queued`
      });
    } else {
      logs.push({
        title: 'No critical weak areas detected in quiz analytics',
        meta: 'Study health stable • maintain cadence',
        muted: true
      });
    }

    logs.push({
      title: `${(profile.achievements || []).length}/${ACHIEVEMENTS.length} achievements unlocked`,
      meta: `Current level ${progressEngine.getLevelForXP(profile.xp).title} • profile synced`
    });

    return logs;
  }

  _pickSimIcon(simId) {
    if (simId.includes('subnet') || simId.includes('vlsm')) return 'flask';
    if (simId.includes('route') || simId.includes('ttl')) return 'globe';
    if (simId.includes('arp') || simId.includes('mac')) return 'network';
    return 'cpu';
  }

  _pickPathIcon(pathId) {
    const map = {
      fundamentals: 'book',
      'network-access': 'network',
      'ip-connectivity': 'send',
      'ip-services': 'shield',
      'security-fundamentals': 'shield',
      'automation-programmability': 'cpu',
    };
    return map[pathId] || 'cpu';
  }

  _bindEvents() {
    const flashcardBtn = this.container.querySelector('#dash-flashcard-btn');
    if (flashcardBtn) {
      flashcardBtn.addEventListener('click', () => {
        eventBus.emit('nav:route-change', { route: '/resources' });
        sessionStorage.setItem('openFlashcards', 'true');
      });
    }
  }

  start() {}
  step() {}

  reset() {
    this._render();
  }

  destroy() {
    this.container = null;
  }
}

export default new Dashboard();
