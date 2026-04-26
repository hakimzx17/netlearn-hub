# AGENTS.md — NetlearnHub

> **Purpose:** Authoritative guide for AI agents (Antigravity, OpenCode, Codex, etc.) working on this codebase.
> Read this file before touching any code. It describes the architecture, rules, and conventions you must follow.

---

## 🗺️ Project Overview

**NetlearnHub** is an interactive CCNA networking learning platform built as a **vanilla JavaScript SPA** (Single Page Application). No build step, no bundler — it runs directly in the browser with ES6 modules via a local HTTP server.

### Tech Stack
- **HTML/CSS/JavaScript** — No frameworks, no TypeScript
- **ES6 Modules** with dynamic `import()` for lazy-loaded routes
- **Hash-based routing** (`#/route`) — `window.location.hash`
- **CSS design system** — Custom properties (CSS variables) in `css/base.css`
- **No npm build** — The `package.json` only has a validation script (`node scripts/validate-core.mjs`)

### Running Locally
```batch
start.bat           # Tries python -m http.server 8080, fallback: npx serve
```
Open browser at `http://localhost:8080`

---

## 📁 Directory Structure

```
Clone3 CLI/
├── index.html                  # Shell HTML — loads CSS and bootstraps app
├── js/                         # Core framework (app-level)
│   ├── app.js                  # Bootstrap entry point — wires all systems
│   ├── router.js               # Hash-based SPA router
│   ├── eventBus.js             # Pub/sub event system
│   ├── stateManager.js         # Global state (localStorage-backed)
│   ├── progressEngine.js       # XP, levels, achievements, progress tracking
│   ├── flashcardEngine.js      # Spaced-repetition flashcard logic
│   └── constants/
│       └── designTokens.js     # Design token constants
├── components/                 # Reusable UI components
│   ├── AdvancedQuizMode.js     # Interactive quiz (used by LessonPage)
│   ├── dragDropEngine.js       # Generic drag-and-drop (used by ipv4HeaderGame, ethernetFrameGame)
│   ├── gamificationUI.js       # XP toast + achievement popups
│   ├── modalSystem.js          # Global modal manager
│   ├── navbar.js               # Top navigation bar
│   └── networkDiagram.js       # SVG network topology renderer
├── modules/                    # Route-level page modules (lazy-loaded)
│   ├── dashboard.js            # / — Command center dashboard
│   ├── arpSimulation.js        # /arp-simulation
│   ├── ethernetFrameGame.js    # /ethernet-frame
│   ├── examModeEngine.js       # /exam
│   ├── ipClassesExplorer.js    # /ip-classes
│   ├── ipv4HeaderGame.js       # /ipv4-header
│   ├── macTableSimulation.js   # /mac-table
│   ├── osiQuizMode.js          # (used as sub-component)
│   ├── osiTcpipVisualizer.js   # /osi-tcpip
│   ├── packetJourneySimulator.js # /packet-journey
│   ├── resourceLibrary.js      # /resources and /flashcards
│   ├── routingTableSimulator.js # /routing-table
│   ├── subnetCalculator.js     # /subnet-calculator
│   ├── subnetPracticeEngine.js # /subnet-practice
│   ├── ttlRouterSimulation.js  # /ttl-simulation
│   ├── vlsmDesignEngine.js     # /vlsm-design
│   ├── paths/                  # Learning path modules
│   │   ├── LessonPage.js       # /paths/:pathId/:moduleId
│   │   ├── PathLanding.js      # /paths/:pathId
│   │   └── PathsOverview.js    # /paths
│   └── simulations/
│       └── SimulationsHub.js   # /simulations
├── data/                       # Static data (question banks, curriculum)
│   ├── achievements.js         # Achievement definitions + level thresholds
│   ├── ccnaFlashcards.js       # Flashcard content
│   ├── examQuestions.js        # Exam mode question bank
│   ├── osiQuizBank.js          # OSI quiz questions (used by osiQuizMode)
│   ├── pathRegistry.js         # ALL_PATHS master registry + helper functions
│   ├── quizQuestions.js        # General quiz question bank
│   ├── subnetProblems.js       # Subnetting practice problems
│   ├── curriculum/             # Curriculum metadata
│   │   ├── ccnaBlueprints.js   # CCNA topic blueprints
│   │   ├── simulationCatalog.js
│   │   ├── sourceLibrary.js    # Source citation rules + formatters
│   │   └── workflow.js
│   └── paths/                  # Path data (empty — path data lives in pathRegistry.js)
├── css/                        # Design system stylesheets
│   ├── base.css                # CSS custom properties + reset + typography
│   ├── layout.css              # App shell, sidebar, view-root layout
│   ├── animations.css          # Keyframe animations
│   ├── themes.css              # Theme variants (dark/light)
│   ├── learning.css            # Learning path + lesson page styles
│   ├── flashcard.css           # Flashcard component styles
│   └── cyber-identity.css      # Cyber/terminal aesthetic styles
├── utils/                      # Utility functions
│   ├── binaryUtils.js          # Binary/hex conversions
│   ├── helperFunctions.js      # General DOM/string helpers
│   ├── ipUtils.js              # IP address utilities
│   ├── networkMath.js          # Subnet math
│   └── tokenIcons.js           # renderTokenIcon() — SVG icon renderer
├── assets/                     # Static assets (currently empty subdirs)
│   ├── diagrams/
│   ├── icons/
│   └── images/
├── scripts/
│   └── validate-core.mjs       # Core module validation script
├── package.json                # Module type declaration + validation script
├── start.bat                   # Local dev server launcher
└── deploy.ps1                  # Deployment script
```

