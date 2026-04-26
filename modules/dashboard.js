/**
 * dashboard.js — NetlearnHub Landing Page
 *
 * A simple TryHackMe/HackTheBox-inspired landing experience for new users:
 * focused hero, concise identity copy, terminal-style status, and a clean
 * learning roadmap list.
 */

import { stateManager } from '../js/stateManager.js';
import { progressEngine } from '../js/progressEngine.js';
import { ALL_PATHS, findPathForModule, getCurriculumStats } from '../data/pathRegistry.js';

const ICONS = {
  send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  lab: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.3L4.2 19A2 2 0 0 0 6 22h12a2 2 0 0 0 1.8-3L14 9.3V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  flash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.7 4.7L18 9.4l-4.3 1.7L12 16l-1.7-4.9L6 9.4l4.3-1.7z"/><path d="M19 13l.8 2.1.2.1L22 16l-2 .8-.2.1L19 19l-.8-2.1-.2-.1L16 16l2-.8.2-.1z"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
};

function icon(name, className = '') {
  return `<span class="${className}" aria-hidden="true">${ICONS[name] || ICONS.book}</span>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function trimCopy(value, maxLength = 118) {
  const text = String(value || '').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}…` : text;
}

class Dashboard {
  constructor() {
    this.container = null;
  }

  init(containerEl) {
    this.container = containerEl;
    this._render();
  }

  _render() {
    const model = this._buildModel();
    const actionLabel = model.hasLearningHistory ? model.resumeLabel : 'Start learning';

    this.container.innerHTML = `
      <div class="nh-simple" aria-labelledby="netlearnhub-title">
        <section class="nh-simple-hero" aria-label="NetlearnHub introduction">
          <div class="nh-simple-hero__copy">
            <p class="nh-simple-label">NetlearnHub / CCNA Training Lab</p>
            <h1 id="netlearnhub-title">NETWORK LEARN HUB</h1>
            <p class="nh-simple-lead">
              NetlearnHub is an interactive learning platform for new networking students. It explains CCNA concepts,
              shows how packets move, and gives you labs, quizzes, flashcards, and practice exams in one place.
            </p>

            <div class="nh-simple-actions" aria-label="Primary actions">
              <a href="${model.resumeRoute}" class="nh-simple-btn nh-simple-btn--primary">
                <span>${escapeHtml(actionLabel)}</span>
                ${icon('send', 'nh-simple-icon')}
              </a>
              <a href="#/paths" class="nh-simple-btn nh-simple-btn--ghost">
                <span>View curriculum</span>
                ${icon('chevron', 'nh-simple-icon')}
              </a>
            </div>

            <dl class="nh-simple-stats" aria-label="NetlearnHub platform summary">
              <div><dt>${model.curriculumStats.domainCount}</dt><dd>${icon('shield', 'nh-simple-stat-icon')} Domains</dd></div>
              <div><dt>${model.curriculumStats.topicCount}</dt><dd>${icon('book', 'nh-simple-stat-icon')} Topics</dd></div>
              <div><dt>${model.curriculumStats.simulationCount}</dt><dd>${icon('lab', 'nh-simple-stat-icon')} Labs</dd></div>
            </dl>
          </div>

          <aside class="nh-simple-terminal" aria-label="Current learning status">
            <div class="nh-simple-terminal__bar">
              <span></span><span></span><span></span>
              <strong>learning-session</strong>
            </div>
            <div class="nh-simple-terminal__body">
              <p><span>$</span> platform --name netlearnhub</p>
              <p>${icon('shield', 'nh-simple-stat-icon')} Identity: Interactive CCNA learning hub</p>
              <p>${icon('book', 'nh-simple-stat-icon')} Active path: ${escapeHtml(model.pathName)}</p>
              <p>${icon('send', 'nh-simple-stat-icon')} Next step: ${escapeHtml(model.currentObjective)}</p>
              <p>${icon('flash', 'nh-simple-stat-icon')} Progress: ${model.pathDone}/${model.pathTotal} topics clear</p>
            </div>
            <div class="nh-simple-progress" role="progressbar" aria-label="Active path progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${model.pathProgress}">
              <span style="width:${model.pathProgress}%"></span>
            </div>
          </aside>
        </section>

        <section class="nh-simple-section nh-simple-section--split" aria-labelledby="nh-about-title">
          <div>
            <p class="nh-simple-label">${icon('shield', 'nh-simple-label-icon')}What it is</p>
            <h2 id="nh-about-title">The Ultimate Study Platform For the CCNA</h2>
          </div>
          <p>
            Start with beginner-friendly explanations, move into simulations, test yourself with quizzes,
            then use flashcards and exam mode to close weak areas. NetlearnHub is built to help you understand
            networks by doing, not just reading.
          </p>
        </section>

        <section class="nh-simple-section" aria-labelledby="nh-flow-title">
          <p class="nh-simple-label">${icon('flash', 'nh-simple-label-icon')}How it works</p>
          <h2 id="nh-flow-title">One simple learning loop</h2>
          <ol class="nh-simple-flow">
            <li><span class="nh-simple-flow-step">01</span><strong>${icon('book', 'nh-simple-label-icon')}Learn</strong><p>Read a focused CCNA topic explanation.</p></li>
            <li><span class="nh-simple-flow-step">02</span><strong>${icon('lab', 'nh-simple-label-icon')}Practice</strong><p>Use a visual lab to see the concept work.</p></li>
            <li><span class="nh-simple-flow-step">03</span><strong>${icon('shield', 'nh-simple-label-icon')}Validate</strong><p>Pass quizzes and review weak areas.</p></li>
            <li><span class="nh-simple-flow-step">04</span><strong>${icon('flash', 'nh-simple-label-icon')}Prepare</strong><p>Train with flashcards and exam sessions.</p></li>
          </ol>
        </section>

        <section class="nh-simple-section" aria-labelledby="nh-roadmap-title">
          <div class="nh-simple-heading-row">
            <div>
              <p class="nh-simple-label">${icon('book', 'nh-simple-label-icon')} Roadmap</p>
              <h2 id="nh-roadmap-title">CCNA domains</h2>
            </div>
            <a href="#/simulations" class="nh-simple-text-link">Open lab grid ${icon('chevron', 'nh-simple-icon')}</a>
          </div>
          <div class="nh-simple-roadmap">
            ${this._renderDomainRows(ALL_PATHS)}
          </div>
        </section>

        <section class="nh-simple-final" aria-label="Recommended next action">
          <div>
            <p class="nh-simple-label">${icon('send', 'nh-simple-label-icon')} Recommended</p>
            <h2>${escapeHtml(model.commandHeadline)}</h2>
            <p>${escapeHtml(model.commandCopy)}</p>
          </div>
          <a href="${model.resumeRoute}" class="nh-simple-btn nh-simple-btn--primary">
            <span>${escapeHtml(actionLabel)}</span>
            ${icon('send', 'nh-simple-icon')}
          </a>
        </section>
      </div>
    `;
  }

