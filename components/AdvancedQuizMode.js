/**
 * AdvancedQuizMode.js — Interactive Quiz (Sequential/Linear Version)
 */

import { eventBus } from '../js/eventBus.js';
import { escapeHtml } from '../utils/helperFunctions.js';
import { renderTokenIcon } from '../utils/tokenIcons.js';

const DIFF_META = {
    'easy': { label: 'Easy', color: '#4FC3F7', icon: 'LEARN' },
    'medium': { label: 'Medium', color: '#FFB74D', icon: 'FAST' },
    'hard': { label: 'Hard', color: '#E57373', icon: 'HOT' },
};

function renderIconLabel(token, label, className = 'learning-token-icon') {
    return `${renderTokenIcon(token, className)}<span>${label}</span>`;
}

export class AdvancedQuizMode {
    constructor(containerEl, questions, config) {
        this.container = containerEl;
        this.onClose = config.onClose;
        this.onComplete = config.onComplete;
        
        // Ensure container is visible in case it was hidden previously
        this.container.style.display = 'block';

        this.passingScore = config.passingScore || 80;
        this.targetCount = config.count || 10;
        
        // Slice up to target count
        this.questions = questions.slice(0, this.targetCount);

        this._score = 0;
        this._streak = 0;
        this._bestStreak = 0;
        this._questionIndex = 0;
        this._currentQuestion = null;
        this._selectedAnswer = null;
        this._answered = false;
        this._timerSeconds = 60;
        this._timerInterval = null;
        this._isFinished = false;

        this._totalCorrect = 0;
        this._history = [];
        this._shuffledOptionsMap = {};

        this._pickNextQuestion();
        this._render();
    }

    _pickNextQuestion() {
        if (this._questionIndex >= this.questions.length) {
            this._isFinished = true;
            this._render();
            return;
        }

        this._currentQuestion = this.questions[this._questionIndex];
        this._prepareOptions(this._currentQuestion);
    }
    
    _prepareOptions(q) {
        if (!this._shuffledOptionsMap[q.id]) {
            const indices = q.options.map((_, i) => i);
            this._shuffle(indices);
            this._shuffledOptionsMap[q.id] = indices;
        }
    }