---

## 🔄 Boot Sequence

```
index.html loads css/* → loads js/app.js (ES module)
  └── app.js bootstraps in order:
       1. stateManager.init()      — localStorage state
       2. progressEngine.init()    — XP / achievements
       3. gamificationUI.init()    — toast notifications
       4. modalSystem.init()       — global modal
       5. navbar.init()            — top nav
       6. router.init()            — reads hash → loads first module
```

---

## 🧩 Module Lifecycle Contract

Every route-level module **must** export a `default` object with these methods:

```javascript
export default {
  init(containerEl) { /* render HTML into containerEl */ },
  destroy()         { /* clean up: remove listeners, clear intervals */ },
  start()           { /* optional: start animations/timers */ },
  reset()           { /* optional: reset to initial state */ },
  step()            { /* optional: advance simulation step */ },
};
```

The router calls `destroy()` on the current module before loading the next. **Always clean up `setInterval`, `setTimeout`, and `eventBus.on()` listeners in `destroy()`.**

---

## 🚦 Routing

Routes are defined in `js/router.js`:

| Hash | Module |
|------|--------|
| `#/` | `modules/dashboard.js` |
| `#/paths` | `modules/paths/PathsOverview.js` |
| `#/paths/:pathId` | `modules/paths/PathLanding.js` |
| `#/paths/:pathId/:moduleId` | `modules/paths/LessonPage.js` |
| `#/simulations` | `modules/simulations/SimulationsHub.js` |
| `#/osi-tcpip` | `modules/osiTcpipVisualizer.js` |
| `#/arp-simulation` | `modules/arpSimulation.js` |
| `#/mac-table` | `modules/macTableSimulation.js` |
| `#/routing-table` | `modules/routingTableSimulator.js` |
| `#/packet-journey` | `modules/packetJourneySimulator.js` |
| `#/ttl-simulation` | `modules/ttlRouterSimulation.js` |
| `#/ipv4-header` | `modules/ipv4HeaderGame.js` |
| `#/ethernet-frame` | `modules/ethernetFrameGame.js` |
| `#/ip-classes` | `modules/ipClassesExplorer.js` |
| `#/subnet-practice` | `modules/subnetPracticeEngine.js` |
| `#/vlsm-design` | `modules/vlsmDesignEngine.js` |
| `#/subnet-calculator` | `modules/subnetCalculator.js` |
| `#/exam` | `modules/examModeEngine.js` |
| `#/resources` | `modules/resourceLibrary.js` |
| `#/flashcards` | `modules/resourceLibrary.js` |

**To add a new route:** Register in `ROUTES` in `js/router.js` and ensure the module exports the lifecycle contract.

---

## 🎨 CSS Architecture

- **All CSS custom properties** live in `css/base.css` under `:root`.
- **Never use inline hex colors** or raw values — use `var(--color-*)` tokens.
- **Key tokens:**
  - `--color-primary` — cyan `#00d4ff`
  - `--color-accent` — purple `#7c4dff`
  - `--color-bg` / `--color-surface` — dark backgrounds
  - `--color-text` / `--color-text-muted` — text hierarchy
  - `--color-success` / `--color-warning` / `--color-error`
- **Common utility classes:** `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.card`, `.badge`, `.text-muted`, `.text-sm`, `.text-mono`, `.anim-fade-in-up`
- **Never add TailwindCSS** — this is a vanilla CSS project.

---

## 📡 Event Bus

All inter-module communication goes through `js/eventBus.js`:

```javascript
import { eventBus } from '../js/eventBus.js';

// Emit
eventBus.emit('nav:route-change', { route: '/exam' });

// Listen (always unsubscribe on destroy)
const unsub = eventBus.on('app:ready', handler);
// In destroy():
unsub();
```

**Key system events:**
- `app:ready` — bootstrap complete
- `nav:route-change` — programmatic navigation
- `router:module-loaded` — new module is active
- `modal:open` / `modal:close` — modal system
- `progress:xp-gained` / `progress:achievement` — gamification

---

## 💾 State Management

`js/stateManager.js` manages global app state backed by `localStorage`.

```javascript
import { stateManager } from '../js/stateManager.js';

stateManager.getState('userProfile');    // { xp, level, streak, achievements }
stateManager.getState('userProgress');   // { completedModules[], quizHistory{} }
stateManager.getState('learningState');  // { lastPathId, lastModuleId }
stateManager.setState('theme', 'dark');
stateManager.subscribe('theme', (val) => { /* react to change */ });
```

---

## 🏆 Progress Engine

`js/progressEngine.js` is the source of truth for learning progress:

