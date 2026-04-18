# Anton — Design Prompt (Web + Mobile)

> **Purpose:** A comprehensive design brief that can be handed to a senior product designer, fed to an AI design generator (v0, Lovable, Figma Make), or used as a self-brief by Noel to direct the design of Anton's web and mobile interfaces.
> **Non-negotiable:** UX must be perfect. UI must NOT be generic. No ChatGPT-clone chat bubbles. No Claude-clone clean-but-boring. This is a **personal operating system**, not a chatbot.
> **Source research:** Based on parallel research across 8 topics — Granola, Linear, Arc, Raycast, Superhuman, Cursor, Warp, Dia, Rauno Freiberg, Smashing Magazine's 2026 agentic UX patterns, Apple HIG visionOS, Readwise Reader, Fellou, and more.

---

## 0. How to use this prompt

**For a human designer:** Read end-to-end. The document is self-contained. Deliverables are listed in §14.

**For an AI design tool (v0, Lovable, Figma Make):**

> You are a world-class product designer with 15 years shipping software at Linear, Arc (Browser Company), Raycast, and Things. You have deep taste in typography, motion, and power-user ergonomics. You reject generic patterns. Every design decision has a reason. You are designing Anton — a personal AI operating system for a founder named Noel. Read the brief below completely, then produce the deliverables listed in §14. When in doubt, pick the less-obvious option; copy from Linear, Arc, Raycast, Granola, and Superhuman over anything SaaS-generic.

---

## 1. Product Summary

**Anton** is Noel's personal AI operating system. It orchestrates 26 AI agents across engineering, marketing, SEO, finance, data, and product departments. Anton runs primarily on local hardware (Qwen3 8B via Ollama now, Qwen3 72B on Mac Studio soon). Claude is a rare fallback for code generation and deep research. Anton has persistent memory (SQLite + vector retrieval), handles Slack + web + voice input, executes autonomously within trust tiers, and speaks first (proactive briefings, approvals, alerts).

**The interface is the thing.** Today, Anton runs through Slack. That is a workaround. The real Anton lives in a dedicated web app (desktop workspace) and a mobile app (voice-forward, on-the-go). This prompt designs those.

---

## 2. User — Noel

- Founder. Technical. Power user.
- Works primarily at a Mac (16GB today, Mac Studio 128GB incoming).
- Runs a solo operation that behaves like a 26-person company through AI.
- Wants Anton to be JARVIS — present, aware, proactive, executing.
- Will use the web app in focused work sessions (briefing reviews, approval sweeps, delegation, memory browsing).
- Will use the mobile app for: voice delegation on the move, approval sweeps between meetings, proactive notification triage, quick checks.
- Values: precision, taste, speed, keyboard control, distinctive design, lived-in feel.
- Anti-values: generic SaaS aesthetic, excessive animation, corporate friendliness, modal dialogs, hand-holding.

---

## 3. Design North Star — 10 Principles

These are the filters. If a decision violates any of them, it is wrong.

1. **The OS, not the assistant.** Anton is not a chat app with AI — it is Noel's control environment. Every screen should feel like a workbench, not a conversation.
2. **Populated by default.** The app opens to a live state: what's active, what's pending, what happened while Noel was away. An empty home screen is a failure.
3. **Every action is keyboardable.** Cmd+K is the universal entry. Every visible button also exists as a command. Power users operate Anton without a mouse.
4. **Monospace is the system's voice; sans-serif is Noel's.** Agent output, logs, memory entries — monospace. UI chrome and Noel's input — sans-serif. The visual distinction is the message.
5. **Color carries meaning, never decoration.** One accent color for active state. Amber for approvals. Green for complete. Red for blocked. Nothing more.
6. **Approvals are ambient, never modal.** A persistent tray surfaces pending items. The screen never locks. Only destructive, irreversible actions get a modal.
7. **Transparency on demand.** Every agent action is a sealed, permalinkable block. Expanding from summary → steps → full trace is a click, not navigation.
8. **Personality lives in copy, not chrome.** No mascots, no celebrations. Personality is Anton's voice in every status message and empty state. Sounds like Noel's OS is alive, not like a SaaS product with a mascot.
9. **Mobile is voice-forward but not voice-only.** Push-to-talk default. Rich notification cards with inline actions. Swipe right = approve, left = reject.
10. **Trust tiers are visible at all times.** Every agent shows its autonomy level (green/amber/red badge). Noel is never surprised an agent acted.