    _render() {
        if (this._isFinished) {
            this._renderResults();
            return;
        }

        // Check if modal structure already exists (for targeted updates)
        const existingModal = this.container.querySelector('.osi-quiz-modal');
        if (existingModal) {
            this._updateQuestion();
            return;
        }

        const q = this._currentQuestion;
        const diff = q.difficulty || 'easy';
        const tm = DIFF_META[diff] || DIFF_META['easy'];
        
        const timerPct = (this._timerSeconds / 60) * 100;
        const timerColor = this._timerSeconds > 20 ? '#4FC3F7' : this._timerSeconds > 10 ? '#FFB74D' : '#EF5350';
        
        const optMap = this._shuffledOptionsMap[q.id];

        this.container.innerHTML = `
      <div class="osi-quiz-overlay" style="
        position:fixed; inset:0; z-index:9999;
        background:rgba(8,13,20,0.95);
        display:flex; align-items:center; justify-content:center;
        animation: fadeIn 250ms ease forwards;
        padding: 0.5rem;
      ">
        <div class="osi-quiz-modal" style="
          width:100%; max-width:720px; max-height:95vh; overflow-y:auto;
          background:linear-gradient(145deg, #111d2e, #0d1520);
          border:1px solid rgba(0,206,209,0.25);
          border-radius:12px;
          padding:1.5rem;
          box-shadow: 0 0 60px rgba(0,206,209,0.08), 0 25px 50px rgba(0,0,0,0.5);
          position:relative;
        ">
          <!-- Top Bar -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <span id="quiz-diff-icon" style="font-size:1.5rem; display:inline-flex; align-items:center;">${renderTokenIcon(tm.icon)}</span>
              <div>
                <div id="quiz-diff-label" style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:${tm.color}; font-weight:700;">Difficulty</div>
                <div id="quiz-diff-level" style="font-size:1rem; font-weight:700; color:var(--color-text-primary); text-transform:capitalize;">${tm.label} Level</div>
              </div>
            </div>
            <button id="quiz-close-btn" style="
              background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
              color:var(--color-text-muted); font-size:1.2rem; width:44px; height:44px;
              border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center;
              transition:all 0.2s;
            ">${renderTokenIcon('X')}</button>
          </div>

          <!-- Stats Row -->
          <div id="quiz-stats-row" style="display:flex; gap:0.75rem; margin-bottom:1.25rem; flex-wrap:wrap;">
            <div style="flex:1; min-width:70px; background:rgba(0,0,0,0.25); border-radius:8px; padding:0.5rem 0.6rem; text-align:center;">
              <div style="font-size:0.6rem; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.1em;">Score</div>
              <div id="quiz-score" style="font-size:1.2rem; font-weight:800; color:#4FC3F7;">${this._score}</div>
            </div>
            <div style="flex:1; min-width:70px; background:rgba(0,0,0,0.25); border-radius:8px; padding:0.5rem 0.6rem; text-align:center;">
              <div style="font-size:0.6rem; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.1em;">Streak</div>
              <div id="quiz-streak" style="font-size:1.2rem; font-weight:800; color:${this._streak >= 3 ? '#FFB74D' : '#81C784'}; display:inline-flex; align-items:center; gap:0.35rem;">${renderIconLabel('HOT', this._streak)}</div>
            </div>
            <div style="flex:1; min-width:70px; background:rgba(0,0,0,0.25); border-radius:8px; padding:0.5rem 0.6rem; text-align:center;">
              <div style="font-size:0.6rem; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.1em;">Question</div>
              <div id="quiz-question-num" style="font-size:1.2rem; font-weight:800; color:var(--color-text-primary);">${this._questionIndex + 1} / ${this.questions.length}</div>
            </div>
          </div>

          <!-- Timer Bar -->
          <div style="margin-bottom:1.25rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.3rem;">
              <span style="font-size:0.7rem; color:var(--color-text-muted); font-weight:600; display:inline-flex; align-items:center; gap:0.35rem;">${renderIconLabel('TIME', 'Time')}</span>
              <span id="quiz-timer-label" style="font-size:0.8rem; font-weight:800; color:${timerColor}; font-family:var(--font-mono);">${this._timerSeconds}s</span>
            </div>
            <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:99px; overflow:hidden;">
              <div id="quiz-timer-bar" style="
                height:100%; width:${timerPct}%; background:${timerColor};
                border-radius:99px; transition:width 1s linear, background 0.3s;
              "></div>
            </div>
          </div>

          <!-- Question -->
          <div id="quiz-question-text" style="font-size:1rem; font-weight:700; color:var(--color-text-primary); margin-bottom:1rem; line-height:1.5;">
            ${q.question}
          </div>

          <!-- Options -->
          <div id="quiz-options" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom:1.25rem;">
            ${this._renderOptions(q, optMap)}
          </div>

          <!-- Feedback / Explanation area -->
          <div id="quiz-feedback" style="display:none; margin-bottom:1rem;"></div>

          <!-- Action Buttons -->
          <div style="display:flex; gap:0.75rem; justify-content:flex-end;">
            <button id="quiz-submit-btn" class="btn btn-primary" style="padding:0.6rem 1.5rem; display:none; border-radius:10px;">
              ${renderIconLabel('OK', 'Submit Answer')}
            </button>
            <button id="quiz-next-btn" class="btn btn-primary" style="padding:0.6rem 1.5rem; display:none; border-radius:10px;">
              ${this._questionIndex === this.questions.length - 1 ? 'Finish Quiz →' : 'Next Question →'}
            </button>
          </div>
        </div>
      </div>
    `;

        this._bindQuizEvents();
        this._startTimer();
    }