```javascript
import { progressEngine } from '../js/progressEngine.js';

progressEngine.isTopicComplete(moduleId)      // boolean
progressEngine.completeModule(id, pathId, rewards, score)
progressEngine.getLevelForXP(xp)              // { level, title, ... }
progressEngine.getWeakAreas()                 // low-scoring modules
progressEngine.isDomainFinalPassed(pathId)
progressEngine.isPathUnlocked(path, allPaths)
```

---

## 🃏 Flashcard Engine

`js/flashcardEngine.js` manages spaced repetition and is launched from `resourceLibrary.js`.
Flashcard content lives in `data/ccnaFlashcards.js`.

---

## 🧠 Key Data Files

### `data/pathRegistry.js`
The **master curriculum registry**. All learning paths, modules, simulations are defined here.

```javascript
import { ALL_PATHS, getPathById, getModuleById, getAllSimulations, SIMULATION_ROUTE_MAP } from '../data/pathRegistry.js';
```

### `data/achievements.js`
Achievement definitions and level threshold tables (`LEVEL_THRESHOLDS`, `ACHIEVEMENTS`).

### `data/examQuestions.js` / `data/quizQuestions.js`
Question banks for exam mode and general quizzes.

---

## 🧩 Components

### `components/AdvancedQuizMode.js`
Used by `LessonPage.js`. Renders a per-module quiz with timer, scoring, pass/fail, and completion callback.

```javascript
import { AdvancedQuizMode } from '../../components/AdvancedQuizMode.js';
new AdvancedQuizMode(containerEl, questions, { passingScore, count, onComplete, onClose });
```

### `components/networkDiagram.js`
SVG network topology renderer. Used by `packetJourneySimulator`, `routingTableSimulator`, `ttlRouterSimulation`.

```javascript
import { createNetworkDiagram } from '../components/networkDiagram.js';
const diagram = createNetworkDiagram(containerEl, nodes, edges);
```

### `components/dragDropEngine.js`
Generic drag-and-drop framework. Used by `ipv4HeaderGame` and `ethernetFrameGame`.

### `components/navbar.js`
Top navigation bar. Reads routes from the router and highlights the active link.

### `components/modalSystem.js`
Global modal. Opened via `eventBus.emit('modal:open', { content, title })`.

### `components/gamificationUI.js`
XP toasts and achievement popups. Listens for `progress:*` events.

---

## ✅ Agent Rules

### MUST DO
1. **Follow the module lifecycle contract** — every new route module needs `init`, `destroy`, `start`, `reset`.
2. **Use `eventBus`** for cross-module communication, never direct coupling.
3. **Use CSS variables** from `css/base.css` for all colors and spacing.
4. **Clean up in `destroy()`** — all `setInterval`, `setTimeout`, event listeners, and `eventBus.on()` subscriptions.
5. **Lazy dynamic imports** — modules are loaded via `router.js`'s `import()`. Don't import route modules statically.
6. **Import paths are relative** — always use `../` or `../../` relative imports.
7. **No build step** — the project runs directly in the browser. Don't add bundlers, transpilers, or TypeScript.

### MUST NOT
1. **Never add TailwindCSS** — this project uses vanilla CSS.
2. **Never add React, Vue, or any frontend framework** — this is intentionally vanilla JS.
3. **Never hardcode colors** — use CSS custom properties.
4. **Never import deleted files** — `timer.js`, `quizEngine.js`, `networkExamples.js`, `build_adv_quiz.py` have been removed.
5. **Never commit large binary assets** directly — use CDN links or reference external sources.

---

## 🏗️ Adding New Features

### New Simulation / Route
1. Create `modules/yourSimulation.js` implementing the lifecycle contract
2. Register in `js/router.js` → `ROUTES` object
3. Add navigation link in `components/navbar.js` if needed
4. Register simulation metadata in `data/pathRegistry.js` → `getAllSimulations()`
5. Add title mapping in `js/app.js` → `titleMap`

### New Learning Path
1. Add path definition to `data/pathRegistry.js` → `ALL_PATHS`
2. Each module in the path needs: `id`, `title`, `code`, `difficulty`, `estimatedMinutes`, `theory`, `quiz`
3. The router automatically handles `/paths/:pathId/:moduleId` via `LessonPage.js`

### New Quiz Bank
1. Create `data/yourQuizBank.js` with a default export array of question objects
2. Reference it in the module's `quiz.bank` field in `pathRegistry.js`
3. `LessonPage._initQuiz()` dynamically imports it via `import(\`../../data/${mod.quiz.bank}.js\`)`

---

## 🐛 Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Module not loading | Missing `export default` | Add `export default new MyModule()` |
| Memory leak on navigation | Missing `destroy()` cleanup | Clear all timers + eventBus listeners |
| Router 404 | Route not in `ROUTES` | Add entry to `js/router.js` |
| CSS not applying | Wrong class name or missing import | Check `index.html` loads the right CSS file |
| State not persisting | Using local vars instead of stateManager | Use `stateManager.setState()` |
| Quiz not rendering | `mod.quiz.questions` is null | Check pathRegistry data has `questions` array |

---

*Last updated: 2026-04-05 — Reflects post-cleanup project state.*
