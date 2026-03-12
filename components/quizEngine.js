/**
 * quizEngine.js — Question Renderer and Answer Validator
 *
 * Responsibility:
 *   Renders multiple-choice questions from data objects.
 *   Validates answers, tracks score, shows explanations.
 *   Used by: examModeEngine (full exam), and inline module quizzes.
 *
 * Events emitted:
 *   quiz:answer-submitted  — { questionId, selectedIndex, correct, score }
 *   quiz:complete          — { score, total, percent, timeTaken }
 *   quiz:question-changed  — { index, question }
 *
 * Question schema:
 *   { id, topic, question, options: string[], correctIndex: number,
 *     explanation: string, difficulty: 'easy'|'medium'|'hard' }
 *
 * Depends on: eventBus.js, helperFunctions.js
 */

import { eventBus }  from '../js/eventBus.js';
import { shuffle, escapeHtml } from '../utils/helperFunctions.js';

// Difficulty color map
const DIFFICULTY_COLOR = {
  easy:   'var(--color-success)',
  medium: 'var(--color-warning)',
  hard:   'var(--color-error)',
};

class QuizEngine {
  constructor() {
    this._container       = null;
    this._questions       = [];
    this._shuffledOptions = []; // per-question shuffled option index maps
    this._currentIndex    = 0;
    this._answers         = []; // [{ questionId, selectedIndex, correct }]
    this._answered        = false; // true after current question answered
    this._startTime       = null;
    this._config          = {};
  }

  /**
   * Initialize the quiz engine.
   *
   * @param {Object} config
   * @param {HTMLElement}  config.containerEl
   * @param {Array}        config.questions       — Array of question objects
   * @param {boolean}      [config.shuffle=false] — Shuffle question order
   * @param {boolean}      [config.shuffleOptions=false] — Shuffle answer options
   * @param {boolean}      [config.showExplanation=true] — Show explanation after answer
   * @param {boolean}      [config.showProgress=true]    — Show Q n of N indicator
   * @param {Function}     [config.onComplete]           — Called with final results
   * @param {Function}     [config.onAnswer]             — Called on each answer
   * @param {'exam'|'practice'} [config.mode='practice']
   */
  init(config) {
    this._config    = config;
    this._container = config.containerEl;
    this._answers   = [];
    this._startTime = Date.now();

    // Clone questions to avoid mutating source data
    let questions = [...config.questions];
    if (config.shuffle) questions = shuffle(questions);
    this._questions = questions;

    // Pre-compute shuffled option maps if enabled
    this._shuffledOptions = this._questions.map(q => {
      if (!config.shuffleOptions) {
        return q.options.map((_, i) => i); // identity map
      }
      // Shuffle option indices, track which original index maps to which display index
      const indices = q.options.map((_, i) => i);
      const shuffled = shuffle(indices);
      return shuffled;
    });

    this._currentIndex = 0;
    this._answered     = false;

    this._render();
  }

  /**
   * Advance to a specific question index.
   * @param {number} index
   */
  goToQuestion(index) {
    if (index < 0 || index >= this._questions.length) return;
    this._currentIndex = index;
    this._answered     = !!this._answers[index];
    this._render();
    eventBus.emit('quiz:question-changed', { index, question: this._questions[index] });
  }

  /**
   * Advance to next question.
   */
  nextQuestion() {
    if (this._currentIndex < this._questions.length - 1) {
      this.goToQuestion(this._currentIndex + 1);
    } else {
      this._finalize();
    }
  }

  /**
   * Get current score.
   * @returns {{ correct: number, total: number, percent: number }}
   */
  getScore() {
    const correct = this._answers.filter(a => a.correct).length;
    const total   = this._questions.length;
    return { correct, total, percent: total ? Math.round((correct / total) * 100) : 0 };
  }

  /**
   * Reset quiz to initial state.
   */
  reset() {
    this._answers      = [];
    this._currentIndex = 0;
    this._answered     = false;
    this._startTime    = Date.now();
    this._render();
  }

