// Mission Control — unified screen with view switcher (list / dept / grid / orbit / terminal)
const { useState: useS_MC } = React;

/* ─────────── KPI STRIP ─────────── */
function MCKpiStrip() {
  const kpis = [
    { label:'Active',     val:'7',  sub:'of 15',   c:'var(--work)' },
    { label:'Queue',      val:'14', sub:'tasks',   c:'var(--text-primary)' },
    { label:'Approvals',  val:'5',  sub:'pending', c:'var(--work)' },
    { label:'Handoffs',   val:'23', sub:'today',   c:'var(--text-primary)' },
    { label:'Errors',     val:'1',  sub:'Riley',   c:'var(--error)' },
    { label:'Tokens',     val:'142k', sub:'/day',  c:'var(--text-secondary)' },
    { label:'Local',      val:'89%',sub:'routing', c:'var(--ok)' },
    { label:'Next brief', val:'27m',sub:'18:00',   c:'var(--text-secondary)' },
  ];
  return (
    <div style={{
      display:'grid', gridTemplateColumns:`repeat(${kpis.length}, 1fr)`,
      borderBottom:'1px solid var(--border-subtle)',
    }}>
      {kpis.map((k, i) => (
        <div key={k.label} style={{
          padding:'12px 16px',
          borderRight: i < kpis.length - 1 ? '1px solid var(--border-subtle)' : 'none',
        }}>
          <div className="mono caps small" style={{color:'var(--text-tertiary)', fontSize:10, marginBottom:4}}>{k.label}</div>
          <div style={{display:'flex', alignItems:'baseline', gap:6}}>
            <span style={{fontSize:20, color:k.c, fontFamily:'var(--font-mono)'}}>{k.val}</span>
            <span className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{k.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────── VIEW SWITCHER + FILTERS ─────────── */
function MCToolbar({ view, setView, filter, setFilter, dept, setDept }) {
  const views = [
    { id:'list', label:'List',    glyph:'☰' },
    { id:'dept', label:'Dept',    glyph:'⚏' },
    { id:'grid', label:'Grid',    glyph:'▦' },
    { id:'orbit',label:'Orbit',   glyph:'◎' },
    { id:'term', label:'Terminal',glyph:'▸' },
  ];
  const filters = [
    { id:'all',      label:'All',      count:15 },
    { id:'working',  label:'Active',   count:AGENTS.filter(a=>a.s==='working').length },
    { id:'error',    label:'Blocked',  count:AGENTS.filter(a=>a.s==='error').length },
    { id:'idle',     label:'Idle',     count:AGENTS.filter(a=>a.s==='idle').length },
    { id:'queued',   label:'Queued',   count:AGENTS.filter(a=>a.q>0).length },
  ];
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:14, padding:'10px 20px',
      borderBottom:'1px solid var(--border-subtle)',
    }}>
      {/* View switcher */}
      <div style={{display:'flex', background:'var(--bg-surface)', borderRadius:6, padding:2, border:'1px solid var(--border-default)'}}>
        {views.map(v => (
          <button key={v.id} onClick={()=>setView(v.id)} className="mono small" style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'5px 10px',
            background: view===v.id ? 'var(--accent-soft)' : 'transparent',
            color: view===v.id ? 'var(--accent)' : 'var(--text-secondary)',
            border:'none', borderRadius:4, cursor:'pointer', fontSize:11,
          }}>
            <span style={{fontSize:13, lineHeight:1}}>{v.glyph}</span>
            {v.label}
          </button>
        ))}
      </div>

      <div style={{width:1, height:20, background:'var(--border-subtle)'}}/>

      {/* Status filters */}
      <div style={{display:'flex', gap:4}}>
        {filters.map(f => (
          <button key={f.id} onClick={()=>setFilter(f.id)} className="mono small" style={{
            padding:'5px 10px',
            background: filter===f.id ? 'var(--bg-hover)' : 'transparent',
            color: filter===f.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            border:`1px solid ${filter===f.id?'var(--border-strong)':'var(--border-default)'}`,
            borderRadius:'var(--r-chip)', cursor:'pointer', fontSize:11,
            display:'flex', alignItems:'center', gap:6,
          }}>
            {f.label}
            <span style={{color:'var(--text-tertiary)', fontSize:10}}>{f.count}</span>
          </button>
        ))}
      </div>

      <div style={{width:1, height:20, background:'var(--border-subtle)'}}/>

      {/* Dept picker */}
      <select value={dept} onChange={e=>setDept(e.target.value)} className="mono small" style={{
        background:'var(--bg-surface)', color:'var(--text-secondary)',
        border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)',
        padding:'5px 10px', fontSize:11, cursor:'pointer',
      }}>
        <option value="all">all teams</option>
        {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name.toLowerCase()}</option>)}
      </select>

      <span style={{flex:1}}/>

      {/* Sort + live indicator */}
      <span className="mono small" style={{color:'var(--text-tertiary)', fontSize:11, display:'flex', alignItems:'center', gap:6}}>
        <span className="pulse" style={{width:5, height:5, borderRadius:'50%', background:'var(--ok)', display:'inline-block'}}/>
        live · sorted by activity
      </span>
    </div>
  );
}

