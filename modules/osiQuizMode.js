/**
 * osiQuizMode.js — Interactive OSI/TCP-IP Quiz with Spaced Repetition
 *
 * Features:
 *  - Progressive difficulty (Tier 1→5) on correct answers
 *  - 60-second countdown timer per question
 *  - Spaced repetition queue for wrong answers
 *  - Streak tracking, score, and detailed results
 */

import OSI_QUIZ_BANK from '../data/osiQuizBank.js';

/* ── Spaced-repetition intervals (in number of questions before retry) ── */
const SR_INTERVALS = [1, 3, 5, 8];

/* ── Tier labels & colors ── */
const TIER_META = {
    1: { label: 'Fundamentals', color: '#4FC3F7', icon: '🌱' },
    2: { label: 'Layer Functions', color: '#81C784', icon: '📗' },
    3: { label: 'Protocol Knowledge', color: '#FFB74D', icon: '⚡' },
    4: { label: 'Advanced Concepts', color: '#E57373', icon: '🔥' },
    5: { label: 'Expert Level', color: '#CE93D8', icon: '💎' },
};

export class OsiQuizMode {
    constructor(containerEl, onClose) {
        this.container = containerEl;
        this.onClose = onClose;

        // Quiz state
        this._currentTier = 1;
        this._score = 0;
        this._streak = 0;
        this._bestStreak = 0;
        this._questionIndex = 0;       // total questions answered
        this._currentQuestion = null;
        this._selectedAnswer = null;
        this._answered = false;
        this._timerSeconds = 60;
        this._timerInterval = null;
        this._isFinished = false;

        // Spaced repetition
        this._srQueue = [];            // { question, box, dueAt }
        this._totalCorrect = 0;
        this._totalWrong = 0;
        this._history = [];            // { question, wasCorrect, tier }

        // Pool management — clone so we don't mutate original
        this._pools = {};
        for (let t = 1; t <= 5; t++) {
            this._pools[t] = OSI_QUIZ_BANK.filter(q => q.tier === t).map(q => ({ ...q }));
            this._shuffle(this._pools[t]);
        }
        this._poolCursors = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        this._pickNextQuestion();
        this._render();
    }

    /* ══════════════════════════════════════════
       QUESTION SELECTION
       ══════════════════════════════════════════ */

    _pickNextQuestion() {
        // 1. Check spaced-repetition queue first
        const dueItems = this._srQueue.filter(item => item.dueAt <= this._questionIndex);
        if (dueItems.length > 0) {
            const item = dueItems[0];
            this._currentQuestion = { ...item.question, _srItem: item };
            return;
        }

        // 2. Otherwise pick from current tier pool
        const pool = this._pools[this._currentTier];
        const cursor = this._poolCursors[this._currentTier];

        if (cursor < pool.length) {
            this._currentQuestion = { ...pool[cursor] };
            this._poolCursors[this._currentTier]++;
        } else {
            // Pool exhausted for this tier — reshuffle
            this._shuffle(pool);
            this._poolCursors[this._currentTier] = 0;
            this._currentQuestion = { ...pool[0] };
            this._poolCursors[this._currentTier]++;
        }
    }

    /* ══════════════════════════════════════════
       RENDERING
       ══════════════════════════════════════════ */

