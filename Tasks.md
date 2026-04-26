# Tasks.md — NetlearnHub

> Status: `✅ Done` · `🔄 Active` · `⬜ Planned`

---

## Snapshot

| Area | Status |
|---|---|
| App shell, routing, CSS system | ✅ |
| 6 CCNA domain blueprints (78 topics) | ✅ |
| 12 standalone simulation engines | ✅ |
| Guided practice labs | 🔄 Inline engine families expanded; standalone rollout ongoing |
| Curriculum navigation UI (Domains → Topic → Lesson) | ✅ |
| Progress engine (XP, levels, streaks, achievements) | ✅ |
| Flashcard engine (SM-2 algorithm) | ✅ |
| Exam mode engine + 1000+ question bank | ✅ |
| Theory content | ✅ D1-D6 complete |
| Per-topic quiz banks | ✅ All 78 topic banks complete |
| Source citations (Cisco URLs + PDF ranges) | ✅ All 78 added |
| Domain final exams | ✅ All 6 domain finals authored |

---

## M1 — Source Citation Foundation ✅
> Unlock the authoring gate for all 78 topics (`phaseGate: locked → open`)

- [x] Add `sourceMappings` to `ccnaBlueprints.js` for all 14 Fundamentals topics (Cisco URL + PDF page range + coverage notes)
- [x] Add `sourceMappings` for all 15 Network Access topics
- [x] Add `sourceMappings` for all 12 IP Connectivity topics
- [x] Add `sourceMappings` for all 11 IP Services topics
- [x] Add `sourceMappings` for all 14 Security Fundamentals topics
- [x] Add `sourceMappings` for all 12 Automation topics
- [x] Verify all 78 topics show `phaseGate: 'open'` in PathLanding source-readiness display

---

## M2 — Theory: Network Fundamentals (D1) ✅
> Author `theory` objects for all 14 D1 topics in `ccnaBlueprints.js`

- [x] OSI & TCP/IP Models — sections + keyTakeaways
- [x] Ethernet LAN Standards — sections + keyTakeaways
- [x] MAC Addresses — sections + keyTakeaways
- [x] CSMA/CD & Ethernet Frames — sections + keyTakeaways
- [x] Network Components — sections + keyTakeaways
- [x] WAN Fundamentals — sections + keyTakeaways
- [x] IPv4 Addressing — sections + keyTakeaways
- [x] IPv4 Subnetting — sections + keyTakeaways
- [x] IPv6 Fundamentals — sections + keyTakeaways
- [x] IPv6 Addressing & EUI-64 — sections + keyTakeaways
- [x] TCP vs UDP — sections + keyTakeaways
- [x] IP Ports & Applications — sections + keyTakeaways
- [x] Virtualization Fundamentals — sections + keyTakeaways
- [x] Cloud Computing — sections + keyTakeaways

---

## M3 — Quiz Banks: Network Fundamentals (D1) ✅
> Wire `quiz.questions` (min 10 per topic) + Domain 1 Final Exam (30Q)

- [x] Create `data/quizBanks/fundamentals/` directory
- [x] Write 10+ questions for each of the 14 topics (implemented with the current `AdvancedQuizMode` MCQ schema)
- [x] Wire each topic's `quizBank` configuration in `ccnaBlueprints.js`
- [x] Author 30-question Domain 1 Final Exam bank (`mcq-drag-fill`, 80% pass)
- [x] Wire final exam bank to `pathRegistry` finalExam object
- [x] Smoke-test full D1 lesson flow: Theory → Quiz → Pass → domain progress updates

---

## M4 — Theory: Network Access (D2) ✅
> Author `theory` for all 15 D2 topics

- [x] Switch Operation & MAC Table
- [x] CLI Basics
- [x] Switch Interface Config
- [x] VLANs
- [x] VLAN Trunking (802.1Q)
- [x] Voice VLANs
- [x] VTP
- [x] STP Concepts
- [x] RSTP & Per-VLAN STP
- [x] EtherChannel
- [x] CDP & LLDP
- [x] Wireless LAN Fundamentals
- [x] Wireless LAN Architectures
- [x] Wireless LAN Security
- [x] Wireless LAN Configuration

---

