/**
 * LessonPage.js — The Core Topic Page
 *
 * Renders a lesson with 4 tabs: Theory, Simulation, Practice, Quiz
 * Each tab is a phase of the learning topic.
 * This is the most important new page in the redesign.
 */

import { progressEngine } from '../../js/progressEngine.js';
import { eventBus }       from '../../js/eventBus.js';
import { getPathById, getModuleById, SIMULATION_ROUTE_MAP } from '../../data/pathRegistry.js';
import { AdvancedQuizMode } from '../../components/AdvancedQuizMode.js';
import { renderTokenIcon } from '../../utils/tokenIcons.js';

class LessonPage {
  static VALID_TABS = new Set(['theory', 'simulation', 'quiz']);

  constructor() {
    this.container = null;
    this._pathId = null;
    this._moduleId = null;
    this._activeTab = 'theory';
    this._simModule = null;
    this._quizEngine = null;
    this._simInitVersion = 0;
    this._unsubs = [];
  }

  init(containerEl) {
    this.container = containerEl;
    // Parse route: #/paths/fundamentals/osi-model or #/paths/fundamentals/osi-model?tab=quiz
    const hash = window.location.hash.slice(1);
    const [pathPart, queryPart] = hash.split('?');
    const parts = pathPart.split('/').filter(Boolean);
    this._pathId = parts[1] || null;
    this._moduleId = parts[2] || null;
    
    // Parse tab from query string
    const params = new URLSearchParams(queryPart || '');
    const requestedTab = params.get('tab');
    this._activeTab = this._normalizeTab(requestedTab);
    this._render();

    if (requestedTab !== this._activeTab) {
      this._syncTabInUrl(this._activeTab);
    }

    // Save learning position
    if (this._pathId && this._moduleId) {
      progressEngine.savePosition(this._pathId, this._moduleId, this._activeTab);
    }
  }

  _render() {
    const path = getPathById(this._pathId);
    const mod  = getModuleById(this._pathId, this._moduleId);

    if (!path || !mod) {
      this.container.innerHTML = `
        <div class="loading-screen">
          <h2>Topic not found</h2>
          <a href="#/paths" class="btn btn-secondary" style="margin-top:1rem;">← Back to Domains</a>
        </div>
      `;
      return;
    }

    const isDone    = progressEngine.isTopicComplete(mod.id);
    const modIndex  = path.modules.findIndex(m => m.id === mod.id);
    const nextMod   = path.modules[modIndex + 1] || null;

    this.container.innerHTML = `
      <div class="lesson-page">
        <div class="module-header">
          <div class="module-header__breadcrumb">
            <a href="#/">Home</a> › <a href="#/paths">Domains</a> › <a href="#/paths/${path.id}">${path.title}</a> › <span>${mod.code} ${mod.title}</span>
          </div>
          <div class="lesson-header-row">
            <div class="lesson-header-info">
              <h1 class="module-header__title">${renderTokenIcon(mod.icon, 'module-header__title-icon')}${mod.code} ${mod.title}</h1>
              <div class="lesson-meta">
                <span class="badge badge-${mod.difficulty === 1 ? 'success' : mod.difficulty === 2 ? 'amber' : 'error'}">
                  L${mod.difficulty}
                </span>
                <span class="text-muted text-sm">~${mod.estimatedMinutes} min</span>
                <span class="text-muted text-sm">${path.title}</span>
                ${isDone ? '<span class="badge badge-success">OK Completed</span>' : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="lesson-tabs" id="lesson-tabs" role="tablist" aria-label="Lesson content phases">
          ${this._renderTabButton('theory', 'DOCS', 'Theory')}
          ${this._renderTabButton('simulation', 'LAB', 'Simulation')}
          ${this._renderTabButton('quiz', 'EXAM', 'Quiz')}
        </div>

        <!-- Tab Content -->
        <div
          class="lesson-content"
          id="${this._getTabPanelId(this._activeTab)}"
          role="tabpanel"
          aria-labelledby="${this._getTabButtonId(this._activeTab)}"
          tabindex="0"
        >
          ${this._renderTabContent(mod, path, isDone, nextMod)}
        </div>
      </div>
    `;

    this._bindTabEvents();
  }

