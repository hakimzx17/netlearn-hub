/**
 * examModeEngine.js — Full CCNA-Style Exam Mode
 *
 * Flow:
 *   1. Config screen  — choose topics, question count, time limit
 *   2. Exam screen    — timed quiz via quizEngine (no explanations shown)
 *   3. Results screen — score, pass/fail, per-topic breakdown, grade
 *   4. Review screen  — every question with correct answer + explanation
 *
 * Depends on:
 *   components/quizEngine.js  (question presentation)
 *   components/timer.js       (countdown display)
 *   data/quizQuestions.js     (question bank)
 *   js/stateManager.js        (score persistence)
 *   utils/helperFunctions.js  (shuffle, escapeHtml, showToast)
 */

import { createQuizEngine }                     from '../components/quizEngine.js';
import { createTimer }                          from '../components/timer.js';
import { QUESTIONS, TOPICS, getRandomQuestions } from '../data/quizQuestions.js';
import { stateManager }                          from '../js/stateManager.js';
import { shuffle, escapeHtml, showToast }        from '../utils/helperFunctions.js';

// ── Constants ─────────────────────────────────────────────────────────
const PASS_PERCENT   = 70;
const TIME_OPTIONS   = [
  { label: '10 min',  seconds: 600  },
  { label: '20 min',  seconds: 1200 },
  { label: '30 min',  seconds: 1800 },
  { label: 'No limit',seconds: 0    },
];
const COUNT_OPTIONS  = [10, 20, 30, 60];
const GRADE_TABLE    = [
  { min: 90, grade: 'A', label: 'Excellent',     color: '#00e676' },
  { min: 80, grade: 'B', label: 'Good',          color: '#69f0ae' },
  { min: 70, grade: 'C', label: 'Pass',          color: '#ffb800' },
  { min: 60, grade: 'D', label: 'Near Miss',     color: '#ff9800' },
  { min: 0,  grade: 'F', label: 'Needs Work',    color: '#ff4444' },
];

// ── State shape ────────────────────────────────────────────────────────
// _session holds everything needed for results + review after completion
// {
//   questions: [...],   answered: Map(questionId → {selectedIndex, correct}),
//   startedAt: Date,    finishedAt: Date,    timeLimitSeconds: number,
//   timeUsedSeconds: number,
// }

class ExamModeEngine {
  constructor() {
    this.container    = null;
    this._screen      = 'config';   // 'config' | 'exam' | 'results' | 'review'
    this._quiz        = null;
    this._timer       = null;
    this._session     = null;
    this._reviewIndex = 0;

    // Config state (sticky across renders)
    this._cfg = {
      topics:   Object.values(TOPICS),   // all selected by default
      count:    20,
      timeSecs: 1200,
    };
  }

  // ── Lifecycle ─────────────────────────────────────────────────────

  init(containerEl) {
    this.container = containerEl;
    this._restoreConfig();
    this._renderConfig();
  }

  start()   { /* config screen is start */ }
  step()    { /* not applicable */ }

  reset() {
    this._teardown();
    this._screen = 'config';
    this._session = null;
    if (this.container) this._renderConfig();
  }

  destroy() {
    this._teardown();
    this.container = null;
  }

  _teardown() {
    if (this._timer) { this._timer.stop(); this._timer.destroy(); this._timer = null; }
    if (this._quiz)  { if (typeof this._quiz.destroy === "function") this._quiz.destroy(); this._quiz = null; }
  }

  // ── Config screen ─────────────────────────────────────────────────