## M5 — Quiz Banks: Network Access (D2) ✅
- [x] Write 10+ questions for each of the 15 D2 topics
- [x] Author 35-question Domain 2 Final Exam bank (`mcq-config-diagram`, 80% pass)
- [x] Wire all banks and verify D2 end-to-end flow

---

## M6 — Theory: IP Connectivity (D3) ✅
> Author `theory` for all 12 D3 topics (highest exam weight: 25%)

- [x] Router Operation
- [x] Routing Table Fundamentals
- [x] Administrative Distance
- [x] IPv4 Static Routing
- [x] IPv4 Troubleshooting
- [x] OSPF Concepts
- [x] OSPF Configuration
- [x] OSPF Network Types & Neighbors
- [x] Multi-Area OSPF
- [x] IPv6 Static Routing
- [x] IPv6 Routing & NDP
- [x] First Hop Redundancy (HSRP)

---

## M6.5 — Practice Lab Pilot: Fundamentals 1.1 ✅
> Roadmap change approved: pull forward the first guided hands-on lab before D3 quiz authoring

- [x] Build a reusable protocol-stack practice lab component in `components/`
- [x] Upgrade `/osi-tcpip` from a pure visualizer to a visualize -> practice -> quiz flow
- [x] Re-label Fundamentals 1.1 to point at the new practice lab experience
- [x] Verify standalone route rendering and module-quiz handoff

---

## M7 — Quiz Banks: IP Connectivity (D3) ✅
- [x] Write 10+ questions for each of the 12 D3 topics
- [x] Author 40-question Domain 3 Final Exam bank (`mcq-config-trace`, 80% pass)
- [x] Wire all banks and verify D3 end-to-end flow

---

## M8 — Theory: IP Services (D4) ✅
> Author `theory` for all 11 D4 topics

- [x] NAT Concepts & Terminology
- [x] Static NAT
- [x] Dynamic NAT & PAT
- [x] NTP
- [x] DNS
- [x] DHCP
- [x] SSH & Remote Access
- [x] SNMP
- [x] Syslog
- [x] QoS Fundamentals
- [x] TFTP & FTP

---

## M9 — Quiz Banks: IP Services (D4) ✅
- [x] Write 10+ questions for each of the 11 D4 topics
- [x] Author 25-question Domain 4 Final Exam bank (`mcq-config-table`, 80% pass)
- [x] Wire all banks and verify D4 end-to-end flow

---

## M10 — Theory: Security Fundamentals (D5) ✅
> Author `theory` for all 14 D5 topics

- [x] Security Concepts
- [x] Attack Types
- [x] Social Engineering
- [x] Password Security & AAA
- [x] 802.1X & PNAC
- [x] ACL Fundamentals
- [x] Advanced ACLs
- [x] Firewalls & IPS
- [x] Port Security
- [x] DHCP Snooping
- [x] Dynamic ARP Inspection
- [x] VPNs — Site-to-Site
- [x] VPNs — Remote Access
- [x] Securing Wireless Networks

---

## M11 — Quiz Banks: Security Fundamentals (D5) ✅
- [x] Write 10+ questions for each of the 14 D5 topics
- [x] Author 30-question Domain 5 Final Exam bank (`mcq-scenario-config`, 80% pass)
- [x] Wire all banks and verify D5 end-to-end flow

---

## M12 — Theory: Automation & Programmability (D6) ✅
> Author `theory` for all 12 D6 topics

- [x] Why Network Automation
- [x] Logical Planes
- [x] SDN Architecture
- [x] Cisco SDN Solutions
- [x] Catalyst Center (DNAC)
- [x] REST APIs
- [x] REST API Authentication
- [x] JSON Data Format
- [x] XML & YAML
- [x] Ansible
- [x] Terraform
- [x] Puppet & Chef

---

## M13 — Quiz Banks: Automation & Programmability (D6) ✅
- [x] Write 10+ questions for each of the 12 D6 topics
- [x] Author 25-question Domain 6 Final Exam bank (`mcq-matrix-scenario`, 80% pass)
- [x] Wire all banks and verify D6 end-to-end flow

---

## M14 — Simulation Engine Expansion ✅
> Build 7 missing reusable engine families as parameterizable components in `components/`