  _renderTabContent(mod, path, isDone, nextMod) {
    switch (this._activeTab) {
      case 'theory':     return this._renderTheory(mod);
      case 'simulation': return this._renderSimulation(mod);
      case 'quiz':       return this._renderQuiz(mod, path, isDone, nextMod);
      default:           return this._renderTheory(mod);
    }
  }

  _renderTheory(mod) {
    const sections = this._getTheorySections(mod);
    const nextTab = mod.simulation ? 'simulation' : 'quiz';
    const nextText = mod.simulation ? 'Continue to Simulation →' : 'Continue to Quiz →';
    const keyTakeaways = Array.isArray(mod.theory?.keyTakeaways) ? mod.theory.keyTakeaways.filter(Boolean) : [];

    if (sections.length === 0) {
      return this._renderTheoryFallback(mod);
    }

    return `
      <div class="theory-panel">
        ${sections.map((section, i) => this._renderTheorySection(section, i)).join('')}

        ${keyTakeaways.length > 0 ? `
          <div class="theory-takeaways anim-fade-in-up" style="animation-delay:${sections.length * 0.08}s">
            <h4 class="theory-takeaways__title">${renderTokenIcon('FOCUS', 'theory-takeaways__title-icon')}Key Takeaways</h4>
            <ul class="theory-takeaways__list">
              ${keyTakeaways.map((takeaway) => `<li>${this._escapeHtml(takeaway)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <div class="lesson-next-action">
          <button class="btn btn-primary" data-tab="${nextTab}" id="theory-next-btn">
            ${nextText}
          </button>
        </div>
      </div>
    `;
  }

  _renderTheoryFallback(mod) {
    const outlineItems = Array.isArray(mod.theoryOutline) ? mod.theoryOutline.filter(Boolean) : [];
    const fallbackTakeaways = Array.isArray(mod.theory?.keyTakeaways) ? mod.theory.keyTakeaways.filter(Boolean) : [];
    const items = outlineItems.length > 0 ? outlineItems : fallbackTakeaways;
    const hasAuthoredTheoryShell = Boolean(mod.theory);
    const nextTab = mod.simulation ? 'simulation' : 'quiz';
    const nextText = mod.simulation ? 'Continue to Simulation →' : 'Continue to Quiz →';
    const introText = hasAuthoredTheoryShell
      ? 'This lesson has a deep-dive shell, but its theory sections are not published yet. Use the current blueprint below while authored content is completed.'
      : 'This topic is architected but not fully authored yet. The final deep-dive theory will be published in a later content pass. For now, use this blueprint to preview the core ideas that will be covered.';

    return `
      <div class="theory-panel">
        <div class="theory-section anim-fade-in-up">
          <h3 class="theory-section__title">${items.length > 0 ? 'Phase 1 Theory Blueprint' : 'Theory Publishing In Progress'}</h3>
          <div class="theory-section__content">
            <p class="text-secondary">${this._escapeHtml(introText)}</p>
            ${items.length > 0 ? `
              <ul class="theory-takeaways__list">
                ${items.map((item) => `<li>${this._escapeHtml(item)}</li>`).join('')}
              </ul>
            ` : `
              <p class="text-secondary">No blueprint bullets are attached to this lesson yet, but the simulation and quiz flow remain available.</p>
            `}
          </div>
        </div>
        ${this._renderWorkflow(mod.authoringWorkflow)}
        <div class="lesson-next-action">
          <button class="btn btn-primary" data-tab="${nextTab}" id="theory-next-btn">
            ${nextText}
          </button>
        </div>
      </div>
    `;
  }

  _renderTheorySection(section, index) {
    const title = this._escapeHtml(section?.title || 'Theory Section');
    const legacyContent = typeof section?.content === 'string' && section.content.trim().length > 0
      ? `<div class="theory-section__content theory-section__content--legacy">${this._sanitizeTrustedHtml(section.content)}</div>`
      : '';
    const blocks = Array.isArray(section?.blocks) && section.blocks.length > 0
      ? `<div class="theory-blocks">${section.blocks.map((block) => this._renderTheoryBlock(block)).join('')}</div>`
      : '';

    return `
      <section class="theory-section anim-fade-in-up" style="animation-delay:${index * 0.08}s">
        <div class="theory-section__header">
          <p class="theory-section__eyebrow">Field Manual Section ${String(index + 1).padStart(2, '0')}</p>
          <h3 class="theory-section__title">${title}</h3>
        </div>
        ${legacyContent}
        ${blocks}
      </section>
    `;
  }

  _renderTheoryBlock(block) {
    if (!block || typeof block !== 'object') return '';

    switch (block.type) {
      case 'paragraph':
      case 'richText':
        return this._renderRichTextBlock(block);
      case 'keyTopic':
        return this._renderKeyTopicBlock(block);
      case 'note':
        return this._renderNoteBlock(block);
      case 'figure':
      case 'image':
        return this._renderFigureBlock(block);
      case 'keyTerms':
        return this._renderKeyTermsBlock(block);
      case 'table':
      case 'comparisonTable':
        return this._renderTableBlock(block);
      case 'steps':
      case 'checklist':
        return this._renderStepsBlock(block);
      default:
        return '';
    }
  }

  _renderRichTextBlock(block) {
    const heading = block.title ? `<h4 class="theory-block__title">${this._escapeHtml(block.title)}</h4>` : '';
    const content = typeof block.html === 'string'
      ? this._sanitizeTrustedHtml(block.html)
      : this._wrapParagraphs(block.content);

    if (!content) return '';

    return `
      <div class="theory-block theory-block--rich-text">
        ${heading}
        <div class="theory-rich-text">${content}</div>
      </div>
    `;
  }

  _renderKeyTopicBlock(block) {
    const items = Array.isArray(block.items) && block.items.length > 0
      ? `<ul class="theory-callout__list">${block.items.map((item) => `<li>${this._escapeHtml(item)}</li>`).join('')}</ul>`
      : '';
    const content = block.content ? `<p>${this._escapeHtml(block.content)}</p>` : '';

    return `
      <section class="theory-block theory-callout theory-callout--key-topic">
        <p class="theory-callout__label">Key Topic</p>
        <h4 class="theory-callout__title">${this._escapeHtml(block.title || 'Operational Focus')}</h4>
        ${content}
        ${items}
      </section>
    `;
  }

  _renderNoteBlock(block) {
    const variant = this._getNoteVariant(block.variant);
    const title = block.title || this._getNoteTitle(variant);
    const content = typeof block.html === 'string'
      ? this._sanitizeTrustedHtml(block.html)
      : this._wrapParagraphs(block.content);

    return `
      <aside class="theory-block theory-note theory-note--${variant}">
        <p class="theory-note__label">${this._escapeHtml(this._getNoteTitle(variant))}</p>
        <h4 class="theory-note__title">${this._escapeHtml(title)}</h4>
        <div class="theory-note__content">${content}</div>
      </aside>
    `;
  }

  _renderFigureBlock(block) {
    if (!block.src) return '';

    const title = block.title ? `<h4 class="theory-block__title">${this._escapeHtml(block.title)}</h4>` : '';
    const caption = block.caption ? `<figcaption class="theory-figure__caption">${this._escapeHtml(block.caption)}</figcaption>` : '';

    return `
      <figure class="theory-block theory-figure">
        ${title}
        <img class="theory-figure__image" src="${this._escapeAttr(block.src)}" alt="${this._escapeAttr(block.alt || '')}" loading="lazy" />
        ${caption}
      </figure>
    `;
  }

  _renderKeyTermsBlock(block) {
    if (!Array.isArray(block.terms) || block.terms.length === 0) return '';

    return `
      <section class="theory-block theory-terms">
        <h4 class="theory-block__title">${this._escapeHtml(block.title || 'Key Terms')}</h4>
        <dl class="theory-terms__grid">
          ${block.terms.map((entry) => {
            const term = typeof entry === 'string' ? entry : entry.term;
            const definition = typeof entry === 'string' ? '' : entry.definition;

            return `
              <div class="theory-terms__item">
                <dt>${this._escapeHtml(term || '')}</dt>
                <dd>${this._escapeHtml(definition || '')}</dd>
              </div>
            `;
          }).join('')}
        </dl>
      </section>
    `;
  }

  _renderTableBlock(block) {
    const columns = Array.isArray(block.columns) ? block.columns : [];
    const rows = Array.isArray(block.rows) ? block.rows : [];

    if (columns.length === 0 || rows.length === 0) return '';

    const normalizedColumns = columns.map((column) => typeof column === 'string'
      ? { label: column, key: column }
      : { label: column.label || column.key || '', key: column.key || column.label || '' });

    return `
      <section class="theory-block theory-data-table">
        <h4 class="theory-block__title">${this._escapeHtml(block.title || 'Reference Table')}</h4>
        ${block.description ? `<p class="theory-data-table__description">${this._escapeHtml(block.description)}</p>` : ''}
        <div class="theory-table-wrap">
          <table class="theory-table">
            <thead>
              <tr>
                ${normalizedColumns.map((column) => `<th scope="col">${this._escapeHtml(column.label)}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows.map((row) => {
                const values = Array.isArray(row)
                  ? row
                  : normalizedColumns.map((column) => row?.[column.key] ?? '');

                return `
                  <tr>
                    ${values.map((value) => `<td>${this._escapeHtml(String(value ?? ''))}</td>`).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>
    `;
  }

  _renderStepsBlock(block) {
    const items = Array.isArray(block.items) ? block.items : [];
    if (items.length === 0) return '';

    const isChecklist = block.type === 'checklist';
    const listClass = isChecklist ? 'theory-checklist' : 'theory-steps';

    return `
      <section class="theory-block theory-sequence">
        <h4 class="theory-block__title">${this._escapeHtml(block.title || (isChecklist ? 'Review Checklist' : 'Process Steps'))}</h4>
        <ol class="${listClass}">
          ${items.map((item) => `<li>${this._escapeHtml(item)}</li>`).join('')}
        </ol>
      </section>
    `;
  }

  _getNoteVariant(variant) {
    const allowed = new Set(['note', 'examTip', 'commonMistake', 'realWorld']);
    return allowed.has(variant) ? variant : 'note';
  }

  _getNoteTitle(variant) {
    const titles = {
      note: 'Study Note',
      examTip: 'Exam Tip',
      commonMistake: 'Common Mistake',
      realWorld: 'Real-World Context',
    };

    return titles[variant] || titles.note;
  }

  _wrapParagraphs(content) {
    if (typeof content !== 'string' || content.trim().length === 0) return '';

    return content
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => `<p>${this._escapeHtml(paragraph)}</p>`)
      .join('');
  }

  _getTheorySections(mod) {
    return Array.isArray(mod?.theory?.sections)
      ? mod.theory.sections.filter((section) => section && typeof section === 'object')
      : [];
  }

  _normalizeTab(tabName) {
    return LessonPage.VALID_TABS.has(tabName) ? tabName : 'theory';
  }

  _getTabButtonId(tabName) {
    return `lesson-tab-${tabName}`;
  }

  _getTabPanelId(tabName) {
    return `lesson-panel-${tabName}`;
  }

  _renderTabButton(tabName, icon, label) {
    const isActive = this._activeTab === tabName;

    return `
      <button
        class="lesson-tab ${isActive ? 'lesson-tab--active' : ''}"
        id="${this._getTabButtonId(tabName)}"
        data-tab="${tabName}"
        role="tab"
        type="button"
        aria-selected="${isActive ? 'true' : 'false'}"
        aria-controls="${this._getTabPanelId(tabName)}"
        tabindex="${isActive ? '0' : '-1'}"
      >
        <span class="lesson-tab__icon">${renderTokenIcon(icon, 'lesson-tab__icon-svg')}</span> ${label}
      </button>
    `;
  }

  _updateTabUi(tabName) {
    this.container.querySelectorAll('.lesson-tab').forEach((tabEl) => {
      const isActive = tabEl.getAttribute('data-tab') === tabName;
      tabEl.classList.toggle('lesson-tab--active', isActive);
      tabEl.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tabEl.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    const contentEl = this.container.querySelector('.lesson-content');
    if (contentEl) {
      contentEl.id = this._getTabPanelId(tabName);
      contentEl.setAttribute('aria-labelledby', this._getTabButtonId(tabName));
    }
  }

  _setActiveTab(tabName, options = {}) {
    const { shouldFocusTab = false } = options;
    const nextTab = this._normalizeTab(tabName);
    this._teardownQuizEngine();
    this._teardownSimulationEngine();
    this._activeTab = nextTab;

    const contentEl = this.container.querySelector('.lesson-content');
    const path = getPathById(this._pathId);
    const mod = getModuleById(this._pathId, this._moduleId);

    if (!contentEl || !path || !mod) return;

    this._updateTabUi(nextTab);

    const isDone = progressEngine.isTopicComplete(mod.id);
    const modIndex = path.modules.findIndex((moduleEntry) => moduleEntry.id === mod.id);
    const nextMod = path.modules[modIndex + 1] || null;

    contentEl.innerHTML = this._renderTabContent(mod, path, isDone, nextMod);
    this._syncTabInUrl(nextTab);
    progressEngine.savePosition(this._pathId, this._moduleId, nextTab);
    this._bindTabEvents();

    if (shouldFocusTab) {
      this.container.querySelector(`.lesson-tab[data-tab="${nextTab}"]`)?.focus();
    }

  }

  _syncTabInUrl(tabName) {
    if (!this._pathId || !this._moduleId) return;

    const url = new URL(window.location.href);
    url.hash = `#/paths/${this._pathId}/${this._moduleId}?tab=${this._normalizeTab(tabName)}`;
    window.history.replaceState(window.history.state, '', url);
  }

  _sanitizeTrustedHtml(html) {
    if (typeof html !== 'string') return '';

    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\s(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '');
  }

  _escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  _escapeAttr(value) {
    return this._escapeHtml(value);
  }

  _renderSimulation(mod) {
    if (!mod.simulation) {
      return `
        <div class="sim-embed-panel">
          <p class="text-muted">No simulation plan is attached to this topic yet.</p>
          <div class="lesson-next-action" style="margin-top: 2rem;">
            <button class="btn btn-primary" data-tab="quiz" id="sim-next-btn">
              Ready to take Quiz →
            </button>
          </div>
        </div>
      `;
    }

    const simRoute = mod.simulation.launchRoute || SIMULATION_ROUTE_MAP[mod.simulation.id] || null;
    const inlineEngineSupported = !mod.simulation.implemented && this._supportsInlineSimulationEngine(mod.simulationType);

    return `
      <div class="sim-embed-panel">
        <div class="sim-embed-header">
          <div>
            <h3>${renderTokenIcon('LAB', 'learning-token-icon')} ${mod.simulation.label}</h3>
            <p class="text-secondary text-sm">
              ${mod.simulation.implemented
                ? 'Interactive simulation available now.'
                : inlineEngineSupported
                  ? 'Lesson-integrated simulation engine available below.'
                  : 'Simulation architecture defined. Engine implementation will be added in a later phase.'}
            </p>
          </div>
        </div>
        <div class="sim-embed-container" id="sim-embed-container">
          ${inlineEngineSupported ? `
            <div id="sim-engine-root"></div>
          ` : `
            <div class="sim-embed-placeholder">
              <div class="sim-embed-placeholder__icon">${renderTokenIcon('LAB', 'learning-token-icon')}</div>
              <h3>${mod.simulation.label}</h3>
              <p class="text-secondary">
                Engine family: <strong>${mod.simulationCatalog?.label || mod.simulationType}</strong>
              </p>
              <p class="text-secondary">
                ${mod.simulationCatalog?.description || 'Reusable simulation engine will be assigned here.'}
              </p>
              ${simRoute ? `
                <a href="#${simRoute}" class="btn btn-primary sim-launch-btn" id="sim-launch-btn">
                  ${mod.simulation.implemented ? '▶ Launch Simulation' : 'Open Simulation Blueprint'}
                </a>
              ` : ''}
            </div>
          `}
        </div>
      </div>
    `;
  }

  _supportsInlineSimulationEngine(simulationType) {
    return new Set([
      'attack-defense',
      'cli-sandbox',
      'comparison-viewer',
      'config-lab',
      'diagram-builder',
      'state-machine',
      'topology-builder',
    ]).has(simulationType);
  }

  async _initSimulation(mod) {
    this._teardownSimulationEngine();
    const initVersion = ++this._simInitVersion;
    const simRoot = this.container?.querySelector('#sim-engine-root');
    if (!simRoot || !mod?.simulationType) return;

    try {
      const engineLoaders = {
        'attack-defense': async () => (await import('../../components/attackDefenseEngine.js')).AttackDefenseEngine,
        'cli-sandbox': async () => (await import('../../components/cliSandboxEngine.js')).CliSandboxEngine,
        'comparison-viewer': async () => (await import('../../components/comparisonViewerEngine.js')).ComparisonViewerEngine,
        'config-lab': async () => (await import('../../components/configLabEngine.js')).ConfigLabEngine,
        'diagram-builder': async () => (await import('../../components/diagramBuilderEngine.js')).DiagramBuilderEngine,
        'state-machine': async () => (await import('../../components/stateMachineEngine.js')).StateMachineEngine,
        'topology-builder': async () => (await import('../../components/topologyBuilderEngine.js')).TopologyBuilderEngine,
      };

      const loadEngine = engineLoaders[mod.simulationType];
      if (!loadEngine) return;

      const Engine = await loadEngine();
      if (initVersion !== this._simInitVersion || this._activeTab !== 'simulation' || !this.container?.contains(simRoot)) return;
      this._simModule = new Engine({ topic: mod });
      this._simModule.mount(simRoot);
    } catch (err) {
      console.warn('[LessonPage] Could not initialize simulation engine:', mod.simulationType, err);
      simRoot.innerHTML = '<p class="text-muted">Simulation engine could not be loaded for this topic.</p>';
    }
  }

  _teardownSimulationEngine() {
    this._simInitVersion += 1;
    if (this._simModule && typeof this._simModule.destroy === 'function') {
      this._simModule.destroy();
    }
    this._simModule = null;
  }

  _teardownQuizEngine() {
    if (this._quizEngine && typeof this._quizEngine.destroy === 'function') {
      this._quizEngine.destroy();
    }
    this._quizEngine = null;
  }

  _renderQuiz(mod, path, isDone, nextMod) {
    if (!mod.quiz) {
      return '<p class="text-muted">No quiz is planned for this topic.</p>';
    }

    if (!mod.quiz.questions && !mod.quiz.bank) {
      return `
        <div class="quiz-panel">
          <div class="quiz-panel__header">
            <h3>EXAM Topic Quiz Blueprint</h3>
            <p class="text-secondary text-sm">
              Assessment type: ${mod.quiz.type}. Pass mark: ${mod.quiz.passingScore}%.
              Question authoring is planned for a later content pass.
            </p>
          </div>
          <div class="card" style="margin-top:1.5rem;">
            <h4 style="margin-top:0;">Assessment Plan</h4>
            <ul class="theory-takeaways__list">
              <li>This topic will use ${mod.quiz.type} questions once the quiz bank is authored.</li>
              <li>Topic progression will remain locked until a quiz is available for this topic.</li>
              <li>Domain final exams unlock only after every topic quiz in the domain passes.</li>
            </ul>
          </div>
          ${this._renderWorkflow(mod.authoringWorkflow)}
          ${isDone ? `
            <div class="lesson-complete-card">
              <div class="lesson-complete-card__icon">${renderTokenIcon('OK', 'lesson-complete-card__status-icon')}</div>
              <h3>Topic Complete</h3>
              <p class="text-secondary">This topic is already marked complete in local progress.</p>
              ${nextMod ? `
                <a href="#/paths/${path.id}/${nextMod.id}" class="btn btn-primary">Next: ${nextMod.title} →</a>
              ` : `
                <a href="#/paths/${path.id}" class="btn btn-primary">← Back to ${path.title}</a>
              `}
            </div>
          ` : ''}
        </div>
      `;
    }

    return `
      <div class="quiz-panel">
        <div class="quiz-panel__header">
          <h3>EXAM Topic Quiz</h3>
          <p class="text-secondary text-sm">
            Answer ${mod.quiz.count} questions. Score at least ${mod.quiz.passingScore}% to complete this topic.
          </p>
        </div>
        <div id="quiz-container"></div>
        ${isDone ? `
          <div class="lesson-complete-card">
            <div class="lesson-complete-card__icon">${renderTokenIcon('OK', 'lesson-complete-card__status-icon')}</div>
            <h3>Topic Complete!</h3>
            <p class="text-secondary">You've already completed this topic. Take the quiz again to improve your score, or continue to the next topic.</p>
            ${nextMod ? `
              <a href="#/paths/${path.id}/${nextMod.id}" class="btn btn-primary">Next: ${nextMod.title} →</a>
            ` : `
              <a href="#/paths/${path.id}" class="btn btn-primary">← Back to ${path.title}</a>
            `}
          </div>
        ` : ''}
      </div>
    `;
  }

  _bindTabEvents() {
    const tabs = this.container.querySelectorAll('.lesson-tab');
    tabs.forEach((tab) => {
      if (tab.dataset.tabBound === 'true') return;
      tab.dataset.tabBound = 'true';

      tab.addEventListener('click', (e) => {
        e.preventDefault();
        this._setActiveTab(tab.getAttribute('data-tab'));
      });

      tab.addEventListener('keydown', (e) => {
        const tabButtons = Array.from(this.container.querySelectorAll('.lesson-tab'));
        const currentIndex = tabButtons.indexOf(tab);
        if (currentIndex === -1) return;

        let nextIndex = null;
        if (e.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabButtons.length;
        if (e.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabButtons.length) % tabButtons.length;
        if (e.key === 'Home') nextIndex = 0;
        if (e.key === 'End') nextIndex = tabButtons.length - 1;

        if (nextIndex === null) return;

        e.preventDefault();
        this._setActiveTab(tabButtons[nextIndex].getAttribute('data-tab'), { shouldFocusTab: true });
      });
    });

    const tabTriggers = this.container.querySelectorAll('[data-tab]:not(.lesson-tab)');
    tabTriggers.forEach((trigger) => {
      if (trigger.dataset.tabBound === 'true') return;
      trigger.dataset.tabBound = 'true';

      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        this._setActiveTab(trigger.getAttribute('data-tab'));
      });
    });

    // Auto-init quiz if already on quiz tab
    if (this._activeTab === 'quiz') {
      const mod = getModuleById(this._pathId, this._moduleId);
      if (mod?.quiz) this._initQuiz(mod);
    }

    if (this._activeTab === 'simulation') {
      const mod = getModuleById(this._pathId, this._moduleId);
      if (mod?.simulation) this._initSimulation(mod);
    }
  }

  async _initQuiz(mod) {
    this._teardownQuizEngine();
    const quizContainer = this.container.querySelector('#quiz-container');
    if (!quizContainer) return;

    let questions = [];

    if (mod.quiz.questions) {
      // Disable shuffling for inline questions to preserve the 1-10 difficulty curve
      questions = mod.quiz.questions.slice(0, mod.quiz.count || 10);
    } else if (mod.quiz.bank) {
      // Dynamically import the quiz bank
      try {
        const bankModule = await import(`../../data/${mod.quiz.bank}.js`);
        const allQuestions = bankModule.default || bankModule.questions || Object.values(bankModule).flat();
        // Pick random subset
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        questions = shuffled.slice(0, mod.quiz.count || 5);
      } catch (err) {
        console.warn('[LessonPage] Could not load quiz bank:', mod.quiz.bank, err);
        quizContainer.innerHTML = '<p class="text-muted">Quiz questions could not be loaded.</p>';
        return;
      }
    } else {
      quizContainer.innerHTML = '<p class="text-muted">Quiz authoring is planned but no validated question bank exists yet.</p>';
      return;
    }

    if (questions.length === 0) {
      quizContainer.innerHTML = '<p class="text-muted">No quiz questions available yet.</p>';
      return;
    }

    // Render the beautiful "Start Quiz" card
    quizContainer.innerHTML = `
      <div class="card" style="margin-top:2rem; background:linear-gradient(135deg, rgba(0,206,209,0.06), rgba(206,147,216,0.06)); border:1px solid rgba(0,206,209,0.2);">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
          <div>
            <h2 style="margin:0 0 0.4rem 0; font-size:1.2rem; display:flex; align-items:center; gap:0.5rem;">
              ${renderTokenIcon('FOCUS', 'learning-token-icon')} Quiz Mode
            </h2>
            <p style="color:var(--color-text-muted); margin:0; font-size:0.85rem; max-width:420px; line-height:1.5;">
              Test your knowledge with progressive difficulty, a 60-second timer, and spaced repetition for topics you need to review.
            </p>
          </div>
          <button class="btn btn-primary" id="btn-launch-quiz" style="
            padding:0.75rem 1.75rem; border-radius:12px; font-size:1rem; font-weight:700;
            background:linear-gradient(135deg, #00CED1, #7C4DFF);
            border:none; color:white; cursor:pointer;
            box-shadow:0 4px 20px rgba(0,206,209,0.3);
            transition:all 0.3s ease;
          " onmouseover="this.style.transform='translateY(-2px) scale(1.03)';this.style.boxShadow='0 6px 30px rgba(0,206,209,0.45)'" onmouseout="this.style.transform='none';this.style.boxShadow='0 4px 20px rgba(0,206,209,0.3)'">
            ▶ Start Quiz
          </button>
        </div>
      </div>
    `;

    const startBtn = quizContainer.querySelector('#btn-launch-quiz');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this._quizEngine = new AdvancedQuizMode(quizContainer, questions, {
          passingScore: mod.quiz.passingScore || 80,
          count: mod.quiz.count || 10,
          onComplete: (result) => {
             const path = getPathById(this._pathId);
             const m = getModuleById(this._pathId, this._moduleId);
             if (!m) return;
             const isPassing = result.percent >= (m.quiz.passingScore || 80);
             if (isPassing) {
               progressEngine.completeModule(m.id, this._pathId, m.rewards || {}, result.percent);
             }
             const modIndex = path.modules.findIndex(x => x.id === m.id);
             const nextMod = path.modules[modIndex + 1] || null;
             
              if (isPassing) {
                  if (nextMod) {
                      eventBus.emit('nav:route-change', { route: `/paths/${path.id}/${nextMod.id}` });
                  } else {
                      eventBus.emit('nav:route-change', { route: `/paths/${path.id}` });
                  }
                  // Reset the hash slightly if we are re-rendering the same base route
                  // Or we can programmatically close the container if it doesn't refresh automatically
           }
         },
          onClose: () => {
             this._teardownQuizEngine();
             this._initQuiz(mod);
           }
         });
      });
    }
  }

  start() {}
  step() {}
  reset() {
    this._teardownQuizEngine();
    this._teardownSimulationEngine();
    this._render();
  }

  _renderWorkflow(steps = []) {
    if (!Array.isArray(steps) || steps.length === 0) return '';

    return `
      <div class="theory-takeaways anim-fade-in-up" style="animation-delay:0.12s">
        <h4 class="theory-takeaways__title">${renderTokenIcon('TIP', 'theory-takeaways__title-icon')}Authoring Workflow</h4>
        <ul class="theory-takeaways__list">
          ${steps.map((step) => `<li>${step}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  destroy() {
    this._teardownSimulationEngine();
    this._teardownQuizEngine();
    this._unsubs.forEach(fn => fn());
    this._unsubs = [];
    this.container = null;
    this._simModule = null;
  }
}

export default new LessonPage();
