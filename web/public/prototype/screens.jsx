// Supporting screens: Briefing, Approvals, Memory, Log, CmdPalette, AgentDetail, Settings, Onboarding

/* ─────────── BRIEFING ─────────── */
function Briefing() {
  const sections = [
    { title: 'Overnight', items: [
      'Felix completed rate-limit middleware (3 commits, tests green).',
      'Kai drafted 4 SEO articles; 2 awaiting review.',
      'James flagged a flaky test in checkout/webhook.spec.ts — isolated, not blocking.',
    ] },
    { title: 'Today', items: [
      'v1.2 deploy ready — awaits your approval (James, high risk).',
      'Launch email to 2,340 contacts ready to send (Sarah, medium).',
      'Q1 retention cohort rebuild — Priya, routine.',
    ] },
    { title: 'Flagged', items: [
      'Diana: Stripe reconciliation blocked. API key expired 2h ago.',
      'Riley: scheduled post failed — rate limit on X API.',
    ] },
  ];
  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', height:'100%', gap:0}}>
      <div style={{padding:'24px 32px', borderRight:'1px solid var(--border-subtle)', overflow:'auto'}}>
        <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:4}}>MORNING BRIEF · FRI 18 APR</div>
        <h1 style={{fontSize:28, letterSpacing:'-0.02em', margin:'0 0 24px', fontWeight:500}}>
          Good morning. <span style={{color:'var(--text-secondary)'}}>3 things need you today.</span>
        </h1>
        {sections.map(s => (
          <div key={s.title} style={{marginBottom:28}}>
            <div className="mono caps" style={{color:'var(--text-secondary)', marginBottom:10, paddingBottom:6, borderBottom:'1px solid var(--border-subtle)'}}>{s.title}</div>
            {s.items.map((it, i) => (
              <div key={i} style={{display:'flex', gap:10, padding:'8px 0', cursor:'pointer'}}>
                <span className="mono small" style={{color:'var(--text-tertiary)', width:22, paddingTop:2}}>{String(i+1).padStart(2,'0')}</span>
                <div style={{flex:1, fontSize:14, lineHeight:1.55}}>{it}</div>
                <span className="mono small" style={{color:'var(--text-tertiary)'}}>¶</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{padding:'24px 32px', background:'var(--bg-page)', overflow:'auto'}}>
        <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:4}}>LIVE ACTIVITY</div>
        <div style={{fontSize:15, fontWeight:500, marginBottom:18, color:'var(--text-secondary)'}}>7 agents active now.</div>
        {ACTIVITY.slice(0,7).map((a,i) => (
          <div key={i} style={{
            padding:'12px 14px', background:'var(--bg-surface)',
            border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)',
            marginBottom:8,
          }}>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:4}}>
              <span className="mono small" style={{color:'var(--text-tertiary)'}}>{a.t}</span>
              <span style={{fontSize:13}}>{a.agent}</span>
              <span className="mono small" style={{color:'var(--text-tertiary)'}}>{a.type}</span>
            </div>
            <div className="mono small" style={{color:'var(--text-secondary)'}}>{a.text}</div>
            {a.detail && <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>{a.detail}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── APPROVAL TRAY (right sidebar) ─────────── */
function ApprovalTray({ expandAll = false }) {
  const [expanded, setExpanded] = React.useState(expandAll ? APPROVALS.map(a=>a.id) : [2]);
  const toggle = id => setExpanded(x => x.includes(id) ? x.filter(y=>y!==id) : [...x, id]);

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <div style={{padding:'14px 16px', borderBottom:'1px solid var(--border-subtle)'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div className="mono caps" style={{color:'var(--text-primary)'}}>Pending</div>
          <div className="mono small" style={{color:'var(--work)'}}>{APPROVALS.length}</div>
        </div>
        <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:4}}>sorted by risk · newest first</div>
      </div>
      <div style={{flex:1, overflow:'auto', padding:'8px 10px'}}>
        {APPROVALS.map(a => {
          const isOpen = expanded.includes(a.id);
          return (
            <div key={a.id} style={{
              padding:'12px 12px 10px', marginBottom:8,
              background: a.risk === 'H' ? 'var(--bg-hover)' : 'var(--bg-surface)',
              border: `1px solid ${a.risk === 'H' ? 'var(--error)' : 'var(--border-default)'}`,
              borderRadius:'var(--r-card)',
            }}>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
                <div className="mono" style={{
                  width:22, height:22, borderRadius:4, background:'var(--bg-raised)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:10,
                  color:'var(--text-secondary)',
                }}>{a.agent.slice(0,2).toUpperCase()}</div>
                <span style={{fontSize:13, fontWeight:500}}>{a.agent}</span>
                <DeptChip id={a.dept}/>
                <span style={{flex:1}}/>
                <RiskPip r={a.risk}/>
              </div>
              <div style={{fontSize:13, lineHeight:1.5, color:'var(--text-primary)', marginBottom:8}}>{a.intent}</div>

              {isOpen && a.why && (
                <div className="mono small" style={{
                  padding:'8px 10px', background:'var(--bg-page)', border:'1px solid var(--border-subtle)',
                  borderRadius:4, color:'var(--text-secondary)', marginBottom:8,
                }}>{a.why}</div>
              )}
              {isOpen && a.diff && (
                <div style={{
                  padding:'8px 10px', background:'var(--bg-page)', border:'1px solid var(--border-subtle)',
                  borderRadius:0, marginBottom:8,
                }}>
                  {a.diff.map((row, i) => (
                    <div key={i} className="mono small" style={{display:'flex', gap:8, padding:'2px 0'}}>
                      <span style={{color: row[0]==='+'?'var(--ok)':row[0]==='-'?'var(--error)':'var(--work)', width:12}}>{row[0]}</span>
                      <span style={{flex:1, color:'var(--text-secondary)'}}>{row[1]}</span>
                      <span style={{color:'var(--text-tertiary)'}}>{row[2]||''}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{display:'flex', gap:6, alignItems:'center'}}>
                <button style={{
                  flex:1, padding:'6px 10px', background:'var(--accent)', color:'var(--bg-page)',
                  border:'none', borderRadius:'var(--r-chip)', fontSize:12, fontWeight:500, cursor:'pointer',
                }}>Approve <Kbd>A</Kbd></button>
                <button style={{
                  flex:1, padding:'6px 10px', background:'transparent', color:'var(--text-secondary)',
                  border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', fontSize:12, cursor:'pointer',
                }}>Reject <Kbd>R</Kbd></button>
                <button onClick={()=>toggle(a.id)} className="mono small" style={{
                  background:'transparent', border:'none', color:'var(--text-tertiary)', cursor:'pointer', padding:'6px',
                }}>{isOpen ? '−' : 'why?'}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ApprovalTrayEmpty() {
  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <div style={{padding:'14px 16px', borderBottom:'1px solid var(--border-subtle)'}}>
        <div className="mono caps" style={{color:'var(--text-primary)'}}>Pending</div>
      </div>
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:20, textAlign:'center'}}>
        <div>
          <div style={{fontSize:14, color:'var(--text-secondary)', marginBottom:6}}>Nothing pending right now.</div>
          <div className="mono small" style={{color:'var(--text-tertiary)'}}>auto-approvals will pass through silently.</div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── MEMORY ─────────── */
function MemoryBrowser({ onNav }) {
  const hlColor = { yellow:'var(--hl-yellow)', coral:'var(--hl-coral)', blue:'var(--hl-blue)' };
  const typeIcon = { preference:'◇', decision:'◆', fact:'■', conversation:'▷' };
  return (
    <div style={{padding:'24px 32px', height:'100%', overflow:'auto'}}>
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
        <input placeholder="search memory — full-text or semantic"
          style={{
            flex:1, padding:'10px 14px', background:'var(--bg-surface)',
            border:'1px solid var(--border-default)', borderRadius:'var(--r-card)',
            fontSize:14, color:'var(--text-primary)',
          }}/>
        <Kbd>⌘</Kbd><Kbd>F</Kbd>
      </div>
      <div style={{display:'flex', gap:6, marginBottom:20}}>
        {['All', 'Facts', 'Decisions', 'Preferences', 'Conversations'].map((c, i) => (
          <button key={c} className="mono small" style={{
            padding:'4px 10px', background: i===0 ? 'var(--accent-soft)' : 'transparent',
            color: i===0 ? 'var(--accent)' : 'var(--text-secondary)',
            border:`1px solid ${i===0?'var(--accent)':'var(--border-default)'}`,
            borderRadius:'var(--r-chip)', cursor:'pointer',
          }}>{c}</button>
        ))}
        <div style={{flex:1}}/>
        <span className="mono small" style={{color:'var(--text-tertiary)'}}>1,487 memories · 12 edited this week</span>
      </div>

      {MEMORIES.map((m, i) => (
        <div key={i}
          onClick={()=>onNav && onNav('memory-item', { memoryId: i })}
          onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-strong)'}
          onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-subtle)'}
          style={{
          padding:'14px 16px', marginBottom:8, cursor:'pointer',
          background:'var(--bg-surface)', border:'1px solid var(--border-subtle)',
          borderRadius:'var(--r-card)',
        }}>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
            <span className="mono" style={{color:'var(--text-tertiary)', width:14, textAlign:'center'}}>{typeIcon[m.type]}</span>
            <span className="mono small caps" style={{color:'var(--text-tertiary)'}}>{m.type}</span>
            <span style={{flex:1}}/>
            <span className="mono small" style={{color:'var(--text-tertiary)'}}>{m.src}</span>
            <span style={{display:'flex', gap:2}}>
              {[1,2,3].map(n => (
                <span key={n} style={{width:4, height:4, borderRadius:'50%',
                  background: n <= m.conf ? 'var(--ok)' : 'var(--border-default)'}}/>
              ))}
            </span>
          </div>
          <div style={{fontSize:14, lineHeight:1.55}}>
            <span style={{
              background:hlColor[m.hl], color:'#14120F',
              padding:'1px 3px', boxDecorationBreak:'clone', WebkitBoxDecorationBreak:'clone',
            }}>{m.title}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────── ACTIVITY TIMELINE ─────────── */
function ActivityTimeline({ onNav }) {
  const [verbosity, setVerbosity] = React.useState(1);
  const typeColor = {
    tool:'var(--info)', think:'var(--text-secondary)', write:'var(--accent)',
    search:'var(--hl-blue)', handoff:'var(--work)', complete:'var(--ok)',
    approval:'var(--work)', system:'var(--text-tertiary)',
  };
  const verbosityLabel = ['Summary', 'Normal', 'Full trace'];
  return (
    <div style={{padding:'24px 32px', height:'100%', overflow:'auto'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18}}>
        <div>
          <div className="mono caps" style={{color:'var(--text-tertiary)'}}>ACTIVITY</div>
          <div style={{fontSize:22, fontWeight:500, letterSpacing:'-0.01em'}}>247 events today</div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span className="mono small" style={{color:'var(--text-tertiary)'}}>verbosity</span>
          {[0,1,2].map(v => (
            <button key={v} onClick={()=>setVerbosity(v)} className="mono small" style={{
              padding:'4px 10px', background:verbosity===v?'var(--accent-soft)':'transparent',
              color:verbosity===v?'var(--accent)':'var(--text-secondary)',
              border:`1px solid ${verbosity===v?'var(--accent)':'var(--border-default)'}`,
              borderRadius:'var(--r-chip)', cursor:'pointer',
            }}>{verbosityLabel[v]}</button>
          ))}
        </div>
      </div>

      <div style={{display:'flex', gap:6, marginBottom:16, flexWrap:'wrap'}}>
        {['Marcus', 'James', 'Ada', 'Kai', 'Priya', 'Sarah'].map(n => (
          <button key={n} className="mono small" style={{
            padding:'3px 9px', background:'transparent', color:'var(--text-secondary)',
            border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer',
          }}>{n} ×</button>
        ))}
      </div>

      {ACTIVITY.map((a, i) => (
        <div key={i}
          onClick={()=>onNav && onNav('event', { eventId: i })}
          onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
          onMouseLeave={e=>e.currentTarget.style.background='var(--bg-surface)'}
          style={{
          padding:'10px 14px', marginBottom:4, cursor:'pointer',
          border:'1px solid var(--border-subtle)', borderLeft:`2px solid ${typeColor[a.type]}`,
          borderRadius:0, background:'var(--bg-surface)',
        }}>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <span className="mono small" style={{color:'var(--text-tertiary)', width:60}}>{a.t}</span>
            <span className="mono small caps" style={{color:typeColor[a.type], width:64}}>{a.type}</span>
            <span style={{fontSize:13, width:72}}>{a.agent}</span>
            <span className="mono small" style={{color:'var(--text-secondary)', flex:1}}>{a.text}</span>
            {verbosity >= 1 && a.detail && <span className="mono small" style={{color:'var(--text-tertiary)'}}>{a.detail}</span>}
          </div>
          {verbosity >= 2 && (
            <div className="mono small" style={{
              marginTop:8, paddingTop:8, borderTop:'1px dashed var(--border-subtle)',
              color:'var(--text-tertiary)', paddingLeft:72,
            }}>
              reasoning: evaluated 3 candidate files · chose specs/onboarding.md based on recency<br/>
              tokens: in 412 · out 128 · cost $0.0003 · model qwen3-8b-local<br/>
              parent: &lt;delegate #abc7&gt; · permalink /activity/e-{14852+i}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────── COMMAND PALETTE (overlay) ─────────── */
function CmdPalette() {
  const rows = [
    { kind:'action', icon:'▸', text:'Delegate task to agent', hint:'/delegate', kbd:'D' },
    { kind:'action', icon:'✓', text:'Approve all low-risk pending', hint:'5 items', kbd:'⇧A' },
    { kind:'nav',    icon:'◎', text:'Go to Mission Control', hint:'home', kbd:'G A' },
    { kind:'nav',    icon:'◎', text:'Go to Briefing', hint:'', kbd:'G B' },
    { kind:'agent',  icon:'●', text:'Marcus · Lead engineer', hint:'Engineering', kbd:'⏎' },
    { kind:'agent',  icon:'●', text:'Sarah · Copy & campaigns', hint:'Marketing', kbd:'⏎' },
    { kind:'memory', icon:'■', text:'Search memory for "onboarding"', hint:'14 results', kbd:'' },
    { kind:'system', icon:'◌', text:'Toggle autonomy: all to DRAFT', hint:'reversible', kbd:'' },
  ];
  return (
    <div style={{
      position:'absolute', inset:0, background:'rgba(15,13,11,0.5)',
      backdropFilter:'blur(12px)', display:'flex', alignItems:'flex-start', justifyContent:'center',
      paddingTop:100,
    }}>
      <div style={{
        width:640, background:'var(--bg-raised)', border:'1px solid var(--border-strong)',
        borderRadius:'var(--r-panel)', boxShadow:'0 8px 24px rgba(0,0,0,0.5)', overflow:'hidden',
      }}>
        <div style={{padding:'14px 18px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', gap:10}}>
          <span className="mono" style={{color:'var(--accent)'}}>▸</span>
          <input defaultValue="deleg" placeholder="type a command…" autoFocus
            className="mono"
            style={{flex:1, background:'transparent', border:'none', outline:'none', fontSize:16, color:'var(--text-primary)'}}/>
          <span className="mono small" style={{color:'var(--text-tertiary)'}}>mission control</span>
        </div>
        <div style={{maxHeight:420, overflow:'auto'}}>
          {rows.map((r, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:12, padding:'10px 18px',
              background: i===0 ? 'var(--bg-hover)' : 'transparent',
              borderLeft:`2px solid ${i===0?'var(--accent)':'transparent'}`,
            }}>
              <span className="mono" style={{color:'var(--text-tertiary)', width:14}}>{r.icon}</span>
              <span className="mono" style={{fontSize:14, color:i===0?'var(--text-primary)':'var(--text-secondary)', flex:1}}>{r.text}</span>
              <span className="mono small" style={{color:'var(--text-tertiary)'}}>{r.hint}</span>
              {r.kbd && <Kbd>{r.kbd}</Kbd>}
            </div>
          ))}
        </div>
        <div style={{padding:'10px 18px', borderTop:'1px solid var(--border-subtle)', display:'flex', gap:14}}>
          <span className="mono small" style={{color:'var(--text-tertiary)'}}><Kbd>↑↓</Kbd> navigate</span>
          <span className="mono small" style={{color:'var(--text-tertiary)'}}><Kbd>⏎</Kbd> run</span>
          <span className="mono small" style={{color:'var(--text-tertiary)'}}><Kbd>⌘</Kbd><Kbd>K</Kbd> scope</span>
          <span style={{flex:1}}/>
          <span className="mono small" style={{color:'var(--text-tertiary)'}}>@local · Cmd+L switch to @claude</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────── AGENT DETAIL (expanded panel) ─────────── */
function AgentDetail() {
  const a = AGENTS[0]; // Marcus
  return (
    <div style={{padding:'24px 32px', height:'100%', overflow:'auto'}}>
      <div style={{display:'flex', alignItems:'flex-start', gap:16, marginBottom:20, paddingBottom:20, borderBottom:'1px solid var(--border-subtle)'}}>
        <div style={{width:48, height:48, background:'var(--bg-raised)', borderRadius:'var(--r-card)',
          display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--border-default)'}}>
          <span className="mono" style={{fontSize:14, color:'var(--text-secondary)'}}>{a.k}</span>
        </div>
        <div style={{flex:1}}>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:4}}>
            <h2 style={{margin:0, fontSize:22, fontWeight:500}}>{a.n}</h2>
            <StatusGlow s={a.s}/>
            <TrustBadge tier={a.t}/>
          </div>
          <div className="mono small" style={{color:'var(--text-secondary)'}}>
            {a.r} · Engineering · autonomy dial: <span style={{color:'var(--accent)'}}>DRAFT</span> · last active {a.last} ago
          </div>
        </div>
        <button className="mono small" style={{
          padding:'6px 12px', background:'transparent', color:'var(--text-secondary)',
          border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer',
        }}>Pause agent</button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24}}>
        <div>
          <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:8}}>Tools available</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:4}}>
            {['read_file','write_file','git.commit','search_docs','run_sql','handoff','ask_noel'].map(t => (
              <span key={t} className="mono small" style={{padding:'3px 8px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-chip)', color:'var(--text-secondary)'}}>{t}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:8}}>Memory scope</div>
          <div className="mono small" style={{color:'var(--text-secondary)', lineHeight:1.7}}>
            247 engineering decisions · 34 PRDs · codebase index (last synced 3m)<br/>
            can read: shared facts, eng decisions<br/>
            cannot read: finance, personal
          </div>
        </div>
      </div>

      <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:10}}>Recent activity</div>
      {ACTIVITY.filter(x=>x.agent==='Marcus').concat(ACTIVITY.slice(0,3)).map((x,i) => (
        <div key={i} style={{
          padding:'10px 14px', marginBottom:4,
          background:'var(--bg-surface)', border:'1px solid var(--border-subtle)',
          borderLeft:'2px solid var(--accent)',
        }}>
          <div style={{display:'flex', gap:12}}>
            <span className="mono small" style={{color:'var(--text-tertiary)', width:60}}>{x.t}</span>
            <span className="mono small caps" style={{color:'var(--text-tertiary)', width:64}}>{x.type}</span>
            <span className="mono small" style={{color:'var(--text-secondary)', flex:1}}>{x.text}</span>
          </div>
        </div>
      ))}

      <div style={{marginTop:20, padding:14, background:'var(--bg-surface)', border:'1px solid var(--border-default)', borderRadius:'var(--r-card)'}}>
        <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:8}}>Message Marcus</div>
        <textarea placeholder="tell marcus what you need…" rows={2} style={{
          width:'100%', background:'transparent', border:'none', outline:'none',
          color:'var(--text-primary)', fontSize:14, resize:'vertical',
        }}/>
        <div style={{display:'flex', alignItems:'center', gap:8, marginTop:8}}>
          <span className="mono small" style={{color:'var(--text-tertiary)'}}>@local · Cmd+⏎ to send</span>
          <span style={{flex:1}}/>
          <button className="mono small" style={{padding:'5px 12px', background:'var(--accent)', color:'var(--bg-page)', border:'none', borderRadius:'var(--r-chip)', cursor:'pointer'}}>Send</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────── SETTINGS — trust tiers ─────────── */
function Settings() {
  return (
    <div style={{padding:'24px 32px', height:'100%', overflow:'auto', maxWidth:860}}>
      <div className="mono caps" style={{color:'var(--text-tertiary)'}}>SETTINGS</div>
      <h1 style={{fontSize:26, fontWeight:500, margin:'4px 0 28px'}}>Trust tiers</h1>
      <p style={{color:'var(--text-secondary)', marginTop:0, marginBottom:28, maxWidth:620}}>
        Each agent has an autonomy level. Green runs without asking. Amber confirms before acting. Red waits on you.
      </p>

      <div style={{border:'1px solid var(--border-default)', borderRadius:'var(--r-card)', overflow:'hidden'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 100px 260px 80px', padding:'10px 16px', borderBottom:'1px solid var(--border-default)', background:'var(--bg-surface)'}} className="mono caps">
          <span style={{color:'var(--text-tertiary)'}}>Agent</span>
          <span style={{color:'var(--text-tertiary)'}}>Team</span>
          <span style={{color:'var(--text-tertiary)'}}>Autonomy</span>
          <span style={{color:'var(--text-tertiary)', textAlign:'right'}}>Last</span>
        </div>
        {AGENTS.slice(0,10).map((a, i) => {
          const tiers = ['SUGGEST','DRAFT','EXECUTE','AUTO'];
          const active = { green:3, amber:1, red:0 }[a.t];
          return (
            <div key={a.n} style={{
              display:'grid', gridTemplateColumns:'1fr 100px 260px 80px',
              padding:'10px 16px', alignItems:'center',
              borderBottom: i===9 ? 'none' : '1px solid var(--border-subtle)',
            }}>
              <div>
                <div style={{fontSize:14}}>{a.n}</div>
                <div className="mono small" style={{color:'var(--text-tertiary)'}}>{a.r}</div>
              </div>
              <DeptChip id={a.d}/>
              <div style={{display:'flex', gap:0, border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', overflow:'hidden'}}>
                {tiers.map((t, ti) => (
                  <button key={t} className="mono small" style={{
                    flex:1, padding:'5px 4px',
                    background: ti===active ? 'var(--accent-soft)' : 'transparent',
                    color: ti===active ? 'var(--accent)' : 'var(--text-secondary)',
                    border:'none', cursor:'pointer',
                    borderRight: ti<3 ? '1px solid var(--border-default)' : 'none',
                  }}>{t}</button>
                ))}
              </div>
              <span className="mono small" style={{color:'var(--text-tertiary)', textAlign:'right'}}>{a.last}</span>
            </div>
          );
        })}
      </div>

      <div style={{marginTop:36}}>
        <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:10}}>Integrations</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          {['Slack · connected', 'Ollama · qwen3-8b', 'Claude · fallback', 'Stripe · api-key expired', 'GitHub · connected', 'Calendar · connected'].map((s, i) => {
            const err = s.includes('expired');
            return (
              <div key={i} style={{
                padding:'14px 16px', background:'var(--bg-surface)',
                border:`1px solid ${err?'var(--error)':'var(--border-subtle)'}`, borderRadius:'var(--r-card)',
              }}>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <span className={err?'':''} style={{width:8, height:8, borderRadius:'50%', background: err?'var(--error)':'var(--ok)'}}/>
                  <span className="mono small" style={{color:'var(--text-secondary)'}}>{s}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────── ONBOARDING ─────────── */
function Onboarding() {
  return (
    <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', padding:32}}>
      <div style={{width:560}}>
        <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:4}}>STEP 2 / 5</div>
        <h1 style={{fontSize:34, fontWeight:500, letterSpacing:'-0.02em', margin:'0 0 8px'}}>
          Anton coming online.
        </h1>
        <p style={{color:'var(--text-secondary)', fontSize:15, marginTop:0, marginBottom:28, lineHeight:1.6}}>
          Point the system at your local model. Qwen3 8B via Ollama is recommended for now. Claude stays as a fallback for deep research.
        </p>

        <div style={{background:'var(--bg-surface)', border:'1px solid var(--border-default)', borderRadius:'var(--r-card)', padding:18, marginBottom:14}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:10}}>Local model</div>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <span style={{width:8, height:8, borderRadius:'50%', background:'var(--ok)'}}/>
            <div style={{flex:1}}>
              <div className="mono" style={{fontSize:14}}>qwen3:8b</div>
              <div className="mono small" style={{color:'var(--text-tertiary)'}}>ollama · localhost:11434 · 4.3GB loaded</div>
            </div>
            <Kbd>change</Kbd>
          </div>
        </div>

        <div style={{background:'var(--bg-surface)', border:'1px solid var(--border-default)', borderRadius:'var(--r-card)', padding:18, marginBottom:14}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:10}}>Fallback</div>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <span style={{width:8, height:8, borderRadius:'50%', background:'var(--ok)'}}/>
            <div style={{flex:1}}>
              <div className="mono" style={{fontSize:14}}>claude · sonnet-4.5</div>
              <div className="mono small" style={{color:'var(--text-tertiary)'}}>used only for deep research + code generation</div>
            </div>
            <Kbd>edit</Kbd>
          </div>
        </div>

        <div style={{display:'flex', alignItems:'center', gap:10, marginTop:24}}>
          <button className="mono" style={{padding:'10px 16px', background:'transparent', color:'var(--text-secondary)', border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer'}}>Back</button>
          <span style={{flex:1}}/>
          <span className="mono small" style={{color:'var(--text-tertiary)'}}>takes ~30s</span>
          <button className="mono" style={{padding:'10px 18px', background:'var(--accent)', color:'var(--bg-page)', border:'none', borderRadius:'var(--r-chip)', cursor:'pointer', fontWeight:500}}>Check the team →</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  Briefing, ApprovalTray, ApprovalTrayEmpty, MemoryBrowser,
  ActivityTimeline, CmdPalette, AgentDetail, Settings, Onboarding,
});
