# Anton Web

Production port of the Anton design prototype (`Design/anton/project/`).
Next.js 15 App Router · React 19 · Tailwind CSS v4 · TypeScript 6.

## Run

```bash
cd web && npm install && npm run dev
# http://localhost:3000
```

## Structure

```
web/
  app/                          Next.js App Router (routes only)
    globals.css                 Design tokens + Tailwind @theme mapping
    layout.tsx                  Root layout, theme attribute
    page.tsx                    Default route — mounts WebShell
  components/
    ui/                         Reusable atoms (prototype parity)
      primitives.tsx            DeptChip · TrustBadge · StatusGlow · RiskPip · Kbd
    layout/                     Shell + overlays
      shell.tsx                 WebShell + Titlebar + LeftRail + CommandBar + ApprovalTray
      command-palette.tsx       Cmd+K overlay with keyboard nav
    modules/                    Feature screens — one per nav target
      mission-control.tsx       KPI strip + agent list (default home)
      briefing.tsx              Morning/EOD briefing split pane
      memory-browser.tsx        FTS-style memory list with highlight palette
      activity-timeline.tsx     Log with verbosity slider + agent filters
      team.tsx                  Department chart + handoff routes
      settings.tsx              Trust tiers + integrations
      placeholders.tsx          Stubs for queued modules (Tasks, Inbox, Research, etc.)
  lib/
    data.ts                     Typed mock data (AGENTS, APPROVALS, MEMORIES, ACTIVITY)
    cn.ts                       `cn()` utility (clsx + tailwind-merge)
  public/prototype/             Original HTML/JSX prototype (reference, unchanged)
  postcss.config.mjs            Tailwind v4 PostCSS plugin
  next.config.ts                Minimal Next.js config
  tsconfig.json                 `@/*` → project root path alias
```

## Design system

Tokens live in `app/globals.css` as CSS variables under `:root`, with
`[data-theme='true-dark']` and `[data-theme='light']` overrides. The
Tailwind v4 `@theme inline {}` block maps them so utilities like
`bg-page`, `text-primary`, `border-subtle`, `bg-accent-soft`, `text-ok`
work out of the box.

Font stack: Söhne/Geist for body, Berkeley Mono for agent output and
code. Three themes (warm-dark default, true-dark, light). Helper
classes: `.mono`, `.small`, `.caps`, `.pulse`, `.slide-in`, `.dot`,
`.dot-ok/work/err/idle`.

## What's live

| Module                      | File                                       | Status                                           |
| --------------------------- | ------------------------------------------ | ------------------------------------------------ |
| Mission Control (list view) | `components/modules/mission-control.tsx`   | ✅ KPIs + agent rows with progress bars          |
| Briefing                    | `components/modules/briefing.tsx`          | ✅ Split pane: sections + live activity          |
| Memory Browser              | `components/modules/memory-browser.tsx`    | ✅ Filters + highlight palette + confidence dots |
| Activity Timeline           | `components/modules/activity-timeline.tsx` | ✅ Verbosity slider + agent filters + event rows |
| Team (Dept chart)           | `components/modules/team.tsx`              | ✅ Anton → dept cards + handoff routes           |
| Settings (Trust tiers)      | `components/modules/settings.tsx`          | ✅ Autonomy tier selector + integrations grid    |
| Approval Tray               | `components/layout/shell.tsx`              | ✅ Expand + diff view + approve/reject           |
| Command Palette             | `components/layout/command-palette.tsx`    | ✅ Cmd+K, arrow nav, esc                         |
| Keyboard shortcuts          | `shell.tsx`                                | ✅ ⌘K palette                                    |

## What's queued (stubs present, production port pending)

Nine modules have `Placeholder` stubs in `components/modules/placeholders.tsx`
that link to the prototype source file. Port priority (highest value first):

1. **Approvals Hub** — full approval queue + detail view with diff + multi-option selector (`new-screens.jsx ApprovalDetail`)
2. **Chat** — thread list + conversation view + composer (`new-screens.jsx ChatModule`)
3. **Tasks** — kanban + list view (`tier1.jsx`)
4. **Inbox** — unified message triage (`tier1.jsx`)
5. **Calendar** — day/week + agent overlay (`tier1.jsx`)
6. **Documents** — PRD/ADR editor (`tier2.jsx`)
7. **Research** — parallel spawn + synthesis (`tier2.jsx`)
8. **People** — CRM cards (`tier2.jsx`)
9. **Expenses/Travel/Usage** — financial + telemetry dashboards (`tier2.jsx`)

Also not yet ported:

- Mission Control variants (dept / grid / orbit / terminal) — `mission-control.jsx`
- Detail routes (agent / memory-item / event / integration) — `detail-screens.jsx`
- Mobile shell — `mobile.jsx`
- Tweaks panel — `shell.jsx`
- Settings sub-tabs (Architecture, Memory, Voice, Notifications, Safety) — in `extras.jsx`
- Onboarding — `screens.jsx`

## Next

- Wire Next.js App Router routes: `/mc`, `/brief`, `/memory`, `/team`, `/log`, `/settings`, etc.
- Port Approval Detail + Chat + Tasks (highest-value remaining screens)
- Add API routes that talk to the brain: `POST /api/message` → brain.process
- WebSocket stream for agent activity → Activity Timeline live mode
- Convert inline styles to Tailwind utilities where it improves readability
- Extract TweaksPanel (theme/accent/density live edit) from `shell.jsx`
