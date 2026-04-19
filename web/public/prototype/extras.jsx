// Additional screens: Integrations hub, Architecture, Full settings, Notifications, Safety, Voice cfg, Memory cfg, Destructive modal, FaceID
const INTEGRATIONS = [
  { id:'slack',   name:'Slack',    cat:'messaging', status:'ok',      note:'2 workspaces · 14 channels scoped',    scopes:['read','write','mention'], last:'live' },
  { id:'gmail',   name:'Gmail',    cat:'email',     status:'ok',      note:'noel@anton.computer · 1,284 threads', scopes:['read','draft','send w/ approval'], last:'1m' },
  { id:'jira',    name:'Jira',     cat:'tasks',     status:'ok',      note:'ENG-* · PRD-* projects',              scopes:['read','comment','transition'], last:'3m' },
  { id:'asana',   name:'Asana',    cat:'tasks',     status:'ok',      note:'mirrored to SQLite tasks table',      scopes:['read','write'], last:'2m' },
  { id:'gh',      name:'GitHub',   cat:'code',      status:'ok',      note:'anton-computer/anton · PR + issues', scopes:['repo','issues','pull-requests'], last:'32s' },
  { id:'cal',     name:'Calendar', cat:'calendar',  status:'ok',      note:'Google Calendar · 2 calendars',       scopes:['read','write'], last:'5m' },
  { id:'stripe',  name:'Stripe',   cat:'finance',   status:'error',   note:'API key expired 2h ago',              scopes:['read','reports'], last:'2h' },
  { id:'linear',  name:'Linear',   cat:'tasks',     status:'idle',    note:'available · not connected',           scopes:[], last:null },
  { id:'notion',  name:'Notion',   cat:'docs',      status:'ok',      note:'Personal OS workspace',               scopes:['read','append'], last:'14m' },
  { id:'drive',   name:'Drive',    cat:'files',     status:'warn',    note:'1.2GB · re-index pending',            scopes:['read'], last:'1h' },
  { id:'x',       name:'X / Twitter', cat:'social', status:'ok',      note:'@noel_anton · post w/ approval',      scopes:['post','read timeline'], last:'18m' },
  { id:'figma',   name:'Figma',    cat:'design',    status:'idle',    note:'available · not connected',           scopes:[], last:null },
];

const statusColor = { ok:'var(--ok)', warn:'var(--work)', error:'var(--error)', idle:'var(--text-tertiary)' };
const statusLabel = { ok:'connected', warn:'attention', error:'failing', idle:'available' };

