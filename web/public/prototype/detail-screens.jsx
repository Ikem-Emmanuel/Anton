// Detail screens — Agent, Memory item, Activity event, Integration
const { useState: useS_D } = React;

function BackBar({ label, onNav, crumb = 'Mission Control', crumbRoute = 'mc', extras }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10, padding:'12px 20px',
      borderBottom:'1px solid var(--border-subtle)', background:'var(--bg-page)',
    }}>
      <button onClick={()=>onNav && onNav(crumbRoute)} className="mono small" style={{
        background:'transparent', border:'1px solid var(--border-default)',
        color:'var(--text-secondary)', padding:'4px 10px', borderRadius:'var(--r-chip)',
        cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', gap:6,
      }}>← back</button>
      <span className="mono small" style={{color:'var(--text-tertiary)'}}>{crumb}</span>
      <span className="mono small" style={{color:'var(--text-tertiary)'}}>/</span>
      <span className="mono small" style={{color:'var(--text-primary)'}}>{label}</span>
      <span style={{flex:1}}/>
      {extras}
    </div>
  );
}

/* ─────────── AGENT DETAIL ─────────── */
function AgentDetailView({ agent, onNav }) {
  const a = AGENTS.find(x => x.n === agent) || AGENTS[0];
  const d = DEPARTMENTS.find(x => x.id === a.d);
  const [tab, setTab] = useS_D('activity');

  const tabs = [
    { id:'activity', label:'Activity' },
    { id:'queue',    label:`Queue (${a.q || 0})` },
    { id:'trust',    label:'Trust & tools' },
    { id:'memory',   label:'Memory' },
    { id:'config',   label:'Config' },
  ];

  const actions = (
    <div style={{display:'flex', gap:6}}>
      <button className="mono small" style={btnGhost}>delegate</button>
      <button className="mono small" style={btnGhost}>pause</button>
      <button className="mono small" style={btnPrimary}>chat →</button>
    </div>
  );

  const agentActivity = ACTIVITY.filter(e => e.agent === a.n).concat(
    [{ t:'14:00:00', agent:a.n, type:'think', text:'Reading assignment from Anton.', detail:null },
     { t:'13:58:12', agent:a.n, type:'tool',  text:'mcp.list_tools()', detail:'12 tools' }]
  );

  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <BackBar label={`${a.n} · ${a.r}`} onNav={onNav} crumb="Team" crumbRoute="team" extras={actions}/>

      {/* Agent header */}
      <div style={{padding:'20px 24px', borderBottom:'1px solid var(--border-subtle)', display:'flex', gap:24, alignItems:'flex-start'}}>
        <div style={{
          width:72, height:72, borderRadius:'var(--r-card)',
          background:'var(--bg-surface)', border:`1px solid ${d.color}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:'var(--font-mono)', fontSize:22, color:d.color, letterSpacing:'0.05em',
        }}>{a.k}</div>
        <div style={{flex:1}}>
          <div style={{display:'flex', alignItems:'baseline', gap:10, marginBottom:4}}>
            <h1 style={{fontSize:22, margin:0, color:'var(--text-primary)'}}>{a.n}</h1>
            <StatusGlow s={a.s}/>
            <TrustBadge tier={a.t}/>
            <DeptChip id={a.d}/>
          </div>
          <div style={{color:'var(--text-secondary)', fontSize:13, marginBottom:10}}>{a.r} · reports to Anton</div>
          <div style={{display:'flex', gap:24}}>
            <Stat label="Uptime" v="3d 14h"/>
            <Stat label="Tasks today" v="18"/>
            <Stat label="Success" v="94%" c="var(--ok)"/>
            <Stat label="Avg latency" v="340ms"/>
            <Stat label="Tokens" v="24.1k"/>
            <Stat label="Model" v="qwen3:8b"/>
          </div>
        </div>
        <div style={{width:280, padding:14, background:'var(--bg-surface)', border:'1px solid var(--border-default)', borderRadius:'var(--r-card)'}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:8}}>Now</div>
          <div style={{fontSize:13, color:'var(--text-primary)', marginBottom:6}}>
            {a.s==='working' ? 'Drafting PRD for onboarding v3' : a.s==='error' ? 'Blocked on mcp.tool timeout' : a.s==='complete' ? 'Idle · last task complete' : 'Idle · available'}
          </div>
          <div className="mono small" style={{color:'var(--text-tertiary)'}}>
            {a.q ? `${a.q} queued task${a.q>1?'s':''} · est 22m` : 'nothing queued'}
          </div>
          {a.s==='error' && (
            <button className="mono small" style={{...btnPrimary, marginTop:10, width:'100%'}}>resolve →</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex', gap:0, padding:'0 20px', borderBottom:'1px solid var(--border-subtle)'}}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} className="mono small" style={{
            padding:'10px 14px', background:'transparent',
            color: tab===t.id?'var(--accent)':'var(--text-secondary)',
            border:'none',
            borderBottom:`2px solid ${tab===t.id?'var(--accent)':'transparent'}`,
            cursor:'pointer', fontSize:12, marginBottom:-1,
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{flex:1, overflow:'auto', padding:'16px 24px'}}>
        {tab==='activity' && (
          <div>
            {agentActivity.map((e,i) => (
              <div key={i} style={{display:'grid', gridTemplateColumns:'80px 80px 1fr 120px', gap:14, padding:'10px 0', borderBottom:'1px solid var(--border-subtle)', alignItems:'baseline'}}>
                <span className="mono small" style={{color:'var(--text-tertiary)'}}>{e.t}</span>
                <span className="mono small caps" style={{color:'var(--text-secondary)', fontSize:10}}>{e.type}</span>
                <span style={{fontSize:13, color:'var(--text-primary)'}}>{e.text}</span>
                <span className="mono small" style={{color:'var(--text-tertiary)', textAlign:'right'}}>{e.detail || ''}</span>
              </div>
            ))}
          </div>
        )}

        {tab==='queue' && (
          <div>
            {a.q ? (
              Array(a.q).fill(0).map((_,i) => (
                <div key={i} style={{padding:14, background:'var(--bg-surface)', border:'1px solid var(--border-default)', borderRadius:'var(--r-card)', marginBottom:8, display:'flex', alignItems:'center', gap:14}}>
                  <span className="mono" style={{color:'var(--text-tertiary)', width:20}}>{i+1}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13}}>{['Review PRD draft with Alex','Backfill onboarding tests','Update deploy runbook'][i%3]}</div>
                    <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>queued 4m ago · from Anton</div>
                  </div>
                  <RiskPip r={['L','M','L'][i%3]}/>
                  <button className="mono small" style={btnGhost}>promote</button>
                </div>
              ))
            ) : <div className="mono small" style={{color:'var(--text-tertiary)', padding:20, textAlign:'center'}}>no tasks queued</div>}
          </div>
        )}

        {tab==='trust' && (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
            <div>
              <div className="mono caps small" style={{color:'var(--text-tertiary)', marginBottom:10}}>Current tier</div>
              <div style={{padding:16, background:'var(--bg-surface)', border:'1px solid var(--border-default)', borderRadius:'var(--r-card)', marginBottom:16}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
                  <TrustBadge tier={a.t}/>
                  <span style={{fontSize:14}}>{a.t==='green'?'Autonomous':a.t==='amber'?'Ask first':'Approve every action'}</span>
                </div>
                <div className="mono small" style={{color:'var(--text-secondary)'}}>
                  {a.t==='green' ? 'Acts without approval for low/medium risk. High risk actions still require confirmation.' :
                   a.t==='amber' ? 'Shows intent before any external write. Reads are autonomous.' :
                   'Every action requires explicit approval.'}
                </div>
              </div>
              <div className="mono caps small" style={{color:'var(--text-tertiary)', marginBottom:10}}>Allowed tools</div>
              <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                {['read_file','write_file','run_sql','search','mcp.slack','mcp.github','mcp.linear'].map(t => (
                  <span key={t} className="mono small" style={{padding:'4px 10px', background:'var(--bg-surface)', border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', fontSize:11, color:'var(--text-secondary)'}}>{t}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="mono caps small" style={{color:'var(--text-tertiary)', marginBottom:10}}>Trust history</div>
              <div style={{borderLeft:'1px solid var(--border-default)', paddingLeft:16}}>
                {[
                  { d:'Apr 14', ev:`Promoted to ${a.t}`, by:'Noel' },
                  { d:'Mar 28', ev:'Completed 30 tasks w/o intervention', by:'System' },
                  { d:'Mar 12', ev:'Scoped to MCP tools only', by:'Noel' },
                  { d:'Mar 01', ev:'Onboarded', by:'System' },
                ].map((h,i) => (
                  <div key={i} style={{marginBottom:14, position:'relative'}}>
                    <div style={{position:'absolute', left:-20, top:5, width:7, height:7, borderRadius:4, background:'var(--accent)'}}/>
                    <div style={{fontSize:13}}>{h.ev}</div>
                    <div className="mono small" style={{color:'var(--text-tertiary)'}}>{h.d} · by {h.by}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==='memory' && (
          <div>
            <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:12}}>Memories {a.n} has access to</div>
            {MEMORIES.slice(0,4).map((m,i) => (
              <div key={i} onClick={()=>onNav && onNav('memory-item', { memoryId: i })} style={{
                padding:12, borderBottom:'1px solid var(--border-subtle)', cursor:'pointer',
                display:'flex', gap:12, alignItems:'flex-start',
              }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
                onMouseLeave={e=>e.currentTarget.style.background=''}>
                <span className="mono" style={{color:'var(--text-tertiary)', width:20}}>{{preference:'◇', decision:'◆', fact:'■', conversation:'▷'}[m.type]}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13}}>{m.title}</div>
                  <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>{m.src}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab==='config' && (
          <div style={{maxWidth:560}}>
            {[
              ['Model',           a.t==='red' ? 'claude-opus (forced review)' : 'qwen3:8b (local)'],
              ['Context window',  '128k tokens'],
              ['Max parallel',    '3 tool calls'],
              ['Retry policy',    '2x on timeout, escalate on 3rd'],
              ['Handoff partners','Anton, Alex, Ada'],
              ['Scope',           a.d==='eng' ? 'repo:*, fs:project/*, shell:allowlist' : 'fs:project/*, mcp:*'],
            ].map(([k,v]) => (
              <div key={k} style={{display:'flex', padding:'10px 0', borderBottom:'1px solid var(--border-subtle)'}}>
                <span className="mono small caps" style={{color:'var(--text-tertiary)', width:140}}>{k}</span>
                <span className="mono small" style={{color:'var(--text-primary)', flex:1}}>{v}</span>
                <button className="mono small" style={{background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:11}}>edit</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, v, c }) {
  return (
    <div>
      <div className="mono caps small" style={{color:'var(--text-tertiary)', fontSize:10, marginBottom:2}}>{label}</div>
      <div style={{fontSize:15, color:c || 'var(--text-primary)', fontFamily:'var(--font-mono)'}}>{v}</div>
    </div>
  );
}

const btnGhost = {
  background:'transparent', border:'1px solid var(--border-default)',
  color:'var(--text-secondary)', padding:'5px 10px', borderRadius:'var(--r-chip)',
  cursor:'pointer', fontSize:11,
};
const btnPrimary = {
  background:'var(--accent)', border:'1px solid var(--accent)',
  color:'var(--bg-page)', padding:'5px 12px', borderRadius:'var(--r-chip)',
  cursor:'pointer', fontSize:11, fontWeight:500,
};

/* ─────────── MEMORY ITEM DETAIL ─────────── */
function MemoryItemDetail({ memoryId = 0, onNav }) {
  const m = MEMORIES[memoryId] || MEMORIES[0];
  const related = MEMORIES.filter((_,i) => i !== memoryId).slice(0,3);
  const glyph = { preference:'◇', decision:'◆', fact:'■', conversation:'▷' }[m.type];
  const hlColor = { yellow:'var(--hl-yellow)', coral:'var(--hl-coral)', blue:'var(--hl-blue)' }[m.hl];

  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <BackBar label={`memory #${memoryId+1}`} onNav={onNav} crumb="Memory" crumbRoute="memory" extras={
        <div style={{display:'flex', gap:6}}>
          <button className="mono small" style={btnGhost}>edit</button>
          <button className="mono small" style={{...btnGhost, color:'var(--error)', borderColor:'var(--border-default)'}}>forget</button>
        </div>
      }/>

      <div style={{flex:1, overflow:'auto', display:'grid', gridTemplateColumns:'1fr 320px'}}>
        <div style={{padding:'24px 32px'}}>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:16}}>
            <span className="mono" style={{color:hlColor, fontSize:18}}>{glyph}</span>
            <span className="mono small caps" style={{color:'var(--text-tertiary)'}}>{m.type}</span>
            <span style={{width:1, height:12, background:'var(--border-subtle)'}}/>
            <span className="mono small" style={{color:'var(--text-tertiary)'}}>confidence {m.conf}/3</span>
          </div>

          <h1 style={{fontSize:22, lineHeight:1.35, color:'var(--text-primary)', margin:0, marginBottom:24, maxWidth:640}}>
            <span style={{background:`${hlColor}33`, padding:'0 4px'}}>{m.title}</span>
          </h1>

          <div className="mono caps small" style={{color:'var(--text-tertiary)', marginBottom:10}}>Source</div>
          <div style={{padding:14, background:'var(--bg-surface)', border:'1px solid var(--border-default)', borderRadius:'var(--r-card)', marginBottom:24, maxWidth:640}}>
            <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:8}}>{m.src}</div>
            <div style={{fontSize:13, color:'var(--text-secondary)', fontStyle:'italic', lineHeight:1.6}}>
              "{m.type==='preference' ? 'Honestly, I just want the bullets. I read fast — pack the density in, don\'t fluff it.' :
                m.type==='decision'   ? 'Let\'s make the call here and move on. I don\'t want to keep relitigating this.' :
                m.type==='fact'       ? 'Renewal hits the 14th. Put it in the ledger.' :
                                        'Okay, debriefing Q1 — honestly the creator tier is where our signal is.'}"
            </div>
          </div>

          <div className="mono caps small" style={{color:'var(--text-tertiary)', marginBottom:10}}>Used in</div>
          <div style={{maxWidth:640}}>
            {[
              ['Apr 17 · Morning briefing',       'Applied formatting preference'],
              ['Apr 12 · Chat with Noel',         'Anton cited this when discussing model routing'],
              ['Apr 08 · Sarah reviewing copy',   'Blocked emoji in draft email'],
              ['Apr 02 · Anton weekly summary',   'Used as context for tone'],
            ].map(([when, how],i) => (
              <div key={i} style={{padding:'10px 0', borderBottom:'1px solid var(--border-subtle)', display:'flex', justifyContent:'space-between', gap:14}}>
                <span className="mono small" style={{color:'var(--text-secondary)'}}>{when}</span>
                <span className="mono small" style={{color:'var(--text-tertiary)'}}>{how}</span>
              </div>
            ))}
          </div>
        </div>

        <aside style={{borderLeft:'1px solid var(--border-subtle)', padding:'24px 20px', background:'var(--bg-surface)'}}>
          <div className="mono caps small" style={{color:'var(--text-tertiary)', marginBottom:10}}>Metadata</div>
          {[
            ['Created',   m.src],
            ['Last used', '2h ago'],
            ['Uses',      '47 times'],
            ['Scope',     'all agents'],
            ['Sensitive', 'no'],
          ].map(([k,v]) => (
            <div key={k} style={{display:'flex', padding:'7px 0', borderBottom:'1px solid var(--border-subtle)', fontSize:12}}>
              <span className="mono small caps" style={{color:'var(--text-tertiary)', width:80, fontSize:10}}>{k}</span>
              <span className="mono small" style={{color:'var(--text-primary)'}}>{v}</span>
            </div>
          ))}

          <div className="mono caps small" style={{color:'var(--text-tertiary)', marginTop:20, marginBottom:10}}>Related</div>
          {related.map((r, i) => (
            <div key={i} style={{padding:10, marginBottom:8, background:'var(--bg-page)', border:'1px solid var(--border-default)', borderRadius:'var(--r-card)', cursor:'pointer'}}>
              <div style={{display:'flex', gap:6, alignItems:'flex-start'}}>
                <span className="mono" style={{color:'var(--text-tertiary)'}}>{{preference:'◇', decision:'◆', fact:'■', conversation:'▷'}[r.type]}</span>
                <span style={{fontSize:12, color:'var(--text-secondary)', lineHeight:1.4}}>{r.title}</span>
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

/* ─────────── ACTIVITY EVENT DETAIL ─────────── */
function ActivityEventDetail({ eventId = 0, onNav }) {
  const e = ACTIVITY[eventId] || ACTIVITY[0];
  const a = AGENTS.find(x => x.n === e.agent) || AGENTS[0];

  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <BackBar label="event detail" onNav={onNav} crumb="Log" crumbRoute="log" extras={
        <div style={{display:'flex', gap:6}}>
          <button className="mono small" style={btnGhost}>copy trace</button>
          <button className="mono small" style={btnGhost}>replay</button>
        </div>
      }/>

      <div style={{flex:1, overflow:'auto', padding:'24px 32px', maxWidth:900}}>
        <div style={{display:'flex', alignItems:'baseline', gap:14, marginBottom:20}}>
          <span className="mono" style={{color:'var(--text-primary)', fontSize:18}}>{e.t}</span>
          <span className="mono small caps" style={{color:'var(--accent)'}}>{e.type}</span>
          <span style={{fontSize:14, color:'var(--text-secondary)'}}>→ {e.agent}</span>
        </div>

        <div style={{padding:18, background:'var(--bg-surface)', border:'1px solid var(--border-default)', borderRadius:'var(--r-card)', marginBottom:24}}>
          <div className="mono" style={{fontSize:14, color:'var(--text-primary)', marginBottom:8}}>{e.text}</div>
          {e.detail && <div className="mono small" style={{color:'var(--text-tertiary)'}}>{e.detail}</div>}
        </div>

        <div className="mono caps small" style={{color:'var(--text-tertiary)', marginBottom:10}}>Trace</div>
        <div style={{background:'var(--bg-surface)', border:'1px solid var(--border-default)', borderRadius:'var(--r-card)', padding:14, marginBottom:24, fontFamily:'var(--font-mono)', fontSize:12, lineHeight:1.7, color:'var(--text-secondary)'}}>
          <div><span style={{color:'var(--text-tertiary)'}}>14:02:17.012</span> <span style={{color:'var(--accent)'}}>anton</span> → delegate to {e.agent}</div>
          <div><span style={{color:'var(--text-tertiary)'}}>14:02:17.040</span> <span style={{color:'var(--ok)'}}>{e.agent}</span> ACK task_id=tsk_9a2f</div>
          <div><span style={{color:'var(--text-tertiary)'}}>14:02:17.118</span> <span style={{color:'var(--ok)'}}>{e.agent}</span> plan: 3 steps identified</div>
          <div><span style={{color:'var(--text-tertiary)'}}>14:02:17.290</span> <span style={{color:'var(--ok)'}}>{e.agent}</span> {e.text}</div>
          <div><span style={{color:'var(--text-tertiary)'}}>14:02:17.312</span> <span style={{color:'var(--ok)'}}>{e.agent}</span> returned {e.detail || 'ok'}</div>
          <div style={{color:'var(--text-tertiary)'}}>14:02:17.315 anton  received</div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
          <div>
            <div className="mono caps small" style={{color:'var(--text-tertiary)', marginBottom:10}}>Context</div>
            {[['Task',      'Draft PRD for onboarding v3'],
              ['Parent',    'brief_2026-04-18'],
              ['Model',     'qwen3:8b'],
              ['Prompt',    '2,104 tokens'],
              ['Output',    '512 tokens'],
              ['Latency',   '340ms']].map(([k,v]) => (
              <div key={k} style={{display:'flex', padding:'7px 0', borderBottom:'1px solid var(--border-subtle)'}}>
                <span className="mono small caps" style={{color:'var(--text-tertiary)', width:100, fontSize:10}}>{k}</span>
                <span className="mono small" style={{color:'var(--text-primary)'}}>{v}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="mono caps small" style={{color:'var(--text-tertiary)', marginBottom:10}}>Safety checks</div>
            {[['PII scan',      'clean'],
              ['Scope check',   'within bounds'],
              ['Risk estimate', 'low'],
              ['Approval',      'auto (trust:green)'],
              ['Rollback',      'snapshot saved']].map(([k,v],i) => (
              <div key={k} style={{display:'flex', padding:'7px 0', borderBottom:'1px solid var(--border-subtle)', alignItems:'center'}}>
                <span style={{color:'var(--ok)', marginRight:8}}>✓</span>
                <span className="mono small caps" style={{color:'var(--text-tertiary)', width:100, fontSize:10}}>{k}</span>
                <span className="mono small" style={{color:'var(--text-primary)'}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── INTEGRATION DETAIL ─────────── */
function IntegrationDetail({ intId = 'slack', onNav }) {
  const INT = {
    slack:   { n:'Slack',   cat:'messaging', st:'connected', since:'Feb 12', who:'noel@anton', scope:'read channels, send as me' },
    github:  { n:'GitHub',  cat:'code',      st:'connected', since:'Feb 12', who:'noel',         scope:'read repos, open PRs' },
    gmail:   { n:'Gmail',   cat:'email',     st:'connected', since:'Feb 18', who:'noel@',        scope:'read labels, draft replies' },
    linear:  { n:'Linear',  cat:'tasks',     st:'connected', since:'Mar 01', who:'noel',         scope:'read all, write assigned issues' },
    stripe:  { n:'Stripe',  cat:'finance',   st:'connected', since:'Mar 04', who:'acct_1Nab',    scope:'read metrics, no write' },
    figma:   { n:'Figma',   cat:'design',    st:'pending',   since:'—',      who:'—',            scope:'—' },
  };
  const it = INT[intId] || INT.slack;

  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <BackBar label={it.n} onNav={onNav} crumb="Hands" crumbRoute="hands" extras={
        <div style={{display:'flex', gap:6}}>
          <button className="mono small" style={btnGhost}>re-auth</button>
          <button className="mono small" style={{...btnGhost, color:'var(--error)'}}>disconnect</button>
        </div>
      }/>

      <div style={{flex:1, overflow:'auto'}}>
        <div style={{padding:'24px 32px', borderBottom:'1px solid var(--border-subtle)', display:'flex', gap:20, alignItems:'center'}}>
          <div style={{width:64, height:64, borderRadius:12, background:'var(--bg-surface)', border:'1px solid var(--border-default)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-mono)', fontSize:24, color:'var(--accent)'}}>
            {it.n[0]}
          </div>
          <div style={{flex:1}}>
            <h1 style={{fontSize:22, margin:0, marginBottom:6}}>{it.n}</h1>
            <div className="mono small" style={{color:'var(--text-tertiary)'}}>{it.cat} · connected via OAuth · since {it.since}</div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <span className="pulse" style={{width:8, height:8, borderRadius:'50%', background: it.st==='connected' ? 'var(--ok)' : 'var(--work)'}}/>
            <span className="mono small caps" style={{color: it.st==='connected' ? 'var(--ok)' : 'var(--work)'}}>{it.st}</span>
          </div>
        </div>

        <div style={{padding:'24px 32px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, maxWidth:1100}}>
          <div>
            <div className="mono caps small" style={{color:'var(--text-tertiary)', marginBottom:10}}>Scopes granted</div>
            {it.scope.split(',').map((s,i) => (
              <div key={i} style={{padding:'10px 0', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', gap:10}}>
                <span style={{color:'var(--ok)'}}>✓</span>
                <span className="mono small" style={{color:'var(--text-primary)'}}>{s.trim()}</span>
              </div>
            ))}

            <div className="mono caps small" style={{color:'var(--text-tertiary)', marginTop:24, marginBottom:10}}>Which agents use it</div>
            {AGENTS.slice(0,5).map(a => (
              <div key={a.n} style={{padding:'8px 0', borderBottom:'1px solid var(--border-subtle)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{fontSize:13}}>{a.n}</span>
                <span className="mono small" style={{color:'var(--text-tertiary)'}}>{Math.floor(10 + Math.random()*40)} calls / wk</span>
              </div>
            ))}
          </div>

          <div>
            <div className="mono caps small" style={{color:'var(--text-tertiary)', marginBottom:10}}>Recent activity</div>
            {[
              ['14:02', 'Sarah',  'posted to #launch'],
              ['13:41', 'Marcus', 'read #eng-standup'],
              ['12:58', 'Anton',  'fetched thread for memory'],
              ['12:02', 'Kai',    'posted to #marketing'],
              ['11:18', 'Sarah',  'drafted reply, held for review'],
            ].map(([t,a,ev],i) => (
              <div key={i} style={{padding:'10px 0', borderBottom:'1px solid var(--border-subtle)', display:'grid', gridTemplateColumns:'60px 90px 1fr', gap:12, alignItems:'baseline'}}>
                <span className="mono small" style={{color:'var(--text-tertiary)'}}>{t}</span>
                <span style={{fontSize:13}}>{a}</span>
                <span className="mono small" style={{color:'var(--text-secondary)'}}>{ev}</span>
              </div>
            ))}

            <div className="mono caps small" style={{color:'var(--text-tertiary)', marginTop:24, marginBottom:10}}>Health</div>
            <div style={{padding:14, background:'var(--bg-surface)', border:'1px solid var(--border-default)', borderRadius:'var(--r-card)'}}>
              {[['Rate limit',  '412 / 5000 / hr'],
                ['Last error',  '—'],
                ['Avg latency', '180ms'],
                ['Uptime (30d)','99.7%']].map(([k,v]) => (
                <div key={k} style={{display:'flex', padding:'6px 0', justifyContent:'space-between'}}>
                  <span className="mono small" style={{color:'var(--text-tertiary)'}}>{k}</span>
                  <span className="mono small" style={{color:'var(--text-primary)'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BackBar, AgentDetailView, MemoryItemDetail, ActivityEventDetail, IntegrationDetail, btnGhost, btnPrimary });