/* ─────────── LIST (activity-bar) ─────────── */
function MC_List({ agents, onOpen }) {
  const Row = ({ a, i }) => {
    const barW = a.s==='working' ? (40+(i*13)%50) : a.s==='complete' ? 72 : a.s==='error' ? 18 : (8+(i*7)%12);
    const task = a.s==='working' ? `running: ${['draft_prd','read_file','run_sql','search','plan'][i%5]}`
               : a.s==='complete' ? `last: committed ${1+i%4} change${i%4?'s':''}`
               : a.s==='error'    ? `blocked: mcp.tool timeout`
               : `clear`;
    return (
      <div onClick={()=>onOpen(a)} style={{
        display:'grid', gridTemplateColumns:'28px 140px 170px 1fr 170px 80px 70px',
        alignItems:'center', gap:16, padding:'10px 20px',
        borderBottom:'1px solid var(--border-subtle)', cursor:'pointer',
      }}
        onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
        onMouseLeave={e=>e.currentTarget.style.background=''}>
        <StatusGlow s={a.s}/>
        <div>
          <div style={{fontSize:14, color:'var(--text-primary)'}}>{a.n}</div>
          <div className="mono small" style={{color:'var(--text-tertiary)'}}>{a.r}</div>
        </div>
        <DeptChip id={a.d}/>
        <div className="mono small" style={{color:'var(--text-secondary)'}}>{task}</div>
        <div style={{position:'relative', height:8, background:'var(--border-subtle)', borderRadius:2, overflow:'hidden'}}>
          <div style={{
            position:'absolute', top:0, left:0, bottom:0, width:`${barW}%`,
            background: a.s==='error'?'var(--error)':a.s==='complete'?'var(--ok)':a.s==='working'?'var(--accent)':'var(--text-disabled)',
            opacity: a.s==='idle'?.4:1,
          }}/>
        </div>
        <TrustBadge tier={a.t}/>
        <div className="mono small" style={{color:'var(--text-tertiary)', textAlign:'right'}}>
          {a.q ? <span style={{color:'var(--work)'}}>{a.q} queued</span> : `${a.last} ago`}
        </div>
      </div>
    );
  };
  return (
    <div style={{flex:1, overflow:'auto'}}>
      <div style={{
        display:'grid', gridTemplateColumns:'28px 140px 170px 1fr 170px 80px 70px',
        gap:16, padding:'10px 20px', borderBottom:'1px solid var(--border-default)',
      }} className="mono caps">
        <span/>
        <span style={{color:'var(--text-tertiary)', fontSize:10}}>agent</span>
        <span style={{color:'var(--text-tertiary)', fontSize:10}}>team</span>
        <span style={{color:'var(--text-tertiary)', fontSize:10}}>now</span>
        <span style={{color:'var(--text-tertiary)', fontSize:10}}>load</span>
        <span style={{color:'var(--text-tertiary)', fontSize:10}}>trust</span>
        <span style={{color:'var(--text-tertiary)', fontSize:10, textAlign:'right'}}>seen</span>
      </div>
      {agents.map((a,i) => <Row key={a.n} a={a} i={i}/>)}
    </div>
  );
}