- [x] **CLI Sandbox** (`components/cliSandboxEngine.js`) — guided command validation with expected-output checks
- [x] **State Machine Animator** (`components/stateMachineEngine.js`) — step-through protocol states (OSPF, RSTP, 802.1X)
- [x] **Topology Builder** (`components/topologyBuilderEngine.js`) — interactive drag-and-drop topology assembly
- [x] **Attack / Defense Scenario** (`components/attackDefenseEngine.js`) — before/after attack + mitigation flow
- [x] **Config Lab** (`components/configLabEngine.js`) — multi-step config fill-in with validation
- [x] **Comparison Visualizer** (`components/comparisonViewerEngine.js`) — side-by-side protocol/tool comparison tables
- [x] **Diagram / Table Builder** (`components/diagramBuilderEngine.js`) — label-placement and table-fill drag-drop
- [x] Wire each engine to blueprint topics through the LessonPage inline simulation loader and existing `simulationType` bindings
- [x] Confirm no new standalone routes are required for this pass; engines run inside lesson simulation tabs

---

## M15 — Domain Final Exam System ✅
> Connect the fully-built progress gating system to real exam delivery

- [x] Add "Take Final Exam" button to `PathLanding.js` (visible only when `isDomainFinalUnlocked()` is true)
- [x] Route domain finals through `examModeEngine.js` passing the domain-specific question bank
- [x] Implement post-exam flagged-topic list (topics below 70% flagged for remediation)
- [x] Call `progressEngine.recordDomainFinalResult()` on exam submit to persist pass/fail and unlock the next domain
- [x] Show pass/fail result card on domain landing page with score history

---

## M16 — Full Practice Exam Mode ✅
> Wire the existing exam engine to curriculum gating and build post-exam analytics

- [x] Gate `/exam` route behind `isPracticeExamUnlocked()` — show lock screen if not all domain finals passed
- [x] Confirm 120-question, 120-minute exam flow works end-to-end in `examModeEngine.js`
- [x] Build post-exam weak-area report: map flagged questions back to domain topics
- [x] Add score history chart (attempts over time) to exam results screen
- [x] Add "Retake Exam" and "Review Weak Areas" CTAs on results page

---

## M17 — Flashcard System Integration ⬜
> Connect the SM-2 flashcard engine to the learning path

- [ ] Add "Review with Flashcards" button to `LessonPage` quiz tab
- [ ] Filter `ccnaFlashcards.js` by `topicId`/`domainId` tags when launching from a lesson
- [ ] Add "Flashcard Review" section to `PathLanding.js` domain page (shows due cards for that domain)
- [ ] Pipe flashcard weak cards (`again` ratings) into `progressEngine.getWeakAreas()` remediation list
- [ ] Ensure flashcard session stats persist correctly across navigation (no data loss on route change)

---

## M18 — UI Polish & Accessibility ⬜
> Final production-readiness pass

- [ ] Responsive layouts: fix sidebar and main grid on tablet (≤1024px) and mobile (≤640px)
- [ ] Add skeleton loading screens for all lazy-loaded route modules
- [ ] Audit keyboard navigation: all interactive elements reachable via Tab + Enter/Space
- [ ] Add ARIA labels to navbar, modals, quiz buttons, and progress bars
- [ ] Audit dark/light theme tokens across all 7 CSS files — fix any hardcoded colors
- [ ] Design empty states for Dashboard (no progress yet) and PathsOverview (no domains unlocked)
- [ ] Add `favicon.ico`, `<meta name="description">`, and Open Graph tags to `index.html`

---

## Dependency Order

```
M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8 → M9 → M10 → M11 → M12 → M13 → M14 → M15 → M16
                                                                                         ↓
                                                              M17 (parallel from M3+)   M18
```

---

## Domain Reference

| Domain | Topics | Exam Weight | Sims Built |
|---|---|---|---|
| Network Fundamentals | 14 | 20% | 6 / 14 |
| Network Access | 15 | 20% | 1 / 15 |
| IP Connectivity | 12 | 25% | 2 / 12 |
| IP Services | 11 | 10% | 0 / 11 |
| Security Fundamentals | 14 | 15% | 0 / 14 |
| Automation & Programmability | 12 | 10% | 0 / 12 |
| **Total** | **78** | **100%** | **9 / 78** |

*Last updated: 2026-04-26*
