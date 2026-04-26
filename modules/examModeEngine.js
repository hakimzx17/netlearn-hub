/**
 * examModeEngine.js — CCNA Exam Mode Engine
 *
 * Screens:   lobby → exam → results → review
 * Modes:     quick (20Q/30min), topic (20Q/30min), full (120Q/120min)
 * Q-types:   single (radio), multi (checkbox), order (drag), input (text)
 * Scoring:   scaled 0–1000, pass ≥ 825, domain breakdown
 *
 * Module contract: init(el), start(), reset(), destroy()
 * Imports: examQuestions.js, stateManager.js, helperFunctions.js
 * Styles:  fully self-contained (no CSS variable dependencies)
 */

import { QUESTIONS, DOMAINS, buildQuestionSet, getQuestionTopic } from '../data/examQuestions.js';
import { ALL_PATHS, getPathById } from '../data/pathRegistry.js';
import { progressEngine } from '../js/progressEngine.js';
import { stateManager } from '../js/stateManager.js';
import { escapeHtml, showToast }    from '../utils/helperFunctions.js';
import { renderTokenIcon } from '../utils/tokenIcons.js';

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const MODE_CONFIG = {
  quick: { label: 'Quick Practice', count: 20, minutes: 30 },
  topic: { label: 'Topic Focus',    count: 20, minutes: 30 },
  full:  { label: 'Full Exam',      count: 120, minutes: 120 },
};
const PASS_SCORE   = 825;
const SCORE_MAX    = 1000;
const DOMAIN_NAMES = DOMAINS;
const DOMAIN_FINAL_SECONDS_PER_QUESTION = 90;

// ─── MODULE CLASS ─────────────────────────────────────────────────────────────
class ExamModeEngine {
  constructor() {
    this.container    = null;
    // exam state
    this._screen      = 'lobby';   // lobby | exam | results | review
    this._mode        = 'quick';
    this._variant     = 'standard'; // standard | domain-final
    this._topicDomain = null;
    this._domainFinalPathId = null;
    this._domainFinalPath = null;
    this._domainFinalBank = null;
    this._questions   = [];        // active question set
    this._answers     = {};        // { qId: answer }
    this._flagged     = new Set();
    this._currentIdx  = 0;
    this._timeLeft    = 0;         // seconds
    this._timerStart  = 0;         // Date.now() snapshot
    this._timerTid    = null;
    this._dragState   = null;      // drag-drop tracking
    this._result      = null;      // computed after submit
    this._reviewIdx   = 0;
  }

  // ── LIFECYCLE ──────────────────────────────────────────────────────────────
  async init(containerEl) {
    this.container = containerEl;
    this._injectStyles();
    await this._configureModeFromRoute();
    this._renderEntryScreen();
  }

  start() {}

  async reset() {
    this._killTimer();
    this._screen     = 'lobby';
    this._questions  = [];
    this._answers    = {};
    this._flagged    = new Set();
    this._currentIdx = 0;
    this._result     = null;
    this._reviewIdx  = 0;
    this._dragState  = null;
    await this._configureModeFromRoute();
    if (this.container) this._renderEntryScreen();
  }

  destroy() {
    this._killTimer();
    this.container = null;
  }

  // ── TIMER ──────────────────────────────────────────────────────────────────
  _startTimer(seconds) {
    this._timeLeft   = seconds;
    this._timerStart = Date.now();
    this._timerTid   = setInterval(() => {
      const elapsed  = Math.floor((Date.now() - this._timerStart) / 1000);
      this._timeLeft = Math.max(0, seconds - elapsed);
      this._updateTimerDisplay();
      if (this._timeLeft <= 0) this._submitExam(true);
    }, 500);
  }

  _killTimer() {
    if (this._timerTid) { clearInterval(this._timerTid); this._timerTid = null; }
  }

  _updateTimerDisplay() {
    const el = this._q('#exam-timer');
    if (!el) return;
    const m  = Math.floor(this._timeLeft / 60);
    const s  = this._timeLeft % 60;
    el.textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    el.style.color =
      this._timeLeft <= 300 ? '#ef4444' :
      this._timeLeft <= 600 ? '#ffb800' : '#00d4ff';
  }

  _fmtTime(seconds) {
    const m = Math.floor(seconds / 60), s = seconds % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }

  _renderEntryScreen() {
    if (this._variant === 'domain-final') {
      this._showDomainFinalLobby();
      return;
    }

    if (!progressEngine.isPracticeExamUnlocked(ALL_PATHS)) {
      this._showPracticeExamLockScreen();
      return;
    }

    this._showLobby();
  }

  _isDomainFinalMode() {
    return this._variant === 'domain-final' && Boolean(this._domainFinalPath);
  }

  async _configureModeFromRoute() {
    const routePath = (window.location.hash.slice(1).split('?')[0] || '/exam');
    const parts = routePath.split('/').filter(Boolean);

    if (parts[0] === 'exam' && parts[1] === 'domain-final' && parts[2]) {
      const domainId = parts[2];
      const path = getPathById(domainId);
      this._variant = 'domain-final';
      this._domainFinalPathId = domainId;
      this._domainFinalPath = path;
      this._domainFinalBank = path?.finalExam?.bank
        ? await this._loadDomainFinalBank(path.finalExam.bank)
        : null;
      return;
    }

    this._variant = 'standard';
    this._domainFinalPathId = null;
    this._domainFinalPath = null;
    this._domainFinalBank = null;
  }

  async _loadDomainFinalBank(bankPath) {
    if (!bankPath) return null;

    try {
      const bankModule = await import(`../data/${bankPath}.js`);
      const bank = bankModule.default || bankModule.questions || [];
      return Array.isArray(bank) ? bank : null;
    } catch (err) {
      console.warn('[ExamModeEngine] Failed to load domain final bank:', bankPath, err);
      return null;
    }
  }

  _getTimeLimitSeconds() {
    if (this._isDomainFinalMode()) {
      const questionCount = this._domainFinalPath?.finalExam?.questionCount
        || this._domainFinalBank?.length
        || this._questions.length
        || 0;
      return questionCount * DOMAIN_FINAL_SECONDS_PER_QUESTION;
    }

    return (MODE_CONFIG[this._mode] || MODE_CONFIG.quick).minutes * 60;
  }

  _getExamLabel() {
    if (this._isDomainFinalMode()) {
      return `${this._domainFinalPath?.title || 'Domain'} Final Exam`;
    }

    return `CCNA ${(MODE_CONFIG[this._mode] || MODE_CONFIG.quick).label}`;
  }

  _getNextDomainPath() {
    if (!this._domainFinalPath) return null;
    const currentIndex = ALL_PATHS.findIndex((path) => path.id === this._domainFinalPath.id);
    if (currentIndex === -1) return null;
    return ALL_PATHS[currentIndex + 1] || null;
  }

  _getPathForExamDomain(domainNumber) {
    return ALL_PATHS.find((path) => Number(path.examDomain) === Number(domainNumber)) || null;
  }

  _getWeakDomainsFromResult(result, threshold = 70) {
    if (!result?.domainPct) return [];

    return Object.entries(result.domainPct)
      .filter(([, pct]) => pct !== null && pct < threshold)
      .map(([domainNumber, pct]) => {
        const domain = Number(domainNumber);
        const path = this._getPathForExamDomain(domain);
        return {
          domain,
          pct,
          path,
          label: DOMAIN_NAMES[domain] || `Domain ${domain}`,
        };
      })
      .sort((a, b) => a.pct - b.pct);
  }

  _getExamHistory() {
    const rawHistory = stateManager.getState('examHistory');
    return Array.isArray(rawHistory) ? rawHistory : [];
  }

  _getQuestionTopicMeta(question) {
    const topicRef = getQuestionTopic(question || {});
    const path = getPathById(topicRef.pathId) || this._getPathForExamDomain(question?.domain);
    const topic = path?.modules.find((module) => module.id === topicRef.topicId) || null;
    const domain = Number(question?.domain || path?.examDomain || 0);

    return {
      domain,
      pathId: path?.id || topicRef.pathId || null,
      pathTitle: path?.title || DOMAIN_NAMES[domain] || 'CCNA Domain',
      topicId: topic?.id || topicRef.topicId || null,
      topicTitle: topic?.title || DOMAIN_NAMES[domain] || 'CCNA Topic',
      topicCode: topic?.code || null,
      href: topic && path ? `#/paths/${path.id}/${topic.id}` : path ? `#/paths/${path.id}` : '#/paths',
    };
  }

  _findPathForTopicId(topicId) {
    if (!topicId) return { path: null, topic: null };
    for (const path of ALL_PATHS) {
      const topic = path.modules.find((module) => module.id === topicId);
      if (topic) return { path, topic };
    }
    return { path: null, topic: null };
  }

  _hydrateTopicReviewEntry(entry) {
    const found = this._findPathForTopicId(entry.topicId);
    const path = getPathById(entry.pathId) || found.path || this._getPathForExamDomain(entry.domain);
    const topic = found.topic || path?.modules.find((module) => module.id === entry.topicId) || null;
    return {
      ...entry,
      pathId: path?.id || entry.pathId || null,
      pathTitle: path?.title || entry.pathTitle || DOMAIN_NAMES[entry.domain] || 'CCNA Domain',
      topicTitle: topic?.title || entry.topicTitle || 'CCNA Topic',
      topicCode: topic?.code || entry.topicCode || null,
      href: topic && path ? `#/paths/${path.id}/${topic.id}` : path ? `#/paths/${path.id}` : '#/paths',
    };
  }

  _getWeakTopicsFromResult(result, threshold = 70) {
    if (!Array.isArray(result?.topicReview)) return [];

    return result.topicReview
      .map((entry) => this._hydrateTopicReviewEntry(entry))
      .filter((entry) => entry.pct !== null && (entry.pct < threshold || entry.missed > 0 || entry.flagged > 0))
      .sort((a, b) => (a.pct - b.pct) || (b.missed - a.missed) || (b.flagged - a.flagged));
  }