  _renderConfig() {
    this._screen = 'config';
    const history = stateManager.getState('examHistory') || [];

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <span>Exam Mode</span>
        </div>
        <h1 class="module-header__title">Exam Mode</h1>
        <p class="module-header__description">
          Test yourself under timed, exam-style conditions.
          No explanations are shown during the exam — answers and
          full breakdowns are revealed in the review after completion.
        </p>
      </div>

      <div class="layout-main-sidebar" style="align-items:flex-start;">

        <!-- Config form -->
        <div>

          <!-- Topic selection -->
          <div class="card" style="margin-bottom:1rem;">
            <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase;">
              Topics <span style="color:var(--color-text-muted);">(${Object.values(TOPICS).length} available)</span>
            </div>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.6rem;" id="exam-topic-grid">
              ${Object.entries(TOPICS).map(([key, label]) => {
                const selected = this._cfg.topics.includes(label);
                const qCount   = QUESTIONS.filter(q => q.topic === label).length;
                return `
                  <button class="exam-topic-btn btn ${selected ? 'btn-primary' : 'btn-ghost'}"
                    data-topic="${escapeHtml(label)}"
                    style="font-size:var(--text-xs); padding:0.3rem 0.65rem;">
                    ${escapeHtml(label)}
                    <span style="opacity:0.65; margin-left:0.25rem;">(${qCount})</span>
                  </button>
                `;
              }).join('')}
            </div>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn btn-ghost" id="exam-select-all" style="font-size:var(--text-xs); padding:0.2rem 0.5rem;">Select All</button>
              <button class="btn btn-ghost" id="exam-select-none" style="font-size:var(--text-xs); padding:0.2rem 0.5rem;">Clear All</button>
            </div>
          </div>

          <!-- Question count -->
          <div class="card" style="margin-bottom:1rem;">
            <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase;">Number of Questions</div>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              ${COUNT_OPTIONS.map(n => `
                <button class="exam-count-btn btn ${this._cfg.count === n ? 'btn-primary' : 'btn-ghost'}"
                  data-count="${n}"
                  style="font-size:var(--text-sm); padding:0.35rem 0.9rem; font-family:var(--font-mono);">
                  ${n}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Time limit -->
          <div class="card" style="margin-bottom:1rem;">
            <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase;">Time Limit</div>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              ${TIME_OPTIONS.map(t => `
                <button class="exam-time-btn btn ${this._cfg.timeSecs === t.seconds ? 'btn-primary' : 'btn-ghost'}"
                  data-seconds="${t.seconds}"
                  style="font-size:var(--text-xs); padding:0.3rem 0.75rem;">
                  ${t.label}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Summary + start -->
          <div class="control-bar" style="flex-wrap:wrap; gap:0.75rem;">
            <div style="flex:1;">
              <div id="exam-summary" class="text-secondary text-sm"></div>
            </div>
            <button class="btn btn-primary" id="exam-start-btn"
              style="font-size:var(--text-base); padding:0.6rem 1.75rem; font-family:var(--font-display); font-weight:700; letter-spacing:0.04em;">
              Begin Exam →
            </button>
          </div>
          <div id="exam-config-error" role="status" aria-live="polite" style="margin-top:0.5rem; font-size:var(--text-xs); color:var(--color-error); min-height:1rem;"></div>
        </div>

        <!-- Right: history + info -->
        <div>
          <!-- Past scores -->
          <div class="info-panel">
            <div class="info-panel__title">📊 Exam History</div>
            ${history.length === 0 ? `
              <p class="text-muted text-xs text-mono" style="text-align:center; padding:0.5rem;">No exams taken yet</p>
            ` : `
              <div style="display:flex; flex-direction:column; gap:0.4rem;">
                ${history.slice(-5).reverse().map(h => {
                  const g = _gradeFor(h.percent);
                  return `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0.5rem;
                      background:var(--color-bg-raised); border-radius:var(--radius-sm);">
                      <div>
                        <span style="font-family:var(--font-mono); font-size:var(--text-xs); color:${g.color}; font-weight:700;">${g.grade}</span>
                        <span style="font-size:var(--text-xs); color:var(--color-text-secondary); margin-left:0.4rem;">${h.percent}% — ${h.correct}/${h.total}</span>
                      </div>
                      <span style="font-size:var(--text-xs); color:var(--color-text-muted); font-family:var(--font-mono);">${_formatDate(h.date)}</span>
                    </div>
                  `;
                }).join('')}
              </div>
              <div style="margin-top:0.75rem; text-align:right;">
                <button class="btn btn-ghost" id="exam-clear-history" style="font-size:var(--text-xs); padding:0.2rem 0.5rem; color:var(--color-error); border-color:var(--color-error)44;">Clear History</button>
              </div>
            `}
          </div>

          <!-- Exam info -->
          <div class="card" style="margin-top:1rem;">
            <div class="text-mono text-xs text-muted" style="margin-bottom:0.6rem; text-transform:uppercase;">Exam Rules</div>
            ${[
              ['Pass mark',         '70% or higher'],
              ['Explanations',      'Shown only in review after exam'],
              ['Navigation',        'One question at a time, no going back'],
              ['Unanswered',        'Counted as incorrect'],
              ['Timer warning',     'Yellow at 5 min, red at 2 min remaining'],
            ].map(([k, v]) => `
              <div style="display:flex; justify-content:space-between; padding:3px 0; border-bottom:1px solid var(--color-border); font-size:var(--text-xs);">
                <span style="color:var(--color-text-muted);">${k}</span>
                <span style="color:var(--color-text-secondary); font-family:var(--font-mono);">${v}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this._updateConfigSummary();
    this._bindConfigControls();
  }

  _updateConfigSummary() {
    const el = this.container.querySelector('#exam-summary');
    if (!el) return;
    const available = QUESTIONS.filter(q => this._cfg.topics.includes(q.topic)).length;
    const actual    = Math.min(this._cfg.count, available);
    const timeLabel = this._cfg.timeSecs === 0
      ? 'untimed'
      : TIME_OPTIONS.find(t => t.seconds === this._cfg.timeSecs)?.label;

    el.innerHTML = `
      <span style="color:var(--color-cyan); font-family:var(--font-mono); font-weight:700;">${actual}</span>
      <span style="color:var(--color-text-muted);"> questions from </span>
      <span style="color:var(--color-amber); font-family:var(--font-mono);">${this._cfg.topics.length}</span>
      <span style="color:var(--color-text-muted);"> topics — </span>
      <span style="color:var(--color-text-secondary); font-family:var(--font-mono);">${timeLabel}</span>
    `;
  }

  _bindConfigControls() {
    // Topic toggles
    this.container.querySelectorAll('.exam-topic-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const topic = btn.getAttribute('data-topic');
        const idx   = this._cfg.topics.indexOf(topic);
        if (idx === -1) this._cfg.topics.push(topic);
        else            this._cfg.topics.splice(idx, 1);
        btn.className = `exam-topic-btn btn ${this._cfg.topics.includes(topic) ? 'btn-primary' : 'btn-ghost'}`;
        btn.style.fontSize = 'var(--text-xs)'; btn.style.padding = '0.3rem 0.65rem';
        this._updateConfigSummary();
        this._saveConfig();
      });
    });

    this.container.querySelector('#exam-select-all')?.addEventListener('click', () => {
      this._cfg.topics = Object.values(TOPICS);
      this._renderConfig();
    });

    this.container.querySelector('#exam-select-none')?.addEventListener('click', () => {
      this._cfg.topics = [];
      this._renderConfig();
    });

    // Count buttons
    this.container.querySelectorAll('.exam-count-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._cfg.count = parseInt(btn.getAttribute('data-count'), 10);
        this.container.querySelectorAll('.exam-count-btn').forEach(b => {
          const n = parseInt(b.getAttribute('data-count'), 10);
          b.className = `exam-count-btn btn ${this._cfg.count === n ? 'btn-primary' : 'btn-ghost'}`;
          b.style.fontSize = 'var(--text-sm)'; b.style.padding = '0.35rem 0.9rem'; b.style.fontFamily = 'var(--font-mono)';
        });
        this._updateConfigSummary();
        this._saveConfig();
      });
    });

    // Time buttons
    this.container.querySelectorAll('.exam-time-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._cfg.timeSecs = parseInt(btn.getAttribute('data-seconds'), 10);
        this.container.querySelectorAll('.exam-time-btn').forEach(b => {
          const s = parseInt(b.getAttribute('data-seconds'), 10);
          b.className = `exam-time-btn btn ${this._cfg.timeSecs === s ? 'btn-primary' : 'btn-ghost'}`;
          b.style.fontSize = 'var(--text-xs)'; b.style.padding = '0.3rem 0.75rem';
        });
        this._updateConfigSummary();
        this._saveConfig();
      });
    });

    // Start
    this.container.querySelector('#exam-start-btn')?.addEventListener('click', () => {
      this._startExam();
    });

    // Clear history
    this.container.querySelector('#exam-clear-history')?.addEventListener('click', () => {
      stateManager.setState('examHistory', []);
      this._renderConfig();
    });
  }

  // ── Exam screen ───────────────────────────────────────────────────

  _startExam() {
    const errEl = this.container.querySelector('#exam-config-error');
    if (this._cfg.topics.length === 0) {
      if (errEl) errEl.textContent = 'Select at least one topic before starting.';
      return;
    }
    const pool = QUESTIONS.filter(q => this._cfg.topics.includes(q.topic));
    if (pool.length === 0) {
      if (errEl) errEl.textContent = 'No questions available for the selected topics.';
      return;
    }

    const questions = getRandomQuestions(this._cfg.count, this._cfg.topics);

    this._session = {
      questions,
      answered:         new Map(),
      startedAt:        Date.now(),
      finishedAt:       null,
      timeLimitSeconds: this._cfg.timeSecs,
      timeUsedSeconds:  0,
    };

    this._screen = 'exam';
    this._renderExam();
  }

  _renderExam() {
    const qs    = this._session.questions;
    const hasTL = this._session.timeLimitSeconds > 0;

    this.container.innerHTML = `
      <div class="exam-chrome">

        <!-- Top bar: title + timer -->
        <div style="
          display:flex; justify-content:space-between; align-items:center;
          padding:0.75rem 1rem;
          background:var(--color-bg-panel);
          border:1px solid var(--color-border);
          border-radius:var(--radius-md);
          margin-bottom:1rem;
          flex-wrap:wrap; gap:0.5rem;
        ">
          <div>
            <span style="font-family:var(--font-display); font-size:var(--text-md); font-weight:700; color:var(--color-text-primary);">
              CCNA Practice Exam
            </span>
            <span style="font-size:var(--text-xs); color:var(--color-text-muted); font-family:var(--font-mono); margin-left:0.75rem;">
              ${qs.length} questions
            </span>
          </div>
          <div style="display:flex; align-items:center; gap:1rem;">
            ${hasTL ? `<div id="exam-timer-mount"></div>` : `
              <span style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-text-muted);">No time limit</span>
            `}
            <button class="btn btn-ghost" id="exam-abandon-btn"
              style="font-size:var(--text-xs); padding:0.25rem 0.6rem; color:var(--color-error); border-color:var(--color-error)44;">
              Abandon
            </button>
          </div>
        </div>

        <!-- Progress dots -->
        <div style="
          display:flex; gap:3px; flex-wrap:wrap;
          padding:0.5rem 0.75rem; margin-bottom:1rem;
          background:var(--color-bg-medium);
          border-radius:var(--radius-md);
          border:1px solid var(--color-border);
        " id="exam-progress-dots">
          ${qs.map((q, i) => `
            <div class="exam-dot" id="exam-dot-${i}"
              title="Q${i+1}: ${escapeHtml(q.topic)}"
              style="
                width:14px; height:14px; border-radius:3px;
                background:var(--color-bg-raised); border:1px solid var(--color-border);
                transition:all 0.2s ease; cursor:default;
                flex-shrink:0;
              ">
            </div>
          `).join('')}
        </div>

        <!-- Quiz engine mount -->
        <div id="exam-quiz-mount"></div>

      </div>
    `;

    // Mount timer
    if (hasTL) {
      this._timer = createTimer();
      const timerMount = this.container.querySelector('#exam-timer-mount');
      this._timer.render(timerMount);
      this._timer.startCountdown(
        this._session.timeLimitSeconds,
        300   // warning at 5 min
      );

      // On expiry: auto-finish
      this._timer.on('expired', () => {
        this._finishExam(true);
      });
    }

    // Mount quiz engine
    const quizMount = this.container.querySelector('#exam-quiz-mount');
    this._quiz = createQuizEngine();
    this._quiz.init({
      containerEl:      quizMount,
      questions:        this._session.questions,
      shuffle:          false,   // already shuffled by getRandomQuestions
      shuffleOptions:   true,
      showExplanation:  false,   // exam mode — no hints
      showProgress:     true,
      mode:             'exam',
      onAnswer: ({ question, correct }) => {
        this._session.answered.set(question.id, { correct });
        this._markDot(this._session.answered.size - 1, correct);
      },
      onComplete: (result) => {
        this._finishExam(false, result);
      },
    });

    this.container.querySelector('#exam-abandon-btn')?.addEventListener('click', () => {
      if (confirm('Abandon this exam? Your progress will be lost.')) {
        this._teardown();
        this._renderConfig();
      }
    });
  }

  _markDot(index, correct) {
    const dot = this.container.querySelector(`#exam-dot-${index}`);
    if (!dot) return;
    dot.style.background = correct ? 'var(--color-success)' : 'var(--color-error)';
    dot.style.borderColor = correct ? 'var(--color-success)' : 'var(--color-error)';
  }

  // ── Results screen ────────────────────────────────────────────────

  _finishExam(timedOut = false, quizResult = null) {
    const timeUsed = this._timer ? this._timer.getElapsed() : 0;
    if (this._timer) { this._timer.stop(); this._timer.destroy(); this._timer = null; }

    this._session.finishedAt      = Date.now();
    this._session.timeUsedSeconds = timeUsed;

    // Count answers from session map (timer expiry: unanswered = wrong)
    const total   = this._session.questions.length;
    const correct = [...this._session.answered.values()].filter(a => a.correct).length;
    const percent = Math.round((correct / total) * 100);
    const passed  = percent >= PASS_PERCENT;
    const grade   = _gradeFor(percent);

    // Per-topic breakdown
    const topicStats = {};
    for (const q of this._session.questions) {
      if (!topicStats[q.topic]) topicStats[q.topic] = { correct: 0, total: 0 };
      topicStats[q.topic].total++;
      const ans = this._session.answered.get(q.id);
      if (ans?.correct) topicStats[q.topic].correct++;
    }

    // Persist to history
    const histEntry = {
      date:    Date.now(),
      correct,
      total,
      percent,
      grade:   grade.grade,
      topics:  this._cfg.topics,
      timeSecs: timeUsed,
    };
    const history = stateManager.getState('examHistory') || [];
    history.push(histEntry);
    stateManager.setState('examHistory', history);

    // Update progress
    stateManager.mergeState('userProgress', {
      completedModules: [...new Set([
        ...(stateManager.getState('userProgress').completedModules || []),
        '/exam',
      ])],
      bestExamScore: Math.max(
        stateManager.getState('userProgress').bestExamScore || 0,
        percent
      ),
    });

    this._screen = 'results';
    this._renderResults({ correct, total, percent, passed, grade, topicStats, timeUsed, timedOut });
  }

  _renderResults({ correct, total, percent, passed, grade, topicStats, timeUsed, timedOut }) {
    const mins = Math.floor(timeUsed / 60);
    const secs = timeUsed % 60;
    const timeStr = this._session.timeLimitSeconds > 0
      ? `${mins}m ${secs}s`
      : 'Untimed';

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <span>Exam Mode</span>
        </div>
        <h1 class="module-header__title">Exam Results</h1>
      </div>

      <!-- Hero score block -->
      <div style="
        display:flex; align-items:center; gap:1.5rem; flex-wrap:wrap;
        padding:1.5rem; margin-bottom:1.5rem;
        background:var(--color-bg-panel);
        border:2px solid ${grade.color}44;
        border-radius:var(--radius-lg);
      ">
        <!-- Big score -->
        <div style="text-align:center; min-width:120px;">
          <div style="font-family:var(--font-display); font-size:4.5rem; font-weight:900; color:${grade.color}; line-height:1;">
            ${percent}%
          </div>
          <div style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--color-text-muted); margin-top:0.2rem;">
            ${correct} / ${total} correct
          </div>
        </div>

        <!-- Grade badge + verdict -->
        <div style="flex:1; min-width:200px;">
          <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem; flex-wrap:wrap;">
            <div style="
              font-family:var(--font-display); font-size:2rem; font-weight:900;
              width:56px; height:56px; border-radius:var(--radius-md);
              background:${grade.color}22; border:2px solid ${grade.color};
              display:flex; align-items:center; justify-content:center;
              color:${grade.color};
            ">${grade.grade}</div>
            <div>
              <div style="font-family:var(--font-display); font-size:1.3rem; font-weight:700; color:${grade.color};">
                ${passed ? '✓ PASSED' : '✕ NOT PASSED'}
              </div>
              <div style="font-size:var(--text-xs); color:var(--color-text-muted);">
                ${grade.label} — pass mark is ${PASS_PERCENT}%
              </div>
            </div>
          </div>

          <div style="display:flex; gap:1rem; flex-wrap:wrap; font-family:var(--font-mono); font-size:var(--text-xs);">
            <span style="color:var(--color-text-muted);">Time used: <span style="color:var(--color-cyan);">${timeStr}</span></span>
            <span style="color:var(--color-text-muted);">Questions: <span style="color:var(--color-amber);">${total}</span></span>
            ${timedOut ? `<span style="color:var(--color-error);">⏱ Timed out</span>` : ''}
          </div>
        </div>

        <!-- Score bar -->
        <div style="flex:1; min-width:180px;">
          <div style="height:12px; background:var(--color-bg-raised); border-radius:99px; overflow:hidden; position:relative;">
            <div style="
              height:100%; width:${percent}%;
              background:linear-gradient(90deg, ${grade.color}88, ${grade.color});
              border-radius:99px;
              transition:width 0.8s ease;
            "></div>
            <!-- Pass mark line -->
            <div style="
              position:absolute; top:0; left:${PASS_PERCENT}%;
              width:2px; height:100%; background:var(--color-text-muted);
            " title="Pass mark: ${PASS_PERCENT}%"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-family:var(--font-mono); font-size:9px; color:var(--color-text-muted); margin-top:0.25rem;">
            <span>0%</span>
            <span style="margin-left:calc(${PASS_PERCENT}% - 16px);">Pass</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      <div class="layout-main-sidebar" style="align-items:flex-start; margin-bottom:1.5rem;">

        <!-- Per-topic breakdown -->
        <div>
          <div class="card">
            <div class="text-mono text-xs text-muted" style="margin-bottom:0.75rem; text-transform:uppercase;">Topic Breakdown</div>
            ${Object.entries(topicStats).map(([topic, stats]) => {
              const pct    = Math.round((stats.correct / stats.total) * 100);
              const tGrade = _gradeFor(pct);
              return `
                <div style="margin-bottom:0.75rem;">
                  <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.3rem;">
                    <span style="font-size:var(--text-xs); color:var(--color-text-secondary);">${escapeHtml(topic)}</span>
                    <span style="font-family:var(--font-mono); font-size:var(--text-xs); color:${tGrade.color}; font-weight:700;">
                      ${stats.correct}/${stats.total} — ${pct}%
                    </span>
                  </div>
                  <div style="height:6px; background:var(--color-bg-raised); border-radius:99px; overflow:hidden;">
                    <div style="height:100%; width:${pct}%; background:${tGrade.color}; border-radius:99px; transition:width 0.5s ease;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Recommendations + actions -->
        <div>
          <!-- Weakest topics -->
          <div class="info-panel" style="margin-bottom:1rem;">
            <div class="info-panel__title">💡 Focus Areas</div>
            ${(() => {
              const weak = Object.entries(topicStats)
                .map(([t, s]) => ({ topic: t, pct: Math.round(s.correct/s.total*100) }))
                .sort((a,b) => a.pct - b.pct)
                .slice(0, 3);
              return weak.map(w => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:0.3rem 0; border-bottom:1px solid var(--color-border);">
                  <span style="font-size:var(--text-xs); color:var(--color-text-secondary);">${escapeHtml(w.topic)}</span>
                  <span style="font-family:var(--font-mono); font-size:var(--text-xs); color:${_gradeFor(w.pct).color};">${w.pct}%</span>
                </div>
              `).join('');
            })()}
          </div>

          <!-- Action buttons -->
          <div style="display:flex; flex-direction:column; gap:0.5rem;">
            <button class="btn btn-primary" id="exam-review-btn"
              style="font-size:var(--text-sm); padding:0.55rem 1rem; justify-content:flex-start; gap:0.5rem;">
              🔍 Review All Answers
            </button>
            <button class="btn btn-secondary" id="exam-retake-btn"
              style="font-size:var(--text-sm); padding:0.55rem 1rem; justify-content:flex-start; gap:0.5rem;">
              ↺ Retake Same Config
            </button>
            <button class="btn btn-ghost" id="exam-new-btn"
              style="font-size:var(--text-sm); padding:0.55rem 1rem; justify-content:flex-start; gap:0.5rem;">
              ⚙ New Exam Config
            </button>
          </div>
        </div>
      </div>
    `;

    if (passed) showToast(`✓ Passed with ${percent}% — well done!`, 'success', 4000);
    else        showToast(`${percent}% — ${PASS_PERCENT - percent}% away from passing.`, 'error', 4000);

    this.container.querySelector('#exam-review-btn')?.addEventListener('click', () => {
      this._reviewIndex = 0;
      this._renderReview();
    });

    this.container.querySelector('#exam-retake-btn')?.addEventListener('click', () => {
      this._startExam();
    });

    this.container.querySelector('#exam-new-btn')?.addEventListener('click', () => {
      this._renderConfig();
    });
  }

  // ── Review screen ─────────────────────────────────────────────────

  _renderReview() {
    this._screen = 'review';
    const total = this._session.questions.length;

    this.container.innerHTML = `
      <div class="module-header">
        <div class="module-header__breadcrumb">
          <a href="#/">Home</a> › <a href="#/exam">Exam</a> › <span>Review</span>
        </div>
        <h1 class="module-header__title">Answer Review</h1>
        <p class="module-header__description">
          Review every question with the correct answer highlighted and a
          full explanation of the reasoning.
        </p>
      </div>

      <!-- Review navigation -->
      <div style="
        display:flex; gap:3px; flex-wrap:wrap; padding:0.6rem 0.75rem;
        margin-bottom:1rem; background:var(--color-bg-medium);
        border-radius:var(--radius-md); border:1px solid var(--color-border);
      ">
        ${this._session.questions.map((q, i) => {
          const ans   = this._session.answered.get(q.id);
          const color = !ans ? 'var(--color-text-muted)' : ans.correct ? 'var(--color-success)' : 'var(--color-error)';
          const bg    = !ans ? 'var(--color-bg-raised)'  : ans.correct ? 'rgba(0,230,118,0.18)' : 'rgba(255,68,68,0.18)';
          return `
            <button class="review-nav-btn"
              data-index="${i}"
              style="
                width:28px; height:28px; border-radius:4px; flex-shrink:0;
                background:${i === this._reviewIndex ? 'var(--color-cyan)' : bg};
                border:1px solid ${i === this._reviewIndex ? 'var(--color-cyan)' : color};
                color:${i === this._reviewIndex ? 'var(--color-bg-deepest)' : color};
                font-family:var(--font-mono); font-size:10px; font-weight:700;
                cursor:pointer; transition:all 0.15s ease;
              ">
              ${i + 1}
            </button>
          `;
        }).join('')}
      </div>

      <!-- Question card -->
      <div id="review-question-card"></div>

      <!-- Nav controls -->
      <div class="control-bar" style="margin-top:1rem; justify-content:space-between;">
        <button class="btn btn-ghost" id="review-prev-btn" ${this._reviewIndex === 0 ? 'disabled' : ''}>
          ← Previous
        </button>
        <span class="text-mono text-xs text-muted">
          ${this._reviewIndex + 1} of ${total}
        </span>
        <button class="btn ${this._reviewIndex === total - 1 ? 'btn-primary' : 'btn-ghost'}" id="review-next-btn">
          ${this._reviewIndex === total - 1 ? '← Back to Results' : 'Next →'}
        </button>
      </div>
    `;

    this._renderReviewQuestion();
    this._bindReviewControls();
  }

  _renderReviewQuestion() {
    const q      = this._session.questions[this._reviewIndex];
    const ans    = this._session.answered.get(q.id);
    const mount  = this.container.querySelector('#review-question-card');
    if (!mount) return;

    const diffColors = { easy: 'var(--color-success)', medium: 'var(--color-warning)', hard: 'var(--color-error)' };

    mount.innerHTML = `
      <div class="card" style="
        border-left:4px solid ${ans ? (ans.correct ? 'var(--color-success)' : 'var(--color-error)') : 'var(--color-text-muted)'};
        animation:fadeInUp 0.25s ease;
      ">
        <!-- Header row -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
            <span class="badge badge-cyan">${escapeHtml(q.topic)}</span>
            <span class="badge" style="background:${diffColors[q.difficulty]}22; color:${diffColors[q.difficulty]}; border-color:${diffColors[q.difficulty]}66;">
              ${q.difficulty}
            </span>
          </div>
          <span style="font-family:var(--font-mono); font-size:var(--text-xs); color:${ans ? (ans.correct ? 'var(--color-success)' : 'var(--color-error)') : 'var(--color-text-muted)'}; font-weight:700;">
            ${ans ? (ans.correct ? '✓ Correct' : '✕ Incorrect') : '— Unanswered'}
          </span>
        </div>

        <!-- Question text -->
        <p style="font-size:var(--text-md); font-weight:700; color:var(--color-text-primary); margin-bottom:1.25rem; line-height:1.6;">
          ${escapeHtml(q.question)}
        </p>

        <!-- Options -->
        <div style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1.25rem;">
          ${q.options.map((opt, i) => {
            const isCorrect  = i === q.correctIndex;
            let bg = 'var(--color-bg-raised)';
            let border = 'var(--color-border)';
            let color = 'var(--color-text-secondary)';
            let icon = '';

            if (isCorrect) {
              bg = 'rgba(0,230,118,0.10)';
              border = 'var(--color-success)';
              color = 'var(--color-success)';
              icon = '✓ ';
            }

            return `
              <div style="
                padding:0.65rem 0.85rem; border-radius:var(--radius-md);
                background:${bg}; border:1px solid ${border}; color:${color};
                font-size:var(--text-sm); transition:all 0.15s ease;
                display:flex; align-items:baseline; gap:0.4rem;
              ">
                <span style="font-family:var(--font-mono); font-size:var(--text-xs); opacity:0.7; flex-shrink:0;">
                  ${String.fromCharCode(65 + i)}.
                </span>
                <span>${escapeHtml(opt)}</span>
                ${icon ? `<span style="margin-left:auto; font-weight:700;">${icon}</span>` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- Explanation -->
        <div style="
          padding:0.85rem 1rem;
          background:rgba(0,212,255,0.06);
          border-left:3px solid var(--color-cyan);
          border-radius:var(--radius-md);
        ">
          <div style="font-size:var(--text-xs); font-weight:700; color:var(--color-cyan); font-family:var(--font-mono); margin-bottom:0.4rem; text-transform:uppercase; letter-spacing:0.06em;">
            Explanation
          </div>
          <p style="font-size:var(--text-sm); color:var(--color-text-secondary); line-height:1.8; margin:0;">
            ${escapeHtml(q.explanation)}
          </p>
        </div>
      </div>
    `;
  }

  _bindReviewControls() {
    const total = this._session.questions.length;

    this.container.querySelector('#review-prev-btn')?.addEventListener('click', () => {
      if (this._reviewIndex > 0) {
        this._reviewIndex--;
        this._renderReview();
      }
    });

    this.container.querySelector('#review-next-btn')?.addEventListener('click', () => {
      if (this._reviewIndex === total - 1) {
        // Back to results
        const correct  = [...this._session.answered.values()].filter(a => a.correct).length;
        const percent  = Math.round((correct / total) * 100);
        const passed   = percent >= PASS_PERCENT;
        const grade    = _gradeFor(percent);
        const topicStats = {};
        for (const q of this._session.questions) {
          if (!topicStats[q.topic]) topicStats[q.topic] = { correct: 0, total: 0 };
          topicStats[q.topic].total++;
          const a = this._session.answered.get(q.id);
          if (a?.correct) topicStats[q.topic].correct++;
        }
        this._renderResults({
          correct, total, percent, passed, grade, topicStats,
          timeUsed: this._session.timeUsedSeconds,
          timedOut: false,
        });
      } else {
        this._reviewIndex++;
        this._renderReview();
      }
    });

    // Number nav buttons
    this.container.querySelectorAll('.review-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._reviewIndex = parseInt(btn.getAttribute('data-index'), 10);
        this._renderReview();
      });
    });
  }

  // ── Persistence helpers ────────────────────────────────────────────

  _saveConfig() {
    stateManager.setState('examConfig', {
      topics:   this._cfg.topics,
      count:    this._cfg.count,
      timeSecs: this._cfg.timeSecs,
    });
  }

  _restoreConfig() {
    const saved = stateManager.getState('examConfig');
    if (!saved) return;
    if (Array.isArray(saved.topics) && saved.topics.length) this._cfg.topics   = saved.topics;
    if (typeof saved.count === 'number')                     this._cfg.count    = saved.count;
    if (typeof saved.timeSecs === 'number')                  this._cfg.timeSecs = saved.timeSecs;
  }
}

// ── Module-level pure helpers ─────────────────────────────────────────

function _gradeFor(percent) {
  for (const g of GRADE_TABLE) {
    if (percent >= g.min) return g;
  }
  return GRADE_TABLE[GRADE_TABLE.length - 1];
}

function _formatDate(timestamp) {
  const d = new Date(timestamp);
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
}

export default new ExamModeEngine();
