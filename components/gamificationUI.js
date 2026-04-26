/**
 * gamificationUI.js — Achievement Popups & XP Toast Notifications
 *
 * Listens to eventBus events from progressEngine and shows
 * visual feedback: achievement popups, XP gain toasts, level-up banners.
 *
 * Self-initializes — import in app.js to activate.
 */

import { eventBus } from '../js/eventBus.js';
import { renderTokenIcon } from '../utils/tokenIcons.js';

class GamificationUI {
  constructor() {
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    this._initialized = true;

    // Achievement popup
    eventBus.on('progress:achievement-unlocked', (achievement) => {
      this._showAchievement(achievement);
    });

    // XP gained toast
    eventBus.on('progress:xp-gained', (data) => {
      this._showXPToast(data.amount, data.reason);
    });

    // Level-up celebration
    eventBus.on('progress:level-up', (data) => {
      this._showLevelUp(data.to);
    });
  }

  _showAchievement(achievement) {
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
      <div class="achievement-popup__icon">${renderTokenIcon(achievement.icon, 'learning-token-icon')}</div>
      <div>
        <div class="achievement-popup__title">${achievement.title}</div>
        <div class="achievement-popup__desc">${achievement.desc}</div>
      </div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => {
      popup.style.opacity = '0';
      popup.style.transform = 'translateY(-20px)';
      popup.style.transition = 'all 0.4s ease';
      setTimeout(() => popup.remove(), 500);
    }, 4000);
  }

  _showXPToast(amount, reason) {
    const toast = document.createElement('div');
    toast.className = 'xp-toast';
    toast.textContent = `+${amount} XP`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 400);
    }, 2500);
  }

  _showLevelUp(newLevel) {
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.style.borderColor = 'var(--color-cyan)';
    popup.innerHTML = `
        <div class="achievement-popup__icon">${renderTokenIcon('UP', 'learning-token-icon')}</div>
      <div>
        <div class="achievement-popup__title" style="color:var(--color-cyan)">Level Up!</div>
        <div class="achievement-popup__desc">You reached Level ${newLevel.level} — ${newLevel.title}</div>
      </div>
    `;
    document.body.appendChild(popup);

    setTimeout(() => {
      popup.style.opacity = '0';
      popup.style.transform = 'translateY(-20px)';
      popup.style.transition = 'all 0.4s ease';
      setTimeout(() => popup.remove(), 500);
    }, 5000);
  }
}

export const gamificationUI = new GamificationUI();