    _renderOptions(q, optMap) {
        return optMap.map((origIdx, dispIdx) => `
              <button class="quiz-opt-btn" data-orig="${origIdx}" data-disp="${dispIdx}" style="
                display:flex; align-items:center; gap:0.75rem;
                padding:1rem; border-radius:10px; min-height:52px;
                background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
                color:var(--color-text-secondary); font-size:0.95rem; text-align:left;
                cursor:pointer; transition:all 0.2s ease; width:100%;
                font-family:inherit; position:relative; overflow:hidden;
              ">
                <span class="opt-letter" style="
                  width:32px; height:32px; border-radius:50%; flex-shrink:0;
                  background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15);
                  display:flex; align-items:center; justify-content:center;
                  font-size:0.85rem; font-weight:700; color:var(--color-text-muted);
                  position:relative; z-index:2;
                ">${String.fromCharCode(65 + dispIdx)}</span>
                <span style="position:relative; z-index:2; flex:1;">${q.options[origIdx]}</span>
              </button>
            `).join('');
    }

    _updateQuestion() {
        const q = this._currentQuestion;
        const diff = q.difficulty || 'easy';
        const tm = DIFF_META[diff] || DIFF_META['easy'];
        const optMap = this._shuffledOptionsMap[q.id];

        // Update difficulty
        const diffIcon = this.container.querySelector('#quiz-diff-icon');
        const diffLabel = this.container.querySelector('#quiz-diff-label');
        const diffLevel = this.container.querySelector('#quiz-diff-level');
        if (diffIcon) diffIcon.innerHTML = renderTokenIcon(tm.icon);
        if (diffLabel) diffLabel.style.color = tm.color;
        if (diffLevel) diffLevel.textContent = `${tm.label} Level`;

        // Update stats
        const scoreEl = this.container.querySelector('#quiz-score');
        const streakEl = this.container.querySelector('#quiz-streak');
        const questionNumEl = this.container.querySelector('#quiz-question-num');
        if (scoreEl) scoreEl.textContent = this._score;
        if (streakEl) {
            streakEl.innerHTML = renderIconLabel('HOT', this._streak);
            streakEl.style.color = this._streak >= 3 ? '#FFB74D' : '#81C784';
        }
        if (questionNumEl) questionNumEl.textContent = `${this._questionIndex + 1} / ${this.questions.length}`;

        // Update timer bar
        const timerBar = this.container.querySelector('#quiz-timer-bar');
        const timerLabel = this.container.querySelector('#quiz-timer-label');
        if (timerBar) {
            timerBar.style.width = '100%';
            timerBar.style.background = '#4FC3F7';
        }
        if (timerLabel) {
            timerLabel.textContent = `${this._timerSeconds}s`;
            timerLabel.style.color = '#4FC3F7';
        }

        // Update question text
        const questionEl = this.container.querySelector('#quiz-question-text');
        if (questionEl) questionEl.textContent = q.question;

        // Update options
        const optionsContainer = this.container.querySelector('#quiz-options');
        if (optionsContainer) {
            optionsContainer.innerHTML = this._renderOptions(q, optMap);
        }

        // Reset feedback
        const feedbackEl = this.container.querySelector('#quiz-feedback');
        if (feedbackEl) {
            feedbackEl.style.display = 'none';
            feedbackEl.innerHTML = '';
        }

        // Reset buttons
        const submitBtn = this.container.querySelector('#quiz-submit-btn');
        const nextBtn = this.container.querySelector('#quiz-next-btn');
        if (submitBtn) submitBtn.style.display = 'none';
        if (nextBtn) {
            nextBtn.style.display = 'none';
            nextBtn.textContent = this._questionIndex === this.questions.length - 1 ? 'Finish Quiz →' : 'Next Question →';
        }

        // Rebind option events
        this._bindOptionEvents();
    }