  _renderDomainRows(paths) {
    return paths.map((path, index) => {
      const total = path.modules.length;
      const done = path.modules.filter(mod => progressEngine.isTopicComplete(mod.id)).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
      const isUnlocked = progressEngine.isPathUnlocked(path, ALL_PATHS);
      const isComplete = progressEngine.isPathComplete(path);
      const href = isUnlocked
        ? `#/paths/${path.id}`
        : '#/paths';

      return `
        <a href="${href}" class="nh-simple-domain ${isUnlocked ? '' : 'is-locked'} ${isComplete ? 'is-complete' : ''}">
          <span class="nh-simple-domain__index">${String(index + 1).padStart(2, '0')}</span>
          <span class="nh-simple-domain__main">
            <strong>${icon(this._domainIcon(path.id), 'nh-simple-label-icon')}${escapeHtml(path.title)}</strong>
            <small>${escapeHtml(trimCopy(path.description || path.learningGoal))}</small>
          </span>
          <span class="nh-simple-domain__meta">${done}/${total}</span>
          <span class="nh-simple-domain__bar" aria-hidden="true"><span style="width:${pct}%"></span></span>
        </a>
      `;
    }).join('');
  }

  _buildModel() {
    const profile = stateManager.getState('userProfile') || {};
    const progress = stateManager.getState('userProgress') || {};
    const learning = stateManager.getState('learningState') || {};
    const completed = new Set(progress.completedModules || []);
    const weakAreas = progressEngine.getWeakAreas();
    const curriculumStats = getCurriculumStats();
    const mission = this._resolveMission(learning, completed);

    const topicIds = ALL_PATHS.flatMap(path => path.modules.map(mod => mod.id));
    const completedCount = topicIds.filter(topicId => completed.has(topicId)).length;
    const pathDone = mission.path ? mission.path.modules.filter(mod => progressEngine.isTopicComplete(mod.id)).length : 0;
    const pathTotal = mission.path ? mission.path.modules.length : 1;
    const pathProgress = Math.round((pathDone / Math.max(1, pathTotal)) * 100);

    return {
      curriculumStats,
      pathName: mission.pathName,
      currentObjective: mission.moduleTitle || mission.title,
      resumeRoute: mission.route,
      resumeLabel: this._getResumeLabel(mission),
      commandHeadline: this._buildCommandHeadline(mission),
      commandCopy: this._buildCommandCopy(mission),
      commandStatus: this._buildCommandStatus(profile, weakAreas),
      pathDone,
      pathTotal,
      pathProgress,
      completedCount,
      hasLearningHistory: Boolean(learning.lastModuleId || completedCount > 0),
    };
  }