---

## 4. Design System — Concrete Tokens

### 4.1 Typography

| Role                     | Font              | Fallback (free)     | Notes                                                 |
| ------------------------ | ----------------- | ------------------- | ----------------------------------------------------- |
| UI chrome, Noel's input  | **Söhne** (Klim)  | Geist Sans (Vercel) | Warm precise sans, mid-century editorial quality      |
| Agent output, logs, code | **Berkeley Mono** | JetBrains Mono      | Refined monospace, signals structured + authoritative |
| Headings                 | Söhne             | Geist Sans          | Same as chrome, larger size                           |
| Command palette body     | Berkeley Mono     | JetBrains Mono      | Superhuman pattern — signals powerful machine         |

**Scale (web):**

- Display: 32px / 1.1 / -1em tracking
- H1: 24px / 1.2 / -0.6em
- H2: 18px / 1.3 / -0.4em
- Body: 14px / 1.5 / -0.5em (Söhne)
- Mono output: 13px / 1.6 / +0.2em (Berkeley Mono)
- Small/caption: 12px / 1.4 / 0em
- Code blocks: 12px Berkeley Mono, 1.5 line-height

**Mobile type scale is same hierarchy shifted up 1px (15px body, 14px mono).**

### 4.2 Color

Warm-near-black base with monochrome structure and a single signature accent.

```
Base
  bg-page        #0F0D0B   warm near-black, NOT pure #000
  bg-surface     #1A1714   elevated cards, panels
  bg-hover       #221E1A   interactive hover
  bg-raised      #2A2622   modal backdrops

Text
  text-primary   #F0EDE8   warm white, NOT pure #FFF
  text-secondary #9E968E   warm mid-gray
  text-tertiary  #6B645D   deep mid-gray
  text-disabled  #413D38

Borders
  border-subtle  #221F1B   barely visible, structural
  border-default #2A2724   felt-not-seen, Linear pattern
  border-strong  #3A3632   emphasized dividers

Accent (pick ONE, use sparingly — only for active state)
  accent-gold    #C4943A   amber gold, warmer than safety amber
  accent-peri    #7B7FFF   periwinkle, distinct from tech blue
  RECOMMENDED:   accent-gold — matches warm base, feels deliberate

Status (reserved meanings)
  status-ok      #3D9970   completed, healthy
  status-work    #E8A03A   in progress, pending
  status-error   #D95F5F   blocked, failed
  status-info    #6B8FC4   ambient neutral info
```

**Dark mode is the default.** Light mode is secondary; if built, invert semantically (warm white base, not sRGB white).

### 4.3 Spacing & Layout

- Base unit: **4px**. All spacing is a multiple of 4.
- Tight (chrome, button padding): 8px
- Standard (content, card padding): 16px
- Section separation: 24px
- Major layout gaps: 48px
- Max content width: 1280px (web); full-viewport for mission control

### 4.4 Border Radius

- Chips, badges: 6px (soft, but defined)
- Cards, buttons: 8px
- Panels, modals: 12px
- **Terminal/code blocks: 0px** (hard edges signal machine precision — Warp pattern)

### 4.5 Motion

- **Palette open/close:** 120ms ease-out, scale 98% → 100%. Fast but not jumpy.
- **Panel transitions:** 200ms ease-in-out. Slide from edge, not fade.
- **Active-agent pulse:** 2000ms sine wave, opacity 60% → 100%. Ambient, not attention-grabbing.
- **New block slide-in:** 180ms ease-out, translate 12px up + fade in.
- **Approval card arrival:** subtle bounce (one cycle, 300ms, spring easing).
- **Max duration for user-triggered:** 400ms. Anything longer feels slow.
- **Prefer `transform` + `opacity` over layout shifts.**

### 4.6 Elevation / Depth