    _render() {
        if (this._isFinished) {
            this._renderResults();
            return;
        }

        const q = this._currentQuestion;
        const tm = TIER_META[this._currentTier];
        const timerPct = (this._timerSeconds / 60) * 100;
        const timerColor = this._timerSeconds > 20 ? '#4FC3F7' : this._timerSeconds > 10 ? '#FFB74D' : '#EF5350';

        this.container.innerHTML = `
      <div class="osi-quiz-overlay" style="
        position:fixed; inset:0; z-index:999;
        background:rgba(8,13,20,0.95);
        display:flex; align-items:center; justify-content:center;
        animation: fadeIn 250ms ease forwards;
      ">
        <div class="osi-quiz-modal" style="
          width:100%; max-width:720px; max-height:90vh; overflow-y:auto;
          background:linear-gradient(145deg, #111d2e, #0d1520);
          border:1px solid rgba(0,206,209,0.25);
          border-radius:16px;
          padding:2rem;
          box-shadow: 0 0 60px rgba(0,206,209,0.08), 0 25px 50px rgba(0,0,0,0.5);
          position:relative;
        ">
          <!-- Top Bar -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <span style="font-size:1.5rem;">${tm.icon}</span>
              <div>
                <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:${tm.color}; font-weight:700;">Tier ${this._currentTier}</div>
                <div style="font-size:1rem; font-weight:700; color:var(--color-text-primary);">${tm.label}</div>
              </div>
            </div>
            <button id="quiz-close-btn" style="
              background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1);
              color:var(--color-text-muted); font-size:1.2rem; width:36px; height:36px;
              border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center;
              transition:all 0.2s;
            " onmouseover="this.style.background='rgba(255,60,60,0.2)';this.style.color='#ff6b6b'" onmouseout="this.style.background='rgba(255,255,255,0.06)';this.style.color='var(--color-text-muted)'">✕</button>
          </div>

          <!-- Stats Row -->
          <div style="display:flex; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap;">
            <div style="flex:1; min-width:80px; background:rgba(0,0,0,0.25); border-radius:8px; padding:0.6rem 0.8rem; text-align:center;">
              <div style="font-size:0.65rem; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.1em;">Score</div>
              <div style="font-size:1.3rem; font-weight:800; color:#4FC3F7;">${this._score}</div>
            </div>
            <div style="flex:1; min-width:80px; background:rgba(0,0,0,0.25); border-radius:8px; padding:0.6rem 0.8rem; text-align:center;">
              <div style="font-size:0.65rem; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.1em;">Streak</div>
              <div style="font-size:1.3rem; font-weight:800; color:${this._streak >= 3 ? '#FFB74D' : '#81C784'};">🔥 ${this._streak}</div>
            </div>
            <div style="flex:1; min-width:80px; background:rgba(0,0,0,0.25); border-radius:8px; padding:0.6rem 0.8rem; text-align:center;">
              <div style="font-size:0.65rem; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.1em;">Question</div>
              <div style="font-size:1.3rem; font-weight:800; color:var(--color-text-primary);">${this._questionIndex + 1}</div>
            </div>
            <div style="flex:1; min-width:80px; background:rgba(0,0,0,0.25); border-radius:8px; padding:0.6rem 0.8rem; text-align:center;">
              <div style="font-size:0.65rem; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.1em;">To Review</div>
              <div style="font-size:1.3rem; font-weight:800; color:${this._srQueue.length > 0 ? '#E57373' : '#81C784'};">${this._srQueue.length}</div>
            </div>
          </div>

          <!-- Timer Bar -->
          <div style="margin-bottom:1.5rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
              <span style="font-size:0.75rem; color:var(--color-text-muted); font-weight:600;">⏱ TIME</span>
              <span style="font-size:0.85rem; font-weight:800; color:${timerColor}; font-family:var(--font-mono);">${this._timerSeconds}s</span>
            </div>
            <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:99px; overflow:hidden;">
              <div id="timer-bar" style="
                height:100%; width:${timerPct}%; background:${timerColor};
                border-radius:99px; transition:width 1s linear, background 0.3s;
              "></div>
            </div>
          </div>

          ${this._currentQuestion._srItem ? `
            <div style="background:rgba(206,147,216,0.1); border:1px solid rgba(206,147,216,0.3); border-radius:8px; padding:0.6rem 0.8rem; margin-bottom:1rem; font-size:0.8rem; color:#CE93D8; display:flex; align-items:center; gap:0.5rem;">
              <span>🔄</span> <strong>Spaced Repetition:</strong> You missed this before — try again!
            </div>
          ` : ''}

          <!-- Question -->
          <div style="font-size:1.1rem; font-weight:700; color:var(--color-text-primary); margin-bottom:1.25rem; line-height:1.5;">
            ${q.question}
          </div>

          <!-- Options -->
          <div id="quiz-options" style="display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1.5rem;">
            ${q.options.map((opt, idx) => `
              <button class="quiz-opt-btn" data-idx="${idx}" style="
                display:flex; align-items:center; gap:0.75rem;
                padding:0.85rem 1rem; border-radius:10px;
                background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
                color:var(--color-text-secondary); font-size:0.95rem; text-align:left;
                cursor:pointer; transition:all 0.2s ease; width:100%;
                font-family:inherit;
              ">
                <span style="
                  width:28px; height:28px; border-radius:50%; flex-shrink:0;
                  background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15);
                  display:flex; align-items:center; justify-content:center;
                  font-size:0.8rem; font-weight:700; color:var(--color-text-muted);
                ">${String.fromCharCode(65 + idx)}</span>
                <span>${opt}</span>
              </button>
            `).join('')}
          </div>

          <!-- Feedback / Explanation area -->
          <div id="quiz-feedback" style="display:none; margin-bottom:1.25rem;"></div>

          <!-- Action Buttons -->
          <div style="display:flex; gap:0.75rem; justify-content:flex-end;">
            <button id="quiz-submit-btn" class="btn btn-primary" style="padding:0.6rem 1.5rem; display:none; border-radius:10px;">
              ✓ Submit Answer
            </button>
            <button id="quiz-next-btn" class="btn btn-primary" style="padding:0.6rem 1.5rem; display:none; border-radius:10px;">
              Next Question →
            </button>
            <button id="quiz-finish-btn" class="btn btn-ghost" style="padding:0.6rem 1.5rem; display:none; border-radius:10px; border-color:rgba(255,255,255,0.15);">
              Finish Quiz
            </button>
          </div>
        </div>
      </div>
    `;

