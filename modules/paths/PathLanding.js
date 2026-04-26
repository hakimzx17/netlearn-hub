/**
 * PathLanding.js — Individual CCNA Domain Landing Page
 * Shows all topics in a domain with linear progression and final-exam readiness.
 */

import { stateManager }  from '../../js/stateManager.js';
import { eventBus } from '../../js/eventBus.js';
import { progressEngine } from '../../js/progressEngine.js';
import { getPathById, ALL_PATHS } from '../../data/pathRegistry.js';
import { renderTokenIcon } from '../../utils/tokenIcons.js';

class PathLanding {
  constructor() {
    this.container = null;
    this._pathId = null;
  }

  init(containerEl) {
    this.container = containerEl;
    // Extract pathId from hash: #/paths/fundamentals → 'fundamentals'
    const hash = window.location.hash.slice(1);
    const parts = hash.split('/').filter(Boolean); // ['paths', 'fundamentals']
    this._pathId = parts[1] || null;
    this._render();
  }

  _render() {
    const path = getPathById(this._pathId);
    if (!path) {
      this.container.innerHTML = `
        <div class="loading-screen">
          <h2>Domain not found</h2>
          <p class="text-secondary">No CCNA domain matches "${this._pathId}"</p>
          <a href="#/paths" class="btn btn-secondary" style="margin-top:1rem;">← Back to Domains</a>
        </div>
      `;
      return;
    }

    const isUnlocked = progressEngine.isPathUnlocked(path, ALL_PATHS);
    const adminPreview = stateManager.getState('adminPreview') === true;
    const pathDone   = path.modules.filter((module) => progressEngine.isTopicComplete(module.id)).length;
    const pct        = path.modules.length > 0 ? Math.round((pathDone / path.modules.length) * 100) : 0;
    const firstPendingIndex = path.modules.findIndex((module) => !progressEngine.isTopicComplete(module.id));
    const nextTopic = firstPendingIndex >= 0 ? path.modules[firstPendingIndex] : null;
    const finalUnlocked = progressEngine.isDomainFinalUnlocked(path);
    const finalPassed = progressEngine.isDomainFinalPassed(path.id);
    const finalExamAuthored = path.finalExam?.status === 'authored';
    const domainFinalRecord = stateManager.getState('userProgress')?.domainFinals?.[path.id] || null;
    const finalScoreHistory = Array.isArray(domainFinalRecord?.scoreHistory) ? domainFinalRecord.scoreHistory : [];
    const latestFinalScore = finalScoreHistory.length > 0 ? finalScoreHistory[finalScoreHistory.length - 1] : null;
    const flaggedModules = (domainFinalRecord?.flaggedTopicIds || [])
      .map((topicId) => path.modules.find((module) => module.id === topicId))
      .filter(Boolean);
    const canLaunchFinal = finalExamAuthored && (finalUnlocked || adminPreview);
    const prereqTitles = (path.prerequisites || [])
      .map((preId) => ALL_PATHS.find((candidate) => candidate.id === preId)?.title || preId)
      .join(' and ');

    if (!isUnlocked) {
      this.container.innerHTML = `
        <div class="loading-screen">
          <p class="path-lock-screen__icon">${renderTokenIcon('LOCK', 'learning-token-icon')}</p>
          <h2>Domain Locked</h2>
          <p class="text-secondary">Complete ${prereqTitles} first to unlock this domain.</p>
          <a href="#/paths" class="btn btn-secondary" style="margin-top:1rem;">← Back to Domains</a>
        </div>
      `;
      return;
    }

    this.container.innerHTML = `
      <div class="path-landing">
        <div class="module-header">
          <div class="module-header__breadcrumb">
            <a href="#/">Home</a> › <a href="#/paths">CCNA Domains</a> › <span>${path.title}</span>
          </div>
          <div class="path-landing__header" style="--path-color:${path.color}">
            <div class="path-landing__icon">${renderTokenIcon(path.icon, 'learning-token-icon')}</div>
            <div>
              <h1 class="module-header__title">${path.title}</h1>
              <p class="module-header__description">${path.description}</p>
                <div class="timeline-card__meta" style="margin-top:0.75rem;">
                  <span>${path.examWeight}% exam weight</span>
                  <span>~${path.estimatedHours} study hours</span>
                  <span>${path.topicCount} topics</span>
                </div>
              </div>
            </div>
          <div class="path-landing__progress-row">
            <div class="path-landing__progress-bar">
              <div class="path-landing__progress-fill" style="width:${pct}%; background:${path.color}"></div>
            </div>
            <span class="text-mono text-sm" style="color:${path.color}">${pathDone}/${path.modules.length} topics complete (${pct}%)</span>
          </div>
        </div>

        <div class="path-modules-timeline">
          ${path.modules.map((mod, i) => {
            const isDone = progressEngine.isTopicComplete(mod.id);
            const isPrev = adminPreview || i === 0 || progressEngine.isTopicComplete(path.modules[i - 1].id);
            const isCurrent = !isDone && (adminPreview ? i === firstPendingIndex : isPrev);
            const isLocked = !adminPreview && !isDone && !isPrev;
            const difficultyLabel = `L${mod.difficulty}`;

            return `
              <div class="timeline-module ${isDone ? 'timeline-module--done' : ''} ${isCurrent ? 'timeline-module--current' : ''} ${isLocked ? 'timeline-module--locked' : ''}">
                <div class="timeline-connector" style="--path-color:${path.color}">
                    <div class="timeline-dot ${isDone ? 'timeline-dot--done' : isCurrent ? 'timeline-dot--current' : ''}">
                      ${isDone ? '✅' : i + 1}
                    </div>
                  ${i < path.modules.length - 1 ? '<div class="timeline-line"></div>' : ''}
                </div>
                <div class="timeline-content">
                  <div class="timeline-card" style="--path-color:${path.color}">
                    <div class="timeline-card__header">
                      <span class="timeline-card__icon">${renderTokenIcon(mod.icon, 'learning-token-icon')}</span>
                      <h3 class="timeline-card__title">${mod.code} ${mod.title}</h3>
                      ${isDone ? '<span class="badge badge-success">✅ Complete</span>' : ''}
                      ${isCurrent ? '<span class="badge badge-cyan">● Current</span>' : ''}
                      ${isLocked ? '<span class="badge" style="background:rgba(255,255,255,0.05);color:var(--color-text-muted)">🔒 Locked</span>' : ''}
                    </div>
                    <div class="timeline-card__meta">
                      <span>${difficultyLabel}</span>
                      <span>~${mod.estimatedMinutes} min</span>
                      ${mod.simulation ? `<span>LAB ${mod.simulation.label}</span>` : ''}
                      <span>${mod.quizType}</span>
                    </div>
                    ${!isLocked ? `
                      <a href="#/paths/${path.id}/${mod.id}" class="btn ${isCurrent ? 'btn-primary' : 'btn-ghost'} timeline-card__btn">
                        ${isDone ? 'Review Topic →' : isCurrent ? '▶ Start Topic' : 'Open Topic →'}
                      </a>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}

          <div class="timeline-module ${finalPassed ? 'timeline-module--done' : ''} ${finalUnlocked && !finalPassed ? 'timeline-module--current' : ''} ${!finalUnlocked && !adminPreview ? 'timeline-module--locked' : ''}">
            <div class="timeline-connector" style="--path-color:${path.color}">
              <div class="timeline-dot ${finalPassed ? 'timeline-dot--done' : finalUnlocked ? 'timeline-dot--current' : ''}">
                ${finalPassed ? '✅' : 'EXAM'}
              </div>
            </div>
            <div class="timeline-content">
              <div class="timeline-card timeline-card--capstone" style="--path-color:${path.color}">
                <div class="timeline-capstone">
                  <p class="timeline-capstone__eyebrow">Domain Capstone</p>
                  <div class="timeline-card__header timeline-card__header--capstone">
                    <span class="timeline-card__icon">${renderTokenIcon('EXAM', 'learning-token-icon')}</span>
                    <h3 class="timeline-card__title">${path.finalExam.title}</h3>
                    ${finalPassed ? '<span class="badge badge-success">✅ Passed</span>' : ''}
                    ${!finalPassed && finalUnlocked ? '<span class="badge badge-cyan">● Ready</span>' : ''}
                    ${!finalPassed && !finalUnlocked ? '<span class="badge" style="background:rgba(255,255,255,0.05);color:var(--color-text-muted)">🔒 Topic Quiz Gate</span>' : ''}
                  </div>

                  <p class="timeline-capstone__summary">
                    ${this._getFinalExamSummary(path, { finalUnlocked, finalPassed, finalExamAuthored })}
                  </p>

                  <div class="timeline-capstone__stats" aria-label="Final exam scope">
                    <div class="timeline-capstone__stat">
                      <span class="timeline-capstone__stat-label">Questions</span>
                      <strong class="timeline-capstone__stat-value">${path.finalExam.questionCount}</strong>
                    </div>
                    <div class="timeline-capstone__stat">
                      <span class="timeline-capstone__stat-label">Pass Mark</span>
                      <strong class="timeline-capstone__stat-value">${path.finalExam.passingScore}%</strong>
                    </div>
                    <div class="timeline-capstone__stat">
                      <span class="timeline-capstone__stat-label">Coverage</span>
                      <strong class="timeline-capstone__stat-value">${path.topicCount} topics</strong>
                    </div>
                  </div>

                  <div class="timeline-capstone__signals">
                    <span class="timeline-capstone__signal">${path.finalExam.quizType}</span>
                    <span class="timeline-capstone__signal">${finalExamAuthored ? 'Capstone question set ready' : 'Capstone outline only'}</span>
                    <span class="timeline-capstone__signal">${finalPassed ? 'Domain progression satisfied' : finalUnlocked ? 'Topic gate open' : 'Finish all topic quizzes to unlock'}</span>
                  </div>

                  ${domainFinalRecord ? `
                    <div class="timeline-capstone__stats" aria-label="Final exam history" style="margin-top:1rem;">
                      <div class="timeline-capstone__stat">
                        <span class="timeline-capstone__stat-label">Latest</span>
                        <strong class="timeline-capstone__stat-value">${latestFinalScore ?? '--'}${latestFinalScore !== null ? '%' : ''}</strong>
                      </div>
                      <div class="timeline-capstone__stat">
                        <span class="timeline-capstone__stat-label">Best</span>
                        <strong class="timeline-capstone__stat-value">${domainFinalRecord.bestScore || 0}%</strong>
                      </div>
                      <div class="timeline-capstone__stat">
                        <span class="timeline-capstone__stat-label">Attempts</span>
                        <strong class="timeline-capstone__stat-value">${domainFinalRecord.attempts || 0}</strong>
                      </div>
                    </div>
                  ` : ''}

                  ${flaggedModules.length > 0 && !finalPassed ? `
                    <div class="timeline-capstone__signals" style="margin-top:1rem;">
                      ${flaggedModules.map((module) => `
                        <a href="#/paths/${path.id}/${module.id}" class="timeline-capstone__signal" style="text-decoration:none;">
                          Review ${this._escapeHtml(module.code)} ${this._escapeHtml(module.title)}
                        </a>
                      `).join('')}
                    </div>
                  ` : ''}

                  <div class="timeline-capstone__actions">
                    ${nextTopic && !finalUnlocked ? `
                      <a href="#/paths/${path.id}/${nextTopic.id}" class="btn btn-primary timeline-card__btn">
                        Continue with ${nextTopic.code} →
                      </a>
                    ` : ''}
                    ${canLaunchFinal ? `
                      <a href="#/exam/domain-final/${path.id}" class="btn btn-primary timeline-card__btn">
                        ${finalPassed ? 'Retake Final Exam' : 'Take Final Exam'}
                      </a>
                    ` : ''}
                    <button type="button" class="btn ${canLaunchFinal || (nextTopic && !finalUnlocked) ? 'btn-ghost' : 'btn-primary'} timeline-card__btn" id="final-exam-scope-btn">
                      Review Exam Scope
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindPageActions(path, { finalUnlocked, finalPassed, finalExamAuthored });
  }

  _bindPageActions(path, examState) {
    const scopeBtn = this.container?.querySelector('#final-exam-scope-btn');
    if (!scopeBtn) return;

    scopeBtn.addEventListener('click', () => {
      this._openFinalExamScope(path, examState);
    });
  }

  _getFinalExamSummary(path, { finalUnlocked, finalPassed, finalExamAuthored }) {
    if (finalPassed) {
      return 'The capstone gate is cleared. Use the scope review below to revisit the concepts that closed out this domain.';
    }

    if (finalUnlocked) {
      return `All ${path.topicCount} topic quizzes are complete. This capstone rolls the full ${path.title} domain into one pass so the learner has to connect the topic sequence as one working operating model.`;
    }

    if (finalExamAuthored) {
      return 'The final exam scope is prepared and tied to this domain. Pass each topic quiz below and the capstone gate becomes the last checkpoint before domain completion.';
    }

    return 'The capstone remains a blueprint until its question set is published. Continue through the topic path to prepare the domain gate.';
  }

  _openFinalExamScope(path, { finalUnlocked, finalPassed, finalExamAuthored }) {
    const readinessLabel = finalPassed
      ? 'Domain capstone already passed'
      : finalUnlocked
        ? 'All topic quiz gates complete'
        : 'Topic completion still required';
    const authoredLabel = finalExamAuthored ? 'Question set ready' : 'Blueprint only';

    eventBus.emit('modal:open', {
      title: `${path.title} Final Exam Scope`,
      wide: true,
      body: `
        <div class="final-exam-preview">
          <div class="final-exam-preview__hero">
            <div class="final-exam-preview__copy">
              <p class="final-exam-preview__eyebrow">Domain Capstone</p>
              <h4 class="final-exam-preview__title">${this._escapeHtml(path.finalExam.title)}</h4>
              <p class="final-exam-preview__summary">
                One final pass across the full ${this._escapeHtml(path.title)} domain, designed to confirm that the learner can connect the topic sequence as a single operating model.
              </p>
            </div>
            <div class="final-exam-preview__stack">
              <div class="final-exam-preview__metric">
                <span>Questions</span>
                <strong>${path.finalExam.questionCount}</strong>
              </div>
              <div class="final-exam-preview__metric">
                <span>Pass mark</span>
                <strong>${path.finalExam.passingScore}%</strong>
              </div>
              <div class="final-exam-preview__metric">
                <span>Coverage</span>
                <strong>${path.topicCount} topics</strong>
              </div>
            </div>
          </div>

          <div class="final-exam-preview__signals">
            <span>${this._escapeHtml(readinessLabel)}</span>
            <span>${this._escapeHtml(authoredLabel)}</span>
            <span>${this._escapeHtml(path.finalExam.quizType)}</span>
          </div>

          <div class="final-exam-preview__topics">
            <p class="final-exam-preview__section-label">Coverage Map</p>
            <div class="final-exam-preview__topic-grid">
              ${path.modules.map((module) => `
                <div class="final-exam-preview__topic">
                  <span class="final-exam-preview__topic-code">${this._escapeHtml(module.code)}</span>
                  <span class="final-exam-preview__topic-title">${this._escapeHtml(module.title)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `,
    });
  }

  _escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  start() {}
  step() {}
  reset() { this._render(); }
  destroy() { this.container = null; }
}

export default new PathLanding();