- Level 0: page background
- Level 1: cards (`bg-surface`, no shadow)
- Level 2: floating panels (`bg-surface`, subtle shadow `0 1px 3px rgba(0,0,0,0.3)`)
- Level 3: modals, command palette (`bg-raised`, stronger shadow `0 8px 24px rgba(0,0,0,0.5)` + 12px blur backdrop)
- **No more than 3 depth levels visible simultaneously.**

---

## 5. Web App — Information Architecture

Single-page workspace. No traditional nav. Three permanent surfaces + one overlay.

```
┌─────────────────────────────────────────────────────────────────────┐
│  TITLEBAR — thin, 32px                                              │
│  Anton monogram · workspace selector · current time · Cmd+K hint    │
├──────────┬───────────────────────────────────────┬──────────────────┤
│          │                                       │                  │
│  LEFT    │  CENTER STAGE (changes)               │  APPROVAL TRAY   │
│  RAIL    │                                       │  (persistent)    │
│  240px   │  Default: Mission Control             │  320px           │
│          │    26-agent grid, status-colored      │                  │
│  Briefing│    Click = expand to agent detail     │  Pending items   │
│  Agents  │                                       │  diff view       │
│  Memory  │  Alt views (driven by left rail):    │  approve/reject  │
│  Log     │    Briefing, Memory, Log              │  inline reasoning│
│  Settings│                                       │                  │
│          │                                       │  Empty state:    │
│          │                                       │  "Nothing pending│
│          │                                       │   right now."    │
│          │                                       │                  │
├──────────┴───────────────────────────────────────┴──────────────────┤
│  COMMAND BAR — 48px, bottom                                         │
│  "/delegate marcus..."  |  Mic icon  |  @local @claude toggle       │
└─────────────────────────────────────────────────────────────────────┘

Overlay (Cmd+K): Command palette, center-screen, 640px wide, Berkeley Mono
```

### 5.1 Key screens

**Mission Control (default home)**

- 26 agent cards in a 5×6 grid (empty slots show ghost cards hinting expansion).
- Each card: agent name, department chip, trust tier badge (green/amber/red), current status glow (idle charcoal / amber pulse working / green pulse complete / red flash error), queue depth (e.g. "2 pending"), last action timestamp.
- Hover: show keyboard shortcuts (R run, P pause, V history).
- Click: expand to Agent Detail panel — full activity history, memory this agent has, tools available, message-this-agent inline.
- At the top, one-line ambient summary: "7 agents active · 3 approvals waiting · morning briefing in 27 min."

**Briefing**

- Granola-inspired split pane. Left: today's summary (auto-generated by Anton at 8am). Right: live activity stream.
- Summary sections: Active sprints · Calendar highlights · Overnight activity · Today's priorities · Flagged items.
- Every line is a permalinkable block. Click = see source (which conversation, which agent, which memory).

**Approval Tray (always visible, right sidebar)**

- Compact cards, stack oldest-bottom.
- Each card: agent monogram + name · risk level badge (L/M/H) · 1-line intent preview · two buttons (Approve / Reject) · "why?" expand link.
- High-risk: diff view expanded by default. Medium: collapsed with expand. Low: single-tap approve.
- Empty state: "Nothing pending right now."

**Memory Browser**

- Search bar (full-text + semantic) with scope chips: All / Agent / Project / Time range.
- Results as highlighted snippets (Readwise-inspired warm highlight colors: `#FBDA83` yellow, `#E4938E` coral, `#8DBBFF` soft blue).
- Each memory shows: type icon (fact / decision / preference / conversation), confidence dot, source attribution, when stored, which agents have access.
- Hover a memory: "Delete" / "Edit" / "Mark wrong" actions.

**Activity Timeline (Log)**

- Reverse-chronological feed of every agent action, tool call, handoff, approval.
- Verbosity slider top-right: Summary / Normal / Full trace. Default: Normal.
- Filter chips: agent name, action type, time range.
- Each entry is a Warp-style block — collapsed by default, expand to see full reasoning + params.
- Right-click a block = copy permalink, view source, annotate.

### 5.2 Command palette (Cmd+K everywhere)

