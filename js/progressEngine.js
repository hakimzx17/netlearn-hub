/**
 * progressEngine.js — Gamification & Progress Tracking Engine
 *
 * Manages: XP, levels, achievements, streak tracking, weak area detection.
 * Subscribes to stateManager and emits gamification events via eventBus.
 *
 * Depends on: eventBus, stateManager, achievements data
 */

import { eventBus }    from './eventBus.js';
import { stateManager } from './stateManager.js';
import { LEVEL_THRESHOLDS, ACHIEVEMENTS } from '../data/achievements.js';
import { ALL_PATHS } from '../data/pathRegistry.js';

class ProgressEngine {
  constructor() {
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    this._initialized = true;

    // Ensure streak is updated on each visit
    this._updateStreak();
  }

  // ─── XP ─────────────────────────────────────────────────

  /**
   * Award XP and check for level-up.
   * @param {number} amount
   * @param {string} reason — e.g. 'quiz:osi-model', 'sim:arp-resolution'
   */
  awardXP(amount, reason) {
    const profile = stateManager.getState('userProfile');
    const oldXP   = profile.xp;
    const newXP   = oldXP + amount;
    const oldLevel = this.getLevelForXP(oldXP);
    const newLevel = this.getLevelForXP(newXP);

    stateManager.mergeState('userProfile', { xp: newXP, level: newLevel.level });

    eventBus.emit('progress:xp-gained', { amount, reason, total: newXP });

    if (newLevel.level > oldLevel.level) {
      eventBus.emit('progress:level-up', {
        from: oldLevel,
        to: newLevel,
      });
    }
  }

  /**
   * Get the level info for a given XP amount.
   */
  getLevelForXP(xp) {
    let result = LEVEL_THRESHOLDS[0];
    for (const t of LEVEL_THRESHOLDS) {
      if (xp >= t.xp) result = t;
      else break;
    }
    return result;
  }

