# Product Requirements Document

| Field | Value |
| --- | --- |
| Product | NetlearnHub |
| Legacy identifiers still present in code | `ultimate-network-learning-platform` |
| Document type | Current-state PRD plus completion roadmap |
| Date | 2026-04-05 |
| Basis | Repository inspection plus successful `npm test` validation |
| Platform | Browser-based vanilla JavaScript SPA served from static files |

## 1. Executive Summary

NetlearnHub is an interactive CCNA learning platform designed to combine structured curriculum progression, hands-on networking simulations, topic-level quizzes, mock exam practice, and spaced-repetition review in a single browser experience.

The current product is already usable as a local-first study tool. It includes a command-center dashboard, six gated CCNA domains, 78 curriculum topics, 78 topic-linked simulation entries, 12 implemented standalone labs/tools, a 65-question mock exam engine, and an eight-deck flashcard system.

The codebase also makes the product direction clear: the platform is intended to evolve from a curriculum shell into a fully authored, source-traceable CCNA academy where every topic has validated theory, simulation behavior, quiz content, domain finals, and a larger practice exam.

## 2. Product Definition

### Vision

Build a focused, operations-style CCNA study environment that helps learners move from theory to practice to exam readiness without leaving the product.

### Problem Statement

CCNA learners usually have to piece together passive notes, scattered labs, flashcards, and exam drills from separate sources. That fragmentation makes it hard to study in sequence, measure retention, and know what to review next.

### Product Thesis

If the platform can combine guided domain progression, interactive simulations, immediate assessment, spaced repetition, and visible progress tracking, learners will spend less time organizing their study process and more time actually mastering networking concepts.

## 3. Goals

- Provide one coherent study surface for CCNA theory, practice, review, and exam rehearsal.
- Convert the CCNA blueprint into a gated, sequential learning journey across six official domains.
- Reinforce knowledge with hands-on simulations, not just passive reading.
- Help learners identify weak areas through quiz history, exam analytics, and flashcard review debt.
- Keep the product simple to run and maintain by using a static, no-build, browser-first architecture.
- Ensure curriculum content can be traced back to validated source material before it is considered fully authored.

## 4. Non-Goals

- Multi-user cloud accounts.
- Remote sync across devices.
- Instructor dashboards or classroom management.
- Real proctored certification delivery.
- Backend APIs, databases, or server-rendered pages.
- Full enterprise-grade authentication or authorization.

## 5. Target Users

| Persona | Needs | How the product serves them |
| --- | --- | --- |
| Self-paced CCNA learner | Clear sequence, confidence-building progress, exam prep | Domain gating, lesson tabs, quizzes, exam mode |
| Lab-first learner | Hands-on understanding of packet flow, headers, routing, switching | Standalone simulations hub plus lesson-linked labs |
| Returning learner | Quick resume path and weak-area review | Dashboard mission pointer, stored learning state, quiz analytics |
| Memorization-focused learner | Fast recall practice and repeated exposure | Resource library, flashcards, due-card review, search |
| Content/admin reviewer | Ability to inspect locked curriculum before completion | Local admin preview mode with passkey bypass |

## 6. Current Scope Snapshot

| Area | Current state |
| --- | --- |
| Curriculum domains | 6 official CCNA domains |
| Topics | 78 topics validated by `scripts/validate-core.mjs` |
| Topic-linked simulation entries | 78 |
| Implemented standalone simulations/tools | 12 |
| Mock exam bank | 65 questions across 6 domains |
| Flashcard decks preloaded | 8 |
| Persistence model | Local storage only |
| Runtime model | Static SPA, ES modules, lazy-loaded routes |
| Validation | Import-path, networking-math, and curriculum-invariant checks pass |

## 7. Information Architecture

| Surface | Route | Purpose |
| --- | --- | --- |
| Command Center Dashboard | `#/` | Resume learning, show KPIs, quick actions, quick simulation launch |
| CCNA Domains overview | `#/paths` | Show the six domains, weights, progress, and lock status |
| Domain landing page | `#/paths/:pathId` | Show sequential topic timeline and final-exam readiness |
| Topic lesson page | `#/paths/:pathId/:moduleId` | Deliver theory, simulation, and quiz flow for a single topic |
| Simulations Hub | `#/simulations` | Browse all available simulations and topic blueprints |
| Standalone simulations/tools | Multiple fixed routes | Launch implemented labs directly without going through a lesson |
| Exam Mode | `#/exam` | Run timed mock exams and review results |
| Resource Library | `#/resources` | Search CCNA references, ports, protocols, CLI, glossary |
| Flashcards shortcut | `#/flashcards` | Open the same resource module directly in flashcard mode |