  _resolveMission(learning, completed) {
    if (learning.lastModuleId) {
      const located = findPathForModule(learning.lastModuleId);
      if (located) {
        return {
          kind: 'module',
          route: this._buildLessonRoute(located.path.id, located.module.id, learning.lastPosition),
          title: `${located.path.title}: Active Study`,
          moduleTitle: located.module.title,
          pathName: located.path.title,
          path: located.path,
          position: learning.lastPosition || 'theory',
        };
      }
    }

    for (const path of ALL_PATHS) {
      if (!progressEngine.isPathUnlocked(path, ALL_PATHS)) continue;

      const next = path.modules.find(mod => !completed.has(mod.id));
      if (next) {
        return {
          kind: 'module',
          route: this._buildLessonRoute(path.id, next.id, 'theory'),
          title: `${path.title}: Next Topic`,
          moduleTitle: next.title,
          pathName: path.title,
          path,
          position: 'theory',
        };
      }

      if (!progressEngine.isDomainFinalPassed(path.id)) {
        return {
          kind: 'final',
          route: `#/paths/${path.id}`,
          title: `${path.title} Final`,
          moduleTitle: path.finalExam?.title || 'Domain Final Exam',
          pathName: path.title,
          path,
          position: 'final-exam',
        };
      }
    }

    const fallbackPath = ALL_PATHS[0];
    return {
      kind: 'review',
      route: '#/simulations',
      title: 'Review Mode',
      moduleTitle: 'Simulation Grid',
      pathName: fallbackPath?.title || 'All Domains',
      path: fallbackPath || null,
      position: 'simulation',
    };
  }

  _buildLessonRoute(pathId, moduleId, position = 'theory') {
    const baseRoute = `#/paths/${pathId}/${moduleId}`;
    if (position === 'simulation') return `${baseRoute}?tab=simulation`;
    if (position === 'quiz') return `${baseRoute}?tab=quiz`;
    return baseRoute;
  }

  _buildCommandHeadline(mission) {
    if (mission.kind === 'final') return `Prepare for ${mission.pathName} final`;
    if (mission.kind === 'review') return 'Keep practicing with labs';
    return `Continue ${mission.moduleTitle}`;
  }

  _buildCommandCopy(mission) {
    if (mission.kind === 'final') return 'Review the domain, close weak areas, and start the final assessment when ready.';
    if (mission.kind === 'review') return 'Use simulations, flashcards, and exam practice to keep your skills sharp.';
    return `Your next checkpoint is inside ${mission.pathName}. Continue the lesson, then complete the lab and quiz.`;
  }

  _buildCommandStatus(profile, weakAreas) {
    const streak = profile.streak || 0;
    if (Array.isArray(weakAreas) && weakAreas.length > 0) return 'review needed';
    if (streak > 0) return `${streak}-day streak`;
    return 'ready';
  }

  _getResumeLabel(mission) {
    if (mission.kind === 'final') return 'Open final';
    if (mission.kind === 'review') return 'Open labs';
    if (mission.position === 'simulation') return 'Resume lab';
    if (mission.position === 'quiz') return 'Resume quiz';
    return 'Resume lesson';
  }

  _domainIcon(pathId) {
    const map = {
      fundamentals: 'book',
      'network-access': 'lab',
      'ip-connectivity': 'send',
      'ip-services': 'flash',
      'security-fundamentals': 'shield',
      'automation-programmability': 'send',
    };
    return map[pathId] || 'book';
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
