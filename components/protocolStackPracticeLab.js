import { renderTokenIcon } from '../utils/tokenIcons.js';

const DEFAULT_MISSIONS = [
  {
    id: 'pdu-ladder',
    step: 'Checkpoint 01',
    label: 'PDU ladder',
    title: 'Assemble the encapsulation path',
    signal: 'PDU names and wrapping order',
    prompt: 'A workstation generates an HTTPS request. Which sequence correctly describes the payload as it moves down the sending host stack?',
    operatorNote: 'Layer names matter because each layer adds a specific kind of control information before handing the payload down.',
    answer: 'a',
    successTitle: 'Encapsulation order confirmed',
    successBody: 'Application data becomes a segment at Layer 4, a packet at Layer 3, a frame at Layer 2, and bits at Layer 1.',
    retryBody: 'Rebuild the stack in the order headers are added: Transport first, then Network, then Data Link.',
    options: [
      { id: 'a', label: 'Data -> Segment -> Packet -> Frame -> Bits' },
      { id: 'b', label: 'Bits -> Frame -> Packet -> Segment -> Data' },
      { id: 'c', label: 'Data -> Packet -> Segment -> Frame -> Bits' },
      { id: 'd', label: 'Data -> Segment -> Frame -> Packet -> Bits' },
    ],
  },
  {
    id: 'transport-duty',
    step: 'Checkpoint 02',
    label: 'Session control',
    title: 'Locate the port-number decision point',
    signal: 'Transport responsibilities',
    prompt: 'Which layer adds source and destination port numbers so the receiving host can hand traffic to the right application?',
    operatorNote: 'Port numbers identify the conversation inside the endpoint. That function sits above logical addressing and below the application payload.',
    answer: 'b',
    successTitle: 'Transport layer identified',
    successBody: 'The Transport layer adds TCP or UDP port numbers, manages segmentation, and supports end-to-end conversations.',
    retryBody: 'If the question is about ports, segmentation, or end-to-end sessions, inspect Layer 4 first.',
    options: [
      { id: 'a', label: 'Application layer' },
      { id: 'b', label: 'Transport layer' },
      { id: 'c', label: 'Network layer' },
      { id: 'd', label: 'Physical layer' },
    ],
  },
  {
    id: 'router-hop',
    step: 'Checkpoint 03',
    label: 'Router hop logic',
    title: 'Decide what changes at the first router hop',
    signal: 'End-to-end versus local delivery data',
    prompt: 'A PC sends traffic to a remote server through a router. Which statement best describes what changes on the first hop?',
    operatorNote: 'Routers preserve end-to-end Layer 3 intent but rebuild the local Layer 2 envelope for each network segment unless translation is introduced elsewhere.',
    answer: 'c',
    successTitle: 'Address behavior mapped correctly',
    successBody: 'The source and destination IP addresses stay tied to the endpoints, while the source and destination MAC addresses are rewritten for the local link.',
    retryBody: 'Separate local delivery from end-to-end delivery. Ethernet changes hop by hop; IP normally does not.',
    options: [
      { id: 'a', label: 'Both MAC and IP addresses stay the same across the router hop.' },
      { id: 'b', label: 'The router rewrites the source IP address to its own interface before forwarding.' },
      { id: 'c', label: 'MAC addresses change for the next link, while the original source and destination IP addresses stay the same.' },
      { id: 'd', label: 'Port numbers and IP addresses are both replaced by the router on every hop.' },
    ],
  },
  {
    id: 'protocol-map',
    step: 'Checkpoint 04',
    label: 'Protocol map',
    title: 'Map protocols to the correct layers',
    signal: 'OSI and TCP/IP alignment',
    prompt: 'Which stack mapping is correct for an HTTPS web session running over Ethernet?',
    operatorNote: 'The practical TCP/IP model compresses layers, but the responsibilities still line up cleanly with OSI when you map real protocols.',
    answer: 'a',
    successTitle: 'Protocol stack aligned',
    successBody: 'HTTPS belongs to the Application layer, TCP to Transport, IP to Network, and Ethernet to Data Link.',
    retryBody: 'Keep the mapping operational: apps create payload, Transport manages the conversation, Network routes, and Data Link handles local framing.',
    options: [
      { id: 'a', label: 'Application = HTTPS, Transport = TCP, Network = IP, Data Link = Ethernet' },
      { id: 'b', label: 'Application = TCP, Transport = IP, Network = Ethernet, Data Link = HTTPS' },
      { id: 'c', label: 'Application = Ethernet, Transport = HTTPS, Network = TCP, Data Link = IP' },
      { id: 'd', label: 'Application = IP, Transport = Ethernet, Network = HTTPS, Data Link = TCP' },
    ],
  },
  {
    id: 'fault-isolation',
    step: 'Checkpoint 05',
    label: 'Fault isolation',
    title: 'Start troubleshooting at the earliest failed function',
    signal: 'Layer-based diagnosis',
    prompt: 'A NIC shows no link light and the host never places bits onto the medium. Which layer should you inspect first?',
    operatorNote: 'Troubleshooting works fastest when you start at the first failed function. No transmitted bits means the problem exists before framing or routing can happen.',
    answer: 'd',
    successTitle: 'Failure scope isolated',
    successBody: 'No link light and no bits on the wire point to Layer 1 issues such as cabling, transceivers, duplex negotiation, or interface state.',
    retryBody: 'If traffic never becomes electrical or optical signaling, the Physical layer is the first boundary to check.',
    options: [
      { id: 'a', label: 'Application layer' },
      { id: 'b', label: 'Network layer' },
      { id: 'c', label: 'Data Link layer' },
      { id: 'd', label: 'Physical layer' },
    ],
  },
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cloneResponses(responses) {
  return Object.entries(responses || {}).reduce((acc, [missionId, response]) => {
    acc[missionId] = {
      selectedOptionId: response?.selectedOptionId || null,
      feedback: response?.feedback
        ? {
            variant: response.feedback.variant || null,
            title: response.feedback.title || '',
            body: response.feedback.body || '',
          }
        : null,
    };
    return acc;
  }, {});
}

export class ProtocolStackPracticeLab {
  constructor(options = {}) {
    this.container = null;
    this._missions = Array.isArray(options.missions) && options.missions.length > 0
      ? options.missions
      : DEFAULT_MISSIONS;
    this._onLaunchQuiz = typeof options.onLaunchQuiz === 'function' ? options.onLaunchQuiz : null;
    this._onComplete = typeof options.onComplete === 'function' ? options.onComplete : null;
    this._handleClick = this._handleClick.bind(this);
    this._completionAnnounced = false;
    this._hydrateState(options.initialState);
  }

  mount(containerEl) {
    if (!containerEl) return;
    this.container = containerEl;
    this.container.addEventListener('click', this._handleClick);
    this._render();
  }

  destroy() {
    if (this.container) {
      this.container.removeEventListener('click', this._handleClick);
    }
    this.container = null;
  }

  getState() {
    return {
      currentIndex: this._currentIndex,
      completedMissionIds: [...this._completedMissionIds],
      responses: cloneResponses(this._responses),
      isComplete: this._isComplete(),
    };
  }

  _hydrateState(initialState = {}) {
    const safeInitialState = initialState && typeof initialState === 'object' ? initialState : {};
    const missionIds = new Set(this._missions.map((mission) => mission.id));
    const completedMissionIds = Array.isArray(safeInitialState.completedMissionIds)
      ? safeInitialState.completedMissionIds.filter((missionId) => missionIds.has(missionId))
      : [];

    this._completedMissionIds = new Set(completedMissionIds);
    this._responses = cloneResponses(safeInitialState.responses || {});
    this._currentIndex = Number.isInteger(safeInitialState.currentIndex)
      ? Math.min(Math.max(safeInitialState.currentIndex, 0), this._missions.length - 1)
      : 0;

    const maxUnlocked = this._getMaxUnlockedIndex();
    if (this._currentIndex > maxUnlocked) {
      this._currentIndex = maxUnlocked;
    }

    if (this._isComplete()) {
      this._currentIndex = this._missions.length - 1;
      this._completionAnnounced = true;
    }
  }

  _getMaxUnlockedIndex() {
    return Math.min(this._completedMissionIds.size, this._missions.length - 1);
  }

  _isUnlocked(index) {
    return index >= 0 && index <= this._getMaxUnlockedIndex();
  }

  _isComplete() {
    return this._completedMissionIds.size === this._missions.length;
  }

  _getResponse(missionId) {
    return this._responses[missionId] || { selectedOptionId: null, feedback: null };
  }

  _setResponse(missionId, nextResponse) {
    this._responses[missionId] = {
      ...this._getResponse(missionId),
      ...nextResponse,
    };
  }

  _setCurrentIndex(index) {
    if (!this._isUnlocked(index)) return;
    this._currentIndex = index;
    this._render();
  }

  _selectOption(optionId) {
    const mission = this._missions[this._currentIndex];
    if (!mission || this._completedMissionIds.has(mission.id)) return;
    this._setResponse(mission.id, { selectedOptionId: optionId, feedback: null });
    this._render();
  }

  _evaluateActiveMission() {
    const mission = this._missions[this._currentIndex];
    if (!mission) return;

    const response = this._getResponse(mission.id);
    if (!response.selectedOptionId) {
      this._setResponse(mission.id, {
        feedback: {
          variant: 'warning',
          title: 'Select an answer first',
          body: 'Choose the best operational answer, then validate the checkpoint.',
        },
      });
      this._render();
      return;
    }

    if (response.selectedOptionId === mission.answer) {
      this._completedMissionIds.add(mission.id);
      this._setResponse(mission.id, {
        feedback: {
          variant: 'correct',
          title: mission.successTitle,
          body: mission.successBody,
        },
      });

      if (this._isComplete() && !this._completionAnnounced) {
        this._completionAnnounced = true;
        if (this._onComplete) {
          this._onComplete(this.getState());
        }
      }
    } else {
      this._setResponse(mission.id, {
        feedback: {
          variant: 'incorrect',
          title: 'Checkpoint failed',
          body: mission.retryBody,
        },
      });
    }

    this._render();
  }

  _advanceToNextMission() {
    const nextIndex = Math.min(this._currentIndex + 1, this._missions.length - 1);
    this._setCurrentIndex(nextIndex);
  }

  _resetLab() {
    this._currentIndex = 0;
    this._completedMissionIds = new Set();
    this._responses = {};
    this._completionAnnounced = false;
    this._render();
  }

  _handleClick(event) {
    const missionButton = event.target.closest('[data-mission-index]');
    if (missionButton && this.container?.contains(missionButton)) {
      const missionIndex = Number.parseInt(missionButton.dataset.missionIndex || '', 10);
      if (Number.isInteger(missionIndex)) {
        this._setCurrentIndex(missionIndex);
      }
      return;
    }

    const optionButton = event.target.closest('[data-option-id]');
    if (optionButton && this.container?.contains(optionButton)) {
      this._selectOption(optionButton.dataset.optionId || '');
      return;
    }

    const actionButton = event.target.closest('[data-lab-action]');
    if (!actionButton || !this.container?.contains(actionButton)) return;

    const action = actionButton.dataset.labAction;
    if (action === 'validate') this._evaluateActiveMission();
    if (action === 'next') this._advanceToNextMission();
    if (action === 'reset') this._resetLab();
    if (action === 'launch-quiz' && this._isComplete() && this._onLaunchQuiz) {
      this._onLaunchQuiz();
    }
  }

  _render() {
    if (!this.container) return;

    const completedCount = this._completedMissionIds.size;
    const progressPercent = Math.round((completedCount / this._missions.length) * 100);
    const activeMission = this._missions[this._currentIndex];

    this.container.innerHTML = `
      <section class="protocol-lab anim-fade-in-up" aria-label="OSI and TCP/IP practice lab">
        <div class="protocol-lab__header">
          <div>
            <p class="protocol-lab__eyebrow">${renderTokenIcon('LAB', 'learning-token-icon')} Guided practice lab</p>
            <h2 class="protocol-lab__title">Command Deck: OSI and TCP/IP Models</h2>
            <p class="protocol-lab__intro">
              Clear each checkpoint to prove you can read the stack, follow encapsulation, and isolate the right layer when a path breaks.
            </p>
          </div>
          <div class="protocol-lab__meter" aria-label="Lab progress">
            <span class="protocol-lab__meter-label">Lab progress</span>
            <strong>${completedCount} / ${this._missions.length} cleared</strong>
            <div class="protocol-lab__meter-bar" aria-hidden="true">
              <span style="width:${progressPercent}%;"></span>
            </div>
          </div>
        </div>

        <div class="protocol-lab__shell">
          <aside class="protocol-lab__rail" aria-label="Lab checkpoints">
            ${this._missions.map((mission, index) => this._renderMissionButton(mission, index)).join('')}
          </aside>

          <div class="protocol-lab__workspace">
            ${this._isComplete() ? this._renderCompletionState() : this._renderActiveMission(activeMission)}
          </div>
        </div>

        <div class="protocol-lab__reference" aria-label="Quick reference">
          <section class="protocol-lab__reference-block">
            <p class="protocol-lab__reference-label">PDU ladder</p>
            <h3>Data -> Segment -> Packet -> Frame -> Bits</h3>
            <p>Name the payload by the layer that most recently wrapped it.</p>
          </section>
          <section class="protocol-lab__reference-block">
            <p class="protocol-lab__reference-label">Hop behavior</p>
            <h3>IP stays end to end. MAC changes per link.</h3>
            <p>Routers preserve the Layer 3 destination while rebuilding each Layer 2 envelope.</p>
          </section>
          <section class="protocol-lab__reference-block">
            <p class="protocol-lab__reference-label">Troubleshooting cue</p>
            <h3>Start where the first function fails.</h3>
            <p>If the host cannot even produce bits, investigate Physical before framing, routing, or applications.</p>
          </section>
        </div>
      </section>
    `;
  }

  _renderMissionButton(mission, index) {
    const isComplete = this._completedMissionIds.has(mission.id);
    const isCurrent = index === this._currentIndex;
    const isUnlocked = this._isUnlocked(index);
    const statusClass = isComplete
      ? 'protocol-lab__mission--complete'
      : isCurrent
        ? 'protocol-lab__mission--current'
        : isUnlocked
          ? 'protocol-lab__mission--ready'
          : 'protocol-lab__mission--locked';
    const statusIcon = isComplete
      ? renderTokenIcon('OK', 'protocol-lab__mission-status-icon')
      : isUnlocked
        ? renderTokenIcon('FOCUS', 'protocol-lab__mission-status-icon')
        : renderTokenIcon('LOCK', 'protocol-lab__mission-status-icon');

    return `
      <button
        type="button"
        class="protocol-lab__mission ${statusClass}"
        data-mission-index="${index}"
        ${isUnlocked ? '' : 'disabled'}
        aria-current="${isCurrent ? 'step' : 'false'}"
      >
        <span class="protocol-lab__mission-index">${String(index + 1).padStart(2, '0')}</span>
        <span class="protocol-lab__mission-copy">
          <span class="protocol-lab__mission-step">${escapeHtml(mission.step)}</span>
          <span class="protocol-lab__mission-label">${escapeHtml(mission.label)}</span>
          <span class="protocol-lab__mission-signal">${escapeHtml(mission.signal)}</span>
        </span>
        <span class="protocol-lab__mission-status">${statusIcon}</span>
      </button>
    `;
  }

  _renderActiveMission(mission) {
    const response = this._getResponse(mission.id);
    const isMissionComplete = this._completedMissionIds.has(mission.id);
    const isFinalMission = this._currentIndex === this._missions.length - 1;

    return `
      <section class="protocol-lab__brief">
        <div class="protocol-lab__brief-head">
          <div>
            <p class="protocol-lab__brief-step">${escapeHtml(mission.step)}</p>
            <h3>${escapeHtml(mission.title)}</h3>
          </div>
          <div class="protocol-lab__brief-signal">
            <span>Signal</span>
            <strong>${escapeHtml(mission.signal)}</strong>
          </div>
        </div>

        <p class="protocol-lab__prompt">${escapeHtml(mission.prompt)}</p>

        <aside class="protocol-lab__note">
          <p class="protocol-lab__note-label">Operator note</p>
          <p>${escapeHtml(mission.operatorNote)}</p>
        </aside>

        <div class="protocol-lab__choices" role="list">
          ${mission.options.map((option) => this._renderOptionButton(option, mission, response)).join('')}
        </div>

        ${response.feedback ? this._renderFeedback(response.feedback) : ''}

        <div class="protocol-lab__actions">
          ${isMissionComplete
            ? ''
            : '<button type="button" class="btn btn-primary" data-lab-action="validate">Validate checkpoint</button>'}
          ${isMissionComplete && !isFinalMission
            ? '<button type="button" class="btn btn-primary" data-lab-action="next">Advance to next checkpoint</button>'
            : ''}
          <button type="button" class="btn btn-secondary" data-lab-action="reset">Reset lab</button>
        </div>
      </section>
    `;
  }

  _renderOptionButton(option, mission, response) {
    const isSelected = response.selectedOptionId === option.id;
    const feedbackVariant = response.feedback?.variant || null;
    let optionClass = 'protocol-lab__choice';

    if (isSelected) optionClass += ' protocol-lab__choice--selected';
    if (feedbackVariant === 'correct' && option.id === mission.answer) {
      optionClass += ' protocol-lab__choice--correct';
    }
    if (feedbackVariant === 'incorrect' && isSelected && option.id !== mission.answer) {
      optionClass += ' protocol-lab__choice--incorrect';
    }

    return `
      <button type="button" class="${optionClass}" data-option-id="${escapeHtml(option.id)}">
        <span class="protocol-lab__choice-marker">${escapeHtml(option.id.toUpperCase())}</span>
        <span class="protocol-lab__choice-copy">${escapeHtml(option.label)}</span>
      </button>
    `;
  }

  _renderFeedback(feedback) {
    const variant = escapeHtml(feedback.variant || 'warning');
    const iconToken = feedback.variant === 'correct'
      ? 'OK'
      : feedback.variant === 'incorrect'
        ? 'WARN'
        : 'TIP';

    return `
      <div class="protocol-lab__feedback protocol-lab__feedback--${variant}">
        <div class="protocol-lab__feedback-icon">${renderTokenIcon(iconToken, 'protocol-lab__feedback-icon-svg')}</div>
        <div>
          <p class="protocol-lab__feedback-title">${escapeHtml(feedback.title)}</p>
          <p class="protocol-lab__feedback-body">${escapeHtml(feedback.body)}</p>
        </div>
      </div>
    `;
  }

  _renderCompletionState() {
    return `
      <section class="protocol-lab__complete">
        <p class="protocol-lab__complete-kicker">${renderTokenIcon('PASS', 'learning-token-icon')} Lab complete</p>
        <h3>Encapsulation runbook confirmed</h3>
        <p class="protocol-lab__complete-copy">
          You cleared every checkpoint. The stack, protocol mapping, hop behavior, and first-pass troubleshooting logic are now aligned before you move into the quiz.
        </p>

        <div class="protocol-lab__complete-grid">
          <div>
            <p class="protocol-lab__reference-label">Mastered</p>
            <ul class="protocol-lab__mastery-list">
              <li>Named PDUs in the correct encapsulation order</li>
              <li>Placed Transport responsibilities at Layer 4</li>
              <li>Separated IP persistence from MAC hop rewrites</li>
              <li>Mapped HTTPS, TCP, IP, and Ethernet to their layers</li>
              <li>Started troubleshooting at the earliest failed function</li>
            </ul>
          </div>
          <div class="protocol-lab__complete-panel">
            <p class="protocol-lab__reference-label">Next move</p>
            <h4>Take the module quiz</h4>
            <p>Use the quiz to prove recall without the lab hints and feedback rails.</p>
          </div>
        </div>

        <div class="protocol-lab__actions">
          <button type="button" class="btn btn-primary" data-lab-action="launch-quiz">Continue to module quiz</button>
          <button type="button" class="btn btn-secondary" data-lab-action="reset">Run the lab again</button>
        </div>
      </section>
    `;
  }
}