## 8. Core User Journeys

1. New learner journey: Dashboard -> Domains -> Domain landing -> First unlocked topic -> Theory tab -> Simulation tab -> Quiz tab -> Auto-advance to next topic on pass.
2. Returning learner journey: Open app -> Dashboard mission card uses stored learning state -> Resume last domain/topic -> Continue from saved tab.
3. Sandbox practice journey: Dashboard or Simulations Hub -> Pick a lab -> Launch implemented simulation or open planned blueprint.
4. Exam-prep journey: Exam lobby -> Choose quick, topic, or full mode -> Complete timed exam -> Review score, domain breakdown, and answer explanations.
5. Recall journey: Resource Library -> Search or browse references -> Open Flashcard Mode -> Study a deck -> Rate cards Again/Hard/Good/Easy -> Review session stats.

## 9. Functional Requirements

### 9.1 Shell and Navigation

- The product shall run entirely in the browser as a hash-routed SPA with lazy-loaded route modules.
- The app shell shall provide a top command bar, a collapsible sidebar, and a central view container.
- Navigation shall support both direct route links and event-driven route changes through a global event bus.
- The shell shall persist theme preference, sidebar state, admin preview state, and learner progress locally.
- The shell shall expose command-style search/navigation UI in the navbar.
- The shell shall support keyboard shortcuts for closing modals with `Escape`, going home with `Ctrl/Cmd + /`, and opening Exam Mode with `Ctrl/Cmd + E`.
- The product shall include a local admin preview mode that bypasses gating for review purposes.

### 9.2 Curriculum and Domain Progression

- The curriculum shall be organized into six official CCNA domains.
- Each domain shall contain a sequential set of topics with prerequisite-based unlocking.
- The product shall show domain progress as completed topics versus total topics.
- Each domain shall include a required final exam definition with an 80 percent passing threshold.
- The domain landing page shall visually distinguish completed, current, and locked topics.
- The system shall allow path and topic unlocking to be bypassed only when admin preview is enabled.
- The product shall surface exam weight, estimated study effort, and topic count at the domain level.

### 9.3 Topic Lesson Experience

- Each topic page shall provide three learner-facing tabs: Theory, Simulation, and Quiz.
- The product shall save the learner's last visited path, topic, and tab so learning can resume later.
- Theory content shall support authored sections, rich text, tables, notes, figures, key terms, steps, and checklists.
- If a topic is not fully authored, the lesson page shall fall back to a blueprint-style theory summary instead of failing.
- If a simulation is not implemented, the lesson page shall still show its engine family and open the topic blueprint route.
- Each topic shall require a quiz pass before the topic is marked complete.
- Passing a topic quiz shall mark the topic complete, update scores, record history, award XP, and unlock the next topic.
- Replaying a topic quiz shall still update quiz history even if the topic was already completed earlier.

### 9.4 Simulations and Practice Tools

- The Simulations Hub shall list all topic-linked simulations across the curriculum.
- The Simulations Hub shall allow filtering by domain.
- Each simulation card shall show whether the simulation is implemented or still a blueprint.
- The product shall preserve direct access to implemented standalone labs/tools for sandbox use.
- Lesson pages shall be able to deep-link into the relevant standalone simulation when one exists.

### 9.5 Topic Quizzes and Assessment

- Topic quizzes shall support inline question sets and dynamically imported question banks.
- Topic quizzes shall enforce a topic-specific passing score, defaulting to 70 percent.
- Quiz UX shall include a start state, sequential question flow, per-question timer, streak tracking, and end-of-quiz summary.
- Topics without authored quiz banks shall remain visible as assessment blueprints rather than disappearing from the learner journey.

### 9.6 Mock Exam Experience

- The platform shall provide three mock exam modes: Quick Practice, Topic Focus, and Full Exam.
- Quick Practice shall use 20 questions in 30 minutes.
- Topic Focus shall use 20 questions in 30 minutes, filtered to one domain.
- Full Exam shall use 60 questions in 90 minutes.
- Exam questions shall support single-answer, multi-answer, ordering, and text-input formats.
- Mock exams shall score on a 0 to 1000 scale with a passing threshold of 825.
- The exam experience shall provide timers, question flagging, a question map, and answer review after submission.
- The product shall store recent exam history locally and keep the latest 10 attempts.
- The exam lobby shall summarize total attempts, pass rate, average score, streak, and weak domains.