- Center-screen, 640px × auto, Berkeley Mono.
- Top: input. Bottom: context hint (current screen + recent commands).
- Results: fuzzy-matched + contextually scored. Each result shows the keyboard shortcut for it in the right column.
- Sections: Actions · Agents · Memory · Navigation · System.
- Parameterized templates (Raycast-inspired): `/delegate {{agent}} {{task}}`, `/remind {{agent}} in {{duration}}`, `/search memory for {{query}}`.

### 5.3 Keyboard shortcut map (Linear-style)

| Shortcut            | Action                                |
| ------------------- | ------------------------------------- |
| Cmd+K               | Command palette                       |
| G then A            | Go to Agents (Mission Control)        |
| G then B            | Go to Briefing                        |
| G then P            | Go to Pending Approvals (focus tray)  |
| G then M            | Go to Memory Browser                  |
| G then L            | Go to Log (Activity Timeline)         |
| Cmd+Enter           | Send current draft in command bar     |
| Cmd+/               | Toggle keyboard shortcut overlay      |
| Cmd+\               | Toggle left rail                      |
| Cmd+]               | Toggle approval tray                  |
| A (on hovered card) | Approve                               |
| R (on hovered card) | Reject                                |
| V (on agent card)   | View full history                     |
| ESC                 | Close palette / modal / expanded card |

---

## 6. Mobile App — Information Architecture

iOS-first. React Native + Expo SDK 54. Voice-forward, not voice-only.

```
┌──────────────────────────┐
│  STATUS BAR              │
├──────────────────────────┤
│                          │
│  CONTENT AREA            │
│  (tab-driven)            │
│                          │
│                          │
│                          │
│                          │
├──────────────────────────┤
│  TAB BAR                 │
│  🏠  🤖  ✓  🎙             │
│ Brief Agents Appr Voice  │
└──────────────────────────┘

Voice tab: full-screen takeover with waveform
```

### 6.1 Four tabs

**1. Briefing**

- Mobile version of web Briefing — scrollable card stack.
- Top: time-of-day greeting ("Good morning. 3 things need you today.")
- Cards: Morning brief · Pending approvals summary · Overnight activity · Today's calendar.
- Pull-to-refresh (haptic feedback on release).

**2. Agents**

- Horizontal scroll of department pills (Eng / Mktg / SEO / Data / Finance / Product).
- Vertical scroll of agent cards for selected department.
- Tap agent = detail screen with history + message input.

**3. Approvals**

- Stack of cards, most urgent on top.
- Card: agent avatar + name, 1-line intent, risk level, diff preview if high-risk.
- **Swipe right = approve** (haptic + green flash).
- **Swipe left = reject** (haptic + red flash).
- Tap = expand with full reasoning + inline approve/reject buttons.
- Badge count on tab bar.

**4. Voice**

- Full-screen takeover. No navigation visible.
- Center: large circular waveform visualizer (animates with voice input).
- Below: live transcription as user speaks.
- Below that: Anton's response streaming in (text + audio simultaneously).
- Top-left: X to close. Top-right: settings (voice, model, PTT vs continuous).
- **Default mode: push-to-talk.** Hold-to-speak button at bottom.
- Long-press close = switch to continuous listening (opt-in, shows recording indicator).

### 6.2 Rich notifications (iOS 26)

- Proactive notifications distinct from reactive (sender: "Anton · Morning Brief" vs "Anton").
- Interactive action buttons inline: approve, reject, snooze, open.
- Grouped batching: if 4 agents complete tasks, one grouped notification ("4 tasks completed — tap to review").
- Never ping for low-priority. Config: Noel sets notification trust tier per agent.

### 6.3 Home screen widget (medium, 2×4)

- Top line: live ambient status ("Anton · working on 2")
- Middle: approval badge count + 1-line preview of top pending item
- Bottom: microphone button (tap = opens Voice tab), next-event chip
- Refreshes every 15 min via background push.

### 6.4 Gestures & haptics

- Swipe on cards: right = approve, left = reject (standard iOS affordance)
- Long-press on agent card: quick-action menu (Message / View history / Pause)
- Pull-down on any tab: refresh with haptic on release
- Double-tap side button: activate voice (physical button shortcut via Shortcuts app integration)

### 6.5 Auth & security