    _renderResults() {
        const totalQ = this.questions.length;
        const pct = totalQ > 0 ? Math.round((this._totalCorrect / totalQ) * 100) : 0;
        const pass = pct >= this.passingScore;
        const gradeColor = pass ? '#81C784' : '#E57373';
        const gradeLabel = pass ? 'Module Passed!' : 'Requires Review';

        let nextBtnHtml = '';
        if (pass && this.onComplete) {
            nextBtnHtml = `
              <button id="quiz-complete-path" class="btn btn-primary" style="padding:0.7rem 2rem; border-radius:10px;">
                Continue Domain →
              </button>
            `;
        }

        this.container.innerHTML = `
      <div class="osi-quiz-overlay" style="
        position:fixed; inset:0; z-index:9999;
        background:rgba(8,13,20,0.95);
        display:flex; align-items:center; justify-content:center;
        animation: fadeIn 250ms ease forwards; padding:1rem;
      ">
        <div style="
          width:100%; max-width:620px; max-height:90vh; overflow-y:auto;
          background:linear-gradient(145deg, #111d2e, #0d1520);
          border:1px solid rgba(0,206,209,0.25);
          border-radius:16px; padding:2rem;
          box-shadow: 0 0 60px rgba(0,206,209,0.08), 0 25px 50px rgba(0,0,0,0.5);
        ">
          <div style="text-align:center; margin-bottom:2rem;">
            <div style="font-size:3rem; margin-bottom:0.5rem; display:flex; justify-content:center;">${renderTokenIcon(pass ? 'PASS' : 'LEARN')}</div>
            <h2 style="margin:0 0 0.25rem 0; font-size:1.5rem; color:${gradeColor};">${gradeLabel}</h2>
            <p style="color:var(--color-text-muted); margin:0; font-size:0.9rem;">Target score: ${this.passingScore}%</p>
          </div>

          <div style="display:flex; justify-content:center; margin-bottom:2rem;">
            <div style="
              width:120px; height:120px; border-radius:50%;
              border:4px solid ${gradeColor};
              display:flex; flex-direction:column; align-items:center; justify-content:center;
              box-shadow:0 0 30px ${gradeColor}33;
            ">
              <div style="font-size:2rem; font-weight:800; color:${gradeColor};">${pct}%</div>
              <div style="font-size:0.7rem; color:var(--color-text-muted);">${this._totalCorrect}/${totalQ}</div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-bottom:1.5rem;">
            <div style="background:rgba(0,0,0,0.25); border-radius:8px; padding:0.75rem; text-align:center;">
              <div style="font-size:0.65rem; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.1em;">Total Score</div>
              <div style="font-size:1.3rem; font-weight:800; color:#4FC3F7;">${this._score}</div>
            </div>
            <div style="background:rgba(0,0,0,0.25); border-radius:8px; padding:0.75rem; text-align:center;">
              <div style="font-size:0.65rem; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.1em;">Best Streak</div>
              <div style="font-size:1.3rem; font-weight:800; color:#FFB74D; display:inline-flex; align-items:center; gap:0.35rem;">${renderIconLabel('HOT', this._bestStreak)}</div>
            </div>
          </div>

          <div style="display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap;">
            <button id="quiz-retry-btn" class="btn btn-ghost" style="padding:0.7rem 2rem; border-radius:10px; border-color:rgba(255,255,255,0.15);">${renderIconLabel('CYCLE', 'Retry')}</button>
            ${nextBtnHtml || `<button id="quiz-close-final" class="btn btn-ghost" style="padding:0.7rem 2rem; border-radius:10px; border-color:rgba(255,255,255,0.15);">${renderIconLabel('X', 'Close')}</button>`}
          </div>
        </div>
      </div>
    `;

        this.container.querySelector('#quiz-retry-btn')?.addEventListener('click', () => {
            this.destroy();
            new AdvancedQuizMode(this.container, this.questions, {
                onClose: this.onClose,
                onComplete: this.onComplete,
                passingScore: this.passingScore,
                count: this.targetCount
            });
        });
        this.container.querySelector('#quiz-close-final')?.addEventListener('click', () => {
             this.destroy();
             if (this.onClose) this.onClose();
        });
        this.container.querySelector('#quiz-complete-path')?.addEventListener('click', () => {
            if (this.onComplete) {
                this.onComplete({ percent: pct, correct: this._totalCorrect, timeTaken: 0, answers: [] });
            }
            this.destroy();
        });
    }

    _bindQuizEvents() {
        this.container.querySelector('#quiz-close-btn')?.addEventListener('click', () => {
            this.destroy();
            if (this.onClose) this.onClose();
        });

        this.container.querySelector('#quiz-submit-btn')?.addEventListener('click', () => {
            if (this._selectedAnswer === null) return;
            this._submitAnswer();
        });

        this.container.querySelector('#quiz-next-btn')?.addEventListener('click', () => {
            this._questionIndex++;
            this._selectedAnswer = null;
            this._answered = false;
            this._timerSeconds = 60;
            this._pickNextQuestion();
            this._render();
            this._startTimer();
        });

        // Bind option events on initial render
        this._bindOptionEvents();
    }