### 9.7 Resource Library and Flashcards

- The Resource Library shall provide searchable CCNA quick-reference content for ports, protocols, CLI commands, OSI, subnetting, and glossary terms.
- The product shall allow learners to enter Flashcard Mode from the resource page or directly from `#/flashcards`.
- Flashcard Mode shall preload eight default decks covering the six CCNA domains plus protocol and ports reference decks.
- Flashcard sessions shall use spaced repetition based on the SM-2 algorithm.
- Flashcard rating options shall include Again, Hard, Good, and Easy.
- The flashcard system shall support deck creation, card creation, import, export, search, tagging, and session statistics.
- The flashcard system shall show due-card workload, mastery progress, and elapsed study time.

### 9.8 Progress, Motivation, and Analytics

- The product shall persist a learner profile with XP, level, streak, and unlocked achievements.
- The product shall award XP when a new topic is completed.
- The product shall calculate levels from threshold tables and surface level-up events.
- The product shall unlock achievements for milestones such as first completion, perfect quiz, and streaks.
- The product shall detect weak areas by averaging stored quiz scores and ranking the lowest performers.
- The dashboard shall use progress, weak areas, and last visited topic to generate the learner's current mission pointer.
- The UI shall provide visible XP toasts, achievement popups, and level-up banners.

### 9.9 Content Governance and Authoring Readiness

- Every topic shall maintain a source manifest derived from a central source library.
- A topic shall not be considered ready for full authoring until it has at least one topic-specific Cisco official URL and one explicit PDF page-range mapping.
- Source entries shall include visible coverage notes describing what part of the topic they support.
- The curriculum model shall track source-readiness status at both topic and domain levels.
- Topic content, simulations, and quizzes shall be authored only from validated source-backed facts.
- The product shall preserve an authoring workflow that sequences source mapping before theory, simulation, and quiz publishing.

### 9.10 State and Persistence

- The product shall store persistent learner data in local storage under a `netlearn:*` namespace.
- Persisted state shall include user progress, learner profile, learning position, quiz scores, exam history, exam config, theme, and admin preview state.
- Volatile simulation state shall be cleared when navigating between modules.
- The product shall not require a backend or remote service to function.

## 10. Curriculum Model

| Domain | Weight | Final exam questions | Final exam pass score |
| --- | --- | --- | --- |
| Network Fundamentals | 20% | 30 | 80% |
| Network Access | 20% | 35 | 80% |
| IP Connectivity | 25% | 40 | 80% |
| IP Services | 10% | 25 | 80% |
| Security Fundamentals | 15% | 30 | 80% |
| Automation and Programmability | 10% | 25 | 80% |

Notes:

- The curriculum architecture validator expects exactly 6 domains and 78 topics.
- The current UI presents domain finals as required gates, but a dedicated final-exam learner flow is not yet implemented as its own route/module.
- The workflow file explicitly plans a later 120-question practice exam after topic and domain-final banks are completed.

## 11. Data and State Model

| State key | Purpose |
| --- | --- |
| `currentRoute` | Active route for navigation and title updates |
| `userProfile` | Name, XP, level, streak, achievements |
| `userProgress` | Completed topics, best scores, topic states, domain finals, practice-exam flags |
| `learningState` | Last path, topic, and tab for continue-learning behavior |
| `quizScores` | Historical scores for weak-area detection |
| `examHistory` | Last mock exam attempts and domain breakdowns |
| `examConfig` | Persisted exam configuration if needed |
| `theme` | Dark/light theme preference |
| `adminPreview` | Local bypass for locked curriculum |
| `simState`, `arpCache`, `macTable`, `routingTable` | Volatile simulation data cleared on route changes |

## 12. Non-Functional Requirements