- **FaceID required on every cold open.** No PIN visible (Cash App pattern).
- Session persists 30 min of activity before re-auth.
- App backgrounded > 2 min = blur screen + require FaceID on return.
- Biometric failure: 3 attempts then lockout for 5 min.

---

## 7. Component Library — The Pieces

Designed once, reused everywhere. Each component maps to a token.

| Component           | Purpose                      | Key states                                           |
| ------------------- | ---------------------------- | ---------------------------------------------------- |
| **AgentCard**       | Grid tile for an agent       | idle · working (pulse) · complete · error · expanded |
| **ApprovalCard**    | Item in approval tray        | low-risk · medium-risk · high-risk (diff expanded)   |
| **Block**           | Sealed activity entry        | collapsed · expanded · permalinked · annotated       |
| **CommandPalette**  | Cmd+K overlay                | empty · typing · results · executing                 |
| **CommandBar**      | Bottom persistent input      | idle · focused · voice-active · override-forced      |
| **TrustBadge**      | Trust tier indicator         | green (auto) · amber (confirms) · red (manual)       |
| **ConfidenceDot**   | Per-output confidence        | certain · uncertain · escalating (3 states, not %)   |
| **MemoryRow**       | Entry in memory browser      | fact · decision · preference · conversation · edited |
| **DiffView**        | Inline action preview        | approve/reject actions embedded                      |
| **StatusGlow**      | Ambient agent state          | idle · working (pulse 2s) · complete (flash) · error |
| **VerbositySlider** | Timeline verbosity           | summary · normal · full-trace                        |
| **AmbientSummary**  | One-line top-of-screen state | updates every 30s without interrupting               |

---

## 8. Copy & Voice

Anton has a voice. It shows up in every string.

### 8.1 Rules

- **First person, system-aware.** "I'm routing this to Marcus." Not "Routing to Marcus." Not "The system is routing..."
- **Direct, no hedging.** "Done." Not "I've completed that for you!" Never "certainly", "of course", "happy to help".
- **Context-aware.** Error messages reference what Noel was doing. Empty states reference time-of-day.
- **Terse by default.** Expand on demand. Two sentences beats a paragraph.
- **Anton's name appears rarely.** It's Noel's OS — Anton doesn't need to introduce himself constantly.

### 8.2 Copy samples

**Empty states:**

- Approval tray empty: "Nothing pending right now."
- Memory search no results: "No memory of that. Want me to remember it going forward?"
- Agent idle, queue empty: "[Agent name] is clear. Queue up work with Cmd+K → delegate."
- Briefing before 8am: "Briefing runs at 8. Grab coffee."

**Errors:**

- Ollama down: "Lost contact with the local model. Retrying. Claude is picking up the slack."
- Claude quota hit: "Claude's subscription window is full. Holding until 9pm reset."
- Network: "Can't reach the outside world. Local work still running."
- Unknown: "Something went sideways. I'm looking into it."

**Status:**

- Starting up: "Anton coming online. Checking the team."
- Morning greeting: "Good morning. 3 things need you today."
- All done: "That's the queue. What's next?"
- Late night: "It's past midnight. I'll handle the rest until you're back."

**Approvals:**

- Low risk: "Marcus wants to draft the PRD. Approve?"
- High risk: "James is ready to push v1.2 to production. This is irreversible. Approve?"
- After auto-action: "I deployed v1.1 at 3:47pm. Because you said 'approve all routine deploys.' Undo available 30 min."

### 8.3 Anti-patterns (never do)

- ❌ "Your assistant Anton is ready to help!" (introducing self, hand-holding)
- ❌ "🎉 Task completed successfully!" (emoji celebration)
- ❌ "I'm sorry, I didn't understand that. Could you please rephrase?" (sycophantic hedging)
- ❌ "As an AI, I cannot..." (breaking character)
- ❌ "Please click the button below to..." (instructional, treats Noel like a novice)
- ❌ "Oops! Something went wrong." (casual, unprofessional)

---

## 9. Interaction Patterns — The Fluency Layer

The difference between a polished product and a great one.

### 9.1 Fluid patterns to build in