    _bindOptionEvents() {
        const optBtns = this.container.querySelectorAll('.quiz-opt-btn');
        optBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this._answered) return;
                this._selectedAnswer = parseInt(btn.dataset.orig);
                optBtns.forEach(b => {
                    b.style.background = 'rgba(255,255,255,0.04)';
                    b.style.borderColor = 'rgba(255,255,255,0.1)';
                });
                btn.style.background = 'rgba(0,206,209,0.12)';
                btn.style.borderColor = '#00CED1';
                const submitBtn = this.container.querySelector('#quiz-submit-btn');
                if (submitBtn) submitBtn.style.display = 'inline-flex';
            });
            btn.addEventListener('mouseover', () => {
                if (this._answered) return;
                if (this._selectedAnswer !== parseInt(btn.dataset.orig)) {
                    btn.style.background = 'rgba(255,255,255,0.08)';
                }
            });
            btn.addEventListener('mouseout', () => {
                if (this._answered) return;
                if (this._selectedAnswer !== parseInt(btn.dataset.orig)) {
                    btn.style.background = 'rgba(255,255,255,0.04)';
                }
            });
        });
    }

    _startTimer() {
        this._stopTimer();
        this._timerInterval = setInterval(() => {
            if (this._answered) { this._stopTimer(); return; }
            this._timerSeconds--;
            const bar = this.container.querySelector('#quiz-timer-bar');
            const timerLabel = this.container.querySelector('#quiz-timer-label');
            if (bar) {
                const pct = (this._timerSeconds / 60) * 100;
                const c = this._timerSeconds > 20 ? '#4FC3F7' : this._timerSeconds > 10 ? '#FFB74D' : '#EF5350';
                bar.style.width = pct + '%';
                bar.style.background = c;
            }
            if (timerLabel) {
                timerLabel.textContent = this._timerSeconds + 's';
                timerLabel.style.color = this._timerSeconds > 20 ? '#4FC3F7' : this._timerSeconds > 10 ? '#FFB74D' : '#EF5350';
            }
            if (this._timerSeconds <= 0) {
                this._stopTimer();
                this._timeUp();
            }
        }, 1000);
    }

    _stopTimer() {
        if (this._timerInterval) {
            clearInterval(this._timerInterval);
            this._timerInterval = null;
        }
    }

    _timeUp() {
        if (this._answered) return;
        this._answered = true;
        this._selectedAnswer = -1;
        this._streak = 0;
        this._showFeedback(false, true);
    }

    _submitAnswer() {
        if (this._answered || this._selectedAnswer === null) return;
        this._answered = true;
        this._stopTimer();

        const q = this._currentQuestion;
        const isCorrect = this._selectedAnswer === q.correctIndex;

        if (isCorrect) {
            this._totalCorrect++;
            this._streak++;
            if (this._streak > this._bestStreak) this._bestStreak = this._streak;

            const basePoints = 100;
            const streakBonus = Math.min(this._streak, 5) * 10;
            const timeBonus = Math.floor(this._timerSeconds / 10) * 5;
            this._score += basePoints + streakBonus + timeBonus;
        } else {
            this._streak = 0;
        }

        this._history.push({ question: q, wasCorrect: isCorrect });
        this._showFeedback(isCorrect, false);
    }

    _showFeedback(isCorrect, isTimeout) {
        const q = this._currentQuestion;
        const feedbackEl = this.container.querySelector('#quiz-feedback');
        const submitBtn = this.container.querySelector('#quiz-submit-btn');
        const nextBtn = this.container.querySelector('#quiz-next-btn');
        const optBtns = this.container.querySelectorAll('.quiz-opt-btn');

        if (submitBtn) submitBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'inline-flex';

        optBtns.forEach(btn => {
            const idx = parseInt(btn.dataset.orig);
            btn.style.cursor = 'default';
            if (idx === q.correctIndex) {
                btn.style.background = 'rgba(129,199,132,0.15)';
                btn.style.borderColor = '#81C784';
                if (!isCorrect) btn.style.boxShadow = '0 0 15px #81C784';
                btn.querySelector('.opt-letter').style.background = '#81C784';
                btn.querySelector('.opt-letter').style.color = '#000';
                btn.querySelector('.opt-letter').textContent = '✅';
            } else if (idx === this._selectedAnswer && !isCorrect) {
                btn.style.background = 'rgba(229,115,115,0.15)';
                btn.style.borderColor = '#E57373';
                btn.querySelector('.opt-letter').style.background = '#E57373';
                btn.querySelector('.opt-letter').style.color = '#000';
                btn.querySelector('.opt-letter').textContent = '❌';
            } else {
                btn.style.opacity = '0.4';
            }
        });

        if (!feedbackEl) return;

        // If correct, just show a brief success message - no explanation
        if (isCorrect && !isTimeout) {
            feedbackEl.style.display = 'block';
            feedbackEl.innerHTML = `
                <div style="background:rgba(129,199,132,0.1); border:1px solid #81C784; border-radius:10px; padding:1rem;">
                    <div style="font-weight:700; color:#81C784; font-size:0.95rem; display:inline-flex; align-items:center; gap:0.35rem;">${renderIconLabel('OK', 'Correct!')}</div>
                </div>
            `;
            return;
        }

        // If incorrect or timeout, show what went wrong and the correct answer
        const correctLetter = String.fromCharCode(65 + this._shuffledOptionsMap[q.id].indexOf(q.correctIndex));
        const correctAnswer = q.options[q.correctIndex];
        
        let feedbackContent = '';
        
        if (isTimeout) {
            feedbackContent = `
                <div style="font-weight:700; color:#FFB74D; font-size:0.95rem; margin-bottom:0.5rem; display:inline-flex; align-items:center; gap:0.35rem;">${renderIconLabel('TIME', "Time's Up!")}</div>
                <div style="color:var(--color-text-secondary); font-size:0.85rem; line-height:1.5; margin-bottom:0.5rem;">
                    The correct answer was <strong style="color:#81C784;">${correctLetter}: ${escapeHtml(correctAnswer)}</strong>
                </div>
            `;
        } else {
            // User selected wrong answer
            const selectedLetter = String.fromCharCode(65 + this._shuffledOptionsMap[q.id].indexOf(this._selectedAnswer));
            const selectedAnswer = q.options[this._selectedAnswer];
            
            feedbackContent = `
                    <div style="font-weight:700; color:#E57373; font-size:0.95rem; margin-bottom:0.5rem; display:inline-flex; align-items:center; gap:0.35rem;">${renderIconLabel('X', 'Incorrect')}</div>
                <div style="color:var(--color-text-secondary); font-size:0.85rem; line-height:1.5; margin-bottom:0.5rem;">
                    You selected <strong style="color:#E57373;">${selectedLetter}: ${escapeHtml(selectedAnswer)}</strong>
                </div>
                <div style="color:var(--color-text-secondary); font-size:0.85rem; line-height:1.5;">
                    The correct answer is <strong style="color:#81C784;">${correctLetter}: ${escapeHtml(correctAnswer)}</strong>
                </div>
            `;
        }

        // Add the option explanation for the correct answer if available
        if (q.optionExplanations && q.optionExplanations[q.correctIndex]) {
            feedbackContent += `
                <div style="color:var(--color-text-secondary); font-size:0.85rem; line-height:1.5; margin-top:0.5rem; padding-top:0.5rem; border-top:1px solid rgba(255,255,255,0.1);">
                    ${escapeHtml(q.optionExplanations[q.correctIndex])}
                </div>
            `;
        }

        feedbackEl.style.display = 'block';
        feedbackEl.innerHTML = `
            <div style="background:rgba(229,115,115,0.1); border:1px solid #E57373; border-radius:10px; padding:1rem;">
                ${feedbackContent}
            </div>
        `;
    }

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    destroy() {
        this._stopTimer();
        this.container.innerHTML = '';
        // DO NOT SET display = none, it kills the quiz parent container in LessonPage!
    }
}
