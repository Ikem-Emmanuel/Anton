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