- **Block model (Warp):** Every agent action is a sealed block. Permalinkable. Annotatable. Collapsible inline.
- **Thinking disclosure (Cursor):** Inline expand showing reasoning. Three levels: summary → steps → full trace.
- **Split canvas (Granola):** Noel's notes on one side, Anton's activity on the other. Never fight for the same space.
- **Context-aware Cmd+K (Superhuman):** Commands relevant to the current screen rank higher.
- **Ambient pulse (Linear):** Agent actively working → slow 2s glow. Never a spinner.
- **Diff before action (Smashing pattern):** Every irreversible action shows a plan card with Proceed / Edit / Handle Myself.
- **"Because you said X" explanations:** When Anton acts autonomously, explanations cite Noel's prior instructions.
- **Autonomy dial per agent:** Four states — Suggest / Draft / Execute / Autonomous. Visible badge on every card.

### 9.2 Anti-patterns to reject

- ❌ Linear chat as primary surface (chat is tertiary — command bar + approvals tray + agent grid carry more weight)
- ❌ Floating mascots, waving AI avatars, personality brought through character design
- ❌ Modal dialogs that lock the screen (approvals live in the tray, not modals)
- ❌ Loading spinners on AI actions (use ambient pulse on the specific agent card)
- ❌ Toasts for every event (use the activity timeline; toasts only for explicit user actions)
- ❌ Sidebar nav with 10 items (we have 5 max: Briefing, Agents, Memory, Log, Settings)
- ❌ Primary CTA buttons in bright blue (color carries meaning — buttons are accent-gold or neutral)

---

## 10. Accessibility

- **Keyboard:** every action reachable via Cmd+K + shortcuts. Tab order logical.
- **Contrast:** all text passes WCAG AA on `#0F0D0B` background (minimum 4.5:1 for body, 3:1 for large text).
- **Focus states:** visible 2px `accent-gold` ring with 2px offset.
- **Screen reader:** semantic HTML (button for buttons, role="status" for live regions).
- **Motion:** respect `prefers-reduced-motion` — disable pulses and slides for users with vestibular needs.
- **Color-blindness:** every color has a shape/icon pair. Status = color + icon (✓ ○ ✕).

---

## 11. Responsive / Adaptive Behavior

### Web breakpoints

- **≥ 1440px:** Full 3-column layout (left rail 240px + center + approval tray 320px).
- **1024–1439px:** Approval tray collapses to 48px icon rail (badge count visible); click to expand as overlay.
- **768–1023px:** Left rail also collapses to icon rail. Only center stage + minimized rails.
- **< 768px:** Mobile web view — use mobile app IA, not a cramped desktop shim.

### Mobile

- **iPhone** SE (small) through Pro Max: tested; component-level responsive.
- **iPad:** adapts to desktop IA with touch-optimized hit targets (44×44 min).

---

## 12. What To Steal From (Inspiration References)

Study these. Do not copy wholesale. The goal is _informed taste_, not pastiche.

| Source                    | What to study                                             | URL                        |
| ------------------------- | --------------------------------------------------------- | -------------------------- |
| **Linear**                | Color discipline, border philosophy, keyboard model       | linear.app                 |
| **Arc Browser**           | Distinctive personality without clutter, Spaces model     | arc.net                    |
| **Raycast**               | Command palette, parameterized templates, extension model | raycast.com                |
| **Superhuman**            | Monospace command palette, Cmd+K centrality               | superhuman.com             |
| **Granola**               | Split canvas, invisible-until-needed AI                   | granola.ai                 |
| **Cursor**                | Inline thinking disclosure, chain-of-thought UX           | cursor.com                 |
| **Warp**                  | Block model for agent actions                             | warp.dev                   |
| **Dia (Browser Company)** | URL bar as universal input, tab-scoped memory             | diabrowser.com             |
| **Things 3**              | Lived-in feel, copy voice, attention to detail            | culturedcode.com/things    |
| **Readwise Reader**       | Warm highlight palette, annotation as first-class         | readwise.io/read           |
| **Apple visionOS HIG**    | Depth, material, selective translucency                   | developer.apple.com/design |
| **Rauno Freiberg**        | Motion philosophy, interaction as first-class             | raunofreiberg.com          |

---

## 13. What NOT To Design Like

Explicit rejections. These are the generic patterns to avoid.