  /**
   * Submit an answer for the current question.
   * @param {number} displayOptionIndex — Index of the clicked option (0-based, display order)
   */
  submitAnswer(displayOptionIndex) {
    if (this._answered) return; // already answered

    const q           = this._questions[this._currentIndex];
    const optionMap   = this._shuffledOptions[this._currentIndex];
    const originalIdx = optionMap[displayOptionIndex];
    const correct     = originalIdx === q.correctIndex;

    this._answered = true;

    // Record answer
    const record = {
      questionId:    q.id,
      selectedIndex: originalIdx,
      displayIndex:  displayOptionIndex,
      correct,
    };
    this._answers[this._currentIndex] = record;

    // Update UI to show correct/incorrect state
    this._showAnswerFeedback(displayOptionIndex, optionMap.indexOf(q.correctIndex), correct);

    // Show explanation if configured
    if (this._config.showExplanation !== false) {
      this._showExplanation(q.explanation, correct);
    }

    // Emit event
    const score = this.getScore();
    eventBus.emit('quiz:answer-submitted', {
      questionId:    q.id,
      selectedIndex: originalIdx,
      correct,
      score,
    });

    if (typeof this._config.onAnswer === 'function') {
      this._config.onAnswer({ question: q, correct, score });
    }
  }

  /**
   * Render the entire quiz widget.
   */
  destroy() {
    this._container = null;
    this._questions = [];
  }

  // ─── Private ────────────────────────────────

  _render() {
    if (!this._container || this._questions.length === 0) return;

    const q          = this._questions[this._currentIndex];
    const optionMap  = this._shuffledOptions[this._currentIndex];
    const answered   = this._answers[this._currentIndex];
    const showProgress = this._config.showProgress !== false;

    this._container.innerHTML = `
      <div class="quiz-root">
        ${showProgress ? this._renderProgress() : ''}
        <div class="quiz-question-card">
          ${this._renderQuestionHeader(q)}
          <p class="quiz-question-text">${escapeHtml(q.question)}</p>
          <div class="quiz-options" id="quiz-options">
            ${optionMap.map((origIdx, dispIdx) =>
              this._renderOption(q.options[origIdx], dispIdx, answered, optionMap.indexOf(q.correctIndex))
            ).join('')}
          </div>
          ${answered ? this._renderExplanationArea(q.explanation, answered.correct) : ''}
          ${answered ? this._renderNextButton() : ''}
        </div>
      </div>
    `;

    this._bindOptionEvents();
    this._injectStyles();
  }

