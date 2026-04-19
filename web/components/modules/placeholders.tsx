'use client';
// Stubs for modules whose production port is queued. Each shows a concise
// "what this surface does" explanation + which design file to port from.
// See Design/anton/project/ for the source components.

function Placeholder({
  label,
  sub,
  source,
  preview,
}: {
  label: string;
  sub: string;
  source: string;
  preview: string[];
}) {
  return (
    <div style={{ padding: '24px 32px', height: '100%', overflow: 'auto' }}>
      <div className="mono caps" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 500, margin: '4px 0 6px' }}>{sub}</h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 0, marginBottom: 24, maxWidth: 720 }}>
        Production port queued. Source: <code className="mono">Design/anton/project/{source}</code>
      </p>
      <div
        style={{
          padding: 16,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--r-card)',
        }}
      >
        <div className="mono caps small" style={{ color: 'var(--text-tertiary)', marginBottom: 10 }}>
          WHAT THIS SURFACE WILL DO
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 13 }}>
          {preview.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Documents() {
  return (
    <Placeholder
      label="DOCUMENTS"
      sub="PRDs, ADRs, and long-form artifacts"
      source="tier2.jsx"
      preview={[
        'Editor for PM-agent-drafted PRDs + tech-lead ADRs',
        'Version history, inline comments from agents',
        'Linkable @mentions of agents, memories, tasks',
        'Export to Git branch, Notion, or plain markdown',
      ]}
    />
  );
}

export function Research() {
  return (
    <Placeholder
      label="RESEARCH"
      sub="Parallel research spawns + synthesized reports"
      source="tier2.jsx"
      preview={[
        'Kick off a research prompt; watch N parallel agent threads',
        'Auto-synthesize into a single cited report with sources',
        'Save as memory / decision / document with one click',
        'History of past research runs + their outcomes',
      ]}
    />
  );
}

export function People() {
  return (
    <Placeholder
      label="PEOPLE"
      sub="CRM of humans Noel works with"
      source="tier2.jsx"
      preview={[
        'Per-person card: last contact, open threads, decisions involving them',
        'Auto-populated from Slack, email, calendar',
        'Linked to memory: "Noel always CCs Marcus on deploy decisions"',
        'Quick actions: draft intro, schedule, send update',
      ]}
    />
  );
}

export function Expenses() {
  return (
    <Placeholder
      label="EXPENSES"
      sub="Financial ops dashboard"
      source="tier2.jsx"
      preview={[
        'Stripe subscriptions, recurring bills, one-off purchases',
        'Diana (reconciliation) flags anomalies + proposes fixes',
        'Category trends + burn rate + runway',
        'Export to accounting, approve bill payments inline',
      ]}
    />
  );
}

export function Travel() {
  return (
    <Placeholder
      label="TRAVEL"
      sub="Trip planning + status"
      source="tier2.jsx"
      preview={[
        'Upcoming + past trips with flight/hotel/expense ties',
        'Agent-assisted: "find a 3-night stop between X and Y"',
        'Automated out-of-office coordination with team agents',
        'Receipt capture → linked to Expenses automatically',
      ]}
    />
  );
}

export function Usage() {
  return (
    <Placeholder
      label="USAGE"
      sub="System telemetry + model spend"
      source="tier2.jsx"
      preview={[
        'Token usage per agent per day (local vs Claude split)',
        'Latency percentiles, circuit-breaker events',
        'Memory growth, skill success-rate trends',
        'Budget alerts when Claude quota approaches cap',
      ]}
    />
  );
}

export function IntegrationsHub() {
  return (
    <Placeholder
      label="HANDS"
      sub="Integrations + tool access"
      source="detail-screens.jsx"
      preview={[
        'Connected services: Slack, GitHub, Stripe, Calendar, Gmail, etc.',
        'Per-tool access grants + per-agent scoping',
        'Credential expiry alerts (Stripe API key just expired)',
        'Tool-call audit: which agent used which tool when',
      ]}
    />
  );
}

export function ApprovalsHub() {
  return (
    <Placeholder
      label="APPROVALS"
      sub="Full approval queue + detail view"
      source="new-screens.jsx ApprovalDetail"
      preview={[
        'Expanded view of the tray (diff expansion, "why" reasoning)',
        'Multi-option selector (pick from 3 proposed approaches)',
        'On-approve preview: what Anton will do next',
        'Keyboard-first: A/B/C to pick, ⌘⏎ to approve, R to request edit',
      ]}
    />
  );
}