  /**
   * Get XP needed for next level.
   */
  getNextLevelXP(currentXP) {
    for (const t of LEVEL_THRESHOLDS) {
      if (currentXP < t.xp) return t.xp;
    }
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].xp;
  }

  // ─── Module Completion ──────────────────────────────────

  /**
   * Mark a module as complete. Awards XP, checks achievements.
   * @param {string} moduleId
   * @param {string} pathId
   * @param {object} rewards — { theoryXP, simXP, quizBaseXP }
   * @param {number} quizScorePercent — 0-100
   */
  completeModule(moduleId, pathId, rewards, quizScorePercent = 0) {
    const progress = stateManager.getState('userProgress');
    const completed = new Set(progress.completedModules || []);
    const topicStates = { ...(progress.topicStates || {}) };
    const previousState = topicStates[moduleId] || {
      quizPassed: false,
      bestQuizScore: 0,
      attempts: 0,
      quizHistory: [],
      completedAt: null,
    };
    const nextState = {
      ...previousState,
      quizPassed: true,
      attempts: previousState.attempts + 1,
      bestQuizScore: Math.max(previousState.bestQuizScore || 0, quizScorePercent),
      quizHistory: [...(previousState.quizHistory || []), quizScorePercent],
      completedAt: previousState.completedAt || Date.now(),
    };
    topicStates[moduleId] = nextState;

    const alreadyCompleted = completed.has(moduleId);

    if (!alreadyCompleted) {
      completed.add(moduleId);
    }

    // Track scores
    const scores = { ...progress.scores };
    scores[moduleId] = Math.max(scores[moduleId] || 0, quizScorePercent);

    stateManager.setState('userProgress', {
      ...progress,
      completedModules: [...completed],
      scores,
      topicStates,
    });

    // Store quiz score for weak area detection and history even on replays
    const quizScores = stateManager.getState('quizScores') || {};
    const existing = quizScores[moduleId] || [];
    existing.push(quizScorePercent);
    stateManager.setState('quizScores', { ...quizScores, [moduleId]: existing });

    if (alreadyCompleted) return;

    // Award XP
    const quizXP = Math.round((rewards.quizBaseXP || 50) * (quizScorePercent / 100));
    const totalXP = (rewards.theoryXP || 20) + (rewards.simXP || 30) + quizXP;
    this.awardXP(totalXP, `module:${moduleId}`);

    // Check achievements
    this._checkAchievements(moduleId, pathId, quizScorePercent);

    eventBus.emit('progress:module-completed', { moduleId, pathId, xp: totalXP });
  }

  isTopicComplete(topicId) {
    const progress = stateManager.getState('userProgress');
    const completed = new Set(progress.completedModules || []);
    if (completed.has(topicId)) return true;
    return progress.topicStates?.[topicId]?.quizPassed === true;
  }

  isTopicUnlocked(pathData, topicId) {
    if (!pathData) return false;
    if (stateManager.getState('adminPreview') === true) return true;

    const topicIndex = pathData.modules.findIndex((module) => module.id === topicId);
    if (topicIndex === -1) return false;
    if (!this.isPathUnlocked(pathData, ALL_PATHS)) return false;
    if (topicIndex === 0) return true;

    const previousTopic = pathData.modules[topicIndex - 1];
    return previousTopic ? this.isTopicComplete(previousTopic.id) : true;
  }

  isDomainFinalUnlocked(pathData) {
    if (!pathData) return false;
    if (stateManager.getState('adminPreview') === true) return true;
    return pathData.modules.every((module) => this.isTopicComplete(module.id));
  }

  isDomainFinalPassed(domainId) {
    const progress = stateManager.getState('userProgress');
    return progress.domainFinals?.[domainId]?.passed === true;
  }

  recordDomainFinalResult(domainId, scorePercent, flaggedTopicIds = []) {
    const progress = stateManager.getState('userProgress');
    const domainFinals = { ...(progress.domainFinals || {}) };
    const domainPath = ALL_PATHS.find((path) => path.id === domainId);
    const passingScore = domainPath?.finalExam?.passingScore || 80;
    const previous = domainFinals[domainId] || {
      passed: false,
      bestScore: 0,
      attempts: 0,
      scoreHistory: [],
      flaggedTopicIds: [],
      passedAt: null,
    };
    const passed = scorePercent >= passingScore;

    domainFinals[domainId] = {
      ...previous,
      passed: previous.passed || passed,
      bestScore: Math.max(previous.bestScore || 0, scorePercent),
      attempts: previous.attempts + 1,
      scoreHistory: [...(previous.scoreHistory || []), scorePercent],
      flaggedTopicIds: passed ? [] : [...flaggedTopicIds],
      passedAt: previous.passedAt || (passed ? Date.now() : null),
    };

    const practiceExam = { ...(progress.practiceExam || {}) };
    const updatedProgress = {
      ...progress,
      domainFinals,
      flaggedTopicIds: passed ? [] : [...flaggedTopicIds],
      practiceExam: {
        ...practiceExam,
        unlocked: ALL_PATHS.every((path) =>
          path.id === domainId
            ? domainFinals[domainId]?.passed === true
            : this.isPathComplete(path)
        ),
      },
    };

    stateManager.setState('userProgress', updatedProgress);
    eventBus.emit('progress:domain-final-recorded', { domainId, scorePercent, passed });
    return domainFinals[domainId];
  }

  getFlaggedTopicsForDomain(domainId) {
    const progress = stateManager.getState('userProgress');
    return progress.domainFinals?.[domainId]?.flaggedTopicIds || [];
  }

  isPracticeExamUnlocked(allPaths = ALL_PATHS) {
    return allPaths.every((path) => this.isPathComplete(path));
  }

  // ─── Learning State ─────────────────────────────────────

  /**
   * Save the user's current position in a lesson.
   */
  savePosition(pathId, moduleId, position) {
    stateManager.setState('learningState', {
      lastModuleId: moduleId,
      lastPathId: pathId,
      lastPosition: position,
      timestamp: Date.now(),
    });
  }

  /**
   * Get "continue learning" info.
   */
  getContinueState() {
    return stateManager.getState('learningState');
  }

  // ─── Weak Area Detection ────────────────────────────────

  /**
   * Returns modules where average quiz score is below threshold.
   * @param {number} threshold — default 70
   * @returns {Array<{moduleId, averageScore}>}
   */
  getWeakAreas(threshold = 70) {
    const quizScores = stateManager.getState('quizScores') || {};
    const weak = [];

    for (const [moduleId, scores] of Object.entries(quizScores)) {
      if (scores.length === 0) continue;
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg < threshold) {
        weak.push({ moduleId, averageScore: Math.round(avg) });
      }
    }

    return weak.sort((a, b) => a.averageScore - b.averageScore).slice(0, 3);
  }

  // ─── Streak ─────────────────────────────────────────────

  _updateStreak() {
    const profile = stateManager.getState('userProfile');
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const lastVisit = profile.lastVisitDate;

    if (lastVisit === today) return; // already counted today

    let streak = profile.streak || 0;

    if (lastVisit) {
      const diff = (new Date(today) - new Date(lastVisit)) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak += 1; // consecutive day
      } else if (diff > 1) {
        streak = 1; // streak broken, start fresh
      }
    } else {
      streak = 1; // first visit
    }

    stateManager.mergeState('userProfile', {
      streak,
      lastVisitDate: today,
    });

    // Check streak achievements
    if (streak >= 3) this.unlockAchievement('3-day-streak');
    if (streak >= 7) this.unlockAchievement('on-fire');
  }

  // ─── Achievements ───────────────────────────────────────

  unlockAchievement(achievementId) {
    const profile = stateManager.getState('userProfile');
    const unlocked = new Set(profile.achievements || []);

    if (unlocked.has(achievementId)) return;

    unlocked.add(achievementId);
    stateManager.mergeState('userProfile', {
      achievements: [...unlocked],
    });

    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (achievement) {
      eventBus.emit('progress:achievement-unlocked', achievement);
    }
  }

  _checkAchievements(moduleId, pathId, quizScore) {
    const progress  = stateManager.getState('userProgress');
    const completed = new Set(progress.completedModules || []);

    // First module completed
    if (completed.size === 1) {
      this.unlockAchievement('first-steps');
    }

    // Perfect quiz
    if (quizScore === 100) {
      this.unlockAchievement('perfect-quiz');
    }

    // Path completions — we'll check these generically
    // by importing path data when needed
    const simCount = completed.size; // rough proxy
    if (simCount >= 5) this.unlockAchievement('lab-rat');
  }

  /**
   * Check if a learning path is fully complete.
   * @param {object} pathData — path definition with modules array
   * @returns {boolean}
   */
  isPathComplete(pathData) {
    const topicsDone = pathData.modules.every((module) => this.isTopicComplete(module.id));
    if (!topicsDone) return false;
    if (!pathData.finalExam || pathData.finalExam.status !== 'authored') return true;
    return this.isDomainFinalPassed(pathData.id);
  }

  /**
   * Check if a path is unlocked (all prerequisites complete).
   * @param {object} pathData
   * @param {object[]} allPaths — all path definitions
   * @returns {boolean}
   */
  isPathUnlocked(pathData, allPaths = ALL_PATHS) {
    if (stateManager.getState('adminPreview') === true) return true;

    if (!pathData.prerequisites || pathData.prerequisites.length === 0) return true;

    return pathData.prerequisites.every(preId => {
      const prePath = allPaths.find(p => p.id === preId);
      return prePath ? this.isPathComplete(prePath) : true;
    });
  }
}

export const progressEngine = new ProgressEngine();