/* ─────────── DEPT rails ─────────── */
function MC_Dept({ agents, onOpen }) {
  const byDept = DEPARTMENTS.map(d => ({ d, list: agents.filter(a => a.d === d.id) })).filter(x => x.list.length);
  return (
    <div style={{flex:1, overflow:'auto'}}>
      {byDept.map(({d, list}) => (
        <div key={d.id} style={{borderBottom:'1px solid var(--border-subtle)', padding:'16px 20px'}}>
          <div style={{display:'flex', alignItems:'baseline', gap:10, marginBottom:12}}>
            <span style={{width:8, height:8, borderRadius:2, background:d.color}}/>
            <span className="mono caps" style={{color:'var(--text-primary)', fontSize:11}}>{d.name}</span>
            <span style={{height:1, background:'var(--border-subtle)', flex:1}}/>
            <span className="mono small" style={{color:'var(--text-tertiary)'}}>
              {list.length} agents · {list.filter(x=>x.s==='working').length} active · {list.reduce((s,a)=>s+(a.q||0),0)} queued
            </span>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(230px, 1fr))', gap:10}}>
            {list.map(a => (
              <div key={a.n} onClick={()=>onOpen(a)} style={{
                padding:'12px 14px', background:'var(--bg-surface)',
                border:'1px solid var(--border-default)', borderRadius:'var(--r-card)',
                borderLeft:`2px solid ${d.color}`, cursor:'pointer',
              }}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--bg-hover)';}}
                onMouseLeave={e=>{e.currentTarget.style.background='var(--bg-surface)';}}>
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6}}>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <StatusGlow s={a.s}/>
                    <span style={{fontSize:14}}>{a.n}</span>
                  </div>
                  <TrustBadge tier={a.t}/>
                </div>
                <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:8}}>{a.r}</div>
                <div className="mono small" style={{color:'var(--text-secondary)'}}>
                  {a.s==='working' ? '● running' : a.s==='complete' ? '✓ done' : a.s==='error' ? '✕ blocked' : '○ idle'}
                  {a.q ? ` · ${a.q} queued` : ` · ${a.last} ago`}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────── GRID dense ─────────── */
function MC_Grid({ agents, onOpen }) {
  const pad = Math.max(0, 30 - agents.length);
  return (
    <div style={{flex:1, padding:20, overflow:'auto'}}>
      <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10}}>
        {agents.map((a,i) => {
          const d = DEPARTMENTS.find(x=>x.id===a.d);
          return (
            <div key={a.n} onClick={()=>onOpen(a)} style={{
              padding:14, background:'var(--bg-surface)',
              border:'1px solid var(--border-default)', borderRadius:'var(--r-card)',
              minHeight:110, position:'relative', cursor:'pointer',
            }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--border-strong)'; e.currentTarget.style.background='var(--bg-hover)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-default)'; e.currentTarget.style.background='var(--bg-surface)';}}>
              <div style={{position:'absolute', top:12, right:12}}><StatusGlow s={a.s}/></div>
              <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:3}}>
                <span style={{width:4, height:4, borderRadius:1, background:d.color}}/>
                <span className="mono small" style={{color:'var(--text-tertiary)', textTransform:'uppercase', letterSpacing:'0.1em', fontSize:10}}>{d.name}</span>
              </div>
              <div style={{fontSize:15, marginBottom:2}}>{a.n}</div>
              <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:12, fontSize:11}}>{a.r}</div>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <TrustBadge tier={a.t}/>
                <span className="mono small" style={{color: a.q?'var(--work)':'var(--text-tertiary)', fontSize:11}}>
                  {a.q ? `${a.q} queued` : a.last}
                </span>
              </div>
            </div>
          );
        })}
        {Array(pad).fill(0).map((_,i) => (
          <div key={'g'+i} style={{
            padding:14, border:'1px dashed var(--border-default)',
            borderRadius:'var(--r-card)', minHeight:110, display:'flex',
            alignItems:'center', justifyContent:'center',
            color:'var(--text-disabled)', fontSize:12,
          }} className="mono">+ delegate</div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── ORBIT ─────────── */
function MC_Orbit({ agents }) {
  const cx = 360, cy = 280;
  const rings = [
    { r:70,  items: agents.filter(a=>a.s==='working').slice(0,5) },
    { r:140, items: agents.filter(a=>a.s==='working'||a.s==='complete').slice(5) },
    { r:210, items: agents.filter(a=>a.s==='idle'||a.s==='error') },
  ];
  return (
    <div style={{flex:1, position:'relative', overflow:'hidden'}}>
      <svg viewBox={`0 0 ${cx*2} ${cy*2}`} style={{position:'absolute', inset:0, width:'100%', height:'100%'}}>
        {rings.map((ring, ri) => (
          <circle key={ri} cx={cx} cy={cy} r={ring.r} fill="none" stroke="var(--border-subtle)" strokeWidth="1"/>
        ))}
        {rings[0].items.map((a,i) => {
          const ang = (i/rings[0].items.length)*Math.PI*2 - Math.PI/2;
          const x = cx + Math.cos(ang)*rings[0].r;
          const y = cy + Math.sin(ang)*rings[0].r;
          return <line key={a.n} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--accent)" strokeWidth="0.5" opacity="0.5"/>;
        })}
      </svg>
      <div style={{
        position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)',
        width:80, height:80, borderRadius:'50%', background:'var(--bg-surface)',
        border:'1px solid var(--accent)', display:'flex', alignItems:'center', justifyContent:'center',
        flexDirection:'column', zIndex:2,
      }}>
        <div className="mono" style={{fontSize:14, color:'var(--accent)', letterSpacing:'0.1em'}}>ANTON</div>
        <div className="mono small" style={{fontSize:10, color:'var(--text-tertiary)'}}>qwen3·8b</div>
      </div>
      {rings.map((ring, ri) =>
        ring.items.map((a, i) => {
          const ang = (i/ring.items.length)*Math.PI*2 - Math.PI/2 + ri*0.2;
          const x = 50 + (Math.cos(ang)*ring.r)/(cx*2)*100;
          const y = 50 + (Math.sin(ang)*ring.r)/(cy*2)*100;
          return (
            <div key={a.n} style={{
              position:'absolute', left:`${x}%`, top:`${y}%`, transform:'translate(-50%,-50%)',
              padding:'6px 10px', background:'var(--bg-surface)',
              border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)',
              fontSize:12, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6, zIndex:2,
            }}>
              <StatusGlow s={a.s}/>{a.n}
            </div>
          );
        })
      )}
    </div>
  );
}