  _renderScoreHistoryChart(history, title = 'Score History') {
    const attempts = Array.isArray(history) ? history.slice(-10) : [];
    if (!attempts.length) return '';

    const passPct = Math.round((PASS_SCORE / SCORE_MAX) * 100);
    const bars = attempts.map((attempt, index) => {
      const score = Math.max(0, Math.min(Number(attempt.score) || 0, SCORE_MAX));
      const height = Math.max(6, Math.round((score / SCORE_MAX) * 100));
      const label = `${attempt.mode || 'Exam'} attempt ${index + 1}: ${score}/${SCORE_MAX} ${attempt.passed ? 'passed' : 'not passed'}`;
      return `
        <div class="ex-score-chart-point">
          <div class="ex-score-chart-bar ${attempt.passed ? 'pass' : 'fail'}" style="--bar-height:${height}%" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"></div>
          <div class="ex-score-chart-label">${score}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="ex-score-history" role="img" aria-label="${escapeHtml(title)} showing the last ${attempts.length} exam attempt scores">
        <div class="ex-score-history-head">
          <span>${renderTokenIcon('UP', 'ex-icon ex-history-chart-icon')}${escapeHtml(title)}</span>
          <span class="ex-score-history-meta">Last ${attempts.length} attempt${attempts.length === 1 ? '' : 's'} · pass line ${PASS_SCORE}</span>
        </div>
        <div class="ex-score-chart" style="--pass-line:${passPct}%">
          <div class="ex-score-chart-passline" aria-hidden="true"></div>
          ${bars}
        </div>
      </div>
    `;
  }

  _showPracticeExamLockScreen() {
    this._screen = 'lobby';
    const statusRows = ALL_PATHS.map((path) => {
      const topicsDone = path.modules.filter((module) => progressEngine.isTopicComplete(module.id)).length;
      const topicsTotal = path.modules.length;
      const finalAuthored = path.finalExam?.status === 'authored';
      const finalPassed = progressEngine.isDomainFinalPassed(path.id);
      const pathComplete = progressEngine.isPathComplete(path);
      const isUnlocked = progressEngine.isPathUnlocked(path, ALL_PATHS);

      return {
        path,
        topicsDone,
        topicsTotal,
        finalAuthored,
        finalPassed,
        pathComplete,
        isUnlocked,
      };
    });

    const completedPaths = statusRows.filter((row) => row.pathComplete).length;
    const nextRow = statusRows.find((row) => row.isUnlocked && !row.pathComplete)
      || statusRows.find((row) => !row.pathComplete)
      || null;
    const nextTopic = nextRow?.path?.modules.find((module) => !progressEngine.isTopicComplete(module.id)) || null;
    const continueRoute = nextRow
      ? nextTopic
        ? `#/paths/${nextRow.path.id}/${nextTopic.id}`
        : nextRow.finalAuthored && !nextRow.finalPassed
          ? `#/exam/domain-final/${nextRow.path.id}`
          : `#/paths/${nextRow.path.id}`
      : '#/paths';

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <span>Exam &amp; Resources</span> › <span>CCNA Exam Mode</span>
        </div>
        <h1 class="module-header__title">${renderTokenIcon('LOCK', 'module-header__title-icon')}Practice Exam Locked</h1>
        <p class="module-header__description">
          The full practice exam unlocks after the curriculum path is cleared. Finish each required domain and any authored capstone gates first.
        </p>
      </div>

      <div class="ex-domain-final-hero">
        <div class="ex-info-strip">
          <div class="ex-info-cell">
            <div class="ex-info-num">${completedPaths}</div>
            <div class="ex-info-lbl">Domains Complete</div>
          </div>
          <div class="ex-info-div"></div>
          <div class="ex-info-cell">
            <div class="ex-info-num">${ALL_PATHS.length}</div>
            <div class="ex-info-lbl">Total Domains</div>
          </div>
          <div class="ex-info-div"></div>
          <div class="ex-info-cell">
            <div class="ex-info-num">${QUESTIONS.length}</div>
            <div class="ex-info-lbl">Practice Bank</div>
          </div>
          <div class="ex-info-div"></div>
          <div class="ex-info-cell">
            <div class="ex-info-num">${statusRows.filter((row) => row.finalAuthored && row.finalPassed).length}</div>
            <div class="ex-info-lbl">Authored Finals Passed</div>
          </div>
        </div>

        <div class="ex-weak-areas" style="margin-top:14px;">
          <div class="ex-weak-title">${renderTokenIcon('FOCUS', 'ex-icon ex-weak-title-icon')}Next Unlock Step</div>
          <div class="ex-weak-tags">
            <span class="ex-weak-tag">${nextRow ? escapeHtml(nextRow.path.title) : 'Curriculum'}</span>
            <span class="ex-weak-tag">${nextTopic ? `Continue with ${escapeHtml(nextTopic.code)} ${escapeHtml(nextTopic.title)}` : 'Review domain completion status'}</span>
          </div>
        </div>

        <div class="ex-breakdown" style="margin-top:16px;">
          <div class="ex-breakdown-title">Unlock Progress</div>
          ${statusRows.map((row) => `
            <div class="ex-breakdown-row">
              <span class="ex-breakdown-icon">${renderTokenIcon(row.pathComplete ? 'OK' : row.isUnlocked ? 'WARN' : 'LOCK', 'ex-icon ex-breakdown-icon-svg')}</span>
              <div class="ex-breakdown-info">
                <span class="ex-breakdown-name">${escapeHtml(row.path.title)}</span>
                <div class="ex-breakdown-bar">
                  <div class="ex-breakdown-fill" style="width:${Math.round((row.topicsDone / row.topicsTotal) * 100)}%;background:${row.path.color}"></div>
                </div>
              </div>
              <span class="ex-breakdown-pct" style="color:${row.path.color}">${row.topicsDone}/${row.topicsTotal}${row.finalAuthored ? row.finalPassed ? ' · Final OK' : ' · Final pending' : ''}</span>
            </div>
          `).join('')}
        </div>

        <div class="ex-result-actions" style="margin-top:18px;">
          <a class="ex-action-btn primary" href="${continueRoute}">${renderTokenIcon('PASS', 'ex-icon ex-btn-icon')}Continue Learning</a>
          <a class="ex-action-btn ghost" href="#/paths">Browse Domains</a>
        </div>
      </div>
    `;
  }

  _showDomainFinalLobby() {
    const path = this._domainFinalPath;
    if (!path) {
      this.container.innerHTML = `
        <div class="loading-screen">
          <h2>Domain final not found</h2>
          <p class="text-secondary">No authored domain final matches this route.</p>
          <a href="#/paths" class="btn btn-secondary" style="margin-top:1rem;">← Back to Domains</a>
        </div>
      `;
      return;
    }

    const adminPreview = stateManager.getState('adminPreview') === true;
    const finalUnlocked = progressEngine.isDomainFinalUnlocked(path) || adminPreview;
    const finalPassed = progressEngine.isDomainFinalPassed(path.id);
    const finalRecord = stateManager.getState('userProgress')?.domainFinals?.[path.id] || null;
    const flaggedModules = (finalRecord?.flaggedTopicIds || [])
      .map((topicId) => path.modules.find((module) => module.id === topicId))
      .filter(Boolean);
    const questionCount = this._domainFinalBank?.length || path.finalExam?.questionCount || 0;
    const passMark = path.finalExam?.passingScore || 80;
    const timeLimit = this._fmtTime(this._getTimeLimitSeconds());
    const launchReady = finalUnlocked && Array.isArray(this._domainFinalBank) && this._domainFinalBank.length > 0;
    const history = Array.isArray(finalRecord?.scoreHistory) ? finalRecord.scoreHistory : [];

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <a href="#/paths">CCNA Domains</a> › <a href="#/paths/${path.id}">${escapeHtml(path.title)}</a> › <span>Final Exam</span>
        </div>
        <h1 class="module-header__title">${renderTokenIcon('EXAM', 'module-header__title-icon')}${escapeHtml(path.title)} Final Exam</h1>
        <p class="module-header__description">
          Final capstone assessment for the ${escapeHtml(path.title)} domain. Pass at ${passMark}% to satisfy the domain gate and unlock progression.
        </p>
      </div>

      <div class="ex-domain-final-hero">
        <div class="ex-info-strip">
          <div class="ex-info-cell">
            <div class="ex-info-num">${questionCount}</div>
            <div class="ex-info-lbl">Questions</div>
          </div>
          <div class="ex-info-div"></div>
          <div class="ex-info-cell">
            <div class="ex-info-num" style="color:#22c55e">${passMark}%</div>
            <div class="ex-info-lbl">Pass Mark</div>
          </div>
          <div class="ex-info-div"></div>
          <div class="ex-info-cell">
            <div class="ex-info-num">${timeLimit}</div>
            <div class="ex-info-lbl">Time Limit</div>
          </div>
          <div class="ex-info-div"></div>
          <div class="ex-info-cell">
            <div class="ex-info-num">${path.topicCount}</div>
            <div class="ex-info-lbl">Topics Covered</div>
          </div>
        </div>

        <div class="ex-weak-areas" style="margin-top:14px;">
          <div class="ex-weak-title">${renderTokenIcon(finalPassed ? 'OK' : finalUnlocked ? 'FOCUS' : 'LOCK', 'ex-icon ex-weak-title-icon')}
            ${finalPassed ? 'Domain Gate Cleared' : finalUnlocked ? 'Capstone Ready' : 'Topic Quiz Gate Locked'}
          </div>
          <div class="ex-weak-tags">
            <span class="ex-weak-tag">${escapeHtml(path.finalExam?.quizType || 'mixed')}</span>
            <span class="ex-weak-tag">${finalPassed ? 'Passed previously' : finalUnlocked ? 'Eligible to launch now' : 'Finish all topic quizzes first'}</span>
            ${adminPreview ? '<span class="ex-weak-tag">Admin preview override active</span>' : ''}
          </div>
        </div>

        ${finalRecord ? `
          <div class="ex-history" style="margin-top:14px;">
            <div class="ex-history-title">Previous Domain Final Results</div>
            <div class="ex-history-list">
              <div class="ex-history-row">
                <span class="ex-history-badge ${finalPassed ? 'pass' : 'fail'}">${finalPassed ? 'PASS' : 'LATEST'}</span>
                <span class="ex-history-score">Best ${finalRecord.bestScore || 0}%</span>
                <span class="ex-history-meta">${finalRecord.attempts || 0} attempt(s) · History: ${history.map((score) => `${score}%`).join(' · ')}</span>
              </div>
            </div>
          </div>
        ` : ''}

        ${flaggedModules.length > 0 && !finalPassed ? `
          <div class="ex-weak-areas" style="margin-top:14px;">
            <div class="ex-weak-title">${renderTokenIcon('WARN', 'ex-icon ex-weak-title-icon')}Remediation Topics</div>
            <div class="ex-weak-tags">
              ${flaggedModules.map((module) => `
                <a class="ex-weak-tag" href="#/paths/${path.id}/${module.id}">${escapeHtml(module.code)} ${escapeHtml(module.title)}</a>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="ex-result-actions" style="margin-top:18px;">
          <button class="ex-action-btn primary" id="ex-final-start-btn" ${launchReady ? '' : 'disabled'}>
            ${renderTokenIcon('PASS', 'ex-icon ex-btn-icon')}${finalPassed ? 'Retake Final Exam' : 'Start Final Exam'}
          </button>
          <a class="ex-action-btn ghost" href="#/paths/${path.id}">← Back to ${escapeHtml(path.title)}</a>
        </div>
      </div>
    `;

    const startBtn = this._q('#ex-final-start-btn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (!launchReady) {
          showToast('Finish all topic quizzes before starting the domain final.', 'warning');
          return;
        }
        this._startExam();
      });
    }
  }

  _computeAnalytics(history) {
    if (!history || !Array.isArray(history) || history.length === 0) {
      return { totalExams: 0, passRate: 0, avgScore: 0, streak: 0, weakDomains: [], weakTopics: [] };
    }
    
    const totalExams = history.length;
    const passed = history.filter(h => h.passed).length;
    const passRate = Math.round((passed / totalExams) * 100);
    const avgScore = Math.round(history.reduce((sum, h) => sum + h.score, 0) / totalExams);
    
    const today = new Date().toDateString();
    let streak = 0;
    const examDates = [...new Set(history.map(h => new Date(h.date).toDateString()))].sort().reverse();
    if (examDates[0] === today) streak = 1;
    for (let i = 0; i < examDates.length - 1; i++) {
      const curr = new Date(examDates[i]);
      const prev = new Date(examDates[i + 1]);
      const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diff === 1) streak++;
      else break;
    }
    
    const domainScores = {};
    history.forEach(h => {
      if (h.domainResults) {
        Object.entries(h.domainResults).forEach(([d, score]) => {
          domainScores[d] = domainScores[d] || [];
          domainScores[d].push(score);
        });
      }
    });
    
    const weakDomains = Object.entries(domainScores)
      .map(([d, scores]) => ({
        domain: parseInt(d),
        pct: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      }))
      .filter(d => d.pct < 70)
      .sort((a, b) => a.pct - b.pct);

    const topicScores = {};
    history.forEach(h => {
      if (h.topicResults) {
        Object.entries(h.topicResults).forEach(([topicId, score]) => {
          if (score === null || score === undefined) return;
          topicScores[topicId] = topicScores[topicId] || [];
          topicScores[topicId].push(score);
        });
      }
      else if (Array.isArray(h.weakTopics)) {
        h.weakTopics.forEach((topic) => {
          if (!topic.topicId || topic.pct === null || topic.pct === undefined) return;
          topicScores[topic.topicId] = topicScores[topic.topicId] || [];
          topicScores[topic.topicId].push(topic.pct);
        });
      }
    });

    const weakTopics = Object.entries(topicScores)
      .map(([topicId, scores]) => this._hydrateTopicReviewEntry({
        topicId,
        pct: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        missed: 0,
        flagged: 0,
        total: scores.length,
      }))
      .filter((topic) => topic.pct < 70)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 6);
    
