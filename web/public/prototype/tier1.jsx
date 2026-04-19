/* ─────────── TIER 1 MODULES
   Calendar · Inbox · Tasks · Auth/Lock
   Each screen is a full-width module designed to slot into WebShell's
   center slot (the left rail + titlebar + command bar are provided).
   Voice: warm-dark, dense, monospace labels, copy as if Anton is
   presenting information to Noel, not the other way around.
   ─────────── */
const { useState: _t1useS } = React;

/* ═════════ CALENDAR ═════════
   Week view. Anton overlays its proposals (held slots, auto-reshuffles,
   blocked focus time) directly on the grid, tagged by color + an "Anton"
   glyph so Noel can see at a glance what's human-booked vs AI-proposed. */
function CalendarModule({ onNav }) {
  const DAYS = ['MON 14','TUE 15','WED 16','THU 17','FRI 18','SAT 19','SUN 20'];
  const HOURS = ['8','9','10','11','12','1','2','3','4','5','6'];
  const TODAY = 3; // THU

  // Events: day idx, start hour (0 = 8am), duration hours, kind, title, who
  const EVENTS = [
    { d:0, s:1,   h:1,   k:'human', t:'Standup',                  w:'team' },
    { d:0, s:3,   h:2,   k:'anton', t:'Focus · PRD draft',        w:'held by Anton', note:'Marcus drafting' },
    { d:0, s:7,   h:1,   k:'human', t:'1:1 Anna',                 w:'Anna Kou' },

    { d:1, s:0.5, h:1,   k:'human', t:'Investor · Spark Capital', w:'J. Pell' },
    { d:1, s:2,   h:3,   k:'anton', t:'Deep research block',      w:'held by Anton', note:'creator-tier pricing' },
    { d:1, s:6,   h:1,   k:'human', t:'Gym',                      w:'recurring' },

    { d:2, s:1,   h:1,   k:'human', t:'Design review',            w:'Elena + Ada' },
    { d:2, s:3,   h:1.5, k:'anton', t:'Reshuffled · walk',        w:'moved from Fri', note:'rain forecast' },
    { d:2, s:5,   h:1,   k:'human', t:'Board prep',               w:'solo' },

    { d:3, s:0,   h:1,   k:'human', t:'Standup',                  w:'team' },
    { d:3, s:2,   h:1,   k:'hold',  t:'Focus · no meetings',      w:'protected' },
    { d:3, s:4,   h:2,   k:'human', t:'Launch sync',              w:'Sarah + Riley' },
    { d:3, s:7,   h:1,   k:'anton', t:'Email triage',             w:'held by Anton', note:'45 threads' },

    { d:4, s:1,   h:1,   k:'human', t:'All-hands',                w:'26 ppl' },
    { d:4, s:3,   h:2,   k:'anton', t:'Weekly review',            w:'with Anton', note:'proposed' },

    { d:6, s:2,   h:2,   k:'human', t:'Family lunch',             w:'Mom + Dad' },
  ];

  const [sel, setSel] = useState({d:3, s:2}); // selected cell → right rail

  const selectedEvent = EVENTS.find(e => e.d === sel.d && sel.s >= e.s && sel.s < e.s + e.h);

  // proposed items in right rail
  const proposals = [
    { t:'Move "Design review" → Thu 2pm',  r:'Elena is OOO Wed', conf:'suggested' },
    { t:'Hold 3h block Fri afternoon',      r:'to finish creator-tier writeup', conf:'proposed' },
    { t:'Decline "Vendor pitch · Mon"',     r:'duplicate of Tues investor call', conf:'suggested' },
  ];

  return (
    <div style={{display:'flex', flex:1, minHeight:0}}>
      {/* main canvas */}
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0}}>
        {/* header */}
        <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', gap:16}}>
          <div>
            <div style={{fontSize:20, color:'var(--text-primary)', fontWeight:500}}>April 14 — 20</div>
            <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>Week 16 · 3 holds pending your approval</div>
          </div>
          <div style={{flex:1}}/>
          <div style={{display:'flex', gap:4}}>
            {['day','week','month'].map(v => (
              <button key={v} className="mono small" style={{
                padding:'5px 10px', fontSize:11,
                background: v==='week' ? 'var(--bg-hover)' : 'transparent',
                color: v==='week' ? 'var(--text-primary)' : 'var(--text-secondary)',
                border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer',
              }}>{v}</button>
            ))}
          </div>
          <button className="mono small" style={{
            padding:'5px 12px', fontSize:11, background:'var(--accent-soft)',
            color:'var(--accent)', border:'1px solid var(--accent)',
            borderRadius:'var(--r-chip)', cursor:'pointer',
          }}>+ ask Anton</button>
        </div>

        {/* grid */}
        <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
          {/* day header */}
          <div style={{display:'grid', gridTemplateColumns:'52px repeat(7, 1fr)', borderBottom:'1px solid var(--border-subtle)'}}>
            <div/>
            {DAYS.map((d,i) => (
              <div key={d} className="mono small" style={{
                padding:'10px 8px', textAlign:'center', fontSize:11,
                color: i===TODAY ? 'var(--accent)' : 'var(--text-secondary)',
                borderLeft:'1px solid var(--border-subtle)',
                background: i===TODAY ? 'var(--accent-soft)' : 'transparent',
              }}>{d}</div>
            ))}
          </div>

          <div style={{flex:1, overflow:'auto', position:'relative'}}>
            <div style={{display:'grid', gridTemplateColumns:'52px repeat(7, 1fr)', position:'relative'}}>
              {/* hour labels */}
              <div style={{display:'flex', flexDirection:'column'}}>
                {HOURS.map(h => (
                  <div key={h} className="mono small" style={{
                    height:64, borderBottom:'1px solid var(--border-subtle)',
                    padding:'4px 6px', fontSize:10, color:'var(--text-tertiary)',
                    textAlign:'right',
                  }}>{h}</div>
                ))}
              </div>

              {/* day columns */}
              {DAYS.map((d, di) => (
                <div key={d} style={{position:'relative', borderLeft:'1px solid var(--border-subtle)'}}>
                  {HOURS.map((h,hi) => (
                    <div key={h} onClick={()=>setSel({d:di, s:hi})} style={{
                      height:64, borderBottom:'1px solid var(--border-subtle)',
                      background: sel.d===di && sel.s===hi ? 'var(--bg-hover)' : 'transparent',
                      cursor:'pointer',
                    }}/>
                  ))}
                  {/* events */}
                  {EVENTS.filter(e=>e.d===di).map((e,ei) => (
                    <CalendarEvent key={ei} e={e} selected={selectedEvent===e} onClick={()=>setSel({d:di, s:e.s})}/>
                  ))}
                  {/* now line — Thu at 2:30 */}
                  {di===TODAY && (
                    <div style={{
                      position:'absolute', left:0, right:0,
                      top: `${(2.5+2)*64 / HOURS.length * 100 / 1}%`,
                      // simpler: absolute pixel
                    }}/>
                  )}
                  {di===TODAY && <div style={{
                    position:'absolute', left:0, right:0, top: 64*(6.5), height:1,
                    background:'var(--accent)', zIndex:5,
                  }}>
                    <div style={{position:'absolute', left:-4, top:-4, width:8, height:8, borderRadius:4, background:'var(--accent)'}}/>
                  </div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* right rail — proposals + details */}
      <div style={{width:320, borderLeft:'1px solid var(--border-subtle)', display:'flex', flexDirection:'column', overflow:'auto'}}>
        <div style={{padding:'16px 16px 12px', borderBottom:'1px solid var(--border-subtle)'}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:6}}>ANTON PROPOSES</div>
          {proposals.map((p,i) => (
            <div key={i} style={{
              padding:'10px 12px', marginBottom:6,
              background:'var(--bg-surface)', border:'1px solid var(--border-subtle)',
              borderRadius:'var(--r-card)',
            }}>
              <div style={{fontSize:13, color:'var(--text-primary)', marginBottom:3}}>{p.t}</div>
              <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:6}}>{p.r}</div>
              <div style={{display:'flex', gap:6}}>
                <button className="mono small" style={{
                  padding:'3px 10px', fontSize:10,
                  background:'var(--accent)', color:'var(--bg-page)',
                  border:'none', borderRadius:'var(--r-chip)', cursor:'pointer',
                }}>accept</button>
                <button className="mono small" style={{
                  padding:'3px 10px', fontSize:10,
                  background:'transparent', color:'var(--text-secondary)',
                  border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer',
                }}>dismiss</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{padding:'16px'}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:6}}>SELECTED</div>
          {selectedEvent ? (
            <div>
              <div style={{fontSize:14, color:'var(--text-primary)', marginBottom:4}}>{selectedEvent.t}</div>
              <div className="mono small" style={{color:'var(--text-secondary)', marginBottom:10}}>
                {DAYS[sel.d]} · {fmtTime(selectedEvent.s)} – {fmtTime(selectedEvent.s + selectedEvent.h)}
              </div>
              {selectedEvent.w && <Row k="with" v={selectedEvent.w}/>}
              {selectedEvent.k === 'anton' && <Row k="source" v="Anton (proposed)"/>}
              {selectedEvent.k === 'human' && <Row k="source" v="Calendar"/>}
              {selectedEvent.k === 'hold' && <Row k="source" v="Focus hold"/>}
              {selectedEvent.note && <Row k="note" v={selectedEvent.note}/>}
            </div>
          ) : (
            <div className="mono small" style={{color:'var(--text-tertiary)'}}>
              Empty slot — {DAYS[sel.d]} {fmtTime(sel.s)}
            </div>
          )}
        </div>

        <div style={{flex:1}}/>
        <div style={{padding:'12px 16px', borderTop:'1px solid var(--border-subtle)'}}>
          <div className="mono small" style={{color:'var(--text-tertiary)', lineHeight:1.6}}>
            <div>✦ 14 events this week</div>
            <div>◎ 3 proposed by Anton</div>
            <div>◌ 6h of focus time held</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalendarEvent({ e, selected, onClick }) {
  const H = 64; // px per hour
  const COLOR = e.k === 'anton' ? 'var(--accent)'
              : e.k === 'hold'  ? 'var(--info)'
              : 'var(--text-primary)';
  const BG = e.k === 'anton' ? 'var(--accent-soft)'
           : e.k === 'hold'  ? 'rgba(107,143,196,0.12)'
           : 'var(--bg-surface)';
  const BORDER = e.k === 'anton' ? 'var(--accent)'
               : e.k === 'hold'  ? 'var(--info)'
               : 'var(--border-default)';
  return (
    <div onClick={onClick} style={{
      position:'absolute', left:3, right:3,
      top: e.s * H + 1, height: e.h * H - 3,
      background: BG, border: `1px solid ${BORDER}`,
      borderLeft: `3px solid ${COLOR}`,
      borderRadius:4, padding:'4px 6px', cursor:'pointer',
      boxShadow: selected ? '0 0 0 2px var(--accent)' : 'none',
      overflow:'hidden',
    }}>
      <div style={{fontSize:11, color:'var(--text-primary)', lineHeight:1.3, fontWeight: e.k==='anton'?500:400}}>
        {e.k === 'anton' && <span style={{color:'var(--accent)', marginRight:4}}>◎</span>}
        {e.k === 'hold' && <span style={{color:'var(--info)', marginRight:4}}>◌</span>}
        {e.t}
      </div>
      {e.h > 1 && e.w && <div className="mono small" style={{fontSize:9, color:'var(--text-tertiary)', marginTop:2}}>{e.w}</div>}
    </div>
  );
}

function fmtTime(s) {
  const h = Math.floor(s) + 8;
  const m = (s % 1) * 60;
  const h12 = h > 12 ? h - 12 : h;
  const ap = h >= 12 ? 'pm' : 'am';
  return `${h12}:${m.toString().padStart(2,'0')}${ap}`;
}

function Row({ k, v }) {
  return (
    <div style={{display:'flex', padding:'4px 0', fontSize:12, borderBottom:'1px solid var(--border-subtle)'}}>
      <div className="mono" style={{width:60, color:'var(--text-tertiary)', fontSize:11}}>{k}</div>
      <div style={{flex:1, color:'var(--text-secondary)'}}>{v}</div>
    </div>
  );
}

/* ═════════ INBOX ═════════
   Email triaged by Anton. Left: list, with Anton's summary one-liner
   as the preview (not the original subject). Each thread shows what Anton
   already did (drafted reply, archived, snoozed) or wants to do. Right:
   thread with original message + Anton's draft response side-by-side. */
function InboxModule({ onNav }) {
  const THREADS = [
    { id:0, from:'Julia Pell · Spark',  subj:'Re: Series A deck',         summary:'Wants to move Tues call to Wed. Anton drafted a reply proposing Wed 2pm.', t:'2m',  k:'drafted',  unread:true, tags:['investor','fundraise'] },
    { id:1, from:'Stripe',               subj:'Invoice #4412',             summary:'Monthly subscription receipt, $847. Anton auto-filed to Finance.',         t:'14m', k:'filed',    unread:false, tags:['finance'] },
    { id:2, from:'Sarah (agent)',        subj:'Launch email copy · v3',    summary:'Asking you to review final copy before Anton sends to 2,340 subs.',       t:'22m', k:'approval', unread:true, tags:['approval'] },
    { id:3, from:'Marcus (agent)',       subj:'PRD draft ready',            summary:'Onboarding v3 draft in memory. Open questions flagged for you.',          t:'41m', k:'review',   unread:true, tags:['product'] },
    { id:4, from:'Anna Kou',             subj:'Hiring loop feedback',       summary:'Positive signal on Priya candidate. Anton extracted key quotes.',         t:'1h',  k:'read',     unread:false, tags:['hiring'] },
    { id:5, from:'LinkedIn',             subj:'6 new connection requests', summary:'Anton auto-archived. 1 flagged (ex-Stripe PM) for your review.',          t:'2h',  k:'archived', unread:false, tags:['noise'] },
    { id:6, from:'Elena (agent)',        subj:'Social calendar Thu–Sun',   summary:'4 posts scheduled. Threadwise copy attached, needs your OK.',             t:'3h',  k:'approval', unread:true, tags:['approval','marketing'] },
    { id:7, from:'Cal (friend)',         subj:'Dinner Friday?',             summary:'Anton held Fri 7–9pm tentatively. Reply drafted: yes.',                   t:'4h',  k:'drafted',  unread:false, tags:['personal'] },
    { id:8, from:'AWS Billing',          subj:'Usage alert — $1,240',      summary:'30% over forecast. Anton flagged to Diana, who is investigating.',        t:'6h',  k:'flagged',  unread:false, tags:['finance'] },
    { id:9, from:'Producthunt',          subj:'Weekly digest',              summary:'Anton archived. Nothing matched your watched keywords.',                  t:'9h',  k:'archived', unread:false, tags:['noise'] },
  ];

  const [selId, setSelId] = useState(0);
  const [filter, setFilter] = useState('all');
  const sel = THREADS.find(t => t.id === selId) || THREADS[0];

  const filtered = THREADS.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'unread') return t.unread;
    if (filter === 'approval') return t.k === 'approval';
    if (filter === 'drafted') return t.k === 'drafted';
    return true;
  });

  const KSTYLE = {
    drafted:  { c:'var(--accent)',  l:'DRAFTED'  },
    filed:    { c:'var(--text-tertiary)', l:'FILED' },
    approval: { c:'var(--work)',    l:'APPROVAL' },
    review:   { c:'var(--info)',    l:'REVIEW' },
    read:     { c:'var(--text-tertiary)', l:'READ' },
    archived: { c:'var(--text-tertiary)', l:'ARCHIVED' },
    flagged:  { c:'var(--error)',   l:'FLAGGED' },
  };

  return (
    <div style={{display:'flex', flex:1, minHeight:0}}>
      {/* thread list */}
      <div style={{width:380, borderRight:'1px solid var(--border-subtle)', display:'flex', flexDirection:'column', minHeight:0}}>
        <div style={{padding:'12px 16px', borderBottom:'1px solid var(--border-subtle)'}}>
          <div style={{display:'flex', alignItems:'baseline', marginBottom:10}}>
            <div style={{fontSize:16, color:'var(--text-primary)', fontWeight:500}}>Inbox</div>
            <div className="mono small" style={{color:'var(--text-tertiary)', marginLeft:10}}>
              {THREADS.filter(t=>t.unread).length} unread · Anton triaged {THREADS.length - THREADS.filter(t=>t.k==='approval'||t.k==='review').length}
            </div>
          </div>
          <div style={{display:'flex', gap:4}}>
            {['all','unread','approval','drafted'].map(f => (
              <button key={f} onClick={()=>setFilter(f)} className="mono small" style={{
                padding:'3px 8px', fontSize:10,
                background: filter===f ? 'var(--bg-hover)' : 'transparent',
                color: filter===f ? 'var(--text-primary)' : 'var(--text-secondary)',
                border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer',
              }}>{f}</button>
            ))}
          </div>
        </div>

        <div style={{flex:1, overflow:'auto'}}>
          {filtered.map(t => {
            const ks = KSTYLE[t.k];
            return (
              <div key={t.id} onClick={()=>setSelId(t.id)} style={{
                padding:'10px 16px', cursor:'pointer',
                borderBottom:'1px solid var(--border-subtle)',
                background: selId===t.id ? 'var(--bg-hover)' : 'transparent',
                borderLeft: `2px solid ${selId===t.id ? 'var(--accent)' : 'transparent'}`,
              }}>
                <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:3}}>
                  {t.unread && <span style={{width:6, height:6, borderRadius:3, background:'var(--accent)'}}/>}
                  <div style={{flex:1, fontSize:12, color:'var(--text-primary)', fontWeight: t.unread?500:400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                    {t.from}
                  </div>
                  <div className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{t.t}</div>
                </div>
                <div style={{fontSize:12, color:'var(--text-secondary)', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                  {t.subj}
                </div>
                <div style={{fontSize:11, color:'var(--text-tertiary)', lineHeight:1.4, marginBottom:6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>
                  {t.summary}
                </div>
                <div className="mono small" style={{fontSize:9, color:ks.c, letterSpacing:'0.08em'}}>
                  {t.k === 'drafted' && '◎ '}
                  {ks.l}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* thread detail */}
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0}}>
        <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)'}}>
          <div style={{fontSize:16, color:'var(--text-primary)', marginBottom:6}}>{sel.subj}</div>
          <div style={{display:'flex', alignItems:'center', gap:10, fontSize:12, color:'var(--text-secondary)'}}>
            <span>{sel.from}</span>
            <span style={{color:'var(--text-tertiary)'}}>·</span>
            <span className="mono small" style={{color:'var(--text-tertiary)'}}>{sel.t} ago</span>
            <div style={{flex:1}}/>
            {sel.tags.map(tg => (
              <span key={tg} className="mono small" style={{
                padding:'2px 6px', fontSize:9,
                background:'var(--bg-surface)', color:'var(--text-secondary)',
                border:'1px solid var(--border-subtle)', borderRadius:'var(--r-chip)',
              }}>{tg}</span>
            ))}
          </div>
        </div>

        <div style={{flex:1, overflow:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:16}}>
          {/* original */}
          <div style={{
            padding:16, background:'var(--bg-surface)', border:'1px solid var(--border-subtle)',
            borderRadius:'var(--r-card)',
          }}>
            <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:8}}>ORIGINAL MESSAGE</div>
            <div style={{fontSize:13, color:'var(--text-primary)', lineHeight:1.6}}>
              {sel.id === 0 && <>Hey Noel, <br/><br/>Something came up Tuesday — can we push to Wednesday same time? Happy to work around your schedule. Also wanted to confirm the deck is in good shape for my partners.<br/><br/>– Julia</>}
              {sel.id === 1 && <>Your subscription invoice is attached. Amount charged: $847.00 USD to card ending 4412. Next billing date: May 14, 2025.</>}
              {sel.id === 2 && <>Final launch copy attached below. Waiting on your review before I (Sarah) ask Anton to queue the send. Kai signed off on SEO tone.</>}
              {sel.id === 3 && <>PRD draft is complete and saved to memory. Two open questions flagged in §3.2 around auth flow. Marcus.</>}
              {sel.id > 3 && <>[message body preview]</>}
            </div>
          </div>

          {/* Anton's summary + action */}
          <div style={{
            padding:16, border:'1px solid var(--accent)',
            borderRadius:'var(--r-card)', background:'var(--accent-soft)',
          }}>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
              <span style={{color:'var(--accent)'}}>◎</span>
              <span className="mono small caps" style={{color:'var(--accent)', letterSpacing:'0.1em'}}>ANTON — {KSTYLE[sel.k].l}</span>
            </div>
            <div style={{fontSize:13, color:'var(--text-primary)', lineHeight:1.6, marginBottom:12}}>
              {sel.summary}
            </div>

            {sel.k === 'drafted' && (
              <div style={{
                padding:12, background:'var(--bg-page)', border:'1px solid var(--border-default)',
                borderRadius:'var(--r-card)', marginBottom:12,
              }}>
                <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:6}}>Draft reply</div>
                <div style={{fontSize:13, color:'var(--text-primary)', lineHeight:1.6, fontStyle:'italic'}}>
                  {sel.id === 0 && <>Hi Julia — works for me. Wed 2pm? I'll have Anton send an updated calendar invite. Deck is ready; will ping you tomorrow with the final version.<br/>— Noel</>}
                  {sel.id === 7 && <>Yes — 7pm works. Where are you thinking?<br/>— N</>}
                </div>
              </div>
            )}

            <div style={{display:'flex', gap:6}}>
              {sel.k === 'drafted' && <>
                <button className="mono small" style={BTN_PRIMARY}>send as is</button>
                <button className="mono small" style={BTN_SEC}>edit</button>
                <button className="mono small" style={BTN_SEC}>write yourself</button>
              </>}
              {sel.k === 'approval' && <>
                <button className="mono small" style={BTN_PRIMARY}>approve & send</button>
                <button className="mono small" style={BTN_SEC}>open in approvals</button>
                <button className="mono small" style={BTN_SEC}>reject</button>
              </>}
              {sel.k === 'filed' && <>
                <button className="mono small" style={BTN_SEC}>view file</button>
                <button className="mono small" style={BTN_SEC}>unfile</button>
              </>}
              {sel.k === 'archived' && <>
                <button className="mono small" style={BTN_SEC}>restore</button>
                <button className="mono small" style={BTN_SEC}>why archived?</button>
              </>}
              {(sel.k==='review' || sel.k==='flagged' || sel.k==='read') && <>
                <button className="mono small" style={BTN_PRIMARY}>reply</button>
                <button className="mono small" style={BTN_SEC}>ask Anton to handle</button>
                <button className="mono small" style={BTN_SEC}>archive</button>
              </>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BTN_PRIMARY = {
  padding:'5px 12px', fontSize:11,
  background:'var(--accent)', color:'var(--bg-page)',
  border:'none', borderRadius:'var(--r-chip)', cursor:'pointer',
};
const BTN_SEC = {
  padding:'5px 12px', fontSize:11,
  background:'transparent', color:'var(--text-secondary)',
  border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer',
};

/* ═════════ TASKS ═════════
   Not a todo list. Every task is owned by someone — Anton, an agent, or
   Noel — and carries its state in the system. Anton-owned tasks show progress
   + current sub-step. Columns: INCOMING (waiting on Noel) · IN FLIGHT ·
   COMPLETE TODAY · BLOCKED. */
function TasksModule({ onNav }) {
  const TASKS = [
    { id:0, title:'Review launch email copy',       owner:'Noel',    actor:'Sarah',  col:'incoming', age:'22m', risk:'M', why:'Waiting on your approval before send' },
    { id:1, title:'Decide: creator-tier pricing',   owner:'Noel',    actor:'Alex',   col:'incoming', age:'2h',  risk:'M', why:'Blocking Marcus\'s PRD §4' },
    { id:2, title:'Sign Q2 engagement letter',      owner:'Noel',    actor:'Diana',  col:'incoming', age:'1d',  risk:'L', why:'Legal needs your signature' },

    { id:3, title:'Draft PRD · onboarding v3',       owner:'Marcus',  actor:'Marcus', col:'flight',   age:'1h',  pct:68, step:'writing §5 error flows' },
    { id:4, title:'Keyword research · creator tier', owner:'Kai',     actor:'Kai',    col:'flight',   age:'8m',  pct:42, step:'clustered 84 of 200 queries' },
    { id:5, title:'Retention cohort rebuild',        owner:'Priya',   actor:'Priya',  col:'flight',   age:'46s', pct:12, step:'running SQL · 714 rows so far' },
    { id:6, title:'Draft reply to Julia Pell',       owner:'Anton',   actor:'Anton',  col:'flight',   age:'2m',  pct:100,step:'ready for your review' },

    { id:7, title:'Pushed v1.2 to staging',          owner:'James',   actor:'James',  col:'done',     age:'6m',  },
    { id:8, title:'Filed Stripe invoice $847',       owner:'Anton',   actor:'Anton',  col:'done',     age:'14m', },
    { id:9, title:'Archived 6 LinkedIn threads',    owner:'Anton',   actor:'Anton',  col:'done',     age:'2h',  },
    { id:10,title:'Reviewed Priya candidate',        owner:'Anna',    actor:'Anna',   col:'done',     age:'1h',  },

    { id:11,title:'Deploy v1.2 to production',       owner:'James',   actor:'James',  col:'blocked',  age:'42m', why:'needs your approval (red tier)' },
    { id:12,title:'Send launch email',               owner:'Sarah',   actor:'Sarah',  col:'blocked',  age:'22m', why:'blocked on Noel review of copy' },
  ];

  const COLS = [
    { id:'incoming', label:'FOR YOU',     c:'var(--work)'   },
    { id:'flight',   label:'IN FLIGHT',   c:'var(--accent)' },
    { id:'done',     label:'DONE TODAY',  c:'var(--ok)'     },
    { id:'blocked',  label:'BLOCKED',     c:'var(--error)'  },
  ];

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', minHeight:0}}>
      <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center'}}>
        <div>
          <div style={{fontSize:20, color:'var(--text-primary)', fontWeight:500}}>Tasks</div>
          <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>
            3 waiting on you · 4 agents working · 2 blocked
          </div>
        </div>
        <div style={{flex:1}}/>
        <button className="mono small" style={{
          padding:'5px 12px', fontSize:11,
          background:'var(--accent)', color:'var(--bg-page)',
          border:'none', borderRadius:'var(--r-chip)', cursor:'pointer',
        }}>+ delegate task</button>
      </div>

      <div style={{flex:1, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', overflow:'hidden', minHeight:0}}>
        {COLS.map(col => {
          const items = TASKS.filter(t => t.col === col.id);
          return (
            <div key={col.id} style={{display:'flex', flexDirection:'column', borderRight:'1px solid var(--border-subtle)', minHeight:0}}>
              <div style={{padding:'12px 16px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center', gap:8}}>
                <span style={{width:6, height:6, borderRadius:3, background:col.c}}/>
                <div className="mono small caps" style={{color:'var(--text-secondary)', letterSpacing:'0.1em', flex:1}}>{col.label}</div>
                <div className="mono small" style={{color:'var(--text-tertiary)'}}>{items.length}</div>
              </div>
              <div style={{flex:1, overflow:'auto', padding:'10px', display:'flex', flexDirection:'column', gap:8}}>
                {items.map(t => <TaskCard key={t.id} t={t}/>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({ t }) {
  const isAnton = t.actor === 'Anton';
  const isNoel  = t.owner === 'Noel';
  return (
    <div style={{
      padding:'10px 12px', background:'var(--bg-surface)',
      border:'1px solid var(--border-subtle)',
      borderLeft: `2px solid ${isNoel ? 'var(--work)' : isAnton ? 'var(--accent)' : 'var(--border-strong)'}`,
      borderRadius:'var(--r-card)', cursor:'pointer',
    }}>
      <div style={{fontSize:12, color:'var(--text-primary)', lineHeight:1.4, marginBottom:6}}>
        {t.title}
      </div>
      <div style={{display:'flex', alignItems:'center', gap:6, marginBottom: (t.pct!=null || t.why) ? 8 : 0}}>
        <div className="mono small" style={{fontSize:10, color:'var(--text-tertiary)'}}>
          {isAnton ? '◎ ' : ''}{t.actor}
        </div>
        <div style={{flex:1}}/>
        <div className="mono small" style={{fontSize:10, color:'var(--text-tertiary)'}}>{t.age}</div>
        {t.risk && (
          <div className="mono small" style={{
            fontSize:9, padding:'1px 4px',
            color: t.risk==='H'?'var(--error)':t.risk==='M'?'var(--work)':'var(--text-tertiary)',
            border:`1px solid ${t.risk==='H'?'var(--error)':t.risk==='M'?'var(--work)':'var(--border-default)'}`,
            borderRadius:3,
          }}>{t.risk}</div>
        )}
      </div>
      {t.pct != null && (
        <>
          <div style={{height:3, background:'var(--bg-raised)', borderRadius:2, overflow:'hidden', marginBottom:6}}>
            <div style={{width:`${t.pct}%`, height:'100%', background: t.pct===100 ? 'var(--ok)' : 'var(--accent)'}}/>
          </div>
          <div className="mono small" style={{fontSize:10, color:'var(--text-secondary)'}}>
            {t.step} · <span style={{color:'var(--text-tertiary)'}}>{t.pct}%</span>
          </div>
        </>
      )}
      {t.why && t.pct == null && (
        <div className="mono small" style={{fontSize:10, color:'var(--text-tertiary)', lineHeight:1.5}}>
          {t.why}
        </div>
      )}
    </div>
  );
}

/* ═════════ AUTH / LOCK ═════════
   Cold-start screen: device is locked, Anton is idle. Warm, not hostile.
   Shows what Anton is about to resume, how many things happened while
   away, and an unlock prompt. Keyboard & face/touch. */
function LockScreen({ onUnlock }) {
  const [pw, setPw] = useState('');
  const [mode, setMode] = useState('face'); // 'face' | 'pw'

  return (
    <div style={{
      flex:1, display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg-page)', position:'relative',
    }}>
      {/* ambient glow */}
      <div style={{
        position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -50%)',
        width:480, height:480, borderRadius:240,
        background:'radial-gradient(circle, var(--accent-soft) 0%, transparent 60%)',
        pointerEvents:'none',
      }}/>

      <div style={{position:'relative', width:360, textAlign:'center'}}>
        {/* Anton glyph */}
        <div style={{marginBottom:28}}>
          <div className="mono" style={{
            fontSize:48, color:'var(--accent)', letterSpacing:'0.2em', marginBottom:8,
          }}>◎</div>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', letterSpacing:'0.3em', fontSize:10}}>
            ANTON
          </div>
        </div>

        {/* greeting */}
        <div style={{fontSize:18, color:'var(--text-primary)', marginBottom:6, fontWeight:400}}>
          Welcome back, Noel.
        </div>
        <div className="mono small" style={{color:'var(--text-tertiary)', marginBottom:32, lineHeight:1.6}}>
          You were away for 8h 24m.<br/>
          I handled 23 things. 3 need you.
        </div>

        {/* unlock */}
        {mode === 'face' ? (
          <div>
            <div style={{
              width:140, height:140, margin:'0 auto 16px',
              border:'1px solid var(--border-default)', borderRadius:70,
              display:'flex', alignItems:'center', justifyContent:'center',
              position:'relative',
            }}>
              <div style={{
                position:'absolute', inset:6, borderRadius:64,
                border:'2px solid var(--accent)',
                borderTopColor:'transparent', borderRightColor:'transparent',
                animation:'spin 2s linear infinite',
              }}/>
              <div className="mono" style={{fontSize:28, color:'var(--text-tertiary)'}}>⌐</div>
            </div>
            <div className="mono small" style={{color:'var(--text-secondary)', marginBottom:14}}>
              looking for you…
            </div>
            <button onClick={()=>setMode('pw')} className="mono small" style={{
              background:'transparent', border:'none', color:'var(--text-tertiary)',
              fontSize:11, cursor:'pointer', textDecoration:'underline',
            }}>use password instead</button>
          </div>
        ) : (
          <div>
            <input
              type="password"
              autoFocus
              value={pw}
              onChange={e=>setPw(e.target.value)}
              onKeyDown={e=> e.key === 'Enter' && onUnlock && onUnlock()}
              placeholder="password"
              className="mono"
              style={{
                width:'100%', padding:'10px 14px', fontSize:13,
                background:'var(--bg-surface)', border:'1px solid var(--border-default)',
                borderRadius:'var(--r-card)', color:'var(--text-primary)',
                textAlign:'center', letterSpacing:'0.2em', outline:'none', marginBottom:14,
              }}
            />
            <button
              onClick={()=>onUnlock && onUnlock()}
              className="mono small"
              style={{
                width:'100%', padding:'8px', fontSize:11,
                background:'var(--accent)', color:'var(--bg-page)',
                border:'none', borderRadius:'var(--r-chip)', cursor:'pointer',
                marginBottom:10,
              }}
            >unlock</button>
            <button onClick={()=>setMode('face')} className="mono small" style={{
              background:'transparent', border:'none', color:'var(--text-tertiary)',
              fontSize:11, cursor:'pointer',
            }}>back to face</button>
          </div>
        )}

        {/* what I'll show you */}
        <div style={{
          marginTop:40, paddingTop:20, borderTop:'1px solid var(--border-subtle)',
          textAlign:'left',
        }}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:10, letterSpacing:'0.1em'}}>
            WHEN YOU UNLOCK
          </div>
          <div className="mono small" style={{color:'var(--text-secondary)', lineHeight:1.8}}>
            <div>— Briefing is ready</div>
            <div>— 3 approvals waiting (1 red)</div>
            <div>— Julia moved her call to Wed</div>
          </div>
        </div>
      </div>

      <div style={{position:'absolute', bottom:24, left:0, right:0, textAlign:'center'}}>
        <div className="mono small" style={{color:'var(--text-tertiary)', fontSize:10, letterSpacing:'0.1em'}}>
          ◉ LOCAL · qwen3:8b · 1,487 mem · v0.4.2
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

Object.assign(window, { CalendarModule, InboxModule, TasksModule, LockScreen });