/* ─────────── INTEGRATIONS HUB ─────────── */
function IntegrationsHub({ onNav }) {
  const [filter, setFilter] = React.useState('all');
  const cats = ['all', 'messaging','email','tasks','code','calendar','finance','docs','files','social','design'];
  const filtered = filter==='all' ? INTEGRATIONS : INTEGRATIONS.filter(i => i.cat === filter);
  return (
    <div style={{padding:'24px 32px', height:'100%', overflow:'auto'}}>
      <div style={{display:'flex', alignItems:'baseline', gap:14, marginBottom:6}}>
        <div className="mono caps" style={{color:'var(--text-tertiary)'}}>SETTINGS / INTEGRATIONS</div>
      </div>
      <h1 style={{fontSize:26, fontWeight:500, margin:'4px 0 8px'}}>Hands</h1>
      <p style={{color:'var(--text-secondary)', marginTop:0, marginBottom:24, maxWidth:620}}>
        External services Anton can see and act through. Scopes minimized by default. Writes above low-risk require approval per agent's trust tier.
      </p>

      <div style={{display:'flex', gap:6, marginBottom:18, flexWrap:'wrap'}}>
        {cats.map(c => (
          <button key={c} onClick={()=>setFilter(c)} className="mono small" style={{
            padding:'4px 10px',
            background: filter===c ? 'var(--accent-soft)' : 'transparent',
            color: filter===c ? 'var(--accent)' : 'var(--text-secondary)',
            border:`1px solid ${filter===c ? 'var(--accent)' : 'var(--border-default)'}`,
            borderRadius:'var(--r-chip)', cursor:'pointer', textTransform:'capitalize',
          }}>{c}</button>
        ))}
        <span style={{flex:1}}/>
        <button className="mono small" style={{
          padding:'4px 12px', background:'var(--accent)', color:'var(--bg-page)',
          border:'none', borderRadius:'var(--r-chip)', cursor:'pointer', fontWeight:500,
        }}>+ Connect service</button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
        {filtered.map(i => (
          <div key={i.id}
            onClick={()=>onNav && onNav('integration', { intId: i.id })}
            onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
            onMouseLeave={e=>e.currentTarget.style.background='var(--bg-surface)'}
            style={{
            padding:'14px 16px', background:'var(--bg-surface)', cursor:'pointer',
            border:`1px solid ${i.status==='error'?'var(--error)':i.status==='warn'?'var(--work)':'var(--border-subtle)'}`,
            borderRadius:'var(--r-card)', display:'flex', flexDirection:'column', gap:8,
          }}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <div style={{
                width:28, height:28, borderRadius:6, background:'var(--bg-raised)',
                border:'1px solid var(--border-default)', display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-secondary)',
              }}>{i.name.slice(0,2).toUpperCase()}</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:14, fontWeight:500}}>{i.name}</div>
                <div className="mono small" style={{color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.08em', fontSize:10}}>{i.cat}</div>
              </div>
              <span style={{display:'inline-flex', alignItems:'center', gap:5}}>
                <span style={{width:6, height:6, borderRadius:'50%', background:statusColor[i.status]}}/>
                <span className="mono small" style={{color:statusColor[i.status], fontSize:10, textTransform:'uppercase', letterSpacing:'0.08em'}}>{statusLabel[i.status]}</span>
              </span>
            </div>
            <div className="mono small" style={{color:'var(--text-secondary)', fontSize:12, lineHeight:1.5}}>{i.note}</div>
            {i.scopes.length > 0 && (
              <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                {i.scopes.map(s => (
                  <span key={s} className="mono small" style={{
                    padding:'1px 6px', fontSize:10, color:'var(--text-tertiary)',
                    border:'1px solid var(--border-subtle)', borderRadius:4,
                  }}>{s}</span>
                ))}
              </div>
            )}
            <div style={{display:'flex', alignItems:'center', gap:8, marginTop:4, paddingTop:8, borderTop:'1px solid var(--border-subtle)'}}>
              <span className="mono small" style={{color:'var(--text-tertiary)', fontSize:11}}>
                {i.last ? `last sync ${i.last}` : 'not configured'}
              </span>
              <span style={{flex:1}}/>
              {i.status==='idle'
                ? <button className="mono small" style={{padding:'3px 10px', background:'var(--accent-soft)', color:'var(--accent)', border:'1px solid var(--accent)', borderRadius:4, cursor:'pointer', fontSize:11}}>connect</button>
                : i.status==='error'
                ? <button className="mono small" style={{padding:'3px 10px', background:'transparent', color:'var(--error)', border:'1px solid var(--error)', borderRadius:4, cursor:'pointer', fontSize:11}}>reconnect</button>
                : <button className="mono small" style={{padding:'3px 10px', background:'transparent', color:'var(--text-secondary)', border:'1px solid var(--border-default)', borderRadius:4, cursor:'pointer', fontSize:11}}>manage</button>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── ARCHITECTURE (v2.1 pipeline) ─────────── */
function ArchScreen() {
  const Layer = ({ n, title, sub, body, col }) => (
    <div style={{
      padding:'14px 18px', background:'var(--bg-surface)',
      border:'1px solid var(--border-default)', borderLeft:`3px solid ${col}`,
      borderRadius:'var(--r-card)', marginBottom:8,
    }}>
      <div style={{display:'flex', alignItems:'baseline', gap:10, marginBottom:4}}>
        <span className="mono small" style={{color:col, letterSpacing:'0.12em'}}>LAYER {n}</span>
        <span style={{fontSize:14, fontWeight:500}}>{title}</span>
        <span style={{flex:1}}/>
        <span className="mono small" style={{color:'var(--text-tertiary)'}}>{sub}</span>
      </div>
      <div className="mono small" style={{color:'var(--text-secondary)', lineHeight:1.7}}>{body}</div>
    </div>
  );
  return (
    <div style={{padding:'24px 32px', height:'100%', overflow:'auto'}}>
      <div className="mono caps" style={{color:'var(--text-tertiary)'}}>SETTINGS / ARCHITECTURE</div>
      <h1 style={{fontSize:26, fontWeight:500, margin:'4px 0 8px'}}>Routing pipeline · v2.1</h1>
      <p style={{color:'var(--text-secondary)', marginTop:0, marginBottom:20, maxWidth:720}}>
        Every message flows through these three layers. Layer 0 short-circuits when it can. Layer 1 classifies when the pre-gate is ambiguous. Layer 2 responds at the right depth.
      </p>

      <Layer n="0" title="Deterministic pre-gate" sub="0ms · no LLM" col="var(--info)"
        body={<>
          <div>@claude / @local prefix → force path</div>
          <div>code block → needsClaude:true · token count &gt; 400 → needsClaude:true</div>
          <div>explicit agent ping → routeTo:&lt;agent&gt; · approval regex → approval handler</div>
        </>}/>
      <Layer n="1" title="Fast classifier" sub="200–400ms · qwen3:8b · think:false" col="var(--work)"
        body={<>
          <div>schema-constrained JSON via Ollama format:&lt;schema&gt; (0.5+)</div>
          <div>output: intent · complexity · agent · depth · needsClaude · confidence</div>
          <div>confidence &lt; 0.6 → escalate to Claude</div>
        </>}/>
      <Layer n="2" title="Responder · depth-controlled" sub="variable" col="var(--accent)"
        body={<>
          <div>minimal/standard (think:false) · detailed/deep (think:true)</div>
          <div>system = persona + memory + ambient_context</div>
          <div>circuit-breaker open → Claude fallback (shared persona, same voice)</div>
        </>}/>

      <div style={{marginTop:28, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
        <div style={{padding:16, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)'}}>
          <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:8}}>HARDWARE TIER · current</div>
          <div style={{display:'flex', alignItems:'baseline', gap:8, marginBottom:10}}>
            <span style={{fontSize:22, color:'var(--accent)'}}>Tier 1</span>
            <span className="mono small" style={{color:'var(--text-tertiary)'}}>16GB · MacBook Pro</span>
          </div>
          <table style={{width:'100%', fontFamily:'var(--font-mono)', fontSize:12}}>
            <tbody>
              <tr><td style={{color:'var(--text-tertiary)', padding:'2px 0'}}>local-fast</td><td style={{color:'var(--text-primary)', textAlign:'right'}}>qwen3:8b</td></tr>
              <tr><td style={{color:'var(--text-tertiary)', padding:'2px 0'}}>local-reason</td><td style={{color:'var(--text-primary)', textAlign:'right'}}>qwen3:8b (deep)</td></tr>
              <tr><td style={{color:'var(--text-tertiary)', padding:'2px 0'}}>local-coder</td><td style={{color:'var(--text-tertiary)', textAlign:'right'}}>→ claude</td></tr>
              <tr><td style={{color:'var(--text-tertiary)', padding:'2px 0'}}>local-embed</td><td style={{color:'var(--text-primary)', textAlign:'right'}}>nomic-embed-text</td></tr>
              <tr><td style={{color:'var(--text-tertiary)', padding:'2px 0'}}>claude fallback</td><td style={{color:'var(--text-primary)', textAlign:'right'}}>20–30%</td></tr>
            </tbody>
          </table>
        </div>
        <div style={{padding:16, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)'}}>
          <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:8}}>NEXT TIER · apr 22</div>
          <div style={{display:'flex', alignItems:'baseline', gap:8, marginBottom:10}}>
            <span style={{fontSize:22, color:'var(--accent)'}}>Tier 3</span>
            <span className="mono small" style={{color:'var(--text-tertiary)'}}>128GB · Mac Studio</span>
          </div>
          <table style={{width:'100%', fontFamily:'var(--font-mono)', fontSize:12}}>
            <tbody>
              <tr><td style={{color:'var(--text-tertiary)', padding:'2px 0'}}>local-fast</td><td style={{color:'var(--text-primary)', textAlign:'right'}}>qwen3:8b</td></tr>
              <tr><td style={{color:'var(--text-tertiary)', padding:'2px 0'}}>local-reason</td><td style={{color:'var(--text-primary)', textAlign:'right'}}>qwen3.6:35b-a3b</td></tr>
              <tr><td style={{color:'var(--text-tertiary)', padding:'2px 0'}}>local-coder</td><td style={{color:'var(--text-primary)', textAlign:'right'}}>coder:32b</td></tr>
              <tr><td style={{color:'var(--text-tertiary)', padding:'2px 0'}}>local-embed</td><td style={{color:'var(--text-primary)', textAlign:'right'}}>bge-m3</td></tr>
              <tr><td style={{color:'var(--text-tertiary)', padding:'2px 0'}}>claude fallback</td><td style={{color:'var(--text-primary)', textAlign:'right'}}>&lt;5%</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{marginTop:20, display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10}}>
        {[
          ['p50 latency', '2.1s', 'var(--ok)'],
          ['p95 latency', '8.4s', 'var(--ok)'],
          ['routing acc.', '96.3%', 'var(--ok)'],
          ['claude rate',  '22%', 'var(--work)'],
          ['memory turns', '1,487', 'var(--text-secondary)'],
          ['up',           '3d 14h', 'var(--text-secondary)'],
          ['retries / hr', '0.3', 'var(--text-secondary)'],
          ['circuit',      'closed', 'var(--ok)'],
        ].map(([l,v,c], i) => (
          <div key={i} style={{padding:'12px 14px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)'}}>
            <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:4}}>{l}</div>
            <div className="mono" style={{fontSize:18, color:c}}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── MEMORY SETTINGS ─────────── */
function MemorySettings() {
  return (
    <div style={{padding:'24px 32px', height:'100%', overflow:'auto', maxWidth:880}}>
      <div className="mono caps" style={{color:'var(--text-tertiary)'}}>SETTINGS / MEMORY</div>
      <h1 style={{fontSize:26, fontWeight:500, margin:'4px 0 20px'}}>Memory</h1>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:24}}>
        {[['memories','1,487'],['turns','34,220'],['size','612 MB'],['FTS5','ready']].map(([l,v]) => (
          <div key={l} style={{padding:'12px 14px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)'}}>
            <div className="mono small" style={{color:'var(--text-tertiary)'}}>{l}</div>
            <div style={{fontSize:18, fontWeight:500, marginTop:2}}>{v}</div>
          </div>
        ))}
      </div>

      {[
        { t:'Distillation pass', s:'after every turn · extracts facts · decisions · preferences · commitments', on:true },
        { t:'Hybrid retrieval', s:'BM25 (FTS5) + vector similarity via sqlite-vec · RRF fused top-5', on:true },
        { t:'Nightly consolidation', s:'per-agent summaries written to agent_journals · 03:00 local', on:true },
        { t:'Markdown export', s:'data/memory/YYYY-MM-DD.md · human-readable sidecar', on:true },
        { t:'Obsidian vault sync', s:'daily commit to ~/vault · noel\u2019s notes + long-form knowledge', on:false },
      ].map((x,i) => (
        <div key={i} style={{
          display:'flex', alignItems:'center', padding:'14px 16px', background:'var(--bg-surface)',
          border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)', marginBottom:8,
        }}>
          <div style={{flex:1}}>
            <div style={{fontSize:14, fontWeight:500}}>{x.t}</div>
            <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>{x.s}</div>
          </div>
          <div style={{
            width:34, height:20, borderRadius:10,
            background: x.on ? 'var(--accent)' : 'var(--border-default)',
            position:'relative', cursor:'pointer',
          }}>
            <div style={{
              position:'absolute', top:2, left: x.on ? 16 : 2,
              width:16, height:16, borderRadius:8, background:'var(--bg-page)',
              transition:'all 120ms',
            }}/>
          </div>
        </div>
      ))}

      <h3 style={{fontSize:16, fontWeight:500, marginTop:28, marginBottom:10}}>Scope controls</h3>
      <div className="mono small" style={{color:'var(--text-secondary)', lineHeight:1.7, padding:14, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)'}}>
        <div>✓ engineering agents can read: engineering decisions, PRDs, codebase index</div>
        <div>✗ engineering agents cannot read: finance, personal, health</div>
        <div>✓ finance agents can read: finance, shared facts</div>
        <div>✓ anton core can read: all scopes</div>
      </div>
    </div>
  );
}

/* ─────────── NOTIFICATIONS SETTINGS ─────────── */
function NotificationsSettings() {
  const rules = [
    { w:'Proactive briefing',   c:'08:00 daily · 18:00 EOD',          s:'Push',   on:true },
    { w:'High-risk approvals',  c:'irreversible · financial · send',   s:'Push + sound', on:true },
    { w:'Medium-risk approvals',c:'external-facing · above $100',      s:'Push',   on:true },
    { w:'Low-risk approvals',   c:'reversible · internal',             s:'Badge only', on:true },
    { w:'Agent errors',         c:'blocked or failing agents',         s:'Push',   on:true },
    { w:'CI failures',          c:'main branch · production',          s:'Push',   on:true },
    { w:'Stalled tasks',        c:'not touched in 48h',                s:'Daily digest', on:true },
    { w:'Memory corrections',   c:'when you correct a prior answer',   s:'Silent',     on:false },
  ];
  return (
    <div style={{padding:'24px 32px', height:'100%', overflow:'auto', maxWidth:900}}>
      <div className="mono caps" style={{color:'var(--text-tertiary)'}}>SETTINGS / NOTIFICATIONS</div>
      <h1 style={{fontSize:26, fontWeight:500, margin:'4px 0 8px'}}>Notifications</h1>
      <p style={{color:'var(--text-secondary)', marginBottom:24}}>What surfaces, and how loudly. Quiet hours 23:00 – 07:30; anything high-risk overrides.</p>

      <div style={{border:'1px solid var(--border-default)', borderRadius:'var(--r-card)', overflow:'hidden'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 260px 140px 60px', padding:'10px 16px', background:'var(--bg-surface)', borderBottom:'1px solid var(--border-default)'}} className="mono caps">
          <span style={{color:'var(--text-tertiary)'}}>Event</span>
          <span style={{color:'var(--text-tertiary)'}}>Trigger</span>
          <span style={{color:'var(--text-tertiary)'}}>Delivery</span>
          <span style={{color:'var(--text-tertiary)', textAlign:'right'}}>On</span>
        </div>
        {rules.map((r, i) => (
          <div key={i} style={{
            display:'grid', gridTemplateColumns:'1fr 260px 140px 60px',
            alignItems:'center', padding:'12px 16px',
            borderBottom: i===rules.length-1?'none':'1px solid var(--border-subtle)',
          }}>
            <span style={{fontSize:14}}>{r.w}</span>
            <span className="mono small" style={{color:'var(--text-tertiary)'}}>{r.c}</span>
            <span className="mono small" style={{color:'var(--text-secondary)'}}>{r.s}</span>
            <div style={{display:'flex', justifyContent:'flex-end'}}>
              <div style={{
                width:30, height:18, borderRadius:9, background: r.on?'var(--accent)':'var(--border-default)',
                position:'relative', cursor:'pointer',
              }}>
                <div style={{position:'absolute', top:2, left: r.on?14:2, width:14, height:14, borderRadius:7, background:'var(--bg-page)'}}/>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{marginTop:20, padding:14, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)'}}>
        <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:8}}>GROUPING</div>
        <div className="mono small" style={{color:'var(--text-secondary)', lineHeight:1.7}}>
          4+ agent completions within 10m → one grouped push: "4 tasks completed — tap to review"
        </div>
      </div>
    </div>
  );
}

/* ─────────── SAFETY / SECURITY ─────────── */
function SafetySettings() {
  return (
    <div style={{padding:'24px 32px', height:'100%', overflow:'auto', maxWidth:900}}>
      <div className="mono caps" style={{color:'var(--text-tertiary)'}}>SETTINGS / SAFETY</div>
      <h1 style={{fontSize:26, fontWeight:500, margin:'4px 0 20px'}}>Safety &amp; data</h1>

      <h3 style={{fontSize:14, fontWeight:500, marginTop:0, marginBottom:10, color:'var(--text-secondary)'}} className="caps mono">Threat surface</h3>
      <div style={{border:'1px solid var(--border-default)', borderRadius:'var(--r-card)', overflow:'hidden', marginBottom:28}}>
        {[
          ['Ollama binding', '127.0.0.1:11434 (localhost only)', 'ok'],
          ['External content spotlighting', 'wrapped in <EXTERNAL_CONTENT> before injection', 'ok'],
          ['Secret storage', '.env · rotate quarterly · move to Keychain at v1.0', 'warn'],
          ['Agent name allowlist', 'validated against TEAM_NAMES', 'ok'],
          ['Audit log', 'hashes by default · --verbose for content', 'ok'],
          ['SQLite backups', 'daily to ~/Backups/anton · 30d retention', 'ok'],
          ['Circuit breaker', 'closed · 3 fails in 60s opens for 30s', 'ok'],
        ].map((r, i, arr) => (
          <div key={i} style={{
            display:'grid', gridTemplateColumns:'220px 1fr 80px', padding:'12px 16px',
            borderBottom: i===arr.length-1?'none':'1px solid var(--border-subtle)',
            alignItems:'center',
          }}>
            <span style={{fontSize:13}}>{r[0]}</span>
            <span className="mono small" style={{color:'var(--text-secondary)'}}>{r[1]}</span>
            <span className="mono small" style={{textAlign:'right', color:statusColor[r[2]]}}>{r[2].toUpperCase()}</span>
          </div>
        ))}
      </div>

      <h3 style={{fontSize:14, fontWeight:500, marginBottom:10, color:'var(--text-secondary)'}} className="caps mono">Destructive actions · always ask</h3>
      <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8}}>
        {['Production deploy','Send email','Post publicly','Money movement','Delete files','Cancel subscription','Schedule meeting','Edit calendar'].map(x => (
          <label key={x} style={{display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)'}}>
            <input type="checkbox" defaultChecked style={{accentColor:'var(--accent)'}}/>
            <span style={{fontSize:13}}>{x}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

/* ─────────── VOICE SETTINGS ─────────── */
function VoiceSettings() {
  return (
    <div style={{padding:'24px 32px', height:'100%', overflow:'auto', maxWidth:820}}>
      <div className="mono caps" style={{color:'var(--text-tertiary)'}}>SETTINGS / VOICE</div>
      <h1 style={{fontSize:26, fontWeight:500, margin:'4px 0 20px'}}>Voice pipeline</h1>

      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:24}}>
        {[
          ['Wake word', 'OpenWakeWord', '"Hey Anton"'],
          ['STT',       'whisper.cpp',   'base.en · 400ms'],
          ['TTS',       'kokoro-onnx',   'streaming · 100ms'],
          ['Target E2E','<1.5s',         'end-of-speech → audio'],
        ].map(([a,b,c], i) => (
          <div key={i} style={{padding:'12px 14px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)'}}>
            <div className="mono small" style={{color:'var(--text-tertiary)'}}>{a}</div>
            <div className="mono" style={{fontSize:13, color:'var(--text-primary)', marginTop:2}}>{b}</div>
            <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>{c}</div>
          </div>
        ))}
      </div>

      <h3 style={{fontSize:14, fontWeight:500, marginBottom:10}} className="caps mono">Latency budget · measured p50</h3>
      <div style={{padding:14, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)'}}>
        {[
          ['VAD end-detect',   200, 200],
          ['STT',              400, 380],
          ['Brain (minimal)',  800, 740],
          ['TTS first token',  100, 120],
        ].map(([l, budget, actual]) => {
          const pct = Math.min(100, (actual/1600)*100);
          const over = actual > budget;
          return (
            <div key={l} style={{marginBottom:10}}>
              <div style={{display:'flex', alignItems:'baseline', gap:8, marginBottom:4}}>
                <span className="mono small" style={{color:'var(--text-secondary)', width:160}}>{l}</span>
                <span className="mono small" style={{color:'var(--text-tertiary)'}}>budget {budget}ms</span>
                <span style={{flex:1}}/>
                <span className="mono small" style={{color: over?'var(--error)':'var(--ok)'}}>{actual}ms</span>
              </div>
              <div style={{height:4, background:'var(--bg-page)', borderRadius:2}}>
                <div style={{height:'100%', width:`${pct}%`, background: over?'var(--error)':'var(--accent)', borderRadius:2}}/>
              </div>
            </div>
          );
        })}
      </div>

      <h3 style={{fontSize:14, fontWeight:500, marginTop:28, marginBottom:10}} className="caps mono">Mode</h3>
      <div style={{display:'flex', gap:8}}>
        {['Push to talk (default)','Continuous (opt-in)','Wake word only'].map((m, i) => (
          <button key={m} className="mono small" style={{
            flex:1, padding:'12px', background: i===0?'var(--accent-soft)':'transparent',
            color: i===0?'var(--accent)':'var(--text-secondary)',
            border:`1px solid ${i===0?'var(--accent)':'var(--border-default)'}`,
            borderRadius:'var(--r-card)', cursor:'pointer', fontSize:12,
          }}>{m}</button>
        ))}
      </div>
    </div>
  );
}

/* ─────────── DESTRUCTIVE MODAL ─────────── */
function DestructiveModal() {
  return (
    <div style={{position:'absolute', inset:0, background:'rgba(15,13,11,0.7)', backdropFilter:'blur(16px)',
      display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div style={{
        width:520, background:'var(--bg-raised)', border:'1px solid var(--error)',
        borderRadius:'var(--r-panel)', padding:'24px 26px', boxShadow:'0 12px 40px rgba(0,0,0,0.6)',
      }}>
        <div className="mono caps" style={{color:'var(--error)', fontSize:11, marginBottom:10}}>IRREVERSIBLE · HIGH RISK</div>
        <h2 style={{margin:'0 0 8px', fontSize:20, fontWeight:500, letterSpacing:'-0.01em'}}>Push v1.2 to production.</h2>
        <p style={{color:'var(--text-secondary)', margin:'0 0 16px', lineHeight:1.55}}>James will run the deploy script against anton-api-prod. Rollback available for 90 seconds after completion.</p>

        <div style={{padding:12, background:'var(--bg-page)', border:'1px solid var(--border-subtle)', marginBottom:16}}>
          {[['+','api/router.ts','+24'], ['-','api/router.ts','-9'], ['~','config/deploy.yaml','3']].map((r,i) => (
            <div key={i} className="mono small" style={{display:'flex', gap:8, padding:'2px 0'}}>
              <span style={{color:r[0]==='+'?'var(--ok)':r[0]==='-'?'var(--error)':'var(--work)', width:12}}>{r[0]}</span>
              <span style={{color:'var(--text-secondary)', flex:1}}>{r[1]}</span>
              <span style={{color:'var(--text-tertiary)'}}>{r[2]}</span>
            </div>
          ))}
        </div>

        <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:16, padding:'8px 10px', background:'var(--bg-page)', borderLeft:'2px solid var(--border-strong)'}}>
          type <b style={{color:'var(--text-primary)'}}>DEPLOY</b> to confirm
        </div>
        <input placeholder="" className="mono" style={{
          width:'100%', padding:'10px 12px', background:'var(--bg-page)',
          border:'1px solid var(--border-default)', color:'var(--text-primary)',
          borderRadius:4, fontSize:14, marginBottom:16,
        }}/>

        <div style={{display:'flex', gap:8}}>
          <button style={{flex:1, padding:'10px', background:'transparent', color:'var(--text-secondary)', border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer'}}>Cancel</button>
          <button style={{flex:1, padding:'10px', background:'var(--error)', color:'var(--text-primary)', border:'none', borderRadius:'var(--r-chip)', cursor:'pointer', fontWeight:500}}>Deploy</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── MOBILE INTEGRATIONS ─────────── */
function MobileIntegrations() {
  return (
    <div style={{paddingTop:58, paddingBottom:96, height:'100%', overflow:'auto'}}>
      <div style={{padding:'14px 20px 10px'}}>
        <div style={{fontSize:22, fontWeight:500, letterSpacing:'-0.02em'}}>Hands</div>
        <div className="mono small" style={{color:'var(--text-tertiary)'}}>8 connected · 4 available</div>
      </div>

      <div style={{padding:'0 16px'}}>
        {INTEGRATIONS.map(i => (
          <div key={i.id} style={{
            padding:'12px 14px', marginBottom:6, background:'var(--bg-surface)',
            border:`1px solid ${i.status==='error'?'var(--error)':i.status==='warn'?'var(--work)':'var(--border-subtle)'}`,
            borderRadius:'var(--r-card)', display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{
              width:32, height:32, borderRadius:6, background:'var(--bg-raised)',
              border:'1px solid var(--border-default)', display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-secondary)',
            }}>{i.name.slice(0,2).toUpperCase()}</div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{display:'flex', alignItems:'center', gap:6}}>
                <span style={{fontSize:14}}>{i.name}</span>
                <span style={{width:6, height:6, borderRadius:'50%', background:statusColor[i.status]}}/>
              </div>
              <div className="mono small" style={{color:'var(--text-tertiary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
                {i.note}
              </div>
            </div>
            <span style={{color:'var(--text-tertiary)', fontSize:18}}>›</span>
          </div>
        ))}
      </div>
      <MobileTabBar active="agents"/>
    </div>
  );
}

/* ─────────── MOBILE SETTINGS ─────────── */
function MobileSettings() {
  const items = [
    { g:'You', rows:[
      { t:'Noel', s:'noel@anton.computer', icon:'◉' },
      { t:'FaceID & passcode', s:'required on cold open', icon:'◐' },
    ]},
    { g:'System', rows:[
      { t:'Models', s:'qwen3:8b · claude fallback', icon:'◎' },
      { t:'Voice', s:'push-to-talk · kokoro', icon:'◒' },
      { t:'Memory', s:'1,487 memories · distillation on', icon:'■' },
      { t:'Notifications', s:'high-risk always · quiet 23–07', icon:'◌' },
      { t:'Hands / integrations', s:'8 connected · 1 failing', icon:'◈', warn:true },
    ]},
    { g:'Safety', rows:[
      { t:'Trust tiers', s:'per-agent autonomy', icon:'△' },
      { t:'Destructive actions', s:'always ask · 8 categories', icon:'▲' },
      { t:'Audit log', s:'last 30 days', icon:'▢' },
    ]},
    { g:'', rows:[
      { t:'Sign out', s:'', icon:'', dim:true },
    ]},
  ];
  return (
    <div style={{paddingTop:58, paddingBottom:40, height:'100%', overflow:'auto'}}>
      <div style={{padding:'14px 20px 10px'}}>
        <div style={{fontSize:22, fontWeight:500, letterSpacing:'-0.02em'}}>Settings</div>
      </div>
      {items.map((grp, gi) => (
        <div key={gi} style={{marginBottom:16}}>
          {grp.g && <div className="mono small caps" style={{color:'var(--text-tertiary)', padding:'6px 20px'}}>{grp.g}</div>}
          <div style={{margin:'0 16px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)', overflow:'hidden'}}>
            {grp.rows.map((r, i) => (
              <div key={i} style={{
                display:'flex', alignItems:'center', gap:12, padding:'14px 14px',
                borderBottom: i===grp.rows.length-1 ? 'none' : '1px solid var(--border-subtle)',
                color: r.dim?'var(--error)':'inherit',
              }}>
                {r.icon && <span className="mono" style={{width:20, color: r.warn?'var(--work)':'var(--text-tertiary)'}}>{r.icon}</span>}
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:14}}>{r.t}</div>
                  {r.s && <div className="mono small" style={{color:'var(--text-tertiary)'}}>{r.s}</div>}
                </div>
                {!r.dim && <span style={{color:'var(--text-tertiary)', fontSize:18}}>›</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────── MOBILE FACEID GATE ─────────── */
function MobileFaceID() {
  return (
    <div style={{height:'100%', paddingTop:58, display:'flex', flexDirection:'column', alignItems:'center'}}>
      <div style={{marginTop:120, display:'flex', flexDirection:'column', alignItems:'center'}}>
        <div style={{width:96, height:96, borderRadius:20, border:'2px solid var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, position:'relative'}}>
          <div style={{position:'absolute', top:14, left:14, right:14, bottom:14, border:'1.5px solid var(--accent)', borderRadius:10, opacity:0.6}}/>
          <span style={{fontSize:30, color:'var(--accent)'}} className="pulse">◐</span>
        </div>
        <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:6}}>ANTON · LOCKED</div>
        <div style={{fontSize:18, fontWeight:500}}>Look to unlock</div>
      </div>
      <div style={{flex:1}}/>
      <div style={{marginBottom:40, color:'var(--text-tertiary)', fontSize:12}} className="mono">
        3 attempts remaining
      </div>
    </div>
  );
}

Object.assign(window, {
  INTEGRATIONS, IntegrationsHub, ArchScreen, MemorySettings, NotificationsSettings,
  SafetySettings, VoiceSettings, DestructiveModal, MobileIntegrations, MobileSettings, MobileFaceID,
});