    return { totalExams, passRate, avgScore, streak, weakDomains, weakTopics };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SCREEN 1 — LOBBY
  // ══════════════════════════════════════════════════════════════════════════
  _showLobby() {
    this._screen = 'lobby';
    const history = this._getExamHistory();
    const analytics = this._computeAnalytics(history);
    const last3   = history.slice(-3).reverse();

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <span>Home</span> › <span>Exam &amp; Resources</span> › <span>CCNA Exam Mode</span>
        </div>
        <h1 class="module-header__title">${renderTokenIcon('EXAM', 'module-header__title-icon')}CCNA Exam Mode</h1>
        <p class="module-header__description">
          Simulates the real Cisco CCNA 200-301 exam. Timed, randomized questions
          across all 6 official domains. Pass score: 825 / 1000.
        </p>
      </div>

      <!-- ANALYTICS DASHBOARD -->
      ${history.length > 0 ? `
      <div class="ex-analytics-strip">
        <div class="ex-analytics-card">
          <div class="ex-analytics-icon">${renderTokenIcon('LOG', 'ex-icon ex-analytics-icon-svg')}</div>
          <div class="ex-analytics-data">
            <div class="ex-analytics-value">${analytics.totalExams}</div>
            <div class="ex-analytics-label">Exams Taken</div>
          </div>
        </div>
        <div class="ex-analytics-card">
          <div class="ex-analytics-icon">${renderTokenIcon('FOCUS', 'ex-icon ex-analytics-icon-svg')}</div>
          <div class="ex-analytics-data">
            <div class="ex-analytics-value" style="color:${analytics.passRate >= 70 ? '#22c55e' : analytics.passRate >= 50 ? '#ffb800' : '#ef4444'}">${analytics.passRate}%</div>
            <div class="ex-analytics-label">Pass Rate</div>
          </div>
        </div>
        <div class="ex-analytics-card">
          <div class="ex-analytics-icon">${renderTokenIcon('UP', 'ex-icon ex-analytics-icon-svg')}</div>
          <div class="ex-analytics-data">
            <div class="ex-analytics-value">${analytics.avgScore}</div>
            <div class="ex-analytics-label">Avg Score</div>
          </div>
        </div>
        <div class="ex-analytics-card">
          <div class="ex-analytics-icon">${renderTokenIcon('HOT', 'ex-icon ex-analytics-icon-svg')}</div>
          <div class="ex-analytics-data">
            <div class="ex-analytics-value">${analytics.streak}</div>
            <div class="ex-analytics-label">Day Streak</div>
          </div>
        </div>
      </div>
      
      ${this._renderScoreHistoryChart(history, 'Practice Exam Score History')}

      <!-- WEAK AREAS -->
      ${analytics.weakTopics.length > 0 || analytics.weakDomains.length > 0 ? `
      <div class="ex-weak-areas">
        <div class="ex-weak-title">${renderTokenIcon('WARN', 'ex-icon ex-weak-title-icon')}Areas to Focus On</div>
        <div class="ex-weak-tags">
          ${analytics.weakTopics.map((topic) => `
            <a class="ex-weak-tag" href="${topic.href}" data-topic="${escapeHtml(topic.topicId || '')}">
              ${escapeHtml(topic.topicCode ? `${topic.topicCode} ${topic.topicTitle}` : topic.topicTitle)} (${topic.pct}% correct)
            </a>
          `).join('')}
          ${analytics.weakDomains.map(d => `
            <a class="ex-weak-tag" href="#/paths/${this._getPathForExamDomain(d.domain)?.id || ''}" data-domain="${d.domain}">
              ${DOMAIN_NAMES[d.domain]} (${d.pct}% correct)
            </a>
          `).join('')}
        </div>
      </div>
      ` : ''}
      ` : ''}

      <!-- MODE CARDS -->
      <div class="ex-mode-grid">
        ${['quick','topic','full'].map(m => `
          <div class="ex-mode-card ${this._mode===m?'active':''}" data-mode="${m}">
            <div class="ex-mode-icon">${renderTokenIcon(m==='quick' ? 'FAST' : m==='topic' ? 'FOCUS' : 'PASS', 'ex-icon ex-mode-icon-svg')}</div>
            <div class="ex-mode-label">${MODE_CONFIG[m].label}</div>
            <div class="ex-mode-meta">
              ${MODE_CONFIG[m].count} questions · ${MODE_CONFIG[m].minutes} min
            </div>
          </div>
        `).join('')}
      </div>

      <!-- TOPIC FILTER (topic mode only) -->
      <div class="ex-topic-bar" id="ex-topic-bar" style="display:${this._mode==='topic'?'flex':'none'}">
        <span class="ex-label">Topic:</span>
        <select class="ex-sel" id="ex-topic-sel">
          ${Object.entries(DOMAIN_NAMES).map(([k,v])=>`
            <option value="${k}" ${this._topicDomain==k?'selected':''}>Domain ${k} — ${v}</option>
          `).join('')}
        </select>
      </div>

      <!-- EXAM INFO STRIP -->
      <div class="ex-info-strip">
        <div class="ex-info-cell">
          <div class="ex-info-num">${QUESTIONS.length}</div>
          <div class="ex-info-lbl">Total Questions</div>
        </div>
        <div class="ex-info-div"></div>
        <div class="ex-info-cell">
          <div class="ex-info-num">6</div>
          <div class="ex-info-lbl">Domains Covered</div>
        </div>
        <div class="ex-info-div"></div>
        <div class="ex-info-cell">
          <div class="ex-info-num" style="color:#22c55e">825</div>
          <div class="ex-info-lbl">Pass Score / 1000</div>
        </div>
        <div class="ex-info-div"></div>
        <div class="ex-info-cell">
          <div class="ex-info-num">4</div>
          <div class="ex-info-lbl">Question Types</div>
        </div>
      </div>

      <!-- START BUTTON -->
      <div style="display:flex;justify-content:center;margin:8px 0">
        <button class="ex-start-btn" id="ex-start-btn">
          Start ${MODE_CONFIG[this._mode].label} →
        </button>
      </div>

      <!-- RECENT ATTEMPTS -->
      ${last3.length ? `
        <div class="ex-history">
          <div class="ex-history-title">Recent Attempts</div>
          <div class="ex-history-list">
            ${last3.map(r => `
              <div class="ex-history-row">
                <span class="ex-history-badge ${r.passed?'pass':'fail'}">
                  ${r.passed?'PASS':'FAIL'}
                </span>
                <span class="ex-history-score">${r.score} / 1000</span>
                <span class="ex-history-meta">${r.mode} · ${r.correct}/${r.total} correct · ${r.date}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- DOMAIN OVERVIEW -->
      <div class="ex-domains">
        <div class="ex-domains-title">Domain Coverage</div>
        <div class="ex-domains-grid">
          ${Object.entries(DOMAIN_NAMES).map(([k,v]) => {
            const count = QUESTIONS.filter(q=>q.domain==k).length;
            const pct   = Math.round((count/QUESTIONS.length)*100);
            return `
              <div class="ex-domain-row">
                <span class="ex-domain-num">Domain ${k}</span>
                <span class="ex-domain-name">${v}</span>
                <div class="ex-domain-bar">
                  <div class="ex-domain-fill" style="width:${pct}%"></div>
                </div>
                <span class="ex-domain-pct">${pct}%</span>
              </div>`;
          }).join('')}
        </div>
      </div>
    `;

    // wire mode cards
    this._qq('.ex-mode-card').forEach(card => {
      card.addEventListener('click', () => {
        this._mode = card.dataset.mode;
        this._qq('.ex-mode-card').forEach(c=>c.classList.remove('active'));
        card.classList.add('active');
        const topicBar = this._q('#ex-topic-bar');
        if (topicBar) topicBar.style.display = this._mode==='topic'?'flex':'none';
        const btn = this._q('#ex-start-btn');
        if (btn) btn.textContent = `Start ${MODE_CONFIG[this._mode].label} →`;
      });
    });

    const topicSel = this._q('#ex-topic-sel');
    if (topicSel) {
      topicSel.addEventListener('change', () => {
        this._topicDomain = parseInt(topicSel.value);
      });
      this._topicDomain = parseInt(topicSel.value);
    }

    const startBtn = this._q('#ex-start-btn');
    if (startBtn) startBtn.addEventListener('click', () => this._startExam());
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SCREEN 2 — EXAM ACTIVE
  // ══════════════════════════════════════════════════════════════════════════
  async _startExam() {
    if (this._isDomainFinalMode()) {
      const adminPreview = stateManager.getState('adminPreview') === true;
      if (!progressEngine.isDomainFinalUnlocked(this._domainFinalPath) && !adminPreview) {
        showToast('Finish all topic quizzes before starting the domain final.', 'warning');
        this._showDomainFinalLobby();
        return;
      }

      if (this._domainFinalPath?.finalExam?.status !== 'authored') {
        showToast('This domain final is still a blueprint and cannot be launched yet.', 'warning');
        this._showDomainFinalLobby();
        return;
      }

      if (!Array.isArray(this._domainFinalBank) || this._domainFinalBank.length === 0) {
        this._domainFinalBank = await this._loadDomainFinalBank(this._domainFinalPath?.finalExam?.bank);
      }

      if (!Array.isArray(this._domainFinalBank) || this._domainFinalBank.length === 0) {
        showToast('This domain final question set could not be loaded.', 'error');
        this._showDomainFinalLobby();
        return;
      }

      this._questions = [...this._domainFinalBank];
    } else {
      if (!progressEngine.isPracticeExamUnlocked(ALL_PATHS)) {
        showToast('Practice exam is still locked. Finish the curriculum gates first.', 'warning');
        this._showPracticeExamLockScreen();
        return;
      }

      this._questions = buildQuestionSet(this._mode, this._topicDomain);
    }

    this._answers    = {};
    this._flagged    = new Set();
    this._currentIdx = 0;
    this._screen     = 'exam';
    const totalSecs  = this._getTimeLimitSeconds();
    this._showExamShell();
    this._renderQuestion();
    this._startTimer(totalSecs);
  }

  _showExamShell() {
    const total = this._questions.length;
    const title = this._getExamLabel();
    const totalSecs = this._getTimeLimitSeconds();

    this.container.innerHTML = `
      <!-- TOP BAR -->
      <div class="ex-topbar">
        <div class="ex-topbar-left">
          <span class="ex-topbar-title">${escapeHtml(title)}</span>
          <span class="ex-topbar-sep">|</span>
          <span class="ex-progress-txt" id="ex-progress-txt">Q 1 / ${total}</span>
        </div>
        <div class="ex-topbar-center">
          <div class="ex-progress-bar-wrap">
            <div class="ex-progress-bar-fill" id="ex-progress-fill" style="width:0%"></div>
          </div>
        </div>
        <div class="ex-topbar-right">
          <span class="ex-timer-ico">${renderTokenIcon('TIME', 'ex-icon ex-timer-icon-svg')}</span>
          <span class="ex-timer" id="exam-timer">${this._fmtTime(totalSecs)}</span>
        </div>
      </div>

      <!-- QUESTION AREA -->
      <div class="ex-question-area" id="ex-question-area">
        <!-- rendered by _renderQuestion() -->
      </div>

      <!-- BOTTOM BAR -->
      <div class="ex-bottombar">
        <button class="ex-flag-btn" id="ex-flag-btn">${renderTokenIcon('FLAG', 'ex-icon ex-btn-icon')}Flag</button>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="ex-nav-btn" id="ex-prev-btn">← Prev</button>
          <button class="ex-map-btn" id="ex-map-btn">${renderTokenIcon('LOG', 'ex-icon ex-btn-icon')} ${total} Qs</button>
          <button class="ex-nav-btn" id="ex-next-btn">Next →</button>
        </div>
        <button class="ex-submit-btn" id="ex-submit-btn">Submit Exam</button>
      </div>

      <!-- QUESTION MAP OVERLAY -->
      <div class="ex-map-overlay" id="ex-map-overlay" style="display:none">
        <div class="ex-map-panel">
          <div class="ex-map-header">
            <span class="ex-map-title">Question Map</span>
            <button class="ex-map-close" id="ex-map-close" aria-label="Close">${renderTokenIcon('X', 'ex-icon ex-map-close-icon')}</button>
          </div>
          <div class="ex-map-legend">
            <span class="ex-legend-dot answered"></span>Answered
            <span class="ex-legend-dot flagged"></span>Flagged
            <span class="ex-legend-dot current"></span>Current
            <span class="ex-legend-dot unanswered"></span>Unanswered
          </div>
          <div class="ex-map-grid" id="ex-map-grid"></div>
          <div class="ex-map-footer">
            <span id="ex-map-stats"></span>
            <button class="ex-submit-btn" id="ex-map-submit">Submit Exam</button>
          </div>
        </div>
      </div>
    `;

    // wire navigation
    this._q('#ex-prev-btn').addEventListener('click', () => {
      if (this._currentIdx > 0) { this._currentIdx--; this._renderQuestion(); }
    });
    this._q('#ex-next-btn').addEventListener('click', () => {
      if (this._currentIdx < this._questions.length-1) { this._currentIdx++; this._renderQuestion(); }
    });
    this._q('#ex-flag-btn').addEventListener('click', () => this._toggleFlag());
    this._q('#ex-map-btn').addEventListener('click', () => this._openMap());
    this._q('#ex-map-close').addEventListener('click', () => this._closeMap());
    this._q('#ex-submit-btn').addEventListener('click', () => this._confirmSubmit());
    this._q('#ex-map-submit').addEventListener('click', () => this._confirmSubmit());
  }

  _renderQuestion() {
    const q   = this._questions[this._currentIdx];
    const idx = this._currentIdx;
    const total = this._questions.length;
    const ans = this._answers[q.id];

    // update progress
    const answered = Object.keys(this._answers).length;
    const pct = Math.round(((idx+1)/total)*100);
    this._q('#ex-progress-txt').textContent = `Q ${idx+1} / ${total}`;
    this._q('#ex-progress-fill').style.width = pct + '%';

    // flag button state
    const flagBtn = this._q('#ex-flag-btn');
    if (flagBtn) flagBtn.classList.toggle('active', this._flagged.has(q.id));

    // prev/next buttons
    const prevBtn = this._q('#ex-prev-btn');
    const nextBtn = this._q('#ex-next-btn');
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === total - 1;

    // domain tag color
    const domainColors = {
      1:'#00d4ff',2:'#ab47bc',3:'#ffb800',4:'#22c55e',5:'#ef4444',6:'#8b5cf6'
    };
    const dc = domainColors[q.domain] || '#00d4ff';

    const area = this._q('#ex-question-area');
    area.classList.add('ex-question-fade');
    setTimeout(() => {
    area.innerHTML = `
      <div class="ex-q-slide-in">
        <div class="ex-q-meta">
          <span class="ex-q-domain" style="border-color:${dc};color:${dc}">
            Domain ${q.domain} — ${DOMAIN_NAMES[q.domain]}
          </span>
          <span class="ex-q-diff diff-${q.difficulty}">${q.difficulty.toUpperCase()}</span>
          ${this._flagged.has(q.id) ? `<span class="ex-q-flagged">${renderTokenIcon('FLAG', 'ex-icon ex-flagged-icon')}Flagged</span>` : ''}
        </div>

        <div class="ex-q-text">${q.question}</div>

        ${q.type==='multi'
          ? `<div class="ex-q-hint">Select all that apply — multiple answers required</div>`
          : q.type==='order'
          ? `<div class="ex-q-hint">Drag items into the correct order</div>`
          : q.type==='input'
          ? `<div class="ex-q-hint">Type your answer exactly (e.g. 192.168.1.0 or 30)</div>`
          : ''}

        <div class="ex-q-body" id="ex-q-body">
          ${this._renderQuestionBody(q, ans)}
        </div>
      </div>
    `;

    this._bindQuestionInteractions(q);
    area.classList.remove('ex-question-fade');
    }, 10);
  }

  // ── QUESTION TYPE RENDERERS ─────────────────────────────────────────────

  _renderQuestionBody(q, ans) {
    switch(q.type) {
      case 'single':  return this._renderSingle(q, ans);
      case 'multi':   return this._renderMulti(q, ans);
      case 'order':   return this._renderOrder(q, ans);
      case 'input':   return this._renderInput(q, ans);
      default:        return '';
    }
  }

  /** Single answer — radio buttons */
  _renderSingle(q, ans) {
    return `<div class="ex-options">
      ${q.options.map(opt => `
        <label class="ex-option ${ans===opt.id?'selected':''}">
          <input type="radio" name="q_${q.id}" value="${opt.id}"
            ${ans===opt.id?'checked':''} class="ex-radio">
          <span class="ex-option-key">${opt.id.toUpperCase()}</span>
          <span class="ex-option-text">${opt.text}</span>
        </label>
      `).join('')}
    </div>`;
  }

  /** Multiple answer — checkboxes */
  _renderMulti(q, ans) {
    const selected = Array.isArray(ans) ? ans : [];
    return `<div class="ex-options">
      ${q.options.map(opt => `
        <label class="ex-option ${selected.includes(opt.id)?'selected':''}">
          <input type="checkbox" name="q_${q.id}" value="${opt.id}"
            ${selected.includes(opt.id)?'checked':''} class="ex-checkbox">
          <span class="ex-option-key">${opt.id.toUpperCase()}</span>
          <span class="ex-option-text">${opt.text}</span>
        </label>
      `).join('')}
    </div>`;
  }

  /** Drag-to-order */
  _renderOrder(q, ans) {
    const ordered = Array.isArray(ans) ? ans : q.items.map(i=>i.id);
    const itemMap = Object.fromEntries(q.items.map(i=>[i.id, i.text]));
    return `<div class="ex-order-list" id="ex-order-list">
      ${ordered.map((id, idx) => `
        <div class="ex-order-item" draggable="true" data-id="${id}" data-idx="${idx}">
          <span class="ex-order-handle">${renderTokenIcon('CYCLE', 'ex-icon ex-order-handle-icon')}</span>
          <span class="ex-order-num">${idx+1}</span>
          <span class="ex-order-text">${itemMap[id]||id}</span>
        </div>
      `).join('')}
    </div>`;
  }

  /** Free-text input */
  _renderInput(q, ans) {
    return `<div class="ex-input-wrap">
      <input type="text" class="ex-input" id="ex-input-field"
        value="${ans||''}"
        placeholder="Type your answer here..."
        autocomplete="off" autocorrect="off" spellcheck="false">
    </div>`;
  }

  // ── QUESTION INTERACTION BINDING ────────────────────────────────────────

  _bindQuestionInteractions(q) {
    if (q.type === 'single') {
      this._qq(`input[name="q_${q.id}"]`).forEach(radio => {
        radio.addEventListener('change', () => {
          this._answers[q.id] = radio.value;
          // update option highlight
          this._qq('.ex-option').forEach(opt => opt.classList.remove('selected'));
          radio.closest('.ex-option').classList.add('selected');
        });
      });
    }

    if (q.type === 'multi') {
      this._qq(`input[name="q_${q.id}"]`).forEach(cb => {
        cb.addEventListener('change', () => {
          const checked = [...this._qq(`input[name="q_${q.id}"]:checked`)].map(c=>c.value);
          this._answers[q.id] = checked;
          cb.closest('.ex-option').classList.toggle('selected', cb.checked);
        });
      });
    }

    if (q.type === 'order') this._bindDragDrop(q);

    if (q.type === 'input') {
      const field = this._q('#ex-input-field');
      if (field) {
        field.addEventListener('input', () => {
          this._answers[q.id] = field.value.trim();
        });
        field.focus();
      }
    }
  }

  // ── DRAG AND DROP (order questions) ────────────────────────────────────

  _bindDragDrop(q) {
    const list = this._q('#ex-order-list');
    if (!list) return;

    let dragSrc = null;

    list.querySelectorAll('.ex-order-item').forEach(item => {
      item.addEventListener('dragstart', e => {
        dragSrc = item;
        item.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        list.querySelectorAll('.ex-order-item').forEach(i=>i.classList.remove('drag-over'));
        dragSrc = null;
      });
      item.addEventListener('dragover', e => {
        e.preventDefault();
        if (dragSrc && dragSrc !== item) {
          list.querySelectorAll('.ex-order-item').forEach(i=>i.classList.remove('drag-over'));
          item.classList.add('drag-over');
        }
      });
      item.addEventListener('drop', e => {
        e.preventDefault();
        if (!dragSrc || dragSrc === item) return;
        const items  = [...list.querySelectorAll('.ex-order-item')];
        const srcIdx = items.indexOf(dragSrc);
        const dstIdx = items.indexOf(item);
        if (srcIdx < dstIdx) list.insertBefore(dragSrc, item.nextSibling);
        else                 list.insertBefore(dragSrc, item);
        // re-number
        list.querySelectorAll('.ex-order-item').forEach((el,i) => {
          el.querySelector('.ex-order-num').textContent = i+1;
          el.dataset.idx = i;
        });
        // save answer
        const newOrder = [...list.querySelectorAll('.ex-order-item')].map(el=>el.dataset.id);
        this._answers[q.id] = newOrder;
      });
    });
  }

  // ── FLAG ────────────────────────────────────────────────────────────────
  _toggleFlag() {
    const q = this._questions[this._currentIdx];
    if (this._flagged.has(q.id)) this._flagged.delete(q.id);
    else this._flagged.add(q.id);
    this._renderQuestion();
  }

  // ── QUESTION MAP ────────────────────────────────────────────────────────
  _openMap() {
    const overlay = this._q('#ex-map-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    this._renderMapGrid();
  }

  _closeMap() {
    const overlay = this._q('#ex-map-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  _renderMapGrid() {
    const grid  = this._q('#ex-map-grid');
    const stats = this._q('#ex-map-stats');
    if (!grid) return;

    const answered  = Object.keys(this._answers).length;
    const flagged   = this._flagged.size;
    const remaining = this._questions.length - answered;
    if (stats) stats.textContent = `${answered} answered · ${flagged} flagged · ${remaining} remaining`;

    grid.innerHTML = this._questions.map((q, i) => {
      let cls = 'map-cell';
      if (i === this._currentIdx) cls += ' current';
      else if (this._flagged.has(q.id)) cls += ' flagged';
      else if (this._answers[q.id] !== undefined) cls += ' answered';
      return `<div class="${cls}" data-idx="${i}">${i+1}</div>`;
    }).join('');

    grid.querySelectorAll('.map-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        this._currentIdx = parseInt(cell.dataset.idx);
        this._renderQuestion();
        this._closeMap();
      });
    });
  }

  // ── SUBMIT ────────────────────────────────────────────────────────────────
  _confirmSubmit() {
    const answered  = Object.keys(this._answers).length;
    const total     = this._questions.length;
    const remaining = total - answered;

    if (remaining > 0) {
      if (!confirm(`You have ${remaining} unanswered question${remaining>1?'s':''}. Submit anyway?`)) {
        this._openMap();
        return;
      }
    }
    this._submitExam(false);
  }

  _submitExam(timeUp) {
    this._killTimer();
    const totalSeconds = this._getTimeLimitSeconds();
    const timeUsed     = totalSeconds - this._timeLeft;
    this._result       = this._calcScore(timeUsed);
    this._saveResult(this._result);
    this._showResults(timeUp);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SCORING ENGINE
  // ══════════════════════════════════════════════════════════════════════════
  _calcScore(timeUsed) {
    let rawTotal = 0, rawMax = 0;
    const domainScores = {};
    const domainMax    = {};
    const topicScores = {};
    const topicMax = {};
    const topicReviewMap = {};
    const isDomainFinal = this._isDomainFinalMode();

    // init domain trackers
    if (!isDomainFinal) {
      Object.keys(DOMAIN_NAMES).forEach(d => { domainScores[d]=0; domainMax[d]=0; });
    }

    this._questions.forEach(q => {
      const ans = this._answers[q.id];
      let pts = 0, max = 1;

      if (q.type === 'single') {
        pts = ans === q.correct ? 1 : 0;
        max = 1;
      }
      else if (q.type === 'multi') {
        // partial credit: each correct selection = 0.5, each wrong = -0.25, floor 0
        const selected = Array.isArray(ans) ? ans : [];
        const correct  = q.correct;
        let   score    = 0;
        selected.forEach(s => { score += correct.includes(s) ? 0.5 : -0.25; });
        pts = Math.max(0, Math.min(score, 1));
        max = 1;
      }
      else if (q.type === 'order') {
        const given = Array.isArray(ans) ? ans : null;
        const correct = q.correct;
        let correct_positions = 0;
        if (given) {
          correct.forEach((id, i) => { if (given[i] === id) correct_positions++; });
        }
        pts = given ? correct_positions / correct.length : 0;
        max = 1;
      }
      else if (q.type === 'input') {
        const given    = (ans||'').toString().trim().toLowerCase();
        const expected = q.answer.toString().trim().toLowerCase();
        pts = given === expected ? 1 : 0;
        max = 1;
      }

      rawTotal += pts;
      rawMax   += max;
      if (!isDomainFinal) {
        domainScores[q.domain] = (domainScores[q.domain]||0) + pts;
        domainMax[q.domain]    = (domainMax[q.domain]||0)    + max;

        const topicMeta = this._getQuestionTopicMeta(q);
        if (topicMeta.topicId) {
          topicScores[topicMeta.topicId] = (topicScores[topicMeta.topicId] || 0) + pts;
          topicMax[topicMeta.topicId] = (topicMax[topicMeta.topicId] || 0) + max;

          if (!topicReviewMap[topicMeta.topicId]) {
            topicReviewMap[topicMeta.topicId] = {
              topicId: topicMeta.topicId,
              topicTitle: topicMeta.topicTitle,
              topicCode: topicMeta.topicCode,
              pathId: topicMeta.pathId,
              pathTitle: topicMeta.pathTitle,
              domain: topicMeta.domain,
              points: 0,
              max: 0,
              total: 0,
              missed: 0,
              flagged: 0,
              questionIds: [],
              missedQuestionIds: [],
              flaggedQuestionIds: [],
            };
          }

          const topicEntry = topicReviewMap[topicMeta.topicId];
          const isFullyCorrect = max > 0 && pts >= max;
          const isFlagged = this._flagged.has(q.id);
          topicEntry.points += pts;
          topicEntry.max += max;
          topicEntry.total += 1;
          if (!isFullyCorrect) {
            topicEntry.missed += 1;
            topicEntry.missedQuestionIds.push(q.id);
          }
          if (isFlagged) {
            topicEntry.flagged += 1;
            topicEntry.flaggedQuestionIds.push(q.id);
          }
          if (!isFullyCorrect || isFlagged) topicEntry.questionIds.push(q.id);
        }
      }

      if (isDomainFinal && q.topicId) {
        topicScores[q.topicId] = (topicScores[q.topicId] || 0) + pts;
        topicMax[q.topicId] = (topicMax[q.topicId] || 0) + max;
      }
    });

    const correct = this._questions.filter(q => {
      const ans = this._answers[q.id];
      if (q.type==='single') return ans===q.correct;
      if (q.type==='multi')  return Array.isArray(ans)&&ans.length===q.correct.length&&ans.every(a=>q.correct.includes(a));
      if (q.type==='order')  return Array.isArray(ans)&&ans.every((id,i)=>id===q.correct[i]);
      if (q.type==='input')  return (ans||'').toString().trim().toLowerCase()===q.answer.toString().trim().toLowerCase();
      return false;
    }).length;

    if (isDomainFinal) {
      const percent = rawMax > 0 ? Math.round((rawTotal / rawMax) * 100) : 0;
      const passScore = this._domainFinalPath?.finalExam?.passingScore || 80;
      const topicPct = Object.fromEntries(
        Object.entries(topicMax).map(([topicId, max]) => [
          topicId,
          max > 0 ? Math.round((topicScores[topicId] / max) * 100) : null,
        ])
      );
      const flaggedTopicIds = Object.entries(topicPct)
        .filter(([, pct]) => pct !== null && pct < 70)
        .map(([topicId]) => topicId);

      return {
        kind: 'domain-final',
        domainId: this._domainFinalPath?.id || null,
        pathTitle: this._domainFinalPath?.title || 'Domain',
        score: percent,
        scoreMax: 100,
        passScore,
        passed: percent >= passScore,
        correct,
        total: this._questions.length,
        timeUsed,
        topicPct,
        flaggedTopicIds,
        mode: `${this._domainFinalPath?.title || 'Domain'} Final Exam`,
        date: new Date().toLocaleDateString(),
      };
    }

    const scaled  = Math.round((rawTotal / rawMax) * SCORE_MAX);
    const passed  = scaled >= PASS_SCORE;

    const domainPct = {};
    Object.keys(DOMAIN_NAMES).forEach(d => {
      domainPct[d] = domainMax[d] > 0
        ? Math.round((domainScores[d]/domainMax[d])*100)
        : null;
    });

    const topicPct = Object.fromEntries(
      Object.entries(topicMax).map(([topicId, max]) => [
        topicId,
        max > 0 ? Math.round((topicScores[topicId] / max) * 100) : null,
      ])
    );

    const topicReview = Object.values(topicReviewMap)
      .map((entry) => ({
        ...entry,
        pct: entry.max > 0 ? Math.round((entry.points / entry.max) * 100) : null,
      }))
      .filter((entry) => entry.pct !== null && (entry.pct < 70 || entry.missed > 0 || entry.flagged > 0))
      .sort((a, b) => (a.pct - b.pct) || (b.missed - a.missed) || (b.flagged - a.flagged));

    return {
      kind: 'standard',
      score: scaled, passed, correct,
      scoreMax: SCORE_MAX,
      passScore: PASS_SCORE,
      total: this._questions.length,
      timeUsed, domainPct, topicPct, topicReview,
      flaggedQuestionIds: [...this._flagged],
      mode: MODE_CONFIG[this._mode].label,
      date: new Date().toLocaleDateString(),
    };
  }

  _saveResult(result) {
    if (result.kind === 'domain-final' && this._domainFinalPath) {
      progressEngine.recordDomainFinalResult(this._domainFinalPath.id, result.score, result.flaggedTopicIds || []);
      if (result.passed) {
        showToast(`${this._domainFinalPath.title} final passed! Score: ${result.score}%`, 'success');
      } else {
        showToast(`${this._domainFinalPath.title} final recorded at ${result.score}%. Review flagged topics and try again.`, 'warning');
      }
      return;
    }

    const rawHistory = stateManager.getState('examHistory');
    const history = Array.isArray(rawHistory) ? rawHistory : [];
    history.push({
      score: result.score, passed: result.passed,
      correct: result.correct, total: result.total,
      mode: result.mode, date: result.date,
      domainResults: result.domainPct,
      topicResults: result.topicPct,
      weakTopics: (result.topicReview || []).slice(0, 8).map((topic) => ({
        topicId: topic.topicId,
        pathId: topic.pathId,
        domain: topic.domain,
        pct: topic.pct,
        missed: topic.missed,
        flagged: topic.flagged,
        total: topic.total,
      })),
      flaggedQuestionIds: result.flaggedQuestionIds || [],
    });
    stateManager.setState('examHistory', history.slice(-10)); // keep last 10

    if (result.passed) {
      const prog = stateManager.getState('userProgress') || {};
      const done = new Set(prog.completedModules || []);
      done.add('/exam');
      stateManager.mergeState('userProgress', { completedModules: [...done] });
      showToast('Exam passed! Score: ' + result.score + '/1000', 'success');
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SCREEN 3 — RESULTS
  // ══════════════════════════════════════════════════════════════════════════
  _showResults(timeUp) {
    if (this._result?.kind === 'domain-final') {
      this._showDomainFinalResults(timeUp);
      return;
    }

    this._screen = 'results';
    const r = this._result;
    const pct = Math.round((r.correct / r.total) * 100);
    const ringDeg = Math.round((r.score / SCORE_MAX) * 360);
    const weakDomains = this._getWeakDomainsFromResult(r);
    const weakTopics = this._getWeakTopicsFromResult(r);
    const displayedWeakTopics = weakTopics.slice(0, 12);
    const hiddenWeakTopicCount = Math.max(0, weakTopics.length - displayedWeakTopics.length);
    const firstWeakHref = weakTopics[0]?.href || (weakDomains[0]?.path ? `#/paths/${weakDomains[0].path.id}` : '#/paths');
    const history = this._getExamHistory();

    const domainColors = {1:'#00d4ff',2:'#ab47bc',3:'#ffb800',4:'#22c55e',5:'#ef4444',6:'#8b5cf6'};

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <span>Home</span> › <span>Exam</span> › <span>Results</span>
        </div>
        <h1 class="module-header__title">
          ${r.passed
            ? `${renderTokenIcon('OK', 'module-header__title-icon')}Exam Passed!`
            : `${renderTokenIcon('X', 'module-header__title-icon')}Exam Not Passed`}
        </h1>
      </div>

      ${timeUp ? `<div class="ex-timeup-banner">${renderTokenIcon('TIME', 'ex-icon ex-timeup-icon')}Time expired — exam submitted automatically</div>` : ''}

      <!-- SCORE HERO -->
      <div class="ex-score-hero">
        <div class="ex-score-ring" style="--deg:${ringDeg}deg;--color:${r.passed?'#22c55e':'#ef4444'}">
          <div class="ex-score-ring-inner">
            <div class="ex-score-num">${r.score}</div>
            <div class="ex-score-den">/ ${SCORE_MAX}</div>
            <div class="ex-score-verdict ${r.passed?'pass':'fail'}">${r.passed?'PASS':'FAIL'}</div>
          </div>
        </div>
        <div class="ex-score-stats">
          <div class="ex-stat-row">
            <span class="ex-stat-label">Correct Answers</span>
            <span class="ex-stat-value">${r.correct} / ${r.total} (${pct}%)</span>
          </div>
          <div class="ex-stat-row">
            <span class="ex-stat-label">Time Used</span>
            <span class="ex-stat-value">${this._fmtTime(r.timeUsed)} / ${this._fmtTime(MODE_CONFIG[this._mode].minutes*60)}</span>
          </div>
          <div class="ex-stat-row">
            <span class="ex-stat-label">Pass Score</span>
            <span class="ex-stat-value">${PASS_SCORE} / ${SCORE_MAX}</span>
          </div>
          <div class="ex-stat-row">
            <span class="ex-stat-label">Mode</span>
            <span class="ex-stat-value">${r.mode}</span>
          </div>
          <div class="ex-pass-bar-wrap">
            <div class="ex-pass-bar">
              <div class="ex-pass-fill" style="width:${(r.score/SCORE_MAX)*100}%;background:${r.passed?'#22c55e':'#ef4444'}"></div>
              <div class="ex-pass-marker" style="left:${(PASS_SCORE/SCORE_MAX)*100}%">
                <span class="ex-pass-marker-label">Pass: ${PASS_SCORE}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      ${this._renderScoreHistoryChart(history, 'Attempt Score History')}

      <!-- DOMAIN BREAKDOWN -->
      <div class="ex-breakdown">
        <div class="ex-breakdown-title">Domain Breakdown</div>
        ${Object.entries(DOMAIN_NAMES).map(([k,v]) => {
          const pct = r.domainPct[k];
          if (pct === null) return '';
          const color = domainColors[k] || '#00d4ff';
          const icon  = pct >= 70 ? 'OK' : pct >= 50 ? 'WARN' : 'X';
          return `
            <div class="ex-breakdown-row">
              <span class="ex-breakdown-icon">${renderTokenIcon(icon, 'ex-icon ex-breakdown-icon-svg')}</span>
              <div class="ex-breakdown-info">
                <span class="ex-breakdown-name">Domain ${k} — ${v}</span>
                <div class="ex-breakdown-bar">
                  <div class="ex-breakdown-fill" style="width:${pct}%;background:${color}"></div>
                </div>
              </div>
              <span class="ex-breakdown-pct" style="color:${color}">${pct}%</span>
            </div>`;
        }).join('')}
      </div>

      ${weakTopics.length > 0 || weakDomains.length > 0 ? `
        <div class="ex-weak-areas" id="ex-weak-report">
          <div class="ex-weak-title">${renderTokenIcon('WARN', 'ex-icon ex-weak-title-icon')}Weak-Area Recovery Plan</div>
          <div class="ex-weak-tags">
            ${displayedWeakTopics.map((entry) => `
              <a class="ex-weak-tag" href="${entry.href}">
                ${escapeHtml(entry.topicCode ? `${entry.topicCode} ${entry.topicTitle}` : entry.topicTitle)} · ${entry.pct}% (${entry.missed} missed${entry.flagged ? `, ${entry.flagged} flagged` : ''})
              </a>
            `).join('')}
            ${hiddenWeakTopicCount ? `<span class="ex-weak-tag">+${hiddenWeakTopicCount} more topic${hiddenWeakTopicCount === 1 ? '' : 's'} in answer review</span>` : ''}
            ${weakDomains.map((entry) => `
              <a class="ex-weak-tag" href="#/paths/${entry.path?.id || ''}">
                ${escapeHtml(entry.label)} (${entry.pct}% correct)
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- ACTIONS -->
      <div class="ex-result-actions">
        <button class="ex-action-btn primary" id="ex-review-btn">${renderTokenIcon('DOCS', 'ex-icon ex-btn-icon')}Review Answers</button>
        ${weakTopics.length > 0 || weakDomains.length > 0 ? `<a class="ex-action-btn secondary" href="${firstWeakHref}">${renderTokenIcon('FOCUS', 'ex-icon ex-btn-icon')}Review Weak Areas</a>` : ''}
        <button class="ex-action-btn secondary" id="ex-retake-btn">${renderTokenIcon('CYCLE', 'ex-icon ex-btn-icon')}Retake Exam</button>
        <button class="ex-action-btn ghost" id="ex-lobby-btn">← Back to Lobby</button>
      </div>
    `;

    this._q('#ex-review-btn').addEventListener('click', () => this._showReview());
    this._q('#ex-retake-btn').addEventListener('click', () => this._startExam());
    this._q('#ex-lobby-btn').addEventListener('click', () => this.reset());
  }

  _showDomainFinalResults(timeUp) {
    this._screen = 'results';
    const r = this._result;
    const path = this._domainFinalPath;
    const scoreRatio = Math.max(0, Math.min(r.score / r.scoreMax, 1));
    const ringDeg = Math.round(scoreRatio * 360);
    const pct = Math.round((r.correct / r.total) * 100);
    const finalRecord = stateManager.getState('userProgress')?.domainFinals?.[r.domainId] || null;
    const nextPath = this._getNextDomainPath();
    const nextPathUnlocked = nextPath ? progressEngine.isPathUnlocked(nextPath, ALL_PATHS) : false;
    const flaggedModules = (r.flaggedTopicIds || [])
      .map((topicId) => path?.modules.find((module) => module.id === topicId))
      .filter(Boolean);

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <a href="#/paths">CCNA Domains</a> › <a href="#/paths/${path?.id || ''}">${escapeHtml(path?.title || 'Domain')}</a> › <span>Final Results</span>
        </div>
        <h1 class="module-header__title">
          ${r.passed
            ? `${renderTokenIcon('OK', 'module-header__title-icon')}${escapeHtml(path?.title || 'Domain')} Final Passed!`
            : `${renderTokenIcon('X', 'module-header__title-icon')}${escapeHtml(path?.title || 'Domain')} Final Not Passed`}
        </h1>
      </div>

      ${timeUp ? `<div class="ex-timeup-banner">${renderTokenIcon('TIME', 'ex-icon ex-timeup-icon')}Time expired — final exam submitted automatically</div>` : ''}

      <div class="ex-score-hero">
        <div class="ex-score-ring" style="--deg:${ringDeg}deg;--color:${r.passed ? '#22c55e' : '#ef4444'}">
          <div class="ex-score-ring-inner">
            <div class="ex-score-num">${r.score}</div>
            <div class="ex-score-den">/ ${r.scoreMax}%</div>
            <div class="ex-score-verdict ${r.passed ? 'pass' : 'fail'}">${r.passed ? 'PASS' : 'FAIL'}</div>
          </div>
        </div>
        <div class="ex-score-stats">
          <div class="ex-stat-row">
            <span class="ex-stat-label">Correct Answers</span>
            <span class="ex-stat-value">${r.correct} / ${r.total} (${pct}%)</span>
          </div>
          <div class="ex-stat-row">
            <span class="ex-stat-label">Time Used</span>
            <span class="ex-stat-value">${this._fmtTime(r.timeUsed)} / ${this._fmtTime(this._getTimeLimitSeconds())}</span>
          </div>
          <div class="ex-stat-row">
            <span class="ex-stat-label">Pass Mark</span>
            <span class="ex-stat-value">${r.passScore}%</span>
          </div>
          <div class="ex-stat-row">
            <span class="ex-stat-label">Attempts</span>
            <span class="ex-stat-value">${finalRecord?.attempts || 1}</span>
          </div>
          <div class="ex-stat-row">
            <span class="ex-stat-label">Best Score</span>
            <span class="ex-stat-value">${finalRecord?.bestScore || r.score}%</span>
          </div>
          <div class="ex-pass-bar-wrap">
            <div class="ex-pass-bar">
              <div class="ex-pass-fill" style="width:${scoreRatio * 100}%;background:${r.passed ? '#22c55e' : '#ef4444'}"></div>
              <div class="ex-pass-marker" style="left:${r.passScore}%">
                <span class="ex-pass-marker-label">Pass: ${r.passScore}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="ex-breakdown">
        <div class="ex-breakdown-title">Topic Breakdown</div>
        ${(path?.modules || []).map((module) => {
          const topicPct = r.topicPct?.[module.id];
          if (topicPct === undefined || topicPct === null) return '';
          const color = topicPct >= r.passScore ? '#22c55e' : topicPct >= 70 ? '#ffb800' : '#ef4444';
          const icon = topicPct >= r.passScore ? 'OK' : topicPct >= 70 ? 'WARN' : 'X';
          return `
            <div class="ex-breakdown-row">
              <span class="ex-breakdown-icon">${renderTokenIcon(icon, 'ex-icon ex-breakdown-icon-svg')}</span>
              <div class="ex-breakdown-info">
                <span class="ex-breakdown-name">${escapeHtml(module.code)} — ${escapeHtml(module.title)}</span>
                <div class="ex-breakdown-bar">
                  <div class="ex-breakdown-fill" style="width:${topicPct}%;background:${color}"></div>
                </div>
              </div>
              <span class="ex-breakdown-pct" style="color:${color}">${topicPct}%</span>
            </div>`;
        }).join('')}
      </div>

      ${flaggedModules.length > 0 ? `
        <div class="ex-weak-areas">
          <div class="ex-weak-title">${renderTokenIcon('WARN', 'ex-icon ex-weak-title-icon')}Topics Below 70% — Review Required</div>
          <div class="ex-weak-tags">
            ${flaggedModules.map((module) => `
              <a class="ex-weak-tag" href="#/paths/${path.id}/${module.id}">${escapeHtml(module.code)} ${escapeHtml(module.title)}</a>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="ex-result-actions">
        <button class="ex-action-btn primary" id="ex-review-btn">${renderTokenIcon('DOCS', 'ex-icon ex-btn-icon')}Review Answers</button>
        <button class="ex-action-btn secondary" id="ex-retake-btn">${renderTokenIcon('CYCLE', 'ex-icon ex-btn-icon')}Retake Final Exam</button>
        <a class="ex-action-btn ghost" href="#/paths/${path?.id || ''}">← Return to Domain</a>
        ${r.passed && nextPath && nextPathUnlocked ? `<a class="ex-action-btn secondary" href="#/paths/${nextPath.id}">Continue to ${escapeHtml(nextPath.title)} →</a>` : ''}
      </div>
    `;

    this._q('#ex-review-btn')?.addEventListener('click', () => this._showReview());
    this._q('#ex-retake-btn')?.addEventListener('click', () => this._startExam());
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SCREEN 4 — ANSWER REVIEW
  // ══════════════════════════════════════════════════════════════════════════
  _showReview() {
    this._screen    = 'review';
    this._reviewIdx = 0;
    this._renderReviewQuestion();
  }

  _renderReviewQuestion() {
    const q     = this._questions[this._reviewIdx];
    const ans   = this._answers[q.id];
    const total = this._questions.length;
    const isCorrect = this._isCorrect(q, ans);
    const domainColors = {1:'#00d4ff',2:'#ab47bc',3:'#ffb800',4:'#22c55e',5:'#ef4444',6:'#8b5cf6'};
    const dc = domainColors[q.domain] || '#00d4ff';

    this.container.innerHTML = `
      <!-- REVIEW TOPBAR -->
      <div class="ex-topbar">
        <div class="ex-topbar-left">
          <button class="ex-nav-btn" id="rev-back-btn">← Results</button>
        </div>
        <div class="ex-topbar-center">
          <span style="font:600 13px 'Nunito',sans-serif;color:#94a3b8">
            Review ${this._reviewIdx+1} / ${total}
          </span>
        </div>
        <div class="ex-topbar-right">
          <span style="font:600 12px 'JetBrains Mono',monospace;color:${isCorrect?'#22c55e':'#ef4444'}">
            ${isCorrect
              ? `${renderTokenIcon('OK', 'ex-icon ex-status-inline-icon')}CORRECT`
              : `${renderTokenIcon('X', 'ex-icon ex-status-inline-icon')}INCORRECT`}
          </span>
        </div>
      </div>

      <!-- REVIEW BODY -->
      <div class="ex-review-body">
        <div class="ex-q-meta">
          <span class="ex-q-domain" style="border-color:${dc};color:${dc}">
            Domain ${q.domain} — ${DOMAIN_NAMES[q.domain]}
          </span>
          <span class="ex-q-diff diff-${q.difficulty}">${q.difficulty.toUpperCase()}</span>
        </div>

        <div class="ex-q-text">${q.question}</div>

        <!-- ANSWER DISPLAY -->
        <div class="ex-review-answers">
          ${this._renderReviewAnswers(q, ans)}
        </div>

        <!-- EXPLANATION -->
        <div class="ex-explanation">
          <div class="ex-explanation-title">${renderTokenIcon('TIP', 'ex-icon ex-explanation-title-icon')}Explanation</div>
          <div class="ex-explanation-text">${q.explanation}</div>
        </div>
      </div>

      <!-- REVIEW NAV -->
      <div class="ex-bottombar">
        <button class="ex-nav-btn ${this._reviewIdx===0?'':''}",
          id="rev-prev-btn" ${this._reviewIdx===0?'disabled':''}>← Previous</button>
        <div class="ex-review-progress">
          ${this._questions.map((_,i) => `
            <div class="rev-dot ${this._isCorrect(this._questions[i],this._answers[this._questions[i].id])?'correct':'wrong'} ${i===this._reviewIdx?'current':''}"></div>
          `).join('')}
        </div>
        <button class="ex-nav-btn" id="rev-next-btn"
          ${this._reviewIdx===total-1?'disabled':''}>
          ${this._reviewIdx===total-1 ? 'Done' : 'Next →'}
        </button>
      </div>
    `;

    this._q('#rev-back-btn').addEventListener('click',()=>this._showResults(false));
    const prevBtn = this._q('#rev-prev-btn');
    const nextBtn = this._q('#rev-next-btn');
    if (prevBtn) prevBtn.addEventListener('click',()=>{
      if(this._reviewIdx>0){this._reviewIdx--;this._renderReviewQuestion();}
    });
    if (nextBtn) nextBtn.addEventListener('click',()=>{
      if(this._reviewIdx<total-1){this._reviewIdx++;this._renderReviewQuestion();}
      else this._showResults(false);
    });
  }

  _renderReviewAnswers(q, ans) {
    if (q.type === 'single' || q.type === 'multi') {
      const correctArr = Array.isArray(q.correct) ? q.correct : [q.correct];
      const givenArr   = Array.isArray(ans)        ? ans        : (ans ? [ans] : []);
      return `<div class="ex-options review">
        ${q.options.map(opt => {
          const isCorrectOpt = correctArr.includes(opt.id);
          const wasSelected  = givenArr.includes(opt.id);
          let cls = 'ex-option review-opt';
          if (isCorrectOpt)              cls += ' correct-opt';
          if (wasSelected && !isCorrectOpt) cls += ' wrong-opt';
          const icon = isCorrectOpt ? 'OK' : wasSelected ? 'X' : '';
          return `<div class="${cls}">
            <span class="ex-option-key">${opt.id.toUpperCase()}</span>
            <span class="ex-option-text">${opt.text}</span>
            ${icon ? `<span class="rev-icon">${renderTokenIcon(icon, 'ex-icon ex-review-mark-icon')}</span>` : ''}
          </div>`;
        }).join('')}
      </div>`;
    }

    if (q.type === 'order') {
      const given   = Array.isArray(ans) ? ans : [];
      const itemMap = Object.fromEntries(q.items.map(i=>[i.id,i.text]));
      return `
        <div class="ex-review-order-wrap">
          <div class="ex-review-order-col">
            <div class="ex-review-order-hdr">Your Order</div>
            ${given.length ? given.map((id,i)=>`
              <div class="ex-order-item ${id===q.correct[i]?'order-correct':'order-wrong'}">
                <span class="ex-order-num">${i+1}</span>
                <span>${itemMap[id]||id}</span>
                <span class="ex-review-order-mark">${renderTokenIcon(id===q.correct[i] ? 'OK' : 'X', 'ex-icon ex-review-mark-icon')}</span>
              </div>`).join('') : `<div class="ex-order-item order-wrong"><span>(no order submitted)</span></div>`}
          </div>
          <div class="ex-review-order-col">
            <div class="ex-review-order-hdr">Correct Order</div>
            ${q.correct.map((id,i)=>`
              <div class="ex-order-item order-correct">
                <span class="ex-order-num">${i+1}</span>
                <span>${itemMap[id]||id}</span>
                <span class="ex-review-order-mark">${renderTokenIcon('OK', 'ex-icon ex-review-mark-icon')}</span>
              </div>`).join('')}
          </div>
        </div>`;
    }

    if (q.type === 'input') {
      const given = (ans||'').toString();
      const ok    = given.trim().toLowerCase() === q.answer.toString().trim().toLowerCase();
      return `
        <div class="ex-review-input">
          <div class="ex-review-input-row">
            <span class="ex-review-input-lbl">Your answer:</span>
            <span class="ex-review-input-val ${ok?'correct-opt':'wrong-opt'}">${given||'(no answer)'} ${renderTokenIcon(ok ? 'OK' : 'X', 'ex-icon ex-review-mark-icon')}</span>
          </div>
          <div class="ex-review-input-row">
            <span class="ex-review-input-lbl">Correct answer:</span>
            <span class="ex-review-input-val correct-opt">${q.answer} ${renderTokenIcon('OK', 'ex-icon ex-review-mark-icon')}</span>
          </div>
        </div>`;
    }
    return '';
  }

  _isCorrect(q, ans) {
    if (!ans && ans !== 0) return false;
    if (q.type==='single') return ans===q.correct;
    if (q.type==='multi')  return Array.isArray(ans)&&ans.length===q.correct.length&&ans.every(a=>q.correct.includes(a));
    if (q.type==='order')  return Array.isArray(ans)&&ans.every((id,i)=>id===q.correct[i]);
    if (q.type==='input')  return ans.toString().trim().toLowerCase()===q.answer.toString().trim().toLowerCase();
    return false;
  }

  // ── UTILS ───────────────────────────────────────────────────────────────
  _q(sel)  { return this.container ? this.container.querySelector(sel)    : null; }
  _qq(sel) { return this.container ? this.container.querySelectorAll(sel) : []; }

  // ══════════════════════════════════════════════════════════════════════════
  //  STYLES — fully self-contained, zero CSS variable dependencies
  // ══════════════════════════════════════════════════════════════════════════
  _injectStyles() {
    if (document.getElementById('exam-mode-styles')) return;
    const s = document.createElement('style');
    s.id = 'exam-mode-styles';
    s.textContent = `
    .ex-icon{display:inline-flex;align-items:center;justify-content:center;line-height:0;vertical-align:middle}
    .ex-icon svg{width:1em;height:1em}

    /* ── Lobby ── */
    .ex-mode-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px}
    .ex-mode-card{background:#111827;border:2px solid #1e2d45;border-radius:12px;padding:20px 16px;
      cursor:pointer;text-align:center;transition:all .2s}
    .ex-mode-card:hover{border-color:#2a3f60;background:#1a2235}
    .ex-mode-card.active{border-color:#00d4ff;background:rgba(0,212,255,0.08)}
    .ex-mode-icon{display:flex;align-items:center;justify-content:center;margin-bottom:8px;color:#00d4ff}
    .ex-mode-icon-svg svg{width:30px;height:30px}
    .ex-mode-label{font:700 14px 'Syne',sans-serif;color:#e2e8f0;margin-bottom:4px}
    .ex-mode-meta{font:11px 'JetBrains Mono',monospace;color:#4b6278}
    .ex-topic-bar{display:flex;align-items:center;gap:10px;background:#111827;
      border:1px solid #1e2d45;border-radius:10px;padding:10px 14px;margin-bottom:12px}
    .ex-label{font:600 12px 'Nunito',sans-serif;color:#94a3b8}
    .ex-sel{background:#1a2235;border:1px solid #2a3f60;color:#e2e8f0;
      font:12px 'JetBrains Mono',monospace;padding:6px 24px 6px 10px;
      border-radius:7px;cursor:pointer;outline:none;appearance:none;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E");
      background-repeat:no-repeat;background-position:right 8px center;min-width:280px}
    .ex-info-strip{display:flex;align-items:center;background:#111827;border:1px solid #1e2d45;
      border-radius:10px;padding:14px 20px;margin-bottom:14px}
    .ex-info-cell{flex:1;text-align:center}
    .ex-info-num{font:700 22px 'JetBrains Mono',monospace;color:#00d4ff}
    .ex-info-lbl{font:11px 'Nunito',sans-serif;color:#4b6278;margin-top:2px}
    .ex-info-div{width:1px;height:36px;background:#1e2d45;margin:0 8px}
    .ex-start-btn{background:#00d4ff;color:#000;font:700 14px 'Syne',sans-serif;
      padding:12px 40px;border-radius:8px;border:none;cursor:pointer;
      transition:all .2s;letter-spacing:.5px}
    .ex-start-btn:hover{background:#33ddff;transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,212,255,.3)}
    .ex-history{background:#111827;border:1px solid #1e2d45;border-radius:10px;padding:16px;margin-top:12px;margin-bottom:12px}
    .ex-history-title{font:700 12px 'JetBrains Mono',monospace;color:#4b6278;
      text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px}
    .ex-history-list{display:flex;flex-direction:column;gap:8px}
    .ex-history-row{display:flex;align-items:center;gap:12px;font-size:13px}
    .ex-history-badge{font:700 10px 'JetBrains Mono',monospace;padding:2px 8px;border-radius:4px}
    .ex-history-badge.pass{background:rgba(34,197,94,.15);color:#22c55e}
    .ex-history-badge.fail{background:rgba(239,68,68,.15);color:#ef4444}
    .ex-history-score{font:600 13px 'JetBrains Mono',monospace;color:#e2e8f0;min-width:80px}
    .ex-history-meta{font:12px 'Nunito',sans-serif;color:#4b6278}
    .ex-score-history{background:var(--color-bg-panel);border:1px solid var(--color-border);border-radius:10px;
      padding:16px;margin:12px 0 14px}
    .ex-score-history-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;
      font:700 12px 'JetBrains Mono',monospace;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:1px}
    .ex-score-history-head span:first-child{display:inline-flex;align-items:center;gap:8px;color:var(--color-text-primary)}
    .ex-history-chart-icon svg{width:14px;height:14px;color:var(--color-primary)}
    .ex-score-history-meta{font:600 10px 'Nunito',sans-serif;color:var(--color-text-muted);text-transform:none;letter-spacing:0}
    .ex-score-chart{position:relative;display:grid;grid-template-columns:repeat(auto-fit,minmax(38px,1fr));
      align-items:end;gap:10px;height:120px;padding:10px 0 22px;border-top:1px solid var(--color-border)}
    .ex-score-chart-passline{position:absolute;left:0;right:0;bottom:var(--pass-line);border-top:1px dashed var(--color-warning);opacity:.8}
    .ex-score-chart-point{height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px;min-width:0}
    .ex-score-chart-bar{width:100%;max-width:46px;height:var(--bar-height);min-height:6px;border-radius:6px 6px 2px 2px;
      background:var(--color-error);box-shadow:0 0 0 1px var(--color-border);transition:height .4s ease, transform .2s ease}
    .ex-score-chart-bar.pass{background:var(--color-success)}
    .ex-score-chart-bar:hover{transform:translateY(-2px)}
    .ex-score-chart-label{font:700 10px 'JetBrains Mono',monospace;color:var(--color-text-muted);line-height:1}
    .ex-domains{background:#111827;border:1px solid #1e2d45;border-radius:10px;padding:16px;margin-top:12px}
    .ex-domains-title{font:700 12px 'JetBrains Mono',monospace;color:#4b6278;
      text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px}
    .ex-domains-grid{display:flex;flex-direction:column;gap:8px}
    .ex-domain-row{display:grid;grid-template-columns:80px 1fr 1fr 40px;align-items:center;gap:10px}
    .ex-domain-num{font:700 10px 'JetBrains Mono',monospace;color:#4b6278}
    .ex-domain-name{font:13px 'Nunito',sans-serif;color:#94a3b8}
    .ex-domain-bar{height:4px;background:#1e2d45;border-radius:2px;overflow:hidden}
    .ex-domain-fill{height:100%;background:#00d4ff;border-radius:2px}
    .ex-domain-pct{font:11px 'JetBrains Mono',monospace;color:#4b6278;text-align:right}

    /* ── Analytics Dashboard ── */
    .ex-analytics-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px}
    .ex-analytics-card{display:flex;align-items:center;gap:12px;background:#111827;
      border:1px solid #1e2d45;border-radius:10px;padding:14px 16px;transition:all .2s}
    .ex-analytics-card:hover{border-color:#2a3f60;transform:translateY(-2px)}
    .ex-analytics-icon{display:flex;align-items:center;justify-content:center;line-height:1;color:#00d4ff}
    .ex-analytics-icon-svg svg{width:24px;height:24px}
    .ex-analytics-data{display:flex;flex-direction:column}
    .ex-analytics-value{font:700 22px 'JetBrains Mono',monospace;color:#e2e8f0}
    .ex-analytics-label{font:11px 'Nunito',sans-serif;color:#4b6278;margin-top:2px}
    
    .ex-weak-areas{background:linear-gradient(135deg,rgba(255,184,0,0.08),rgba(239,68,68,0.08));
      border:1px solid rgba(255,184,0,0.3);border-radius:10px;padding:14px 16px;margin-bottom:14px}
    .ex-weak-title{display:flex;align-items:center;gap:8px;font:700 12px 'Nunito',sans-serif;color:#ffb800;margin-bottom:10px}
    .ex-weak-title-icon svg{width:14px;height:14px}
    .ex-weak-tags{display:flex;flex-wrap:wrap;gap:8px}
    .ex-weak-tag{font:11px 'JetBrains Mono',monospace;padding:4px 10px;
      background:rgba(239,68,68,0.15);color:#ef4444;border-radius:20px;cursor:pointer;
      transition:all .15s}
    .ex-weak-tag:hover{background:rgba(239,68,68,0.25);transform:scale(1.05)}

    /* ── Exam top bar ── */
    .ex-topbar{display:flex;align-items:center;gap:12px;background:#111827;
      border:1px solid #1e2d45;border-radius:10px;padding:10px 16px;margin-bottom:12px;flex-shrink:0}
    .ex-topbar-left{display:flex;align-items:center;gap:8px;min-width:160px}
    .ex-topbar-center{flex:1}
    .ex-topbar-right{display:flex;align-items:center;gap:6px;min-width:100px;justify-content:flex-end}
    .ex-topbar-title{font:700 13px 'Syne',sans-serif;color:#e2e8f0}
    .ex-topbar-sep{color:#1e2d45}
    .ex-progress-txt{font:11px 'JetBrains Mono',monospace;color:#94a3b8}
    .ex-progress-bar-wrap{height:6px;background:#1e2d45;border-radius:3px;overflow:hidden}
    .ex-progress-bar-fill{height:100%;background:linear-gradient(90deg,#00d4ff,#0099cc);
      border-radius:3px;transition:width .3s ease}
    .ex-timer-ico{display:inline-flex;align-items:center;justify-content:center;color:#4b6278}
    .ex-timer-icon-svg svg{width:14px;height:14px}
    .ex-timer{font:700 16px 'JetBrains Mono',monospace;color:#00d4ff;min-width:52px;text-align:right}

    /* ── Question area ── */
    .ex-question-area{background:#111827;border:1px solid #1e2d45;border-radius:10px;
      padding:20px 24px;margin-bottom:12px;min-height:320px}
    .ex-q-meta{display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap}
    .ex-q-domain{font:600 11px 'JetBrains Mono',monospace;padding:3px 10px;
      border-radius:4px;border:1px solid;background:transparent}
    .ex-q-diff{font:700 9px 'JetBrains Mono',monospace;padding:2px 8px;border-radius:3px}
    .diff-easy{background:rgba(34,197,94,.15);color:#22c55e}
    .diff-medium{background:rgba(255,184,0,.15);color:#ffb800}
    .diff-hard{background:rgba(239,68,68,.15);color:#ef4444}
    .ex-q-flagged{display:inline-flex;align-items:center;gap:6px;font:600 11px 'Nunito',sans-serif;color:#ffb800}
    .ex-flagged-icon svg{width:12px;height:12px}
    .ex-q-text{font:500 16px 'Nunito',sans-serif;color:#e2e8f0;line-height:1.65;margin-bottom:16px}
    .ex-q-hint{font:italic 12px 'Nunito',sans-serif;color:#4b6278;margin-bottom:12px;
      padding:6px 10px;background:#0d1424;border-radius:6px;border-left:3px solid #2a3f60}

    /* ── Options ── */
    .ex-options{display:flex;flex-direction:column;gap:8px}
    .ex-option{display:flex;align-items:flex-start;gap:12px;padding:12px 16px;
      border-radius:8px;border:1.5px solid #1e2d45;cursor:pointer;
      background:#0d1424;transition:all .15s;line-height:1.45}
    .ex-option:hover{border-color:#2a3f60;background:#111827}
    .ex-option.selected{border-color:#00d4ff;background:rgba(0,212,255,.08)}
    .ex-radio,.ex-checkbox{display:none}
    .ex-option-key{font:700 12px 'JetBrains Mono',monospace;color:#00d4ff;
      min-width:20px;flex-shrink:0;margin-top:1px}
    .ex-option-text{font:14px 'Nunito',sans-serif;color:#e2e8f0;flex:1}

    /* ── Drag order ── */
    .ex-order-list{display:flex;flex-direction:column;gap:8px}
    .ex-order-item{display:flex;align-items:center;gap:12px;padding:12px 16px;
      border-radius:8px;border:1.5px solid #1e2d45;background:#0d1424;
      cursor:grab;transition:all .15s;user-select:none}
    .ex-order-item:hover{border-color:#2a3f60}
    .ex-order-item.dragging{opacity:.5;border-color:#00d4ff}
    .ex-order-item.drag-over{border-color:#00d4ff;background:rgba(0,212,255,.06);
      transform:scale(1.01)}
    .ex-order-handle{display:inline-flex;align-items:center;justify-content:center;color:#2a3f60;cursor:grab}
    .ex-order-handle-icon svg{width:16px;height:16px}
    .ex-order-num{font:700 12px 'JetBrains Mono',monospace;color:#00d4ff;min-width:20px}
    .ex-order-text{font:14px 'Nunito',sans-serif;color:#e2e8f0;flex:1}

    /* ── Input ── */
    .ex-input-wrap{padding:8px 0}
    .ex-input{width:100%;background:#0d1424;border:1.5px solid #2a3f60;color:#e2e8f0;
      font:16px 'JetBrains Mono',monospace;padding:14px 16px;border-radius:8px;
      outline:none;transition:border-color .15s}
    .ex-input:focus{border-color:#00d4ff}

    /* ── Bottom bar ── */
    .ex-bottombar{display:flex;align-items:center;justify-content:space-between;
      background:#111827;border:1px solid #1e2d45;border-radius:10px;
      padding:10px 16px;margin-top:4px;gap:10px}
    .ex-flag-btn{display:inline-flex;align-items:center;gap:8px;background:transparent;border:1.5px solid #1e2d45;color:#94a3b8;
      font:600 12px 'Nunito',sans-serif;padding:7px 14px;border-radius:7px;cursor:pointer;transition:all .2s}
    .ex-flag-btn:hover{border-color:#ffb800;color:#ffb800}
    .ex-flag-btn.active{border-color:#ffb800;color:#ffb800;background:rgba(255,184,0,.08)}
    .ex-nav-btn{background:#1a2235;color:#e2e8f0;border:1px solid #2a3f60;
      font:600 12px 'Nunito',sans-serif;padding:7px 14px;border-radius:7px;cursor:pointer;transition:all .2s}
    .ex-nav-btn:hover:not(:disabled){border-color:#00d4ff;color:#00d4ff}
    .ex-nav-btn:disabled{opacity:.3;cursor:not-allowed}
    .ex-map-btn{display:inline-flex;align-items:center;gap:8px;background:#1a2235;color:#94a3b8;border:1px solid #1e2d45;
      font:600 11px 'JetBrains Mono',monospace;padding:7px 12px;border-radius:7px;cursor:pointer;transition:all .2s}
    .ex-btn-icon svg{width:13px;height:13px}
    .ex-map-btn:hover{border-color:#2a3f60;color:#e2e8f0}
    .ex-submit-btn{background:transparent;color:#ef4444;border:1.5px solid #ef4444;
      font:700 12px 'Syne',sans-serif;padding:7px 18px;border-radius:7px;cursor:pointer;transition:all .2s}
    .ex-submit-btn:hover{background:rgba(239,68,68,.1)}

    /* ── Question map overlay ── */
    .ex-map-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);
      z-index:1000;display:flex;align-items:center;justify-content:center}
    .ex-map-panel{background:#111827;border:1px solid #2a3f60;border-radius:14px;
      padding:20px;max-width:520px;width:90%;max-height:80vh;overflow-y:auto}
    .ex-map-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
    .ex-map-title{font:700 14px 'Syne',sans-serif;color:#e2e8f0}
    .ex-map-close{display:inline-flex;align-items:center;justify-content:center;background:transparent;border:none;color:#94a3b8;font-size:16px;
      cursor:pointer;padding:4px 8px;border-radius:4px}
    .ex-map-close:hover{color:#e2e8f0;background:#1e2d45}
    .ex-map-close-icon svg{width:14px;height:14px}
    .ex-map-legend{display:flex;align-items:center;gap:16px;font:12px 'Nunito',sans-serif;
      color:#94a3b8;margin-bottom:12px;flex-wrap:wrap}
    .ex-legend-dot{width:10px;height:10px;border-radius:3px;display:inline-block;margin-right:4px}
    .ex-legend-dot.answered{background:#00d4ff}
    .ex-legend-dot.flagged{background:#ffb800}
    .ex-legend-dot.current{background:#a855f7}
    .ex-legend-dot.unanswered{background:#1e2d45;border:1px solid #2a3f60}
    .ex-map-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:6px;margin-bottom:14px}
    .map-cell{aspect-ratio:1;border-radius:6px;background:#1e2d45;border:1px solid #2a3f60;
      display:flex;align-items:center;justify-content:center;font:600 10px 'JetBrains Mono',monospace;
      color:#4b6278;cursor:pointer;transition:all .15s}
    .map-cell:hover{border-color:#00d4ff;color:#e2e8f0}
    .map-cell.answered{background:rgba(0,212,255,.15);border-color:#00d4ff;color:#00d4ff}
    .map-cell.flagged{background:rgba(255,184,0,.15);border-color:#ffb800;color:#ffb800}
    .map-cell.current{background:rgba(168,85,247,.2);border-color:#a855f7;color:#a855f7}
    .ex-map-footer{display:flex;align-items:center;justify-content:space-between}
    .ex-map-footer span{font:12px 'JetBrains Mono',monospace;color:#4b6278}

    /* ── Results ── */
    .ex-timeup-banner{display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);
      border-radius:8px;padding:10px 16px;font:600 13px 'Nunito',sans-serif;
      color:#ef4444;text-align:center;margin-bottom:14px}
    .ex-timeup-icon svg{width:14px;height:14px}
    .ex-score-hero{display:grid;grid-template-columns:200px 1fr;gap:24px;
      background:#111827;border:1px solid #1e2d45;border-radius:12px;padding:24px;margin-bottom:14px}
    .ex-score-ring{width:160px;height:160px;border-radius:50%;display:flex;
      align-items:center;justify-content:center;
      background:conic-gradient(var(--color) 0deg,var(--color) var(--deg),#1e2d45 var(--deg));
      padding:8px}
    .ex-score-ring-inner{width:100%;height:100%;border-radius:50%;background:#111827;
      display:flex;flex-direction:column;align-items:center;justify-content:center}
    .ex-score-num{font:800 36px 'Syne',sans-serif;color:#e2e8f0;line-height:1}
    .ex-score-den{font:12px 'JetBrains Mono',monospace;color:#4b6278}
    .ex-score-verdict{font:700 12px 'Syne',sans-serif;margin-top:4px;padding:2px 10px;border-radius:4px}
    .ex-score-verdict.pass{background:rgba(34,197,94,.15);color:#22c55e}
    .ex-score-verdict.fail{background:rgba(239,68,68,.15);color:#ef4444}
    .ex-score-stats{display:flex;flex-direction:column;justify-content:center;gap:10px}
    .ex-stat-row{display:flex;justify-content:space-between;align-items:center;
      padding-bottom:8px;border-bottom:1px solid #1e2d45}
    .ex-stat-row:last-child{border-bottom:none}
    .ex-stat-label{font:600 12px 'Nunito',sans-serif;color:#94a3b8}
    .ex-stat-value{font:600 13px 'JetBrains Mono',monospace;color:#e2e8f0}
    .ex-pass-bar-wrap{margin-top:4px}
    .ex-pass-bar{height:8px;background:#1e2d45;border-radius:4px;position:relative;overflow:visible}
    .ex-pass-fill{height:100%;border-radius:4px;transition:width 1s ease}
    .ex-pass-marker{position:absolute;top:-4px;height:16px;width:2px;background:#ffb800;transform:translateX(-50%)}
    .ex-pass-marker-label{position:absolute;top:-20px;left:50%;transform:translateX(-50%);
      font:10px 'JetBrains Mono',monospace;color:#ffb800;white-space:nowrap}
    .ex-breakdown{background:#111827;border:1px solid #1e2d45;border-radius:12px;padding:20px;margin-bottom:14px}
    .ex-breakdown-title{font:700 12px 'JetBrains Mono',monospace;color:#4b6278;
      text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px}
    .ex-breakdown-row{display:flex;align-items:center;gap:12px;margin-bottom:10px}
    .ex-breakdown-icon{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}
    .ex-breakdown-icon-svg svg{width:16px;height:16px}
    .ex-breakdown-info{flex:1}
    .ex-breakdown-name{font:600 13px 'Nunito',sans-serif;color:#e2e8f0;display:block;margin-bottom:4px}
    .ex-breakdown-bar{height:6px;background:#1e2d45;border-radius:3px;overflow:hidden}
    .ex-breakdown-fill{height:100%;border-radius:3px;transition:width .6s ease}
    .ex-breakdown-pct{font:700 13px 'JetBrains Mono',monospace;min-width:40px;text-align:right}
    .ex-result-actions{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px}
    .ex-action-btn{display:inline-flex;align-items:center;gap:8px;font:700 13px 'Syne',sans-serif;padding:10px 22px;border-radius:8px;
      border:none;cursor:pointer;transition:all .2s}
    .ex-action-btn.primary{background:#00d4ff;color:#000}
    .ex-action-btn.primary:hover{background:#33ddff;transform:translateY(-1px)}
    .ex-action-btn.secondary{background:#1a2235;color:#e2e8f0;border:1.5px solid #2a3f60}
    .ex-action-btn.secondary:hover{border-color:#00d4ff;color:#00d4ff}
    .ex-action-btn.ghost{background:transparent;color:#94a3b8;border:1.5px solid #1e2d45}
    .ex-action-btn.ghost:hover{border-color:#2a3f60;color:#e2e8f0}

    /* ── Review ── */
    .ex-review-body{background:#111827;border:1px solid #1e2d45;border-radius:10px;
      padding:20px 24px;margin-bottom:12px}
    .ex-options.review .ex-option{cursor:default}
    .ex-options.review .ex-option:hover{border-color:#1e2d45;background:#0d1424}
    .review-opt{background:#0d1424;border:1.5px solid #1e2d45}
    .correct-opt{background:rgba(34,197,94,.08)!important;border-color:#22c55e!important;color:#22c55e}
    .wrong-opt{background:rgba(239,68,68,.08)!important;border-color:#ef4444!important;color:#ef4444}
    .rev-icon{margin-left:auto;flex-shrink:0;display:inline-flex;align-items:center}
    .ex-review-mark-icon svg{width:14px;height:14px}
    .ex-explanation{margin-top:16px;background:#0d1424;border:1px solid #1e2d45;
      border-radius:8px;padding:14px 16px;border-left:3px solid #00d4ff}
    .ex-explanation-title{display:flex;align-items:center;gap:8px;font:700 12px 'JetBrains Mono',monospace;color:#00d4ff;
      text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
    .ex-explanation-title-icon svg{width:14px;height:14px}
    .ex-explanation-text{font:14px 'Nunito',sans-serif;color:#94a3b8;line-height:1.65}
    .ex-review-progress{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;max-width:400px}
    .rev-dot{width:8px;height:8px;border-radius:50%;background:#1e2d45;flex-shrink:0}
    .rev-dot.correct{background:#22c55e}
    .rev-dot.wrong{background:#ef4444}
    .rev-dot.current{outline:2px solid #00d4ff;outline-offset:1px}
    .ex-review-order-wrap{display:grid;grid-template-columns:1fr 1fr;gap:16px}
    .ex-review-order-col{}
    .ex-review-order-hdr{font:700 11px 'JetBrains Mono',monospace;color:#4b6278;
      text-transform:uppercase;margin-bottom:8px}
    .ex-review-order-mark{display:inline-flex;align-items:center;margin-left:auto}
    .order-correct{border-color:#22c55e!important;background:rgba(34,197,94,.06)!important}
    .order-wrong{border-color:#ef4444!important;background:rgba(239,68,68,.06)!important}
    .ex-review-input{display:flex;flex-direction:column;gap:10px;padding:4px 0}
    .ex-review-input-row{display:flex;align-items:center;gap:12px}
    .ex-review-input-lbl{font:600 12px 'Nunito',sans-serif;color:#94a3b8;min-width:140px}
    .ex-review-input-val{display:inline-flex;align-items:center;gap:8px;font:600 14px 'JetBrains Mono',monospace;padding:6px 12px;border-radius:6px;border:1px solid #1e2d45}
    .ex-status-inline-icon{margin-right:6px}
    .ex-status-inline-icon svg{width:12px;height:12px}

    /* ── Animations ── */
    @keyframes ex-fade-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes ex-slide-in{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
    @keyframes ex-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.02)}}
    @keyframes ex-score-pop{0%{transform:scale(0);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
    
    .ex-question-fade{animation:none}
    .ex-q-slide-in{animation:ex-slide-in .35s ease-out}
    .ex-mode-card,.ex-analytics-card,.ex-weak-tag,.map-cell{animation:ex-fade-in .4s ease-out}
    .ex-score-ring-inner{animation:ex-score-pop .6s ease-out}
    
    .ex-score-num,.ex-score-verdict,.ex-stat-value{animation:ex-pulse 2s ease-in-out infinite}
    
    @media (max-width:768px){
      .ex-analytics-strip{grid-template-columns:repeat(2,1fr)}
      .ex-score-hero{grid-template-columns:1fr}
      .ex-score-ring{margin:0 auto}
      .ex-review-order-wrap{grid-template-columns:1fr}
    }
    `;
    document.head.appendChild(s);
  }
}

export default new ExamModeEngine();
