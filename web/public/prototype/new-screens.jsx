// CHAT MODULE, DEPARTMENT CHART, APPROVAL DETAIL
const { useState: useS } = React;

/* ─────────── CHAT ─────────── */
const CHAT_THREADS = [
  { id:'anton', name:'Anton', sub:'personal OS', last:'Morning briefing sent.', time:'14:02', unread:0, pinned:true, avatar:'◉', color:'var(--accent)' },
  { id:'marcus', name:'Marcus', sub:'Lead engineer · Engineering', last:'PRD draft is ready. Two open questions.', time:'13:58', unread:2, avatar:'M', color:'#8DBBFF' },
  { id:'sarah', name:'Sarah', sub:'Copy · Marketing', last:'Launch email ready for review.', time:'13:44', unread:1, avatar:'S', color:'#E4938E' },
  { id:'james', name:'James', sub:'DevOps', last:'Waiting on your approval for v1.2.', time:'13:32', unread:1, avatar:'J', color:'#8DBBFF' },
  { id:'kai', name:'Kai', sub:'SEO', last:'Keyword set indexed.', time:'12:10', unread:0, avatar:'K', color:'#FBDA83' },
  { id:'eng', name:'# engineering', sub:'5 agents · Marcus lead', last:'Ben → Felix: green on the retry harness', time:'11:50', unread:0, avatar:'#', color:'var(--text-secondary)', group:true },
  { id:'priya', name:'Priya', sub:'Analytics · Data', last:'Cohort rebuilt, 714 rows.', time:'11:02', unread:0, avatar:'P', color:'#A6D89C' },
  { id:'alex', name:'Alex', sub:'Product', last:'Onboarding v3 scope locked.', time:'10:14', unread:0, avatar:'A', color:'#F0B780' },
];

const ANTON_MSGS = [
  { from:'anton', t:'09:02', text:"Morning. Three things for today:", render:'header' },
  { from:'anton', t:'09:02', text:"James is queued to push v1.2 — waiting on your approval. All tests have been green for 42 minutes.", meta:{ cite:'James · 08:20', depth:'minimal' } },
  { from:'anton', t:'09:02', text:"Sarah's launch email is drafted. Targeting 2,340 dormant waitlist. Copy reviewed by Kai for SEO tone.", meta:{ cite:'Sarah · 08:55', depth:'minimal' } },
  { from:'anton', t:'09:02', text:"Marcus has the PRD for onboarding v3 ready, with two open questions for you.", meta:{ cite:'Marcus · 08:41', depth:'minimal' } },
  { from:'noel',  t:'09:14', text:"walk me through Marcus's open questions" },
  { from:'anton', t:'09:14', text:"1. Should step 3 auto-create a workspace or prompt the user? (He's leaning prompt.)\n2. What's the fallback if the local model can't classify the user's intent on first-run?", meta:{ cite:'Marcus PRD §3.2, §4.1', depth:'standard', model:'qwen3:8b', lat:'2.1s' } },
  { from:'noel',  t:'09:15', text:"ask Marcus to propose the fallback and draft both auto and prompt options side-by-side" },
  { from:'anton', t:'09:15', text:"Sent. Marcus is on it — he'll post in this thread when ready.", meta:{ handoff:'Marcus', intent:'draft comparison', depth:'minimal' } },
];