/* ─────────── TERMINAL ─────────── */
function MC_Term({ agents }) {
  return (
    <div style={{flex:1, overflow:'auto', padding:'16px 20px', fontFamily:'var(--font-mono)', fontSize:13, lineHeight:1.7}}>
      <div style={{color:'var(--text-tertiary)'}}># anton status · 2026-04-18 14:02:17 · up 3d 14h</div>
      <div style={{color:'var(--text-tertiary)', marginBottom:8}}># {agents.length} agents matching filter · ctrl-c to exit</div>
      {agents.map(a => {
        const d = DEPARTMENTS.find(x=>x.id===a.d);
        const stChar = { working:'●', complete:'✓', error:'✕', idle:'○' }[a.s];
        const stCol  = { working:'var(--work)', complete:'var(--ok)', error:'var(--error)', idle:'var(--text-tertiary)' }[a.s];
        return (
          <div key={a.n} style={{display:'flex', gap:12, alignItems:'baseline'}}>
            <span style={{color:stCol, width:14}}>{stChar}</span>
            <span style={{color:'var(--text-primary)', width:80}}>{a.n.padEnd(8,' ')}</span>
            <span style={{color:d.color, width:70}}>[{d.id}]</span>
            <span style={{color: a.t==='green'?'var(--ok)':a.t==='amber'?'var(--work)':'var(--error)', width:90}}>{`trust:${a.t}`}</span>
            <span style={{color:'var(--text-secondary)', flex:1}}>{a.r.toLowerCase()}</span>
            <span style={{color: a.q?'var(--work)':'var(--text-tertiary)'}}>{a.q ? `q:${a.q}` : `idle ${a.last}`}</span>
          </div>
        );
      })}
      <div style={{marginTop:16, color:'var(--accent)'}}>▊</div>
    </div>
  );
}

/* ─────────── MAIN Mission Control (combined w/ switcher) ─────────── */
function MissionControl({ onNav, defaultView = 'list' }) {
  const [view, setView]     = useS_MC(defaultView);
  const [filter, setFilter] = useS_MC('all');
  const [dept, setDept]     = useS_MC('all');

  const agents = AGENTS.filter(a =>
    (filter==='all' || filter==='queued' ? (filter==='queued' ? a.q>0 : true) : a.s===filter)
    && (dept==='all' || a.d===dept)
  );

  const openAgent = a => onNav && onNav('agent', { agent: a.n });

  const body =
    view==='list'  ? <MC_List  agents={agents} onOpen={openAgent}/> :
    view==='dept'  ? <MC_Dept  agents={agents} onOpen={openAgent}/> :
    view==='grid'  ? <MC_Grid  agents={agents} onOpen={openAgent}/> :
    view==='orbit' ? <MC_Orbit agents={agents}/> :
                     <MC_Term  agents={agents}/>;

  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <MCKpiStrip/>
      <MCToolbar view={view} setView={setView} filter={filter} setFilter={setFilter} dept={dept} setDept={setDept}/>
      {body}
    </div>
  );
}

Object.assign(window, { MissionControl, MCKpiStrip, MCToolbar });