- ❌ **ChatGPT.** Center-column chat, empty-until-prompted, sidebar of past chats. Anton is not a conversation log.
- ❌ **Claude.ai.** Clean but uniform gray-on-white with huge whitespace. Anton is not a document editor.
- ❌ **Slack.** Left-rail-of-channels + center-chat. Anton is not a team inbox.
- ❌ **Notion AI.** Floating "ask AI" button grafted onto a doc editor. Anton is not an add-on.
- ❌ **Stock shadcn/ui out of the box.** Stock shadcn is a starter, not a design. Tokenize everything.
- ❌ **Material Design.** Google's system is for Google. It is not Anton.
- ❌ **Any Tailwind default palette.** `bg-gray-900 text-gray-100` is the 2023 aesthetic. We're in 2026.
- ❌ **Gradients, glass-morphism, purple accents.** All three are tells of 2022 design.
- ❌ **Rounded corners everywhere.** Hard edges on terminal/code. Soft edges on panels. Differentiated.

---

## 14. Deliverables

From a designer or design-generation tool, expect:

### 14.1 Design system (Figma or equivalent)

- Color tokens with semantic naming
- Type scale with all variants
- Spacing scale
- Elevation system
- Motion token library (timing + easing curves)
- Component library (all §7 components, all states)
- Icon library (minimum 50 icons — custom, not heroicons)

### 14.2 Web app screens (high-fidelity mockups)

- [ ] Mission Control (default home) — default, hover, expanded agent
- [ ] Briefing — full view + scroll states
- [ ] Approvals tray — empty, 1 item, 5 items, high-risk expanded
- [ ] Memory Browser — empty search, results, highlighted memory detail
- [ ] Activity Timeline — summary, normal, full-trace verbosity
- [ ] Command palette — empty, typing, results, executing
- [ ] Agent Detail (expanded) — history + message input
- [ ] Settings — trust tiers, integrations, preferences
- [ ] Authentication / onboarding — first-run setup flow

### 14.3 Mobile app screens

- [ ] Briefing tab — morning, afternoon, late-night states
- [ ] Agents tab — department list + agent detail
- [ ] Approvals tab — 0, 1, 5, 10 items
- [ ] Voice tab — idle, listening, transcribing, responding
- [ ] Home screen widget — small, medium, large
- [ ] Lock screen notification — proactive, reactive, grouped
- [ ] Settings / auth gate

### 14.4 Motion specification

- Lottie files or Figma Smart Animate prototypes for:
  - Active-agent pulse
  - Approval card arrival
  - Command palette open/close
  - New activity block slide-in
  - Swipe-to-approve gesture
  - Voice waveform visualizer

### 14.5 Interaction prototype

- Figma prototype showing: home → delegate via Cmd+K → watch agent work in card → approve result in tray → see audit in log
- One end-to-end flow demonstrating the feel

### 14.6 Documentation

- Design principles doc (based on §3)
- Component usage guide (when to use which, common pairings)
- Copy style guide (based on §8)
- Handoff notes for engineering — Next.js + Tailwind tokens ready to build

---

## 15. Acceptance Criteria — When Design Is Done

The design is ready for engineering when:

1. Every screen in §14.2 and §14.3 has three high-fidelity states (default + two edge cases) designed with real content, not lorem ipsum.
2. Every component in §7 has all listed states designed.
3. Motion spec is documented and one working prototype exists.
4. A one-line test: "Is this distinguishable from a generic AI tool at first glance?" — if the answer requires reading, the design failed.
5. Copy has been reviewed against §8 — every string rewritten in Anton's voice.
6. Accessibility is verified (contrast, keyboard, focus) in Figma annotations.
7. The design is presented in a 10-minute walkthrough where the designer can defend every non-obvious choice with a principle from §3.

---

## 16. Final Note to the Designer

Anton is personal. It lives with Noel for years. The design will age with him. It should feel like the instrument of a craftsperson, not a consumer product. Optimize for taste over trend. When in doubt, subtract. The best interface is the one you stop noticing — because it becomes the way you think.

Ship something Noel wants on his screen at 11pm on a Saturday, not something that demos well in a pitch deck.
