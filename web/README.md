# Anton Web

Production port of the Anton design prototype (`Design/anton/project/`).
Next.js 15 + React 19 + CSS variables from the prototype's tokens.css.

## Run

```bash
cd web
npm install
npm run dev       # opens localhost:3000
```

## Structure

```
app/
  globals.css        design tokens (warm-dark, true-dark, light themes)
  layout.tsx         root layout with theme + body shell
  page.tsx           default route = Mission Control
  lib/data.ts        mock data (15 agents, 6 departments, 5 approvals)
  ui/
    primitives.tsx   DeptChip, TrustBadge, StatusGlow, RiskPip, Kbd
    shell.tsx        WebShell = Titlebar + LeftRail + center + ApprovalTray + CommandBar
    mission-control.tsx   default screen with KpiStrip + agent list
public/prototype/    the design files exactly as shipped — for reference
```

## Design source of truth

- `Design/anton/README.md` — handoff bundle README from Claude Design
- `Design/anton/project/` — original HTML/JSX/CSS prototype (5,500 LOC, 18 modules)
- `docs/DESIGN-PROMPT.md` — 16-section design brief (principles, tokens, IA, components, copy, anti-patterns)

## What's implemented

- **tokens.css** → `app/globals.css` complete with all 3 themes
- **shared.jsx primitives** → `app/ui/primitives.tsx` (5 components)
- **shell.jsx** → `app/ui/shell.tsx` (Titlebar + LeftRail + CommandBar + ApprovalTray + WebShell)
- **mission-control.jsx (list variant)** → `app/ui/mission-control.tsx` (KPI strip + agent list rows)
- Mock data from `shared.jsx` → `app/lib/data.ts`

## What's not yet implemented (by module, see `Design/anton/project/`)

| Module                                                    | File                | Lines | Notes                                                   |
| --------------------------------------------------------- | ------------------- | ----- | ------------------------------------------------------- |
| Mission Control variants (dept / grid / orbit / terminal) | mission-control.jsx | 368   | Only list shipped                                       |
| Briefing                                                  | screens.jsx         | 545   | Morning/EOD briefing surface                            |
| Chat                                                      | screens.jsx         | —     | Conversation UI                                         |
| Team / Dept chart                                         | screens.jsx         | —     | Org-chart view                                          |
| Memory Browser                                            | screens.jsx         | —     | Readwise-style memory list                              |
| Activity Timeline / Log                                   | screens.jsx         | —     | Verbosity-switchable feed                               |
| Integrations Hub                                          | screens.jsx         | —     | Third-party tools                                       |
| Settings (6 sub-tabs)                                     | screens.jsx         | —     | Trust tiers, Arch, Memory, Voice, Notifications, Safety |
| Tasks / Inbox / Calendar                                  | tier1.jsx           | 703   | Core-productivity modules                               |
| Documents / Research / People / Expenses / Travel / Usage | tier2.jsx           | 590   | Extended modules                                        |
| Detail routes (agent / memory-item / event / integration) | detail-screens.jsx  | 491   | Individual item detail views                            |
| Mobile shell + screens                                    | mobile.jsx          | 450   | Native-mobile equivalent                                |
| Approval detail (expanded diff view)                      | extras.jsx          | 582   | Currently collapsed in tray                             |
| Tweaks panel (theme/accent/density live edit)             | shell.jsx           | —     | Development-only control                                |

## Next steps (suggested order)

1. Hook `onNav` to Next.js App Router: `/mc`, `/brief`, `/pending/[id]`, etc.
2. Build Approvals detail route (diff view, "why" expansion, approve/reject).
3. Memory Browser (FTS5 query → results list, highlight palette already in tokens).
4. Activity Timeline (wire to SQLite `conversations` + `task_events` tables).
5. Settings > Trust tiers (read/write against config/models.ts).
6. Extract inline styles to CSS modules once the pattern library stabilizes.
7. Wire to brain API: Slack-equivalent REST + WebSocket against `index.js` backend.