        this._bindQuizEvents();
        this._startTimer();
    }

    _renderResults() {
        const totalQ = this._totalCorrect + this._totalWrong;
        const pct = totalQ > 0 ? Math.round((this._totalCorrect / totalQ) * 100) : 0;
        const gradeColor = pct >= 80 ? '#81C784' : pct >= 60 ? '#FFB74D' : '#E57373';
        const gradeLabel = pct >= 90 ? 'Outstanding!' : pct >= 80 ? 'Great Job!' : pct >= 60 ? 'Good Effort' : 'Keep Practicing';

        // Build per-tier breakdown
        const tierBreakdown = {};
        this._history.forEach(h => {
            if (!tierBreakdown[h.tier]) tierBreakdown[h.tier] = { correct: 0, total: 0 };
            tierBreakdown[h.tier].total++;
            if (h.wasCorrect) tierBreakdown[h.tier].correct++;
        });

        // Items still needing review
        const reviewItems = this._srQueue.map(item => item.question);

        this.container.innerHTML = `
      <div class="osi-quiz-overlay" style="
        position:fixed; inset:0; z-index:999;
        background:rgba(8,13,20,0.95);
        display:flex; align-items:center; justify-content:center;
        animation: fadeIn 250ms ease forwards;
      ">
        <div style="
          width:100%; max-width:620px; max-height:90vh; overflow-y:auto;
          background:linear-gradient(145deg, #111d2e, #0d1520);
          border:1px solid rgba(0,206,209,0.25);
          border-radius:16px; padding:2rem;
          box-shadow: 0 0 60px rgba(0,206,209,0.08), 0 25px 50px rgba(0,0,0,0.5);
        ">
          <div style="text-align:center; margin-bottom:2rem;">
            <div style="font-size:3rem; margin-bottom:0.5rem;">${pct >= 80 ? '🏆' : pct >= 60 ? '👏' : '📚'}</div>
            <h2 style="margin:0 0 0.25rem 0; font-size:1.5rem; color:${gradeColor};">${gradeLabel}</h2>
            <p style="color:var(--color-text-muted); margin:0; font-size:0.9rem;">Quiz Complete — Here are your results</p>
          </div>

          <!-- Score circle -->
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

          <!-- Stats grid -->
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.75rem; margin-bottom:1.5rem;">
            <div style="background:rgba(0,0,0,0.25); border-radius:8px; padding:0.75rem; text-align:center;">
              <div style="font-size:0.65rem; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.1em;">Total Score</div>
              <div style="font-size:1.3rem; font-weight:800; color:#4FC3F7;">${this._score}</div>
            </div>
            <div style="background:rgba(0,0,0,0.25); border-radius:8px; padding:0.75rem; text-align:center;">
              <div style="font-size:0.65rem; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.1em;">Best Streak</div>
              <div style="font-size:1.3rem; font-weight:800; color:#FFB74D;">🔥 ${this._bestStreak}</div>
            </div>
            <div style="background:rgba(0,0,0,0.25); border-radius:8px; padding:0.75rem; text-align:center;">
              <div style="font-size:0.65rem; text-transform:uppercase; color:var(--color-text-muted); letter-spacing:0.1em;">Max Tier</div>
              <div style="font-size:1.3rem; font-weight:800; color:${TIER_META[this._currentTier].color};">${TIER_META[this._currentTier].icon} ${this._currentTier}</div>
            </div>
          </div>

          <!-- Tier Breakdown -->
          <div style="margin-bottom:1.5rem;">
            <div style="font-size:0.8rem; text-transform:uppercase; color:var(--color-text-muted); margin-bottom:0.5rem; font-weight:700; letter-spacing:0.1em;">Tier Breakdown</div>
            ${Object.entries(tierBreakdown).map(([tier, data]) => {
            const tp = Math.round((data.correct / data.total) * 100);
            const tc = TIER_META[tier].color;
            return `
                <div style="display:flex; align-items:center; gap:0.75rem; padding:0.4rem 0;">
                  <span style="font-size:0.85rem; min-width:100px; color:${tc}; font-weight:600;">${TIER_META[tier].icon} Tier ${tier}</span>
                  <div style="flex:1; height:8px; background:rgba(255,255,255,0.06); border-radius:99px; overflow:hidden;">
                    <div style="height:100%; width:${tp}%; background:${tc}; border-radius:99px;"></div>
                  </div>
                  <span style="font-size:0.8rem; color:var(--color-text-muted); font-weight:600; min-width:55px; text-align:right;">${data.correct}/${data.total}</span>
                </div>
              `;
        }).join('')}
          </div>

          ${reviewItems.length > 0 ? `
            <div style="margin-bottom:1.5rem; background:rgba(229,115,115,0.08); border:1px solid rgba(229,115,115,0.2); border-radius:10px; padding:1rem;">
              <div style="font-size:0.8rem; text-transform:uppercase; color:#E57373; margin-bottom:0.6rem; font-weight:700; letter-spacing:0.1em;">📌 Topics to Review</div>
              ${reviewItems.map(q => `
                <div style="padding:0.4rem 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.85rem; color:var(--color-text-secondary);">
                  • ${q.question}
                </div>
              `).join('')}
            </div>
          ` : `
            <div style="margin-bottom:1.5rem; background:rgba(129,199,132,0.08); border:1px solid rgba(129,199,132,0.2); border-radius:10px; padding:1rem; text-align:center;">
              <span style="font-size:0.9rem; color:#81C784; font-weight:600;">✅ No items left to review — excellent memory!</span>
            </div>
          `}

          <div style="display:flex; gap:0.75rem; justify-content:center;">
            <button id="quiz-retry-btn" class="btn btn-primary" style="padding:0.7rem 2rem; border-radius:10px;">🔄 Try Again</button>
            <button id="quiz-close-final" class="btn btn-ghost" style="padding:0.7rem 2rem; border-radius:10px; border-color:rgba(255,255,255,0.15);">✕ Close</button>
          </div>
        </div>
      </div>
    `;

        this.container.querySelector('#quiz-retry-btn')?.addEventListener('click', () => {
            this.destroy();
            const fresh = new OsiQuizMode(this.container, this.onClose);
        });
        this.container.querySelector('#quiz-close-final')?.addEventListener('click', () => {
            this.destroy();
            if (this.onClose) this.onClose();
        });
    }

    /* ══════════════════════════════════════════
       EVENT BINDING
       ══════════════════════════════════════════ */

    _bindQuizEvents() {
        // Close button
        this.container.querySelector('#quiz-close-btn')?.addEventListener('click', () => {
            this.destroy();
            if (this.onClose) this.onClose();
        });

        // Option selection
        const optBtns = this.container.querySelectorAll('.quiz-opt-btn');
        optBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this._answered) return;
                this._selectedAnswer = parseInt(btn.dataset.idx);
                // Highlight selected
                optBtns.forEach(b => {
                    b.style.background = 'rgba(255,255,255,0.04)';
                    b.style.borderColor = 'rgba(255,255,255,0.1)';
                });
                btn.style.background = 'rgba(0,206,209,0.12)';
                btn.style.borderColor = '#00CED1';
                // Show submit
                const submitBtn = this.container.querySelector('#quiz-submit-btn');
                if (submitBtn) submitBtn.style.display = 'inline-flex';
            });

            btn.addEventListener('mouseover', () => {
                if (this._answered) return;
                if (this._selectedAnswer !== parseInt(btn.dataset.idx)) {
                    btn.style.background = 'rgba(255,255,255,0.08)';
                }
            });
            btn.addEventListener('mouseout', () => {
                if (this._answered) return;
                if (this._selectedAnswer !== parseInt(btn.dataset.idx)) {
                    btn.style.background = 'rgba(255,255,255,0.04)';
                }
            });
        });

        // Submit
        this.container.querySelector('#quiz-submit-btn')?.addEventListener('click', () => {
            this._submitAnswer();
        });

        // Next
        this.container.querySelector('#quiz-next-btn')?.addEventListener('click', () => {
            this._questionIndex++;
            this._pickNextQuestion();
            this._selectedAnswer = null;
            this._answered = false;
            this._timerSeconds = 60;
            this._render();
        });

        // Finish
        this.container.querySelector('#quiz-finish-btn')?.addEventListener('click', () => {
            this._isFinished = true;
            this._render();
        });
    }

    /* ══════════════════════════════════════════
       TIMER
       ══════════════════════════════════════════ */

    _startTimer() {
        this._stopTimer();
        this._timerInterval = setInterval(() => {
            if (this._answered) { this._stopTimer(); return; }
            this._timerSeconds--;
            // Update bar
            const bar = this.container.querySelector('#timer-bar');
            const timerLabel = this.container.querySelector('#timer-bar')?.parentElement?.previousElementSibling?.lastElementChild;
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
        this._selectedAnswer = -1; // no answer
        this._handleWrong();
        this._showFeedback(false, true);
    }

    /* ══════════════════════════════════════════
       ANSWER LOGIC
       ══════════════════════════════════════════ */

    _submitAnswer() {
        if (this._answered || this._selectedAnswer === null) return;
        this._answered = true;
        this._stopTimer();

        const q = this._currentQuestion;
        const isCorrect = this._selectedAnswer === q.correct;

        if (isCorrect) {
            this._handleCorrect();
        } else {
            this._handleWrong();
        }

        this._showFeedback(isCorrect, false);
        this._history.push({ question: q, wasCorrect: isCorrect, tier: q.tier || this._currentTier });
    }

    _handleCorrect() {
        this._totalCorrect++;
        this._streak++;
        if (this._streak > this._bestStreak) this._bestStreak = this._streak;

        // Score: tier-based + streak bonus
        const tierPoints = this._currentTier * 10;
        const streakBonus = Math.min(this._streak, 5) * 5;
        const timeBonus = Math.floor(this._timerSeconds / 10) * 2;
        this._score += tierPoints + streakBonus + timeBonus;

        // If from SR queue, remove it
        if (this._currentQuestion._srItem) {
            this._srQueue = this._srQueue.filter(i => i !== this._currentQuestion._srItem);
        }

        // Promote tier on every 2 correct in a row (up to 5)
        if (this._streak % 2 === 0 && this._currentTier < 5) {
            this._currentTier++;
        }
    }

    _handleWrong() {
        this._totalWrong++;
        this._streak = 0;

        // Add to SR queue (or increase box if already there)
        const existingSR = this._currentQuestion._srItem;
        if (existingSR) {
            // Increase box (harder interval)
            const newBox = Math.min(existingSR.box + 1, SR_INTERVALS.length - 1);
            existingSR.box = newBox;
            existingSR.dueAt = this._questionIndex + SR_INTERVALS[newBox] + 1;
        } else {
            this._srQueue.push({
                question: { ...this._currentQuestion },
                box: 0,
                dueAt: this._questionIndex + SR_INTERVALS[0] + 1,
            });
        }

        // Demote tier on wrong
        if (this._currentTier > 1) {
            this._currentTier--;
        }
    }

    _showFeedback(isCorrect, isTimeout) {
        const q = this._currentQuestion;
        const feedbackEl = this.container.querySelector('#quiz-feedback');
        const submitBtn = this.container.querySelector('#quiz-submit-btn');
        const nextBtn = this.container.querySelector('#quiz-next-btn');
        const finishBtn = this.container.querySelector('#quiz-finish-btn');
        const optBtns = this.container.querySelectorAll('.quiz-opt-btn');

        if (submitBtn) submitBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'inline-flex';
        if (finishBtn) finishBtn.style.display = 'inline-flex';

        // Highlight correct/incorrect options
        optBtns.forEach(btn => {
            const idx = parseInt(btn.dataset.idx);
            btn.style.cursor = 'default';
            if (idx === q.correct) {
                btn.style.background = 'rgba(129,199,132,0.15)';
                btn.style.borderColor = '#81C784';
                btn.querySelector('span:first-child').style.background = '#81C784';
                btn.querySelector('span:first-child').style.color = '#000';
                btn.querySelector('span:first-child').textContent = '✓';
            } else if (idx === this._selectedAnswer && !isCorrect) {
                btn.style.background = 'rgba(229,115,115,0.15)';
                btn.style.borderColor = '#E57373';
                btn.querySelector('span:first-child').style.background = '#E57373';
                btn.querySelector('span:first-child').style.color = '#000';
                btn.querySelector('span:first-child').textContent = '✕';
            } else {
                btn.style.opacity = '0.4';
            }
        });

        // Show feedback
        if (feedbackEl) {
            const bgColor = isCorrect ? 'rgba(129,199,132,0.1)' : 'rgba(229,115,115,0.1)';
            const borderColor = isCorrect ? '#81C784' : '#E57373';
            const label = isTimeout ? '⏱ Time\'s Up!' : isCorrect ? '✅ Correct!' : '❌ Incorrect';
            const tierChangeMsg = isCorrect && this._streak % 2 === 0 && this._currentTier <= 5
                ? `<div style="margin-top:0.5rem; color:#CE93D8; font-size:0.85rem;">⬆ Difficulty increased to <strong>Tier ${this._currentTier}</strong></div>`
                : !isCorrect && this._currentTier >= 1
                    ? `<div style="margin-top:0.5rem; color:#FFB74D; font-size:0.85rem;">🔄 This question will reappear via spaced repetition</div>`
                    : '';

            feedbackEl.style.display = 'block';
            feedbackEl.innerHTML = `
        <div style="background:${bgColor}; border:1px solid ${borderColor}; border-radius:10px; padding:1rem;">
          <div style="font-weight:700; color:${borderColor}; margin-bottom:0.3rem; font-size:0.95rem;">${label}</div>
          <div style="color:var(--color-text-secondary); font-size:0.85rem; line-height:1.5;">${q.explanation}</div>
          ${tierChangeMsg}
        </div>
      `;
        }

        // Update stats display
        const scoreEl = this.container.querySelectorAll('[style*="Score"]');
    }

    /* ══════════════════════════════════════════
       UTILITIES
       ══════════════════════════════════════════ */

    _shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    destroy() {
        this._stopTimer();
        this.container.innerHTML = '';
    }
}
