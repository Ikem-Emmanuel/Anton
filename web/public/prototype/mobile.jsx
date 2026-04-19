// Mobile screens — iPhone-framed
function IPhoneFrame({ children, label }) {
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
      <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:12}}>{label}</div>
      <div style={{
        width:390, height:844, background:'#000', borderRadius:54,
        padding:12, boxShadow:'0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)',
        position:'relative',
      }}>
        <div style={{
          width:'100%', height:'100%', background:'var(--bg-page)',
          borderRadius:44, overflow:'hidden', position:'relative',
        }}>
          {/* status bar */}
          <div style={{
            position:'absolute', top:0, left:0, right:0, height:52, zIndex:20,
            display:'flex', alignItems:'flex-start', padding:'14px 30px 0',
            justifyContent:'space-between', pointerEvents:'none',
          }}>
            <span className="mono small" style={{color:'var(--text-primary)', fontSize:14, fontWeight:500}}>14:02</span>
            <div style={{width:120, height:30, background:'#000', borderRadius:20, position:'absolute', left:'50%', transform:'translateX(-50%)', top:8}}/>
            <span className="mono small" style={{color:'var(--text-primary)', fontSize:12}}>●●● 􀙇</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function MobileTabBar({ active = 'brief', count = 3 }) {
  const tabs = [
    { id:'brief',   label:'Brief',    glyph:'◎' },
    { id:'agents',  label:'Agents',   glyph:'◉' },
    { id:'appr',    label:'Approve',  glyph:'✓', badge: count },
    { id:'voice',   label:'Voice',    glyph:'◐' },
    { id:'more',    label:'More',     glyph:'⋯' },
  ];
  return (
    <div style={{
      position:'absolute', bottom:0, left:0, right:0, height:84,
      background:'var(--bg-surface)', borderTop:'1px solid var(--border-subtle)',
      display:'flex', paddingBottom:24, paddingTop:8,
    }}>
      {tabs.map(t => (
        <div key={t.id} style={{
          flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3,
          position:'relative',
        }}>
          <span className="mono" style={{fontSize:18, color: t.id===active ? 'var(--accent)' : 'var(--text-tertiary)'}}>{t.glyph}</span>
          <span className="mono small" style={{fontSize:10, color: t.id===active ? 'var(--text-primary)' : 'var(--text-tertiary)'}}>{t.label}</span>
          {t.badge && (
            <span className="mono" style={{
              position:'absolute', top:4, right:'50%', marginRight:-26,
              background:'var(--work)', color:'var(--bg-page)', fontSize:10,
              padding:'1px 5px', borderRadius:8, minWidth:14, textAlign:'center',
            }}>{t.badge}</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────── BRIEFING (mobile) ─────────── */
function MobileBriefing() {
  return (
    <div style={{paddingTop:58, paddingBottom:96, height:'100%', overflow:'auto'}}>
      <div style={{padding:'20px 20px 14px'}}>
        <div className="mono caps" style={{color:'var(--text-tertiary)', fontSize:10, marginBottom:4}}>FRI · 14:02</div>
        <div style={{fontSize:22, fontWeight:500, letterSpacing:'-0.02em', lineHeight:1.25}}>
          Good afternoon.<br/>
          <span style={{color:'var(--text-secondary)'}}>3 things need you.</span>
        </div>
      </div>

      {/* top approval card */}
      <div style={{margin:'6px 16px 10px', padding:14, background:'var(--bg-hover)', border:'1px solid var(--error)', borderRadius:'var(--r-card)'}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
          <span className="mono small caps" style={{color:'var(--error)'}}>HIGH RISK · APPROVAL</span>
          <span style={{flex:1}}/>
          <span className="mono small" style={{color:'var(--text-tertiary)'}}>3m</span>
        </div>
        <div style={{fontSize:14, lineHeight:1.45}}><b>James</b> is ready to push v1.2 to production.</div>
        <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:6}}>swipe → approve · swipe ← reject</div>
      </div>

      {/* ambient status */}
      <div style={{margin:'6px 16px 14px', padding:'12px 14px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)'}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <span className="pulse" style={{width:8, height:8, borderRadius:'50%', background:'var(--work)'}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:13}}>7 agents active · 3 pending</div>
            <div className="mono small" style={{color:'var(--text-tertiary)'}}>Marcus, Ada, Kai, Priya, Sarah, Alex, Felix</div>
          </div>
        </div>
      </div>

      {/* overnight */}
      <div style={{padding:'0 20px'}}>
        <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:10, paddingBottom:6, borderBottom:'1px solid var(--border-subtle)'}}>OVERNIGHT</div>
        {[
          'Felix shipped rate-limit middleware. Tests green.',
          'Kai drafted 4 SEO articles. 2 await review.',
          'James flagged a flaky test. Isolated.',
        ].map((t,i) => (
          <div key={i} style={{display:'flex', gap:10, padding:'8px 0'}}>
            <span className="mono small" style={{color:'var(--text-tertiary)', width:18, paddingTop:2}}>{String(i+1).padStart(2,'0')}</span>
            <div style={{flex:1, fontSize:14, lineHeight:1.55}}>{t}</div>
          </div>
        ))}
        <div className="mono caps" style={{color:'var(--text-tertiary)', margin:'18px 0 10px', paddingBottom:6, borderBottom:'1px solid var(--border-subtle)'}}>CALENDAR</div>
        {[
          ['15:00','Call with Lena — partnership'],
          ['16:30','Focus: v1.2 launch prep'],
          ['19:00','Dinner · block'],
        ].map((x,i) => (
          <div key={i} style={{display:'flex', gap:12, padding:'8px 0'}}>
            <span className="mono small" style={{color:'var(--text-tertiary)', width:38}}>{x[0]}</span>
            <div style={{flex:1, fontSize:14}}>{x[1]}</div>
          </div>
        ))}
      </div>
      <MobileTabBar active="brief"/>
    </div>
  );
}

/* ─────────── AGENTS (mobile) ─────────── */
function MobileAgents() {
  const [dept, setDept] = React.useState('eng');
  const agents = AGENTS.filter(a => a.d === dept);
  return (
    <div style={{paddingTop:58, paddingBottom:96, height:'100%', overflow:'auto'}}>
      <div style={{padding:'14px 20px 10px'}}>
        <div style={{fontSize:22, fontWeight:500, letterSpacing:'-0.02em'}}>Team</div>
        <div className="mono small" style={{color:'var(--text-tertiary)'}}>15 agents across 6 teams</div>
      </div>
      <div style={{display:'flex', gap:6, overflowX:'auto', padding:'6px 16px 14px', scrollbarWidth:'none'}}>
        {DEPARTMENTS.map(d => (
          <button key={d.id} onClick={()=>setDept(d.id)} className="mono small" style={{
            padding:'7px 14px', whiteSpace:'nowrap', fontSize:12,
            background: dept===d.id ? 'var(--accent-soft)' : 'var(--bg-surface)',
            color: dept===d.id ? 'var(--accent)' : 'var(--text-secondary)',
            border:`1px solid ${dept===d.id ? 'var(--accent)' : 'var(--border-default)'}`,
            borderRadius:16, cursor:'pointer',
          }}>{d.name}</button>
        ))}
      </div>
      <div style={{padding:'0 16px'}}>
        {agents.map(a => (
          <div key={a.n} style={{
            padding:'14px 14px', marginBottom:8, background:'var(--bg-surface)',
            border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)',
            display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{
              width:36, height:36, borderRadius:'var(--r-chip)', background:'var(--bg-raised)',
              display:'flex', alignItems:'center', justifyContent:'center',
              border:'1px solid var(--border-default)',
            }}>
              <span className="mono" style={{fontSize:11, color:'var(--text-secondary)'}}>{a.k}</span>
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <span style={{fontSize:15}}>{a.n}</span>
                <StatusGlow s={a.s}/>
              </div>
              <div className="mono small" style={{color:'var(--text-tertiary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{a.r}</div>
            </div>
            <div style={{textAlign:'right'}}>
              <TrustBadge tier={a.t}/>
              <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:3}}>
                {a.q ? <span style={{color:'var(--work)'}}>{a.q} queued</span> : a.last}
              </div>
            </div>
          </div>
        ))}
      </div>
      <MobileTabBar active="agents"/>
    </div>
  );
}

/* ─────────── APPROVALS (mobile swipe stack) ─────────── */
function MobileApprovals() {
  return (
    <div style={{paddingTop:58, paddingBottom:96, height:'100%', overflow:'hidden', position:'relative'}}>
      <div style={{padding:'14px 20px 10px'}}>
        <div style={{display:'flex', alignItems:'baseline', gap:10}}>
          <div style={{fontSize:22, fontWeight:500, letterSpacing:'-0.02em'}}>Approvals</div>
          <div className="mono small" style={{color:'var(--work)'}}>5 pending</div>
        </div>
        <div className="mono small" style={{color:'var(--text-tertiary)'}}>swipe → approve · swipe ← reject</div>
      </div>

      <div style={{position:'relative', height:520, margin:'14px 22px 0'}}>
        {/* stack */}
        {APPROVALS.slice(0,3).map((a, idx) => {
          const top = APPROVALS[0];
          const offset = idx * 10;
          const scale = 1 - idx * 0.04;
          const rotate = idx === 0 ? 6 : 0;
          const opacity = idx === 0 ? 1 : 0.6 - idx * 0.1;
          return (
            <div key={a.id} style={{
              position:'absolute', left:0, right:0, top:offset, bottom: idx===0?0:offset,
              background:'var(--bg-surface)',
              border:`1px solid ${idx===0?'var(--error)':'var(--border-default)'}`,
              borderRadius:'var(--r-panel)', padding:'20px 20px',
              transform: idx===0 ? `translateX(18px) rotate(${rotate}deg)` : `scale(${scale})`,
              opacity, zIndex: 10-idx,
              boxShadow: idx===0 ? '0 12px 32px rgba(0,0,0,0.5)' : 'none',
            }}>
              {idx===0 && (
                <>
                  <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
                    <div style={{width:32, height:32, borderRadius:6, background:'var(--bg-raised)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid var(--border-default)'}}>
                      <span className="mono small" style={{color:'var(--text-secondary)', fontSize:10}}>JMS</span>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:15, fontWeight:500}}>James</div>
                      <div className="mono small" style={{color:'var(--text-tertiary)'}}>Deploy & DevOps · 3m ago</div>
                    </div>
                    <RiskPip r="H"/>
                  </div>
                  <div style={{fontSize:17, lineHeight:1.4, fontWeight:500, marginBottom:16}}>
                    Push v1.2 to production.
                  </div>
                  <div className="mono small" style={{color:'var(--text-secondary)', padding:12, background:'var(--bg-page)', border:'1px solid var(--border-subtle)', borderRadius:6, marginBottom:16, lineHeight:1.5}}>
                    all tests green for 42m<br/>
                    requires approval per red tier<br/>
                    rollback time: &lt;90s
                  </div>
                  <div style={{padding:12, background:'var(--bg-page)', marginBottom:16}}>
                    {[['+','api/router.ts','+24'], ['-','api/router.ts','-9'], ['~','config/deploy.yaml','3']].map((r,i) => (
                      <div key={i} className="mono small" style={{display:'flex', gap:8, padding:'2px 0'}}>
                        <span style={{color: r[0]==='+'?'var(--ok)':r[0]==='-'?'var(--error)':'var(--work)', width:12}}>{r[0]}</span>
                        <span style={{flex:1, color:'var(--text-secondary)'}}>{r[1]}</span>
                        <span style={{color:'var(--text-tertiary)'}}>{r[2]}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex', gap:10}}>
                    <div style={{
                      flex:1, padding:'14px', background:'var(--error)', opacity:.2,
                      borderRadius:'var(--r-card)', textAlign:'center',
                    }} className="mono small caps">✕ REJECT</div>
                    <div style={{
                      flex:1, padding:'14px', background:'var(--ok)', opacity:.2,
                      borderRadius:'var(--r-card)', textAlign:'center',
                    }} className="mono small caps">✓ APPROVE</div>
                  </div>
                </>
              )}
              {idx!==0 && (
                <div style={{padding:8}}>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
                    <div style={{width:24, height:24, borderRadius:4, background:'var(--bg-raised)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                      <span className="mono small" style={{color:'var(--text-tertiary)', fontSize:9}}>{a.agent.slice(0,3).toUpperCase()}</span>
                    </div>
                    <span style={{fontSize:13, color:'var(--text-secondary)'}}>{a.agent}</span>
                    <span style={{flex:1}}/>
                    <RiskPip r={a.risk}/>
                  </div>
                  <div style={{fontSize:14, color:'var(--text-secondary)'}}>{a.intent.slice(0,60)}…</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <MobileTabBar active="appr" count={5}/>
    </div>
  );
}

/* ─────────── VOICE (full-screen) ─────────── */
function MobileVoice({ state = 'listening' }) {
  // state: idle | listening | responding
  const bars = Array.from({length:48});
  const amp = i => {
    if (state === 'idle') return 8;
    const rand = Math.abs(Math.sin(i*0.7) * Math.cos(i*0.3));
    return 10 + rand * (state==='listening' ? 80 : 40);
  };
  return (
    <div style={{height:'100%', position:'relative', paddingTop:58}}>
      {/* top bar */}
      <div style={{display:'flex', alignItems:'center', padding:'14px 20px'}}>
        <button className="mono" style={{
          width:34, height:34, borderRadius:17, background:'var(--bg-surface)',
          border:'1px solid var(--border-default)', color:'var(--text-secondary)',
          fontSize:16, cursor:'pointer',
        }}>✕</button>
        <span style={{flex:1}}/>
        <span className="mono small" style={{color:'var(--text-tertiary)'}}>
          {state==='listening'? '● LISTENING' : state==='responding' ? '● ANTON' : '○ STANDBY'}
        </span>
      </div>

      {/* waveform */}
      <div style={{
        position:'absolute', top:'28%', left:0, right:0, display:'flex',
        alignItems:'center', justifyContent:'center', height:140, gap:3,
      }}>
        {bars.map((_, i) => {
          const h = amp(i);
          return (
            <div key={i} style={{
              width:3, height:`${h}px`, background:'var(--accent)',
              borderRadius:2, opacity: state==='idle' ? 0.3 : (0.4 + (h/120)*0.6),
            }} className={state==='listening'?'pulse':''}/>
          );
        })}
      </div>

      {/* transcript */}
      <div style={{position:'absolute', top:'50%', left:24, right:24}}>
        {state === 'listening' && (
          <div style={{fontSize:22, lineHeight:1.35, letterSpacing:'-0.01em', fontWeight:500}}>
            ask marcus to draft the onboarding PRD by friday and send it to alex for review<span style={{color:'var(--accent)'}}>▊</span>
          </div>
        )}
        {state === 'responding' && (
          <>
            <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:10}}>YOU</div>
            <div style={{fontSize:15, color:'var(--text-secondary)', marginBottom:20, lineHeight:1.5}}>
              what's marcus up to?
            </div>
            <div className="mono small caps" style={{color:'var(--accent)', marginBottom:10}}>ANTON</div>
            <div style={{fontSize:17, lineHeight:1.4, fontWeight:500}}>
              Drafting the onboarding PRD. Two open questions — he'll flag them at 3.
            </div>
          </>
        )}
        {state === 'idle' && (
          <div style={{textAlign:'center', color:'var(--text-tertiary)'}} className="mono small">
            hold the button to speak
          </div>
        )}
      </div>

      {/* PTT button */}
      <div style={{position:'absolute', bottom:60, left:0, right:0, display:'flex', justifyContent:'center'}}>
        <div style={{
          width:96, height:96, borderRadius:'50%',
          background: state==='listening' ? 'var(--accent)' : 'var(--bg-surface)',
          border:`2px solid ${state==='listening'?'var(--accent)':'var(--border-strong)'}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow: state==='listening' ? '0 0 40px rgba(196,148,58,0.4)' : 'none',
        }} className={state==='listening'?'pulse':''}>
          <span style={{fontSize:30, color: state==='listening' ? 'var(--bg-page)' : 'var(--text-secondary)'}}>●</span>
        </div>
      </div>
      <div style={{position:'absolute', bottom:30, left:0, right:0, textAlign:'center'}} className="mono small">
        <span style={{color:'var(--text-tertiary)'}}>hold to speak · long-press for continuous</span>
      </div>
    </div>
  );
}

/* ─────────── HOME SCREEN WIDGET ─────────── */
function HomeWidget() {
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:12}}>
      <div className="mono small caps" style={{color:'var(--text-tertiary)'}}>HOME SCREEN WIDGET · MEDIUM</div>
      <div style={{
        width:340, height:160, background:'var(--bg-surface)', borderRadius:22,
        padding:'16px 18px', border:'1px solid var(--border-default)',
        display:'flex', flexDirection:'column', gap:8,
      }}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span className="pulse" style={{width:6, height:6, borderRadius:'50%', background:'var(--work)'}}/>
          <span className="mono small caps" style={{color:'var(--text-primary)'}}>ANTON · WORKING ON 2</span>
          <span style={{flex:1}}/>
          <span className="mono small" style={{color:'var(--text-tertiary)'}}>14:02</span>
        </div>
        <div style={{
          padding:'8px 10px', background:'var(--bg-hover)', border:'1px solid var(--error)',
          borderRadius:6, marginTop:2,
        }}>
          <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:2}}>
            <RiskPip r="H"/>
            <span className="mono small" style={{color:'var(--text-tertiary)'}}>James · 3m</span>
          </div>
          <div style={{fontSize:13, lineHeight:1.35}}>Push v1.2 to production.</div>
        </div>
        <div style={{flex:1}}/>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <div style={{
            width:36, height:36, borderRadius:18, background:'var(--accent)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <span style={{color:'var(--bg-page)', fontSize:14}}>●</span>
          </div>
          <div style={{flex:1}}>
            <div className="mono small" style={{color:'var(--text-tertiary)'}}>NEXT · 15:00</div>
            <div style={{fontSize:13}}>Call with Lena</div>
          </div>
          <span className="mono small" style={{color:'var(--text-tertiary)'}}>+4 pending</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────── LOCK SCREEN NOTIFICATION ─────────── */
function LockNotification() {
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:12}}>
      <div className="mono small caps" style={{color:'var(--text-tertiary)'}}>LOCK SCREEN · PROACTIVE</div>
      <div style={{
        width:340, background:'rgba(26,23,20,0.85)', backdropFilter:'blur(20px)',
        borderRadius:22, padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
          <div style={{width:18, height:18, borderRadius:4, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <span style={{color:'var(--bg-page)', fontSize:10, fontFamily:'var(--font-mono)'}}>A</span>
          </div>
          <span className="mono small caps" style={{color:'var(--text-primary)'}}>ANTON · HIGH-RISK APPROVAL</span>
          <span style={{flex:1}}/>
          <span className="mono small" style={{color:'var(--text-tertiary)'}}>now</span>
        </div>
        <div style={{fontSize:15, fontWeight:500, marginBottom:2}}>James wants to deploy v1.2</div>
        <div className="mono small" style={{color:'var(--text-secondary)'}}>irreversible · all tests green 42m</div>
        <div style={{display:'flex', gap:6, marginTop:10}}>
          <button style={{
            flex:1, padding:'8px', background:'var(--accent)', color:'var(--bg-page)',
            border:'none', borderRadius:6, fontSize:12, fontWeight:500,
          }}>Approve</button>
          <button style={{
            flex:1, padding:'8px', background:'rgba(255,255,255,0.08)', color:'var(--text-primary)',
            border:'none', borderRadius:6, fontSize:12,
          }}>Open</button>
          <button style={{
            padding:'8px 14px', background:'rgba(255,255,255,0.04)', color:'var(--text-tertiary)',
            border:'none', borderRadius:6, fontSize:12,
          }}>×</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  IPhoneFrame, MobileBriefing, MobileAgents, MobileApprovals, MobileVoice,
  HomeWidget, LockNotification, MobileTabBar,
});
