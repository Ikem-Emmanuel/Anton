/* ─────────── TIER 2 MODULES
   Documents · Research · People · Expenses · Travel · Usage
   Voice stays consistent: Anton did X, Anton proposes Y, Noel reviews.
   ─────────── */
const { useState: _t2useS } = React;

/* ═════════ DOCUMENTS ═════════
   File browser + doc preview. Anton tags every doc with a status:
   who wrote it, what it's about, what needs Noel's eyes. */
function DocumentsModule({ onNav }) {
  const DOCS = [
    { id:0, name:'Onboarding v3 — PRD',          author:'Marcus',  kind:'md',   edited:'2m',   size:'4.1KB', tag:'needs review', color:'var(--work)',  folder:'product' },
    { id:1, name:'Creator-tier pricing analysis', author:'Alex',    kind:'md',   edited:'14m',  size:'8.7KB', tag:'draft',        color:'var(--text-tertiary)', folder:'product' },
    { id:2, name:'Launch email · v3',              author:'Sarah',   kind:'md',   edited:'22m',  size:'1.2KB', tag:'needs review', color:'var(--work)',  folder:'marketing' },
    { id:3, name:'Q1 launch retro',                 author:'Noel',    kind:'md',   edited:'1h',   size:'2.8KB', tag:'personal',     color:'var(--info)',  folder:'personal' },
    { id:4, name:'Board deck · April',              author:'Anton',   kind:'pdf',  edited:'3h',   size:'1.8MB', tag:'assembled',    color:'var(--accent)',folder:'board' },
    { id:5, name:'Retention cohort · week 16',     author:'Priya',   kind:'sheet',edited:'5h',   size:'42KB',  tag:'fresh',        color:'var(--ok)',    folder:'data' },
    { id:6, name:'Engineering weekly',              author:'Marcus',  kind:'md',   edited:'1d',   size:'3.4KB', tag:'archived',     color:'var(--text-tertiary)', folder:'eng' },
    { id:7, name:'Series A deck',                   author:'Noel',    kind:'pdf',  edited:'2d',   size:'2.1MB', tag:'shared',       color:'var(--info)',  folder:'fundraise' },
    { id:8, name:'Brand voice guide',               author:'Sarah',   kind:'md',   edited:'1w',   size:'5.9KB', tag:'canon',        color:'var(--accent)',folder:'marketing' },
  ];
  const FOLDERS = ['all','product','marketing','board','data','eng','fundraise','personal'];
  const [folder, setFolder] = useState('all');
  const [selId, setSelId] = useState(0);
  const sel = DOCS.find(d=>d.id===selId) || DOCS[0];
  const filtered = DOCS.filter(d => folder==='all' || d.folder===folder);

  return (
    <div style={{display:'flex', flex:1, minHeight:0}}>
      <div style={{width:180, borderRight:'1px solid var(--border-subtle)', padding:'12px 8px', overflowY:'auto'}}>
        <div className="mono small caps" style={{color:'var(--text-tertiary)', padding:'0 10px 8px', fontSize:9}}>FOLDERS</div>
        {FOLDERS.map(f => (
          <button key={f} onClick={()=>setFolder(f)} style={{
            display:'block', width:'100%', textAlign:'left', padding:'5px 10px',
            background: folder===f ? 'var(--bg-hover)' : 'transparent',
            color: folder===f ? 'var(--text-primary)' : 'var(--text-secondary)',
            border:'none', borderRadius:6, cursor:'pointer', fontSize:12, marginBottom:1,
          }}>{f}</button>
        ))}
        <div style={{marginTop:24, padding:'0 10px'}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:8, fontSize:9}}>ANTON KNOWS</div>
          <div className="mono small" style={{color:'var(--text-secondary)', lineHeight:1.6, fontSize:10}}>
            <div>9 docs indexed</div>
            <div>4 authored by agents</div>
            <div>2 need your review</div>
          </div>
        </div>
      </div>

      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0}}>
        <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center'}}>
          <div>
            <div style={{fontSize:20, color:'var(--text-primary)', fontWeight:500}}>Documents</div>
            <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>{filtered.length} in {folder}</div>
          </div>
          <div style={{flex:1}}/>
          <button className="mono small" style={{padding:'5px 12px', fontSize:11, background:'var(--accent)', color:'var(--bg-page)', border:'none', borderRadius:'var(--r-chip)', cursor:'pointer'}}>+ new doc</button>
        </div>
        <div style={{flex:1, display:'flex', minHeight:0}}>
          <div style={{width:360, borderRight:'1px solid var(--border-subtle)', overflowY:'auto'}}>
            {filtered.map(d => (
              <div key={d.id} onClick={()=>setSelId(d.id)} style={{
                padding:'10px 14px', cursor:'pointer',
                borderBottom:'1px solid var(--border-subtle)',
                background: selId===d.id ? 'var(--bg-hover)' : 'transparent',
                borderLeft: `2px solid ${selId===d.id ? 'var(--accent)' : 'transparent'}`,
              }}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:3}}>
                  <span className="mono small" style={{fontSize:9, color:'var(--text-tertiary)', width:28}}>{d.kind}</span>
                  <div style={{flex:1, fontSize:12, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.name}</div>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:8, fontSize:10, color:'var(--text-tertiary)'}}>
                  <span>{d.author==='Anton' ? '◎ ' : ''}{d.author}</span>
                  <span>·</span>
                  <span>{d.edited}</span>
                  <span style={{flex:1}}/>
                  <span className="mono small" style={{fontSize:9, color:d.color}}>{d.tag}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{flex:1, overflow:'auto', padding:'24px 32px'}}>
            <div style={{fontSize:22, color:'var(--text-primary)', marginBottom:8, fontWeight:500}}>{sel.name}</div>
            <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:20, display:'flex', gap:10}}>
              <span>by {sel.author}</span><span>·</span><span>{sel.edited} ago</span><span>·</span><span>{sel.size}</span><span>·</span><span style={{color:sel.color}}>{sel.tag}</span>
            </div>
            <div style={{padding:'12px 14px', background:'var(--accent-soft)', border:'1px solid var(--accent)', borderRadius:'var(--r-card)', marginBottom:20}}>
              <div className="mono small caps" style={{color:'var(--accent)', marginBottom:6, fontSize:9}}>◎ ANTON SUMMARY</div>
              <div style={{fontSize:12, color:'var(--text-primary)', lineHeight:1.6}}>
                {sel.id===0 && 'Marcus drafted a 6-section PRD. §3 auth flow and §5 error states have open questions flagged for you. No external commitments.'}
                {sel.id===1 && 'Alex proposes three tiers ($9 / $19 / $49) with analysis of comp set. Uses data from Priya\'s cohort pull.'}
                {sel.id===2 && 'Sarah\'s final v3 copy. Kai signed off on SEO tone. Ready to send to 2,340 subs once you approve.'}
                {sel.id>=3 && 'Summary generated from document content. Key points surfaced above. Full text follows.'}
              </div>
            </div>
            <div style={{fontSize:13, color:'var(--text-secondary)', lineHeight:1.8, fontFamily:'var(--font-sans)'}}>
              <div style={{color:'var(--text-primary)', fontSize:15, fontWeight:500, marginBottom:8}}>§1 · Goals</div>
              <p style={{marginBottom:16}}>Reduce time-to-first-value for new Anton users from 14 minutes to under 4 minutes. Make it feel like meeting a capable assistant, not configuring software. Every step has a clear "this is why" from Anton.</p>
              <div style={{color:'var(--text-primary)', fontSize:15, fontWeight:500, marginBottom:8}}>§2 · Flow</div>
              <p style={{marginBottom:16}}>Unlock → short intro (voice or text) → three scoped trust questions → connect the most valuable integration (Gmail or Calendar) → first brief.</p>
              <div style={{color:'var(--text-primary)', fontSize:15, fontWeight:500, marginBottom:8}}>§3 · Auth <span className="mono small" style={{color:'var(--work)', marginLeft:8, fontSize:10}}>◆ OPEN QUESTION</span></div>
              <p style={{marginBottom:16}}>Passkey-first, with password as fallback? Or biometric required? Marcus leans passkey-first.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═════════ RESEARCH ═════════
   Deep-research threads Anton has run. Each is a question the user (or an
   agent) asked, with the answer, sources, and the reasoning chain. */