function ChatThreadItem({ t, active, onClick }) {
  return (
    <div onClick={onClick} style={{
      display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px',
      background: active ? 'var(--bg-hover)' : 'transparent',
      borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
      cursor:'pointer',
    }}>
      <div style={{
        width:32, height:32, borderRadius:t.group?4:16, background:'var(--bg-raised)',
        border:'1px solid var(--border-default)', color:t.color,
        display:'flex', alignItems:'center', justifyContent:'center',
        fontFamily:'var(--font-mono)', fontSize:13, flexShrink:0,
      }}>{t.avatar}</div>
      <div style={{flex:1, minWidth:0}}>
        <div style={{display:'flex', alignItems:'baseline', gap:6}}>
          <span style={{fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{t.name}</span>
          {t.pinned && <span style={{color:'var(--text-tertiary)', fontSize:10}}>◉</span>}
          <span style={{flex:1}}/>
          <span className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{t.time}</span>
        </div>
        <div style={{display:'flex', alignItems:'baseline', gap:6, marginTop:2}}>
          <span className="mono small" style={{color:'var(--text-tertiary)', fontSize:11, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1}}>{t.last}</span>
          {t.unread > 0 && <span style={{
            background:'var(--accent)', color:'var(--bg-page)', fontSize:10, padding:'0 6px',
            borderRadius:8, fontFamily:'var(--font-mono)', minWidth:14, textAlign:'center',
          }}>{t.unread}</span>}
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ m }) {
  const isNoel = m.from === 'noel';
  return (
    <div style={{
      display:'flex', flexDirection:'column',
      alignItems: isNoel ? 'flex-end' : 'flex-start',
      marginBottom:14,
    }}>
      <div style={{
        maxWidth:'72%',
        padding:'10px 14px',
        background: isNoel ? 'var(--accent-soft)' : 'var(--bg-surface)',
        border: `1px solid ${isNoel ? 'var(--accent)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--r-card)',
        fontFamily: isNoel ? 'var(--font-sans)' : 'var(--font-mono)',
        fontSize: isNoel ? 14 : 13,
        color: 'var(--text-primary)',
        whiteSpace: 'pre-wrap', lineHeight:1.55,
      }}>{m.text}</div>
      <div className="mono small" style={{
        color:'var(--text-tertiary)', fontSize:10, marginTop:3, display:'flex', gap:8,
      }}>
        <span>{isNoel ? 'you' : 'anton'}</span>
        <span>·</span>
        <span>{m.t}</span>
        {m.meta?.depth && <><span>·</span><span>{m.meta.depth}</span></>}
        {m.meta?.model && <><span>·</span><span>{m.meta.model}</span></>}
        {m.meta?.lat && <><span>·</span><span>{m.meta.lat}</span></>}
        {m.meta?.cite && <><span>·</span><span style={{color:'var(--info)'}}>src: {m.meta.cite}</span></>}
        {m.meta?.handoff && <><span>·</span><span style={{color:'var(--accent)'}}>→ {m.meta.handoff}</span></>}
      </div>
    </div>
  );
}

function ChatModule() {
  const [active, setActive] = useS('anton');
  const thread = CHAT_THREADS.find(t => t.id === active);
  return (
    <div style={{display:'flex', height:'100%'}}>
      {/* thread list */}
      <div style={{width:300, borderRight:'1px solid var(--border-subtle)', display:'flex', flexDirection:'column', background:'var(--bg-page)'}}>
        <div style={{padding:'14px 14px 10px', borderBottom:'1px solid var(--border-subtle)'}}>
          <div style={{fontSize:18, fontWeight:500, marginBottom:8}}>Messages</div>
          <input placeholder="Search people & threads" className="mono small" style={{
            width:'100%', padding:'6px 10px', background:'var(--bg-surface)',
            border:'1px solid var(--border-subtle)', color:'var(--text-primary)',
            borderRadius:'var(--r-chip)', fontSize:12, outline:'none',
          }}/>
        </div>
        <div className="mono small caps" style={{color:'var(--text-tertiary)', padding:'10px 14px 4px'}}>PINNED</div>
        {CHAT_THREADS.filter(t=>t.pinned).map(t => <ChatThreadItem key={t.id} t={t} active={active===t.id} onClick={()=>setActive(t.id)}/>)}
        <div className="mono small caps" style={{color:'var(--text-tertiary)', padding:'10px 14px 4px'}}>RECENT</div>
        {CHAT_THREADS.filter(t=>!t.pinned).map(t => <ChatThreadItem key={t.id} t={t} active={active===t.id} onClick={()=>setActive(t.id)}/>)}
      </div>

      {/* conversation */}
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0}}>
        <div style={{padding:'12px 20px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', gap:12}}>
          <div style={{
            width:32, height:32, borderRadius: thread.group?4:16, background:'var(--bg-raised)',
            border:'1px solid var(--border-default)', color:thread.color,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'var(--font-mono)', fontSize:13,
          }}>{thread.avatar}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:15, fontWeight:500}}>{thread.name}</div>
            <div className="mono small" style={{color:'var(--text-tertiary)'}}>{thread.sub}</div>
          </div>
          <button className="mono small" style={{padding:'4px 10px', background:'transparent', border:'1px solid var(--border-default)', color:'var(--text-secondary)', borderRadius:'var(--r-chip)', cursor:'pointer'}}>view log</button>
          <button className="mono small" style={{padding:'4px 10px', background:'transparent', border:'1px solid var(--border-default)', color:'var(--text-secondary)', borderRadius:'var(--r-chip)', cursor:'pointer'}}>memory</button>
        </div>

        <div style={{flex:1, overflow:'auto', padding:'20px 32px', background:'var(--bg-page)'}}>
          {/* date pill */}
          <div style={{textAlign:'center', margin:'0 0 18px'}}>
            <span className="mono small caps" style={{color:'var(--text-tertiary)', padding:'3px 10px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:10}}>FRIDAY · APR 18</span>
          </div>
          {ANTON_MSGS.map((m, i) => <ChatBubble key={i} m={m}/>)}

          {/* typing */}
          <div style={{display:'flex', alignItems:'center', gap:8, marginTop:8, paddingLeft:4}}>
            <span className="mono small" style={{color:'var(--text-tertiary)'}}>anton is thinking</span>
            <span className="pulse" style={{color:'var(--accent)'}}>●</span>
            <span className="mono small" style={{color:'var(--text-tertiary)'}}>standard · qwen3:8b</span>
          </div>
        </div>

        {/* composer */}
        <div style={{padding:'12px 20px', borderTop:'1px solid var(--border-subtle)', background:'var(--bg-page)'}}>
          <div style={{
            display:'flex', alignItems:'flex-end', gap:10, padding:'10px 14px',
            background:'var(--bg-surface)', border:'1px solid var(--border-default)',
            borderRadius:'var(--r-card)',
          }}>
            <span className="mono" style={{color:'var(--accent)', fontSize:14}}>▸</span>
            <textarea placeholder="delegate, ask, or just type…" rows={2} style={{
              flex:1, background:'transparent', border:'none', outline:'none',
              color:'var(--text-primary)', fontSize:14, resize:'none', fontFamily:'var(--font-sans)',
            }}/>
            <div style={{display:'flex', gap:6, alignItems:'center'}}>
              <span className="mono small" style={{color:'var(--text-tertiary)'}}>@local</span>
              <button className="mono small" style={{padding:'4px 8px', background:'transparent', border:'1px solid var(--border-default)', color:'var(--text-secondary)', borderRadius:'var(--r-chip)', cursor:'pointer'}}>🎙</button>
              <button className="mono small" style={{padding:'4px 10px', background:'var(--accent)', color:'var(--bg-page)', border:'none', borderRadius:'var(--r-chip)', cursor:'pointer', fontWeight:500}}>send ⌘⏎</button>
            </div>
          </div>
          <div style={{display:'flex', gap:14, marginTop:8, paddingLeft:4}}>
            <span className="mono small" style={{color:'var(--text-tertiary)'}}>⌘⇧K · delegate to agent</span>
            <span className="mono small" style={{color:'var(--text-tertiary)'}}>@claude · force claude</span>
            <span className="mono small" style={{color:'var(--text-tertiary)'}}>/deep · deep reasoning</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── DEPARTMENT CHART ─────────── */
function DeptChart({ onNav }) {
  const deptAgents = id => AGENTS.filter(a => a.d === id);
  return (
    <div style={{padding:'24px 32px', height:'100%', overflow:'auto'}}>
      <div className="mono caps" style={{color:'var(--text-tertiary)'}}>TEAM / DEPARTMENTS</div>
      <h1 style={{fontSize:26, fontWeight:500, margin:'4px 0 8px'}}>Departments</h1>
      <p style={{color:'var(--text-secondary)', marginTop:0, marginBottom:28, maxWidth:720}}>
        15 agents across 6 departments. Anton sits above — routes work, holds context, enforces trust tiers.
      </p>

      {/* top: Anton node */}
      <div style={{display:'flex', justifyContent:'center', marginBottom:6}}>
        <div style={{
          padding:'14px 24px', background:'var(--bg-surface)', border:'2px solid var(--accent)',
          borderRadius:'var(--r-panel)', textAlign:'center', minWidth:240,
        }}>
          <div className="mono small caps" style={{color:'var(--accent)'}}>CORE · ANTON</div>
          <div style={{fontSize:18, fontWeight:500, marginTop:4}}>◉ Anton</div>
          <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>personal OS · 3d 14h uptime</div>
        </div>
      </div>
      <div style={{display:'flex', justifyContent:'center', marginBottom:20}}>
        <div style={{width:2, height:24, background:'var(--border-strong)'}}/>
      </div>

      {/* dept cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12}}>
        {DEPARTMENTS.map(dept => {
          const agents = deptAgents(dept.id);
          const active = agents.filter(a => a.s === 'working').length;
          return (
            <div key={dept.id} style={{
              background:'var(--bg-surface)', border:'1px solid var(--border-subtle)',
              borderTop:`3px solid ${dept.color}`, borderRadius:'var(--r-card)',
              padding:'16px 18px', display:'flex', flexDirection:'column', gap:10,
            }}>
              <div style={{display:'flex', alignItems:'baseline', gap:8}}>
                <span style={{fontSize:16, fontWeight:500}}>{dept.name}</span>
                <span style={{flex:1}}/>
                <span className="mono small" style={{color:'var(--text-tertiary)'}}>{agents.length}</span>
              </div>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <span className="mono small caps" style={{color:'var(--text-tertiary)', fontSize:10}}>
                  {active > 0 ? <span style={{color:'var(--work)'}}>● {active} active</span> : <span>○ idle</span>}
                </span>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:4, marginTop:4}}>
                {agents.map(a => (
                  <div key={a.n}
                    onClick={()=>onNav && onNav('agent', { agent: a.n })}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
                    onMouseLeave={e=>e.currentTarget.style.background='var(--bg-page)'}
                    style={{
                    display:'flex', alignItems:'center', gap:8, padding:'6px 8px', cursor:'pointer',
                    background:'var(--bg-page)', border:'1px solid var(--border-subtle)', borderRadius:4,
                  }}>
                    <StatusGlow s={a.s}/>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize:13, fontWeight:500}}>{a.n}</div>
                      <div className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{a.r}</div>
                    </div>
                    <TrustBadge tier={a.t}/>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* handoff map legend */}
      <div style={{marginTop:32}}>
        <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:8}}>TOP HAND-OFF ROUTES · LAST 7 DAYS</div>
        <div style={{display:'flex', flexDirection:'column', gap:6, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)', padding:14}}>
          {[
            ['Marcus', 'Ada', 34, 'UI review'],
            ['Sarah', 'Kai', 22, 'SEO pass'],
            ['James', 'Ben', 18, 'QA gate'],
            ['Alex', 'Marcus', 14, 'PRD → engineering'],
            ['Priya', 'Alex', 9, 'data → product'],
          ].map(([from,to,n,why], i) => {
            const pct = (n/34)*100;
            return (
              <div key={i} style={{display:'flex', alignItems:'center', gap:10}}>
                <span className="mono small" style={{width:80, color:'var(--text-primary)'}}>{from}</span>
                <span className="mono" style={{color:'var(--text-tertiary)'}}>→</span>
                <span className="mono small" style={{width:80, color:'var(--text-primary)'}}>{to}</span>
                <div style={{flex:1, height:4, background:'var(--bg-page)', borderRadius:2, position:'relative'}}>
                  <div style={{position:'absolute', left:0, top:0, height:'100%', width:`${pct}%`, background:'var(--accent)', borderRadius:2}}/>
                </div>
                <span className="mono small" style={{color:'var(--text-secondary)', width:28, textAlign:'right'}}>{n}</span>
                <span className="mono small" style={{color:'var(--text-tertiary)', width:120}}>{why}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────── APPROVAL DETAIL — compare & select options ─────────── */
const OPTIONS = [
  {
    id:'A', label:'Gentle onboarding (recommended)',
    pitch:'Prompt user on step 3. Local-model fallback. Default for waitlist graduates.',
    stats:[
      ['Time-to-first-value', '45s', 'var(--ok)'],
      ['Abandonment', 'low', 'var(--ok)'],
      ['Support load', '+5%', 'var(--work)'],
      ['Dev effort', '2 days', 'var(--text-secondary)'],
    ],
    tradeoffs:['Best for new users','Some friction at step 3','Cheapest to build'],
    author:'Marcus',
    preview:[
      {t:'step 1', d:'welcome · who this is for'},
      {t:'step 2', d:'connect Slack (required)'},
      {t:'step 3', d:'create workspace · prompt user'},
      {t:'step 4', d:'meet the team · 3 agents pinned'},
      {t:'step 5', d:'first delegation · guided'},
    ],
  },
  {
    id:'B', label:'Zero-click onboarding',
    pitch:'Auto-creates workspace. Claude-forced first classification. Fastest to value.',
    stats:[
      ['Time-to-first-value', '18s', 'var(--ok)'],
      ['Abandonment', 'lowest', 'var(--ok)'],
      ['Support load', '+18%', 'var(--error)'],
      ['Dev effort', '4 days', 'var(--text-secondary)'],
    ],
    tradeoffs:['Fastest wow moment','Heavy Claude spend','Harder to debug support issues'],
    author:'Marcus',
    preview:[
      {t:'step 1', d:'welcome'},
      {t:'step 2', d:'connect Slack'},
      {t:'step 3', d:'workspace auto-created'},
      {t:'step 4', d:'agents pre-pinned by heuristic'},
      {t:'step 5', d:'first delegation · unguided'},
    ],
  },
  {
    id:'C', label:'Terminal-first onboarding',
    pitch:'Shell-native users only. Five commands, no UI. Power-user path.',
    stats:[
      ['Time-to-first-value', '12s', 'var(--ok)'],
      ['Abandonment', 'high for novices', 'var(--error)'],
      ['Support load', 'none', 'var(--ok)'],
      ['Dev effort', '1 day', 'var(--ok)'],
    ],
    tradeoffs:['Zero-friction for shell users','Alienates non-technical','Lowest effort'],
    author:'Marcus',
    preview:[
      {t:'cmd 1', d:'anton init'},
      {t:'cmd 2', d:'anton connect slack'},
      {t:'cmd 3', d:'anton workspace new'},
      {t:'cmd 4', d:'anton pin @marcus @sarah'},
      {t:'cmd 5', d:'anton "draft a PRD for X"'},
    ],
  },
];

function ApprovalDetail() {
  const [selected, setSelected] = useS('A');

  const OptionCard = ({ o, isSelected, onSelect }) => (
    <div onClick={onSelect} style={{
      padding:'18px 20px', background:'var(--bg-surface)',
      border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}`,
      borderRadius:'var(--r-panel)', cursor:'pointer',
      position:'relative', transition:'all 120ms',
      boxShadow: isSelected ? '0 6px 18px rgba(0,0,0,0.25)' : 'none',
    }}>
      <div style={{display:'flex', alignItems:'flex-start', gap:12, marginBottom:12}}>
        <div style={{
          width:24, height:24, borderRadius:12,
          border:`2px solid ${isSelected?'var(--accent)':'var(--border-strong)'}`,
          background: isSelected ? 'var(--accent)' : 'transparent',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'var(--bg-page)', fontSize:12, fontFamily:'var(--font-mono)', flexShrink:0,
        }}>{isSelected ? '✓' : ''}</div>
        <div style={{flex:1}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', fontSize:10}}>OPTION {o.id}</div>
          <div style={{fontSize:16, fontWeight:500, marginTop:2, lineHeight:1.3}}>{o.label}</div>
        </div>
      </div>
      <p style={{margin:'0 0 14px', fontSize:13, color:'var(--text-secondary)', lineHeight:1.55}}>{o.pitch}</p>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:4, marginBottom:14}}>
        {o.stats.map(([l,v,c], i) => (
          <div key={i} style={{padding:'6px 8px', background:'var(--bg-page)', borderRadius:4}}>
            <div className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{l}</div>
            <div className="mono small" style={{color:c, fontSize:12, marginTop:1}}>{v}</div>
          </div>
        ))}
      </div>

      {/* preview strip */}
      <div style={{
        padding:10, background:'var(--bg-page)', border:'1px solid var(--border-subtle)',
        borderRadius:4, marginBottom:14,
      }}>
        <div className="mono small caps" style={{color:'var(--text-tertiary)', fontSize:10, marginBottom:6}}>FLOW PREVIEW</div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {o.preview.map((s, i) => (
            <div key={i} style={{
              flex:'1 1 0', minWidth:0, padding:'6px 8px',
              background: isSelected ? 'var(--accent-soft)' : 'var(--bg-surface)',
              border:`1px solid ${isSelected ? 'var(--accent)' : 'var(--border-subtle)'}`,
              borderRadius:4,
            }}>
              <div className="mono small" style={{color: isSelected ? 'var(--accent)':'var(--text-tertiary)', fontSize:9}}>{s.t}</div>
              <div className="mono small" style={{fontSize:10, color:'var(--text-secondary)', marginTop:2, lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      <ul style={{margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:4}}>
        {o.tradeoffs.map((x, i) => (
          <li key={i} className="mono small" style={{color:'var(--text-secondary)', fontSize:11, display:'flex', gap:6}}>
            <span style={{color:'var(--text-tertiary)'}}>—</span>{x}
          </li>
        ))}
      </ul>
    </div>
  );

  const chosen = OPTIONS.find(o => o.id === selected);

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      {/* header */}
      <div style={{padding:'16px 32px 14px', borderBottom:'1px solid var(--border-subtle)'}}>
        <div style={{display:'flex', alignItems:'baseline', gap:10, marginBottom:4}}>
          <div className="mono caps" style={{color:'var(--text-tertiary)'}}>APPROVALS / ONBOARDING V3</div>
          <span className="mono small" style={{color:'var(--work)'}}>● PENDING · MED RISK</span>
        </div>
        <div style={{display:'flex', alignItems:'baseline', gap:12}}>
          <h1 style={{fontSize:22, fontWeight:500, margin:'4px 0 0', letterSpacing:'-0.01em'}}>
            Pick an onboarding approach.
          </h1>
          <span className="mono small" style={{color:'var(--text-tertiary)'}}>requested by Marcus · 13:58 · ref PRD §4.1</span>
        </div>
      </div>

      {/* body: 3 options + rail */}
      <div style={{flex:1, display:'flex', minHeight:0}}>
        <div style={{flex:1, overflow:'auto', padding:'20px 32px'}}>
          <p style={{margin:'0 0 20px', color:'var(--text-secondary)', fontSize:13, maxWidth:760, lineHeight:1.55}}>
            Marcus drafted three approaches to the onboarding v3 flow. Pick one to unblock engineering — or request an edit and he'll revise.
          </p>

          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14}}>
            {OPTIONS.map(o => (
              <OptionCard key={o.id} o={o} isSelected={selected===o.id} onSelect={()=>setSelected(o.id)}/>
            ))}
          </div>

          {/* context: why now, affected agents, linked memory */}
          <div style={{marginTop:22, padding:'14px 18px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)'}}>
            <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:10}}>CONTEXT</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20}}>
              <div>
                <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:4}}>why now</div>
                <div style={{fontSize:13, lineHeight:1.5}}>Launch is locked for May 2. Engineering needs a decision today to hit timeline.</div>
              </div>
              <div>
                <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:4}}>affected agents</div>
                <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                  {['Marcus','Ada','Felix','Ben','Alex'].map(n => (
                    <span key={n} className="mono small" style={{padding:'2px 8px', background:'var(--bg-page)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-chip)', fontSize:11}}>{n}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:4}}>linked memory</div>
                <div className="mono small" style={{fontSize:11, color:'var(--text-secondary)', lineHeight:1.6}}>
                  <div>◆ Noel prefers fewer forced steps · Mar 3</div>
                  <div>◆ Claude fallback budget &lt; 20% · Feb 19</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* right rail: decision panel */}
        <div style={{width:340, borderLeft:'1px solid var(--border-subtle)', padding:'20px 20px', display:'flex', flexDirection:'column', background:'var(--bg-page)'}}>
          <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:8}}>YOUR SELECTION</div>

          {/* selection summary */}
          <div style={{
            padding:'14px 16px', background:'var(--accent-soft)',
            border:'1px solid var(--accent)', borderRadius:'var(--r-card)', marginBottom:16,
          }}>
            <div className="mono small caps" style={{color:'var(--accent)', fontSize:10}}>OPTION {chosen.id} · SELECTED</div>
            <div style={{fontSize:15, fontWeight:500, marginTop:4, lineHeight:1.3}}>{chosen.label}</div>
            <div style={{fontSize:12, color:'var(--text-secondary)', marginTop:8, lineHeight:1.5}}>{chosen.pitch}</div>
          </div>

          {/* comparison bars */}
          <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:8, fontSize:11}}>COMPARED TO ALTERNATIVES</div>
          <div style={{marginBottom:18, display:'flex', flexDirection:'column', gap:6}}>
            {chosen.stats.map(([l,v,c], i) => (
              <div key={i} style={{display:'flex', alignItems:'center', gap:8}}>
                <span className="mono small" style={{width:110, color:'var(--text-tertiary)', fontSize:11}}>{l}</span>
                <span className="mono small" style={{flex:1, color:c, fontSize:11}}>{v}</span>
              </div>
            ))}
          </div>

          {/* what anton will do */}
          <div className="mono caps" style={{color:'var(--text-tertiary)', marginBottom:8, fontSize:11}}>ON APPROVE, ANTON WILL</div>
          <ol style={{margin:'0 0 18px', paddingLeft:18, color:'var(--text-secondary)', fontSize:12, lineHeight:1.7}}>
            <li>Lock the decision to memory · decisions table</li>
            <li>Assign tickets to Marcus, Ada, Felix (Jira)</li>
            <li>Ping #engineering with rationale</li>
            <li>Schedule follow-up briefing Mon 08:00</li>
          </ol>

          <div style={{flex:1}}/>

          {/* actions */}
          <div style={{display:'flex', flexDirection:'column', gap:6}}>
            <button style={{
              padding:'10px 14px', background:'var(--accent)', color:'var(--bg-page)',
              border:'none', borderRadius:'var(--r-chip)', cursor:'pointer', fontWeight:500, fontSize:13,
            }}>Approve option {chosen.id} · ⌘⏎</button>
            <button style={{
              padding:'10px 14px', background:'transparent', color:'var(--text-secondary)',
              border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer', fontSize:13,
            }}>Request an edit…</button>
            <button style={{
              padding:'8px 14px', background:'transparent', color:'var(--text-tertiary)',
              border:'none', cursor:'pointer', fontSize:12,
            }}>Ask Marcus to propose a 4th option</button>
          </div>

          {/* keyboard hints */}
          <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:14, fontSize:10, display:'flex', gap:12, justifyContent:'center'}}>
            <span>A B C · pick</span>
            <span>⌘⏎ · approve</span>
            <span>R · request edit</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ChatModule, DeptChart, ApprovalDetail, CHAT_THREADS, OPTIONS });