- The app shall remain framework-free and run as vanilla HTML, CSS, and JavaScript with ES modules.
- The app shall require no build step and must be launchable from a simple local HTTP server.
- Route modules shall be lazy-loaded to keep initial load small.
- Route modules shall implement a lifecycle contract with `init()` and `destroy()` at minimum.
- Modules shall clean up timers, listeners, and subscriptions on `destroy()` to prevent memory leaks.
- Cross-module communication shall go through the event bus rather than direct module imports.
- Global state changes shall flow through the state manager instead of ad hoc module-local persistence.
- Design values shall use centralized CSS variables rather than one-off hardcoded styles wherever practical.
- The experience shall work on both desktop and mobile viewports.
- The product shall degrade gracefully when authored lesson or quiz content is incomplete.

## 13. Success Metrics

The current implementation tracks most metrics locally rather than remotely, but the intended product metrics are clear.

- Topic completion rate by domain.
- Domain final pass rate once finals are implemented.
- Mock exam pass rate and average scaled score.
- Flashcard accuracy and due-card backlog reduction.
- Learner streak retention.
- Weak-area recovery over repeated quiz attempts.
- Curriculum authoring readiness percentage by topic and by domain.

## 14. Risks and Current Gaps

- The product brand has been aligned to NetlearnHub for the browser title, sidebar identity, and app logs; `package.json` still uses `ultimate-network-learning-platform`.
- The curriculum architecture is far ahead of the authored content. Many of the 78 topics are blueprint-ready but not yet fully authored.
- Only two dedicated topic quiz-bank files are currently present, so broad topic-level assessment coverage is still incomplete.
- Domain final exams are modeled and enforced conceptually, but there is no dedicated learner-facing final-exam engine per domain yet.
- The workflow explicitly plans a 120-question practice exam, but that experience is not surfaced yet.
- The mock exam bank currently contains 65 questions while Full Exam mode draws 60, so repeat exposure will happen quickly for frequent users.
- All persistence is local only. Learners cannot sync progress across browsers or devices.
- Admin preview is a local passkey gate inside the client, not a secure authentication boundary.
- The top-level lesson comment still references a four-tab model, but the shipped learner experience currently exposes three tabs: Theory, Simulation, and Quiz.

## 15. Recommended Roadmap

1. Normalize product naming so the title, package metadata, storage namespace, and in-app labels all align under one canonical brand.
2. Finish full authored content for Domain 1, including validated source manifests, richer theory blocks, simulations, and quiz banks.
3. Expand authored quiz coverage across all 78 topics so topic progression is consistently supported.
4. Implement dedicated domain final-exam flows that use the already-modeled question counts, pass thresholds, and gating rules.
5. Complete the reusable simulation engine families so planned simulations stop falling back to blueprint placeholders.
6. Build the planned 120-question practice exam and connect it to the existing practice-exam unlock flags in progress state.
7. Decide whether the product should remain permanently local-first or eventually add optional cloud sync and analytics.

## 16. Appendix A: Implemented Standalone Simulations and Tools

- OSI / TCP-IP Visualizer
- IP Address Classes
- Packet Journey Simulator
- ARP Resolution Simulator
- MAC Table Learning
- Routing Table Simulator
- TTL Router Simulation
- IPv4 Header Game
- Ethernet Frame Game
- Subnetting Practice
- VLSM Design Engine
- Subnet Calculator

## 17. Appendix B: Default Flashcard Decks

- Network Fundamentals
- Network Access
- IP Connectivity
- IP Services
- Security Fundamentals
- Automation and Programmability
- Protocols Reference
- Ports Reference

## 18. Appendix C: Source Files Inspected

The PRD above was derived from direct inspection of these core files and modules.

- `index.html`
- `package.json`
- `js/app.js`
- `js/router.js`
- `js/stateManager.js`
- `js/progressEngine.js`
- `js/flashcardEngine.js`
- `js/eventBus.js`
- `components/navbar.js`
- `components/gamificationUI.js`
- `components/AdvancedQuizMode.js`
- `modules/dashboard.js`
- `modules/resourceLibrary.js`
- `modules/examModeEngine.js`
- `modules/simulations/SimulationsHub.js`
- `modules/paths/PathsOverview.js`
- `modules/paths/PathLanding.js`
- `modules/paths/LessonPage.js`
- `data/pathRegistry.js`
- `data/curriculum/ccnaBlueprints.js`
- `data/curriculum/sourceLibrary.js`
- `data/curriculum/workflow.js`
- `data/achievements.js`
- `data/examQuestions.js`
- `data/ccnaFlashcards.js`
- `css/base.css`
- `scripts/validate-core.mjs`