  _renderProgress() {
    const total   = this._questions.length;
    const current = this._currentIndex + 1;
    const score   = this.getScore();
    const pct     = Math.round((current / total) * 100);

    return `
      <div class="quiz-progress">
        <div class="quiz-progress__text">
          <span class="text-mono text-sm">Question ${current} of ${total}</span>
          <span class="text-mono text-sm" style="color:var(--color-success)">
            ✓ ${score.correct} correct
          </span>
        </div>
        <div class="quiz-progress__bar-wrap">
          <div class="quiz-progress__bar" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }

  _renderQuestionHeader(q) {
    const diffColor = DIFFICULTY_COLOR[q.difficulty] || 'var(--color-text-muted)';
    return `
      <div class="quiz-question-header">
        <span class="badge badge-cyan">${escapeHtml(q.topic || 'General')}</span>
        <span class="quiz-difficulty" style="color:${diffColor}; font-family:var(--font-mono); font-size:var(--text-xs);">
          ${q.difficulty ? q.difficulty.toUpperCase() : ''}
        </span>
      </div>
    `;
  }

  _renderOption(optionText, displayIndex, answeredRecord, correctDisplayIndex) {
    let stateClass = '';
    if (answeredRecord) {
      if (displayIndex === correctDisplayIndex) {
        stateClass = 'is-correct';
      } else if (displayIndex === answeredRecord.displayIndex) {
        stateClass = 'is-incorrect';
      } else {
        stateClass = 'is-disabled';
      }
    }

    const letter = String.fromCharCode(65 + displayIndex); // A, B, C, D

    return `
      <div
        class="answer-option ${stateClass}"
        data-display-index="${displayIndex}"
        role="radio"
        aria-checked="${answeredRecord ? String(displayIndex === answeredRecord.displayIndex) : 'false'}"
        tabindex="${answeredRecord ? '-1' : '0'}"
      >
        <span class="answer-option__letter">${letter}</span>
        <span class="answer-option__text">${escapeHtml(optionText)}</span>
        ${stateClass === 'is-correct'   ? '<span class="answer-option__icon">✓</span>' : ''}
        ${stateClass === 'is-incorrect' ? '<span class="answer-option__icon">✕</span>' : ''}
      </div>
    `;
  }

  _renderExplanationArea(explanation, correct) {
    const color  = correct ? 'var(--color-success)' : 'var(--color-error)';
    const icon   = correct ? '✓' : '✕';
    const result = correct ? 'Correct!' : 'Incorrect';
    return `
      <div class="quiz-explanation anim-fade-in-up" id="quiz-explanation">
        <div class="quiz-explanation__header" style="color:${color};">
          <span>${icon} ${result}</span>
        </div>
        <p class="quiz-explanation__text">${escapeHtml(explanation)}</p>
      </div>
    `;
  }

  _renderNextButton() {
    const isLast = this._currentIndex >= this._questions.length - 1;
    return `
      <div style="display:flex; justify-content:flex-end; margin-top:1rem;">
        <button class="btn btn-primary" id="quiz-next-btn">
          ${isLast ? '📊 View Results' : 'Next Question →'}
        </button>
      </div>
    `;
  }

  _showAnswerFeedback(selectedDisplay, correctDisplay, correct) {
    const options = this._container.querySelectorAll('.answer-option');
    options.forEach((el, i) => {
      el.classList.add('is-disabled');
      if (i === correctDisplay)  el.classList.add('is-correct');
      if (i === selectedDisplay && !correct) el.classList.add('is-incorrect');
    });
  }

  _showExplanation(explanation, correct) {
    // Explanation is already rendered in the re-render — nothing to do here
    // This hook is available for animation triggers in subclasses
  }

  _bindOptionEvents() {
    const options = this._container.querySelectorAll('.answer-option:not(.is-disabled)');
    options.forEach(el => {
      el.addEventListener('click', () => {
        const displayIndex = parseInt(el.getAttribute('data-display-index'), 10);
        this.submitAnswer(displayIndex);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const displayIndex = parseInt(el.getAttribute('data-display-index'), 10);
          this.submitAnswer(displayIndex);
        }
      });
    });

    const nextBtn = this._container.querySelector('#quiz-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextQuestion());
    }
  }

  _finalize() {
    const score     = this.getScore();
    const timeTaken = Math.round((Date.now() - this._startTime) / 1000);
    const result    = { ...score, timeTaken, answers: this._answers };

    eventBus.emit('quiz:complete', result);

    if (typeof this._config.onComplete === 'function') {
      this._config.onComplete(result);
    }

    this._renderResults(result);
  }

  _renderResults(result) {
    const { correct, total, percent, timeTaken } = result;
    const grade   = percent >= 80 ? 'PASS' : 'FAIL';
    const color   = percent >= 80 ? 'var(--color-success)' : 'var(--color-error)';
    const message = percent >= 80
      ? 'Excellent work! You have a solid understanding.'
      : 'Keep studying — review the topics you missed.';

    this._container.innerHTML = `
      <div class="quiz-results anim-fade-in-up">
        <div class="quiz-results__score">
          <div class="score-display">${percent}<span style="font-size:1.5rem;">%</span></div>
          <div class="quiz-results__grade" style="color:${color}; font-family:var(--font-display); font-size:1.25rem; font-weight:800;">
            ${grade}
          </div>
        </div>
        <div class="quiz-results__stats">
          <div class="quiz-results__stat">
            <span class="text-mono text-xs text-muted">CORRECT</span>
            <span style="color:var(--color-success); font-weight:700; font-family:var(--font-mono);">${correct}/${total}</span>
          </div>
          <div class="quiz-results__stat">
            <span class="text-mono text-xs text-muted">TIME</span>
            <span style="font-weight:700; font-family:var(--font-mono);">${Math.floor(timeTaken/60)}:${String(timeTaken%60).padStart(2,'0')}</span>
          </div>
        </div>
        <p style="color:var(--color-text-secondary); margin:1rem 0;">${message}</p>
        <button class="btn btn-secondary" id="quiz-retry-btn">↺ Try Again</button>
      </div>
    `;

    this._container.querySelector('#quiz-retry-btn')?.addEventListener('click', () => this.reset());
  }

  _injectStyles() {
    if (document.getElementById('quiz-styles')) return;
    const style = document.createElement('style');
    style.id = 'quiz-styles';
    style.textContent = `
      .quiz-root { display:flex; flex-direction:column; gap:1rem; }

      .quiz-progress { margin-bottom:0.5rem; }
      .quiz-progress__text {
        display:flex; justify-content:space-between;
        margin-bottom:0.4rem;
      }
      .quiz-progress__bar-wrap {
        height:4px; background:var(--color-bg-raised);
        border-radius:99px; overflow:hidden;
      }
      .quiz-progress__bar {
        height:100%; background:linear-gradient(90deg,var(--color-cyan),var(--color-amber));
        border-radius:99px; transition:width 0.4s ease;
      }

      .quiz-question-card {
        background:var(--color-bg-panel);
        border:1px solid var(--color-border);
        border-radius:var(--radius-lg);
        padding:1.5rem;
      }
      .quiz-question-header {
        display:flex; justify-content:space-between; align-items:center;
        margin-bottom:1rem;
      }
      .quiz-question-text {
        font-size:var(--text-md);
        color:var(--color-text-primary);
        line-height:1.7;
        margin-bottom:1.25rem;
        font-weight:600;
      }
      .quiz-options { display:flex; flex-direction:column; gap:0.5rem; }

      .answer-option {
        display:flex; align-items:center; gap:0.75rem;
        padding:0.75rem 1rem;
        border:2px solid var(--color-border);
        border-radius:var(--radius-md);
        background:var(--color-bg-raised);
        cursor:pointer;
        transition:all var(--transition-fast);
      }
      .answer-option:hover:not(.is-disabled) {
        border-color:var(--color-cyan);
        background:var(--color-cyan-glow);
      }
      .answer-option.is-selected  { border-color:var(--color-cyan); background:var(--color-cyan-glow); }
      .answer-option.is-correct   { border-color:var(--color-success); background:rgba(0,230,118,0.08); }
      .answer-option.is-incorrect { border-color:var(--color-error);   background:rgba(255,68,68,0.08); }
      .answer-option.is-disabled  { cursor:default; opacity:0.65; }
      .answer-option__letter {
        width:28px; height:28px; border-radius:50%;
        background:var(--color-bg-surface);
        display:flex; align-items:center; justify-content:center;
        font-family:var(--font-mono); font-size:var(--text-xs); font-weight:700;
        flex-shrink:0;
      }
      .answer-option__text { flex:1; font-size:var(--text-sm); line-height:1.5; }
      .answer-option__icon { font-size:1rem; flex-shrink:0; }

      .quiz-explanation {
        margin-top:1rem;
        padding:1rem;
        background:var(--color-bg-medium);
        border-radius:var(--radius-md);
        border-left:3px solid var(--color-cyan);
      }
      .quiz-explanation__header {
        font-family:var(--font-display); font-weight:700;
        margin-bottom:0.4rem; font-size:var(--text-sm);
      }
      .quiz-explanation__text {
        font-size:var(--text-sm); color:var(--color-text-secondary);
        line-height:1.7;
      }

      .quiz-results {
        text-align:center; padding:2rem;
      }
      .quiz-results__score { margin-bottom:1.5rem; }
      .quiz-results__stats {
        display:flex; justify-content:center; gap:2.5rem; margin:1rem 0;
      }
      .quiz-results__stat {
        display:flex; flex-direction:column; align-items:center; gap:0.25rem;
      }
    `;
    document.head.appendChild(style);
  }
}

export function createQuizEngine() { return new QuizEngine(); }
export { QuizEngine };