function ResearchModule({ onNav }) {
  const STUDIES = [
    { id:0, q:'What would creator-tier pricing look like for our market?',   status:'done',     depth:'deep',    who:'Alex',  t:'1h',  sources:14, conf:3, runtime:'8m 22s' },
    { id:1, q:'How is Readwise positioning against Reader and Notion?',       status:'done',     depth:'medium',  who:'Sarah', t:'4h',  sources:9,  conf:3, runtime:'3m 18s' },
    { id:2, q:'Retention cohorts for launch week — early patterns',           status:'running',  depth:'deep',    who:'Priya', t:'12m', sources:0,  conf:null, runtime:'running…', pct:38 },
    { id:3, q:'Anna Kou — public writing, recent talks',                       status:'done',     depth:'quick',   who:'Noel',  t:'1d',  sources:6,  conf:3, runtime:'44s' },
    { id:4, q:'Legal: GDPR implications of on-device memory',                  status:'needs review', depth:'deep', who:'Diana', t:'2d',  sources:18, conf:2, runtime:'14m 02s' },
    { id:5, q:'State of local-first LLM inference on Apple Silicon',           status:'done',     depth:'deep',    who:'Ada',   t:'3d',  sources:22, conf:3, runtime:'11m 45s' },
  ];
  const [selId, setSelId] = useState(0);
  const sel = STUDIES.find(s=>s.id===selId) || STUDIES[0];

  return (
    <div style={{display:'flex', flex:1, minHeight:0}}>
      <div style={{width:400, borderRight:'1px solid var(--border-subtle)', display:'flex', flexDirection:'column'}}>
        <div style={{padding:'16px 20px', borderBottom:'1px solid var(--border-subtle)'}}>
          <div style={{fontSize:20, color:'var(--text-primary)', fontWeight:500, marginBottom:2}}>Research</div>
          <div className="mono small" style={{color:'var(--text-tertiary)'}}>6 studies · 1 running · 1 needs review</div>
        </div>
        <div style={{flex:1, overflow:'auto'}}>
          {STUDIES.map(s => (
            <div key={s.id} onClick={()=>setSelId(s.id)} style={{
              padding:'12px 20px', cursor:'pointer',
              borderBottom:'1px solid var(--border-subtle)',
              background: selId===s.id ? 'var(--bg-hover)' : 'transparent',
              borderLeft: `2px solid ${selId===s.id ? 'var(--accent)' : 'transparent'}`,
            }}>
              <div style={{fontSize:13, color:'var(--text-primary)', lineHeight:1.4, marginBottom:6}}>{s.q}</div>
              <div style={{display:'flex', alignItems:'center', gap:8, fontSize:10}}>
                <span className="mono" style={{padding:'1px 5px', borderRadius:3, fontSize:9, border:`1px solid ${s.depth==='deep'?'var(--accent)':'var(--border-default)'}`, color: s.depth==='deep'?'var(--accent)':'var(--text-tertiary)'}}>{s.depth}</span>
                <span className="mono small" style={{color:'var(--text-tertiary)'}}>{s.who}</span>
                <span className="mono small" style={{color:'var(--text-tertiary)'}}>·</span>
                <span className="mono small" style={{color:'var(--text-tertiary)'}}>{s.t}</span>
                <span style={{flex:1}}/>
                <span className="mono small" style={{fontSize:9, color: s.status==='done'?'var(--ok)':s.status==='running'?'var(--accent)':'var(--work)'}}>{s.status.toUpperCase()}</span>
              </div>
              {s.pct != null && (
                <div style={{height:2, background:'var(--bg-raised)', marginTop:8, borderRadius:1, overflow:'hidden'}}>
                  <div style={{width:`${s.pct}%`, height:'100%', background:'var(--accent)'}}/>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{flex:1, overflow:'auto', padding:'24px 32px'}}>
        <div style={{fontSize:22, color:'var(--text-primary)', lineHeight:1.4, marginBottom:8, fontWeight:500}}>{sel.q}</div>
        <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:24, display:'flex', gap:12}}>
          <span>requested by {sel.who}</span><span>·</span><span>{sel.t} ago</span><span>·</span><span>{sel.depth} research</span><span>·</span><span>{sel.runtime}</span><span>·</span><span>{sel.sources} sources</span>
        </div>

        <div style={{padding:'16px 18px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)', marginBottom:20}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:10, fontSize:9}}>ANSWER</div>
          <div style={{fontSize:14, color:'var(--text-primary)', lineHeight:1.7}}>
            {sel.id===0 && <>A three-tier structure at <b>$9 / $19 / $49</b> aligns with comp-set anchors (Raycast $8, Notion $10, Arc $20). At <b>$19/mo</b> we can support up to 500 local-agent operations/day while maintaining ~40% gross margin. Recommend free tier capped at 50 ops/day with a visible usage meter — this converted 11% in the closest analog (Raycast Pro).</>}
            {sel.id===1 && <>Readwise is positioning on <b>breadth of capture</b> (everything you read ends up here). Reader is positioning on <b>reading experience</b>. Notion is positioning on <b>structured thinking</b>. The white space: <b>what you do with it</b>. That's where Anton sits.</>}
            {sel.id===2 && <>Priya is running the retention SQL now. Early signal: day-1 activation up 18% vs last week. Day-7 TBD.</>}
            {sel.id===3 && <>Anna is VP Eng at Spark. Recent posts focus on on-device ML inference costs. Spoke at Strange Loop last year on local-first architecture.</>}
          </div>
        </div>

        <div style={{fontSize:14, color:'var(--text-primary)', marginBottom:10, fontWeight:500}}>Reasoning</div>
        <div style={{padding:'14px 16px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)', marginBottom:20}}>
          {[
            'Pulled comp-set pricing from 9 direct and adjacent tools',
            'Cross-referenced with our cohort LTV from Priya',
            'Modeled three scenarios, ran sensitivity on conversion rate',
            'Stress-tested gross margin at 80/20 free/paid split',
          ].map((step, i) => (
            <div key={i} style={{display:'flex', gap:10, padding:'4px 0'}}>
              <span className="mono small" style={{color:'var(--text-tertiary)', width:20, fontSize:10}}>{(i+1).toString().padStart(2,'0')}</span>
              <span style={{fontSize:12, color:'var(--text-secondary)', lineHeight:1.6}}>{step}</span>
            </div>
          ))}
        </div>

        <div style={{fontSize:14, color:'var(--text-primary)', marginBottom:10, fontWeight:500}}>Sources <span className="mono small" style={{color:'var(--text-tertiary)', marginLeft:6, fontSize:10}}>{sel.sources}</span></div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
          {['Raycast pricing page','Notion billing FAQ','Stripe Atlas pricing guide 2024','Priya · retention cohort v3','Arc Browser press kit','Hacker News thread · Feb 2025'].map((s,i)=>(
            <div key={i} style={{padding:'8px 12px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)', fontSize:11, color:'var(--text-secondary)'}}>
              <span className="mono small" style={{color:'var(--text-tertiary)', marginRight:6, fontSize:9}}>[{i+1}]</span>{s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═════════ PEOPLE / CRM ═════════
   Contacts. Anton tracks who you know, how you know them, and what you
   last talked about. Right rail shows a selected person's thread. */
function PeopleModule({ onNav }) {
  const PEOPLE = [
    { id:0, name:'Julia Pell',  org:'Spark Capital', role:'Partner',     tag:'investor',   warmth:'hot',  last:'2m',   notes:'Series A lead. Moving Tues call → Wed.' },
    { id:1, name:'Anna Kou',     org:'Vapor',        role:'VP Eng',       tag:'candidate',  warmth:'warm', last:'1h',   notes:'Open to conversation. Local-first ML fan.' },
    { id:2, name:'Cal Werner',   org:'Folk',         role:'Friend',       tag:'personal',   warmth:'warm', last:'4h',   notes:'Dinner Fri. Ask about his Series B.' },
    { id:3, name:'Sam Lau',      org:'Linear',       role:'Designer',     tag:'peer',       warmth:'warm', last:'2d',   notes:'Shared Anton onboarding flow for feedback.' },
    { id:4, name:'Tom Pritchett', org:'a16z',        role:'Partner',      tag:'investor',   warmth:'cold', last:'3w',   notes:'Passed on seed. Re-engage at A.' },
    { id:5, name:'Mira Hayes',   org:'Stripe',      role:'Product lead',  tag:'peer',       warmth:'warm', last:'1w',   notes:'Intro for Priya next month.' },
    { id:6, name:'Devon Reeves', org:'solo',        role:'Writer',        tag:'press',      warmth:'warm', last:'5d',   notes:'Drafting piece on local-first AI tools.' },
    { id:7, name:'Leah Okafor',  org:'Figma',       role:'Eng',           tag:'candidate',  warmth:'cold', last:'2mo',  notes:'Paused search last quarter.' },
  ];
  const [selId, setSelId] = useState(0);
  const [tag, setTag] = useState('all');
  const sel = PEOPLE.find(p=>p.id===selId);
  const filtered = PEOPLE.filter(p => tag==='all' || p.tag===tag);
  const WARM = { hot:'var(--error)', warm:'var(--work)', cold:'var(--text-tertiary)' };

  return (
    <div style={{display:'flex', flex:1, minHeight:0}}>
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0}}>
        <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)'}}>
          <div style={{display:'flex', alignItems:'baseline', marginBottom:10}}>
            <div style={{fontSize:20, color:'var(--text-primary)', fontWeight:500}}>People</div>
            <div className="mono small" style={{color:'var(--text-tertiary)', marginLeft:10}}>
              {PEOPLE.length} tracked · {PEOPLE.filter(p=>p.warmth==='hot').length} hot
            </div>
          </div>
          <div style={{display:'flex', gap:4}}>
            {['all','investor','candidate','peer','press','personal'].map(f=>(
              <button key={f} onClick={()=>setTag(f)} className="mono small" style={{
                padding:'3px 8px', fontSize:10,
                background: tag===f ? 'var(--bg-hover)' : 'transparent',
                color: tag===f ? 'var(--text-primary)' : 'var(--text-secondary)',
                border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer',
              }}>{f}</button>
            ))}
          </div>
        </div>
        <div style={{flex:1, overflow:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid var(--border-subtle)'}}>
                <th style={thStyle}>name</th>
                <th style={thStyle}>org</th>
                <th style={thStyle}>role</th>
                <th style={thStyle}>tag</th>
                <th style={thStyle}>warmth</th>
                <th style={thStyle}>last</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p=>(
                <tr key={p.id} onClick={()=>setSelId(p.id)} style={{
                  cursor:'pointer',
                  background: selId===p.id ? 'var(--bg-hover)' : 'transparent',
                  borderBottom:'1px solid var(--border-subtle)',
                }}>
                  <td style={tdStyle}>
                    <div style={{color:'var(--text-primary)', fontSize:13}}>{p.name}</div>
                  </td>
                  <td style={tdStyle}>{p.org}</td>
                  <td style={tdStyle}>{p.role}</td>
                  <td style={tdStyle}><span className="mono small" style={{fontSize:9, padding:'1px 5px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:3, color:'var(--text-secondary)'}}>{p.tag}</span></td>
                  <td style={tdStyle}><span style={{display:'inline-flex', alignItems:'center', gap:6}}><span style={{width:6, height:6, borderRadius:3, background:WARM[p.warmth]}}/>{p.warmth}</span></td>
                  <td style={tdStyle}>{p.last}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{width:340, borderLeft:'1px solid var(--border-subtle)', overflow:'auto'}}>
        {sel && <>
          <div style={{padding:'20px'}}>
            <div style={{fontSize:22, color:'var(--text-primary)', marginBottom:2, fontWeight:500}}>{sel.name}</div>
            <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:16}}>{sel.role} at {sel.org}</div>
            <div style={{display:'flex', gap:6, marginBottom:20}}>
              <button className="mono small" style={{padding:'5px 10px', fontSize:11, background:'var(--accent)', color:'var(--bg-page)', border:'none', borderRadius:'var(--r-chip)', cursor:'pointer'}}>message</button>
              <button className="mono small" style={{padding:'5px 10px', fontSize:11, background:'transparent', color:'var(--text-secondary)', border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer'}}>schedule</button>
              <button className="mono small" style={{padding:'5px 10px', fontSize:11, background:'transparent', color:'var(--text-secondary)', border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer'}}>ask Anton</button>
            </div>
            <div style={{padding:'12px', background:'var(--accent-soft)', border:'1px solid var(--accent)', borderRadius:'var(--r-card)', marginBottom:16}}>
              <div className="mono small caps" style={{color:'var(--accent)', marginBottom:6, fontSize:9}}>◎ ANTON NOTE</div>
              <div style={{fontSize:12, color:'var(--text-primary)', lineHeight:1.6}}>{sel.notes}</div>
            </div>
            <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:8, fontSize:9}}>RECENT THREAD</div>
            {['wants to move call to Wed', 'sent updated deck', 'intro call booked', 'warm intro from Cal', 'first meet at SF dinner'].map((m,i)=>(
              <div key={i} style={{padding:'8px 0', borderBottom:'1px solid var(--border-subtle)', fontSize:12, color:'var(--text-secondary)', display:'flex', gap:10}}>
                <span className="mono small" style={{color:'var(--text-tertiary)', fontSize:10, width:40}}>{['2m','2d','1w','3w','4mo'][i]}</span>
                <span style={{flex:1}}>{m}</span>
              </div>
            ))}
          </div>
        </>}
      </div>
    </div>
  );
}
const thStyle = { padding:'8px 16px', textAlign:'left', fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-tertiary)', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:400 };
const tdStyle = { padding:'9px 16px', fontSize:12, color:'var(--text-secondary)' };

/* ═════════ EXPENSES ═════════
   Money going out. Anton auto-categorizes, flags anomalies, ties charges
   to projects. Left: monthly summary. Right: feed with inline actions. */
function ExpensesModule({ onNav }) {
  const CATS = [
    { name:'infra',       amt:1240, pct:32, c:'#E4938E', flagged:true },
    { name:'saas',        amt:847,  pct:22, c:'#FBDA83', flagged:false },
    { name:'people',      amt:620,  pct:16, c:'#8DBBFF', flagged:false },
    { name:'marketing',   amt:450,  pct:12, c:'#A6D89C', flagged:false },
    { name:'travel',      amt:380,  pct:10, c:'#C5A8F0', flagged:false },
    { name:'other',       amt:302,  pct:8,  c:'#F0B780', flagged:false },
  ];
  const TXNS = [
    { d:'Apr 14', vendor:'AWS',              cat:'infra',     amt:1240, anton:'flagged · 30% over forecast', flag:'warn' },
    { d:'Apr 14', vendor:'Stripe (billing)', cat:'saas',      amt:847,  anton:'auto-filed · recurring',      flag:'ok' },
    { d:'Apr 13', vendor:'Anthropic API',    cat:'infra',     amt:124,  anton:'auto-filed',                   flag:'ok' },
    { d:'Apr 12', vendor:'Delta (SFO→NYC)',  cat:'travel',    amt:380,  anton:'matched to board trip',        flag:'ok' },
    { d:'Apr 11', vendor:'Figma',            cat:'saas',      amt:45,   anton:'auto-filed · recurring',      flag:'ok' },
    { d:'Apr 10', vendor:'LinkedIn Ads',     cat:'marketing', amt:240,  anton:'Riley campaign · launch',      flag:'ok' },
    { d:'Apr 09', vendor:'Brex card ·4412', cat:'other',     amt:89,   anton:'flagged · no description',     flag:'warn' },
    { d:'Apr 08', vendor:'Notion',           cat:'saas',      amt:40,   anton:'auto-filed · recurring',      flag:'ok' },
    { d:'Apr 07', vendor:'Contractor · Ada', cat:'people',    amt:620,  anton:'auto-filed · monthly',        flag:'ok' },
    { d:'Apr 06', vendor:'Datadog',          cat:'infra',     amt:210,  anton:'auto-filed',                   flag:'ok' },
  ];

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', minHeight:0}}>
      <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)'}}>
        <div style={{fontSize:20, color:'var(--text-primary)', fontWeight:500, marginBottom:2}}>Expenses</div>
        <div className="mono small" style={{color:'var(--text-tertiary)'}}>April · $3,839 spent · 2 flagged for your review</div>
      </div>
      <div style={{flex:1, display:'flex', minHeight:0}}>
        <div style={{width:340, borderRight:'1px solid var(--border-subtle)', padding:'20px', overflow:'auto'}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:12, fontSize:9}}>BY CATEGORY</div>
          <div style={{fontSize:32, color:'var(--text-primary)', fontWeight:500, marginBottom:4}}>$3,839</div>
          <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:16}}>
            <span style={{color:'var(--error)'}}>+12%</span> vs last month
          </div>
          <div style={{display:'flex', height:6, borderRadius:3, overflow:'hidden', marginBottom:16}}>
            {CATS.map(c => <div key={c.name} style={{width:`${c.pct}%`, background:c.c}}/>)}
          </div>
          {CATS.map(c => (
            <div key={c.name} style={{display:'flex', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border-subtle)'}}>
              <span style={{width:10, height:10, background:c.c, marginRight:10, borderRadius:2}}/>
              <span style={{flex:1, fontSize:12, color:'var(--text-secondary)'}}>{c.name}</span>
              {c.flagged && <span className="mono small" style={{fontSize:9, color:'var(--error)', marginRight:8}}>◆ FLAG</span>}
              <span className="mono small" style={{fontSize:11, color:'var(--text-primary)'}}>${c.amt.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div style={{flex:1, overflow:'auto'}}>
          <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center'}}>
            <div className="mono small caps" style={{color:'var(--text-tertiary)', fontSize:9, flex:1}}>RECENT TRANSACTIONS</div>
            <button className="mono small" style={{padding:'3px 10px', fontSize:10, background:'transparent', color:'var(--text-secondary)', border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer'}}>export csv</button>
          </div>
          {TXNS.map((t,i) => (
            <div key={i} style={{
              padding:'12px 24px', borderBottom:'1px solid var(--border-subtle)',
              display:'flex', alignItems:'center', gap:16,
              background: t.flag==='warn' ? 'rgba(217,95,95,0.04)' : 'transparent',
            }}>
              <span className="mono small" style={{color:'var(--text-tertiary)', width:56, fontSize:11}}>{t.d}</span>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, color:'var(--text-primary)', marginBottom:2}}>{t.vendor}</div>
                <div className="mono small" style={{color:t.flag==='warn'?'var(--error)':'var(--text-tertiary)', fontSize:10, lineHeight:1.4}}>
                  {t.flag==='warn' && '◆ '}{t.anton}
                </div>
              </div>
              <span className="mono small" style={{fontSize:10, color:'var(--text-tertiary)', width:60}}>{t.cat}</span>
              <div style={{fontSize:14, color:'var(--text-primary)', fontFamily:'var(--font-mono)', width:90, textAlign:'right'}}>${t.amt.toLocaleString()}</div>
              {t.flag==='warn' && (
                <button className="mono small" style={{padding:'3px 8px', fontSize:10, background:'var(--work)', color:'var(--bg-page)', border:'none', borderRadius:'var(--r-chip)', cursor:'pointer'}}>review</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═════════ TRAVEL ═════════
   Trips Anton has booked, is planning, or has surfaced options for. */
function TravelModule({ onNav }) {
  const TRIPS = [
    { id:0, where:'New York', dates:'Apr 22 — Apr 25', purpose:'Board dinner + 3 investor meets', status:'booked',   cost:1840, progress:['Delta SFO→JFK (seat 3A)','Soho Grand — 3 nights','Uber credits applied'] },
    { id:1, where:'Austin',   dates:'May 8 — May 11',   purpose:'Team offsite',                     status:'planning', cost:null, progress:['Comparing flight options','Hotel block held'] },
    { id:2, where:'London',   dates:'Jun — TBD',        purpose:'Early-stage summit',               status:'proposed', cost:null, progress:['3 conference options identified','Awaiting your priority call'] },
  ];
  const [selId, setSelId] = useState(0);
  const sel = TRIPS.find(t=>t.id===selId);
  const STATUS_C = { booked:'var(--ok)', planning:'var(--accent)', proposed:'var(--work)' };

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', minHeight:0}}>
      <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center'}}>
        <div>
          <div style={{fontSize:20, color:'var(--text-primary)', fontWeight:500, marginBottom:2}}>Travel</div>
          <div className="mono small" style={{color:'var(--text-tertiary)'}}>1 booked · 1 planning · 1 awaiting your call</div>
        </div>
        <div style={{flex:1}}/>
        <button className="mono small" style={{padding:'5px 12px', fontSize:11, background:'var(--accent)', color:'var(--bg-page)', border:'none', borderRadius:'var(--r-chip)', cursor:'pointer'}}>+ ask Anton to plan a trip</button>
      </div>
      <div style={{flex:1, display:'flex', minHeight:0}}>
        <div style={{width:380, borderRight:'1px solid var(--border-subtle)', overflow:'auto'}}>
          {TRIPS.map(t => (
            <div key={t.id} onClick={()=>setSelId(t.id)} style={{
              padding:'16px 20px', cursor:'pointer',
              borderBottom:'1px solid var(--border-subtle)',
              background: selId===t.id ? 'var(--bg-hover)' : 'transparent',
              borderLeft: `2px solid ${selId===t.id ? 'var(--accent)' : 'transparent'}`,
            }}>
              <div style={{display:'flex', alignItems:'baseline', marginBottom:4}}>
                <div style={{fontSize:16, color:'var(--text-primary)', fontWeight:500}}>{t.where}</div>
                <div className="mono small" style={{color:STATUS_C[t.status], marginLeft:'auto', fontSize:9}}>{t.status.toUpperCase()}</div>
              </div>
              <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:6}}>{t.dates}</div>
              <div style={{fontSize:12, color:'var(--text-secondary)', lineHeight:1.5}}>{t.purpose}</div>
            </div>
          ))}
        </div>
        <div style={{flex:1, overflow:'auto', padding:'24px 32px'}}>
          {sel && <>
            <div style={{fontSize:28, color:'var(--text-primary)', fontWeight:500, marginBottom:4}}>{sel.where}</div>
            <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:20}}>{sel.dates} · {sel.purpose}</div>

            <div style={{padding:'14px 16px', background:'var(--accent-soft)', border:'1px solid var(--accent)', borderRadius:'var(--r-card)', marginBottom:20}}>
              <div className="mono small caps" style={{color:'var(--accent)', marginBottom:8, fontSize:9}}>◎ ANTON STATUS</div>
              {sel.progress.map((p,i) => (
                <div key={i} style={{padding:'4px 0', fontSize:12, color:'var(--text-primary)', display:'flex', gap:8}}>
                  <span style={{color:'var(--ok)'}}>{sel.status==='booked' ? '✓' : sel.status==='planning'?'◌':'◆'}</span>
                  {p}
                </div>
              ))}
            </div>

            {sel.status==='booked' && (
              <>
                <div style={{fontSize:14, color:'var(--text-primary)', marginBottom:10, fontWeight:500}}>Itinerary</div>
                <div style={{border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)', overflow:'hidden'}}>
                  {[
                    { t:'Apr 22, 6:20a', a:'SFO → JFK',         b:'Delta 402 · seat 3A · confirmation VFX2K7' },
                    { t:'Apr 22, 3:40p', a:'Check in',           b:'Soho Grand · 310 W Broadway · confirmed' },
                    { t:'Apr 23, 9:00a', a:'Board dinner',      b:'Balthazar · private room · 14 people' },
                    { t:'Apr 24, 2:00p', a:'Meeting · Sequoia', b:'550 Madison Ave · Anton added to calendar' },
                    { t:'Apr 25, 4:50p', a:'JFK → SFO',         b:'Delta 415 · seat 7F' },
                  ].map((it,i)=>(
                    <div key={i} style={{padding:'12px 16px', borderBottom: i<4?'1px solid var(--border-subtle)':'none', display:'flex', gap:16}}>
                      <div className="mono small" style={{color:'var(--text-tertiary)', width:110, fontSize:11}}>{it.t}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13, color:'var(--text-primary)', marginBottom:2}}>{it.a}</div>
                        <div className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{it.b}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mono small" style={{marginTop:14, color:'var(--text-tertiary)'}}>Total booked: <span style={{color:'var(--text-primary)'}}>${sel.cost.toLocaleString()}</span></div>
              </>
            )}

            {sel.status==='planning' && (
              <>
                <div style={{fontSize:14, color:'var(--text-primary)', marginBottom:10, fontWeight:500}}>Flight options Anton is comparing</div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
                  {[
                    {a:'United 724', d:'6:00a', p:'$340', pick:true},
                    {a:'Delta 1104', d:'9:15a', p:'$380', pick:false},
                    {a:'Southwest', d:'11:30a', p:'$290', pick:false},
                  ].map((o,i)=>(
                    <div key={i} style={{padding:'12px', background:'var(--bg-surface)', border:`1px solid ${o.pick?'var(--accent)':'var(--border-subtle)'}`, borderRadius:'var(--r-card)'}}>
                      <div style={{fontSize:13, color:'var(--text-primary)', marginBottom:2}}>{o.a}</div>
                      <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:6, fontSize:10}}>dep {o.d}</div>
                      <div style={{fontSize:16, color:o.pick?'var(--accent)':'var(--text-primary)', fontFamily:'var(--font-mono)'}}>{o.p}</div>
                      {o.pick && <div className="mono small" style={{marginTop:6, color:'var(--accent)', fontSize:9}}>◎ ANTON RECOMMENDS</div>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>}
        </div>
      </div>
    </div>
  );
}

/* ═════════ USAGE ═════════
   How hard Anton & agents have been working. Tokens, tools, time, cost.
   Honest numbers, not a dashboard brag. */
function UsageModule({ onNav }) {
  const PERIOD = 'Last 7 days';
  const METRICS = [
    { k:'LLM tokens',     v:'4.2M',    sub:'3.8M local · 430K cloud',      trend:'+18%' },
    { k:'Tool calls',     v:'14,328',  sub:'reads 8.1K · writes 2.2K',    trend:'+5%' },
    { k:'Anton wake time', v:'41h',     sub:'of 168h possible',             trend:'−3%' },
    { k:'Cloud cost',      v:'$47.20',  sub:'claude · deep research only',  trend:'+12%' },
  ];
  const BYAGENT = [
    { a:'Marcus', tok:980, calls:4200, cost:12.40, bar:95 },
    { a:'Kai',    tok:640, calls:2100, cost:8.10,  bar:65 },
    { a:'Alex',   tok:520, calls:1900, cost:11.80, bar:58 },
    { a:'Priya',  tok:410, calls:1400, cost:4.20,  bar:44 },
    { a:'Sarah',  tok:380, calls:1100, cost:3.80,  bar:40 },
    { a:'Ada',    tok:320, calls:980,  cost:2.10,  bar:34 },
    { a:'James',  tok:240, calls:620,  cost:1.90,  bar:25 },
    { a:'others', tok:720, calls:2028, cost:2.90,  bar:52 },
  ];
  const DAYS = [
    { d:'Mon', v:620 }, { d:'Tue', v:840 }, { d:'Wed', v:710 },
    { d:'Thu', v:980 }, { d:'Fri', v:540 }, { d:'Sat', v:240 }, { d:'Sun', v:270 },
  ];
  const maxDay = Math.max(...DAYS.map(d=>d.v));

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', minHeight:0, overflow:'auto'}}>
      <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center'}}>
        <div>
          <div style={{fontSize:20, color:'var(--text-primary)', fontWeight:500, marginBottom:2}}>Usage</div>
          <div className="mono small" style={{color:'var(--text-tertiary)'}}>{PERIOD} · Anton + 15 agents</div>
        </div>
        <div style={{flex:1}}/>
        <div className="mono small" style={{display:'flex', gap:4}}>
          {['24h','7d','30d','90d'].map(p=>(
            <button key={p} style={{
              padding:'3px 10px', fontSize:10,
              background: p==='7d'?'var(--bg-hover)':'transparent',
              color: p==='7d'?'var(--text-primary)':'var(--text-secondary)',
              border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer',
            }}>{p}</button>
          ))}
        </div>
      </div>
      <div style={{padding:'24px', display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, borderBottom:'1px solid var(--border-subtle)'}}>
        {METRICS.map(m=>(
          <div key={m.k} style={{padding:'16px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)'}}>
            <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:8, fontSize:9}}>{m.k}</div>
            <div style={{fontSize:24, color:'var(--text-primary)', fontWeight:500, fontFamily:'var(--font-mono)', marginBottom:4}}>{m.v}</div>
            <div className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{m.sub}</div>
            <div className="mono small" style={{marginTop:8, fontSize:10, color: m.trend.startsWith('+') ? 'var(--work)' : 'var(--ok)'}}>{m.trend} vs prev</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:0}}>
        <div style={{padding:'24px', borderRight:'1px solid var(--border-subtle)'}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:16, fontSize:9}}>DAILY TOKEN USE (thousands)</div>
          <div style={{display:'flex', alignItems:'flex-end', gap:10, height:160, padding:'0 4px'}}>
            {DAYS.map(d=>(
              <div key={d.d} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6}}>
                <div className="mono small" style={{color:'var(--text-primary)', fontSize:10}}>{d.v}</div>
                <div style={{width:'100%', height:`${(d.v/maxDay)*100}%`, background:'var(--accent)', borderRadius:'2px 2px 0 0', minHeight:4}}/>
                <div className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{d.d}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:'24px'}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:16, fontSize:9}}>BY AGENT</div>
          {BYAGENT.map(a=>(
            <div key={a.a} style={{display:'flex', alignItems:'center', gap:12, padding:'6px 0'}}>
              <div style={{width:60, fontSize:12, color:'var(--text-primary)'}}>{a.a}</div>
              <div style={{flex:1, height:6, background:'var(--bg-surface)', borderRadius:3, overflow:'hidden'}}>
                <div style={{width:`${a.bar}%`, height:'100%', background:'var(--accent)'}}/>
              </div>
              <div className="mono small" style={{width:70, textAlign:'right', color:'var(--text-secondary)', fontSize:11}}>{a.tok}K tok</div>
              <div className="mono small" style={{width:70, textAlign:'right', color:'var(--text-tertiary)', fontSize:11}}>${a.cost.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{padding:'20px 24px', background:'var(--bg-surface)', borderTop:'1px solid var(--border-subtle)'}}>
        <div className="mono small caps" style={{color:'var(--accent)', marginBottom:8, fontSize:9}}>◎ ANTON NOTES</div>
        <div style={{fontSize:13, color:'var(--text-primary)', lineHeight:1.7, maxWidth:720}}>
          90% of LLM work stayed local (Qwen3 8B). Cloud usage up because Alex ran deeper creator-tier research.
          Thursday was the busiest day — launch sync and 3 parallel research threads. Total cloud cost: <b>$47.20</b>,
          well under the $150/mo budget you set.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DocumentsModule, ResearchModule, PeopleModule, ExpensesModule, TravelModule, UsageModule });
