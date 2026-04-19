/* ─────────── TIER 3 MODULES
   Home · Health · Vision · Voice · Vault · Privacy · Changelog · Help
   Utility-layer modules — less-used but important for a complete product.
   ─────────── */
const { useState: _t3useS } = React;

/* ═════════ HOME ═════════ */
function HomeModule({ onNav }) {
  const DEVICES = [
    { r:'Office',   n:'Desk lamp',       k:'light',  on:true,  v:'72%' },
    { r:'Office',   n:'Mac Studio',      k:'compute',on:true,  v:'idle · 18% CPU' },
    { r:'Office',   n:'Monitors · 2',    k:'display',on:true,  v:'focus mode' },
    { r:'Living',   n:'Floor lamp',      k:'light',  on:false, v:'—' },
    { r:'Living',   n:'Thermostat',      k:'climate',on:true,  v:'68°F · holding' },
    { r:'Kitchen',  n:'Ceiling',         k:'light',  on:true,  v:'40%' },
    { r:'Bedroom',  n:'Sleep lights',    k:'scene',  on:false, v:'armed · 10:30p' },
    { r:'Entry',    n:'Front door',      k:'lock',   on:true,  v:'locked' },
    { r:'Garage',   n:'Car · BMW',       k:'vehicle',on:true,  v:'72% charge' },
  ];
  const ROUTINES = [
    { t:'Morning',  h:'7:00a', d:'lights 30% · kitchen on · coffee 7:10', next:'tomorrow' },
    { t:'Focus',    h:'—',     d:'office lights 72% · door locked · phones silenced', next:'active now' },
    { t:'Evening',  h:'6:30p', d:'kitchen warm · floor lamp 50% · music low', next:'in 4h 12m' },
    { t:'Sleep',    h:'10:30p',d:'all lights off · doors locked · thermostat 65°F', next:'tonight' },
  ];
  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', minHeight:0, overflow:'auto'}}>
      <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)'}}>
        <div style={{fontSize:20, color:'var(--text-primary)', fontWeight:500}}>Home</div>
        <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>9 devices · 4 routines · focus mode active</div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 340px', flex:1, minHeight:0}}>
        <div style={{padding:'20px 24px', borderRight:'1px solid var(--border-subtle)', overflow:'auto'}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:12, fontSize:9}}>DEVICES</div>
          {['Office','Living','Kitchen','Bedroom','Entry','Garage'].map(room => (
            <div key={room} style={{marginBottom:16}}>
              <div className="mono small" style={{color:'var(--text-secondary)', marginBottom:6, fontSize:11}}>{room}</div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:6}}>
                {DEVICES.filter(d=>d.r===room).map((d,i)=>(
                  <div key={i} style={{
                    padding:'10px 12px', background:'var(--bg-surface)',
                    border:`1px solid ${d.on?'var(--border-default)':'var(--border-subtle)'}`,
                    borderLeft:`2px solid ${d.on?'var(--accent)':'var(--text-tertiary)'}`,
                    borderRadius:'var(--r-card)',
                  }}>
                    <div style={{fontSize:12, color:'var(--text-primary)', marginBottom:2}}>{d.n}</div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{d.k}</span>
                      <span className="mono small" style={{color: d.on?'var(--text-primary)':'var(--text-tertiary)', fontSize:10}}>{d.v}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{padding:'20px', overflow:'auto'}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:12, fontSize:9}}>ROUTINES</div>
          {ROUTINES.map((r,i) => (
            <div key={i} style={{padding:'12px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)', marginBottom:8}}>
              <div style={{display:'flex', alignItems:'baseline', marginBottom:4}}>
                <div style={{fontSize:13, color:'var(--text-primary)', flex:1}}>{r.t}</div>
                <div className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{r.h}</div>
              </div>
              <div style={{fontSize:11, color:'var(--text-secondary)', lineHeight:1.5, marginBottom:6}}>{r.d}</div>
              <div className="mono small" style={{color: r.next==='active now' ? 'var(--accent)' : 'var(--text-tertiary)', fontSize:10}}>◎ {r.next}</div>
            </div>
          ))}
          <div style={{marginTop:20, padding:'12px', background:'var(--accent-soft)', border:'1px solid var(--accent)', borderRadius:'var(--r-card)'}}>
            <div className="mono small caps" style={{color:'var(--accent)', marginBottom:6, fontSize:9}}>◎ ANTON PROPOSES</div>
            <div style={{fontSize:12, color:'var(--text-primary)', lineHeight:1.5}}>Turn off living-room floor lamp? It's been off 6h but scheduled to come on at 6:30p — and you're staying at the office tonight.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═════════ HEALTH ═════════ */
function HealthModule({ onNav }) {
  const METRICS = [
    { k:'sleep',      v:'7h 12m', sub:'last night · 92% efficiency', trend:'+8m' },
    { k:'resting HR', v:'54',     sub:'normal for you',              trend:'−2' },
    { k:'active min', v:'38',     sub:'of 45 goal',                  trend:'−7' },
    { k:'hydration',  v:'1.2L',   sub:'of 2.0L goal',                trend:'−20%' },
  ];
  const WEEK = [
    { d:'Mon', s:7.8, v:42 }, { d:'Tue', s:6.4, v:38 }, { d:'Wed', s:7.1, v:51 },
    { d:'Thu', s:7.2, v:38 }, { d:'Fri', s:8.1, v:62 }, { d:'Sat', s:8.8, v:72 }, { d:'Sun', s:7.9, v:28 },
  ];
  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', minHeight:0, overflow:'auto'}}>
      <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)'}}>
        <div style={{fontSize:20, color:'var(--text-primary)', fontWeight:500}}>Health</div>
        <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>Synced from Apple Health · last update 4m ago</div>
      </div>
      <div style={{padding:'24px', display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
        {METRICS.map(m=>(
          <div key={m.k} style={{padding:'16px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)'}}>
            <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:8, fontSize:9}}>{m.k}</div>
            <div style={{fontSize:28, color:'var(--text-primary)', fontWeight:500, fontFamily:'var(--font-mono)', marginBottom:2}}>{m.v}</div>
            <div className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{m.sub}</div>
            <div className="mono small" style={{marginTop:6, fontSize:10, color:m.trend.startsWith('+')?'var(--ok)':'var(--work)'}}>{m.trend} vs avg</div>
          </div>
        ))}
      </div>
      <div style={{padding:'0 24px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:24}}>
        <div style={{padding:'20px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)'}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:16, fontSize:9}}>SLEEP · LAST 7 DAYS (hours)</div>
          <div style={{display:'flex', alignItems:'flex-end', gap:8, height:140}}>
            {WEEK.map(d=>(
              <div key={d.d} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
                <div className="mono small" style={{color:'var(--text-primary)', fontSize:10}}>{d.s}</div>
                <div style={{width:'100%', height:`${(d.s/10)*100}%`, background:'var(--info)', borderRadius:'2px 2px 0 0'}}/>
                <div className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{d.d}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:'20px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)'}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:16, fontSize:9}}>ACTIVE MINUTES · LAST 7 DAYS</div>
          <div style={{display:'flex', alignItems:'flex-end', gap:8, height:140}}>
            {WEEK.map(d=>(
              <div key={d.d} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
                <div className="mono small" style={{color:'var(--text-primary)', fontSize:10}}>{d.v}</div>
                <div style={{width:'100%', height:`${(d.v/80)*100}%`, background:'var(--ok)', borderRadius:'2px 2px 0 0'}}/>
                <div className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{d.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{margin:'0 24px 24px', padding:'14px 16px', background:'var(--accent-soft)', border:'1px solid var(--accent)', borderRadius:'var(--r-card)'}}>
        <div className="mono small caps" style={{color:'var(--accent)', marginBottom:8, fontSize:9}}>◎ ANTON OBSERVES</div>
        <div style={{fontSize:13, color:'var(--text-primary)', lineHeight:1.7}}>
          Sleep trended down slightly Tue–Thu (6.4h, 7.1h, 7.2h). Looking at your calendar, you ran late calls those nights.
          Want me to hold your 9pm+ slot this week? You have one already — the Thu launch sync.
        </div>
      </div>
    </div>
  );
}

/* ═════════ VISION ═════════ */
function VisionModule({ onNav }) {
  const EVENTS = [
    { t:'14:02', src:'screen',  what:'Opened onboarding.md in VS Code', act:'none' },
    { t:'13:58', src:'camera',  what:'Person detected · Noel at desk',   act:'resumed assistance' },
    { t:'13:41', src:'screen',  what:'Figma · board deck open',          act:'indexed slides for memory' },
    { t:'13:12', src:'camera',  what:'Left desk for 22m',                 act:'paused ambient listening' },
    { t:'12:48', src:'screen',  what:'Slack · Sarah thread',              act:'extracted launch-copy context' },
    { t:'11:30', src:'camera',  what:'New person in frame · unrecognized', act:'asked before listening' },
  ];
  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', minHeight:0}}>
      <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center'}}>
        <div>
          <div style={{fontSize:20, color:'var(--text-primary)', fontWeight:500}}>Vision</div>
          <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>Screen + camera awareness · fully on-device</div>
        </div>
        <div style={{flex:1}}/>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <div className="mono small" style={{display:'flex', alignItems:'center', gap:6, color:'var(--ok)'}}>
            <span style={{width:8, height:8, background:'var(--ok)', borderRadius:4, animation:'pulse 2s infinite'}}/>
            <span>screen</span>
          </div>
          <div className="mono small" style={{display:'flex', alignItems:'center', gap:6, color:'var(--ok)'}}>
            <span style={{width:8, height:8, background:'var(--ok)', borderRadius:4}}/>
            <span>camera</span>
          </div>
        </div>
      </div>
      <div style={{flex:1, display:'grid', gridTemplateColumns:'1fr 380px', minHeight:0}}>
        <div style={{padding:'24px', overflow:'auto', borderRight:'1px solid var(--border-subtle)'}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24}}>
            <div style={{aspectRatio:'16/9', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:20}}>
              <div className="mono" style={{fontSize:32, color:'var(--text-tertiary)'}}>▦</div>
              <div className="mono small caps" style={{color:'var(--text-tertiary)', fontSize:9}}>SCREEN · what Anton sees</div>
              <div style={{fontSize:11, color:'var(--text-secondary)', textAlign:'center', lineHeight:1.5}}>Main display · VS Code + Slack<br/><span style={{color:'var(--text-tertiary)'}}>anonymized thumbnail</span></div>
            </div>
            <div style={{aspectRatio:'16/9', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:20}}>
              <div className="mono" style={{fontSize:32, color:'var(--text-tertiary)'}}>◉</div>
              <div className="mono small caps" style={{color:'var(--text-tertiary)', fontSize:9}}>CAMERA · presence only</div>
              <div style={{fontSize:11, color:'var(--text-secondary)', textAlign:'center', lineHeight:1.5}}>1 person detected<br/><span style={{color:'var(--text-tertiary)'}}>Noel · looking at screen</span></div>
            </div>
          </div>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:12, fontSize:9}}>RECENT EVENTS</div>
          {EVENTS.map((e,i)=>(
            <div key={i} style={{padding:'10px 0', borderBottom:'1px solid var(--border-subtle)', display:'flex', gap:12}}>
              <span className="mono small" style={{color:'var(--text-tertiary)', width:44, fontSize:10}}>{e.t}</span>
              <span className="mono small" style={{color:'var(--accent)', width:56, fontSize:10}}>{e.src}</span>
              <span style={{flex:1, fontSize:12, color:'var(--text-primary)'}}>{e.what}</span>
              <span className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{e.act}</span>
            </div>
          ))}
        </div>
        <div style={{padding:'20px', overflow:'auto'}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:12, fontSize:9}}>CONTROLS</div>
          {[
            { k:'screen capture',   d:'every 30s · on-device OCR', on:true },
            { k:'camera presence',  d:'detection only · no frames stored', on:true },
            { k:'clipboard watch',  d:'off — too noisy', on:false },
            { k:'pause in meetings', d:'auto-detect FaceTime/Zoom/Meet', on:true },
            { k:'data retention',   d:'7 days on device · never cloud', on:true },
          ].map((c,i)=>(
            <div key={i} style={{padding:'12px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)', marginBottom:6, display:'flex', alignItems:'center', gap:12}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12, color:'var(--text-primary)', marginBottom:2}}>{c.k}</div>
                <div className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{c.d}</div>
              </div>
              <div style={{width:30, height:16, background:c.on?'var(--accent)':'var(--border-default)', borderRadius:8, position:'relative', transition:'background 120ms'}}>
                <div style={{position:'absolute', top:2, left:c.on?16:2, width:12, height:12, background:'var(--bg-page)', borderRadius:6, transition:'left 120ms'}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
    </div>
  );
}

/* ═════════ VOICE ═════════ */
function VoiceModule({ onNav }) {
  const TRANSCRIPTS = [
    { id:0, t:'Today, 2:14p', dur:'1m 42s', title:'Quick standup', preview:'Noel: Marcus, where are we on the PRD...' },
    { id:1, t:'Today, 10:40a', dur:'14s',   title:'Calendar change', preview:'Noel: move my 2pm to 3pm.' },
    { id:2, t:'Yesterday, 6:22p', dur:'8m 10s', title:'Q1 launch debrief', preview:'Noel: think about creator tier as a separate brand...' },
    { id:3, t:'Yesterday, 11:03a', dur:'42s', title:'Memory note',      preview:'Noel: remember that Diana\'s on PTO next week.' },
    { id:4, t:'Apr 12, 9:15a',     dur:'3m 4s', title:'Morning walk',    preview:'Noel: let\'s block Thu afternoon for writing...' },
  ];
  const [selId, setSelId] = useState(0);
  const sel = TRANSCRIPTS.find(t=>t.id===selId);
  return (
    <div style={{display:'flex', flex:1, minHeight:0}}>
      <div style={{width:360, borderRight:'1px solid var(--border-subtle)', display:'flex', flexDirection:'column'}}>
        <div style={{padding:'16px 20px', borderBottom:'1px solid var(--border-subtle)'}}>
          <div style={{fontSize:20, color:'var(--text-primary)', fontWeight:500}}>Voice</div>
          <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>On-device STT · nothing leaves your Mac</div>
        </div>
        <div style={{flex:1, overflow:'auto'}}>
          {TRANSCRIPTS.map(t=>(
            <div key={t.id} onClick={()=>setSelId(t.id)} style={{
              padding:'12px 20px', cursor:'pointer',
              borderBottom:'1px solid var(--border-subtle)',
              background: selId===t.id ? 'var(--bg-hover)' : 'transparent',
              borderLeft: `2px solid ${selId===t.id ? 'var(--accent)' : 'transparent'}`,
            }}>
              <div style={{display:'flex', alignItems:'baseline', marginBottom:4}}>
                <div style={{fontSize:13, color:'var(--text-primary)', flex:1}}>{t.title}</div>
                <div className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{t.dur}</div>
              </div>
              <div className="mono small" style={{color:'var(--text-tertiary)', fontSize:10, marginBottom:6}}>{t.t}</div>
              <div style={{fontSize:11, color:'var(--text-secondary)', lineHeight:1.5, overflow:'hidden', textOverflow:'ellipsis', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical'}}>{t.preview}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0}}>
        <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)', display:'flex', alignItems:'center'}}>
          <div>
            <div style={{fontSize:16, color:'var(--text-primary)'}}>{sel.title}</div>
            <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>{sel.t} · {sel.dur}</div>
          </div>
          <div style={{flex:1}}/>
          <button className="mono small" style={{padding:'5px 10px', fontSize:11, background:'transparent', color:'var(--text-secondary)', border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer'}}>delete</button>
        </div>
        <div style={{flex:1, overflow:'auto', padding:'24px 32px'}}>
          <div style={{padding:'12px 16px', background:'var(--accent-soft)', border:'1px solid var(--accent)', borderRadius:'var(--r-card)', marginBottom:20}}>
            <div className="mono small caps" style={{color:'var(--accent)', marginBottom:6, fontSize:9}}>◎ ANTON SUMMARY</div>
            <div style={{fontSize:13, color:'var(--text-primary)', lineHeight:1.6}}>
              You told Marcus to prioritize §5 error flows in the PRD. Asked for a draft by EOD. Noted: creator tier "might be its own brand."
            </div>
          </div>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:12, fontSize:9}}>TRANSCRIPT</div>
          {[
            { s:'Noel',   t:'Alright — where are we on the PRD?' },
            { s:'Marcus', t:'§1–4 are drafted. §5 error flows — I have open questions on the passkey fallback.' },
            { s:'Noel',   t:'Ship a first draft by EOD. I\'ll review tonight. And think about creator tier as a separate brand, not a feature.' },
            { s:'Marcus', t:'Noted. Separate brand — that changes the pricing page too.' },
            { s:'Noel',   t:'Exactly. Loop Alex in.' },
          ].map((l,i)=>(
            <div key={i} style={{padding:'8px 0', display:'flex', gap:12}}>
              <span className="mono small" style={{color:l.s==='Noel'?'var(--accent)':'var(--text-secondary)', width:56, fontSize:10}}>{l.s}</span>
              <span style={{flex:1, fontSize:13, color:'var(--text-primary)', lineHeight:1.6}}>{l.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═════════ VAULT ═════════ */
function VaultModule({ onNav }) {
  const SECRETS = [
    { k:'Anthropic API key',     s:'sk-ant-•••••••',     who:'Anton (deep research)', last:'Apr 14', scope:'cloud fallback' },
    { k:'OpenAI API key',        s:'sk-•••••••••••',     who:'Ada, Felix',             last:'Apr 13', scope:'code agents' },
    { k:'AWS deploy token',      s:'AKIA•••••••',        who:'James',                  last:'Apr 10', scope:'staging + prod deploys' },
    { k:'Stripe restricted key', s:'rk_live_•••',        who:'Diana',                  last:'Apr 09', scope:'read-only billing' },
    { k:'Slack bot token',       s:'xoxb-•••••••',       who:'Anton',                  last:'Apr 08', scope:'post + react' },
    { k:'Gmail OAuth refresh',   s:'1//0e-•••••',        who:'Anton',                  last:'Apr 08', scope:'read + draft' },
    { k:'Notion integration',    s:'secret_•••••',       who:'Sarah',                  last:'Apr 05', scope:'read workspace' },
    { k:'GitHub fine-grained',   s:'ghp_•••••••',        who:'Ada, Marcus, James',     last:'Apr 02', scope:'2 repos · read+write' },
  ];
  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', minHeight:0}}>
      <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)'}}>
        <div style={{display:'flex', alignItems:'baseline'}}>
          <div style={{fontSize:20, color:'var(--text-primary)', fontWeight:500}}>Vault</div>
          <div className="mono small" style={{color:'var(--text-tertiary)', marginLeft:10}}>8 secrets · sealed to this device · unlocked via biometric</div>
        </div>
      </div>
      <div style={{flex:1, overflow:'auto'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{borderBottom:'1px solid var(--border-subtle)'}}>
              <th style={thStyle}>key</th>
              <th style={thStyle}>value</th>
              <th style={thStyle}>used by</th>
              <th style={thStyle}>scope</th>
              <th style={thStyle}>last used</th>
              <th style={{...thStyle, width:80}}></th>
            </tr>
          </thead>
          <tbody>
            {SECRETS.map((s,i)=>(
              <tr key={i} style={{borderBottom:'1px solid var(--border-subtle)'}}>
                <td style={tdStyle}><span style={{color:'var(--text-primary)'}}>{s.k}</span></td>
                <td style={tdStyle}><span className="mono" style={{color:'var(--text-tertiary)', fontSize:11}}>{s.s}</span></td>
                <td style={tdStyle}>{s.who}</td>
                <td style={tdStyle}>{s.scope}</td>
                <td style={tdStyle}>{s.last}</td>
                <td style={tdStyle}>
                  <button className="mono small" style={{padding:'3px 8px', fontSize:10, background:'transparent', color:'var(--text-secondary)', border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer'}}>reveal</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{padding:'16px 24px', borderTop:'1px solid var(--border-subtle)', background:'var(--bg-surface)'}}>
        <div className="mono small caps" style={{color:'var(--accent)', marginBottom:6, fontSize:9}}>◎ ANTON NOTE</div>
        <div style={{fontSize:12, color:'var(--text-primary)', lineHeight:1.6}}>
          Anthropic key hasn't rotated in 54 days. Your policy says 60. Want me to rotate it Thursday after the launch?
        </div>
      </div>
    </div>
  );
}

/* ═════════ PRIVACY ═════════ */
function PrivacyModule({ onNav }) {
  const PRINCIPLES = [
    { t:'Local by default',  d:'All memory, all conversations, all inference — on your Mac. Claude is used only when you invoke deep research.' },
    { t:'Nothing is shared', d:'No telemetry, no crash reports, no usage pings. Anton phones home zero times per day.' },
    { t:'You hold the keys',  d:'Memory is encrypted at rest using a key derived from your system passcode. We can\'t decrypt it.' },
    { t:'Auditable',          d:'Every action Anton or any agent takes is logged and inspectable. See the Log module.' },
  ];
  const DATA = [
    { k:'Memory items',       c:1487,  loc:'on-device',         sizable:'312 MB' },
    { k:'Documents indexed',  c:92,    loc:'on-device',         sizable:'184 MB' },
    { k:'Voice transcripts',  c:42,    loc:'on-device · 7d ttl', sizable:'14 MB' },
    { k:'Activity log',       c:8104,  loc:'on-device · 90d',    sizable:'22 MB' },
    { k:'Screen snapshots',   c:2408,  loc:'on-device · 7d ttl', sizable:'1.2 GB' },
  ];
  const TRUSTED = [
    { n:'Claude (Anthropic)', purp:'deep research · invoked by /deep',    last:'14m ago', v:'$47 this month' },
    { n:'Qwen3 via Ollama',   purp:'default LLM · runs on your Mac',       last:'14s ago', v:'$0' },
  ];
  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', minHeight:0, overflow:'auto'}}>
      <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)'}}>
        <div style={{fontSize:20, color:'var(--text-primary)', fontWeight:500}}>Privacy</div>
        <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>The promises · the data · the exceptions</div>
      </div>
      <div style={{padding:'24px'}}>
        <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:14, fontSize:9}}>PRINCIPLES</div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12, marginBottom:32}}>
          {PRINCIPLES.map((p,i)=>(
            <div key={i} style={{padding:'16px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderLeft:'2px solid var(--accent)', borderRadius:'var(--r-card)'}}>
              <div style={{fontSize:14, color:'var(--text-primary)', marginBottom:6, fontWeight:500}}>{p.t}</div>
              <div style={{fontSize:12, color:'var(--text-secondary)', lineHeight:1.6}}>{p.d}</div>
            </div>
          ))}
        </div>

        <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:14, fontSize:9}}>DATA ANTON HOLDS</div>
        <div style={{border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)', overflow:'hidden', marginBottom:32}}>
          {DATA.map((d,i)=>(
            <div key={i} style={{padding:'12px 16px', display:'flex', alignItems:'center', gap:16, borderBottom: i<DATA.length-1?'1px solid var(--border-subtle)':'none', background:'var(--bg-surface)'}}>
              <div style={{flex:1, fontSize:13, color:'var(--text-primary)'}}>{d.k}</div>
              <div className="mono small" style={{color:'var(--text-secondary)', width:120, textAlign:'right', fontSize:11}}>{d.c.toLocaleString()} items</div>
              <div className="mono small" style={{color:'var(--text-tertiary)', width:200, fontSize:11}}>{d.loc}</div>
              <div className="mono small" style={{color:'var(--text-tertiary)', width:70, textAlign:'right', fontSize:11}}>{d.sizable}</div>
              <button className="mono small" style={{padding:'3px 8px', fontSize:10, background:'transparent', color:'var(--text-secondary)', border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer'}}>export</button>
            </div>
          ))}
        </div>

        <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:14, fontSize:9}}>THIRD PARTIES ANTON TALKS TO</div>
        {TRUSTED.map((t,i)=>(
          <div key={i} style={{padding:'14px 16px', background:'var(--bg-surface)', border:'1px solid var(--border-subtle)', borderRadius:'var(--r-card)', marginBottom:8, display:'flex', alignItems:'center', gap:16}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13, color:'var(--text-primary)', marginBottom:2}}>{t.n}</div>
              <div className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{t.purp}</div>
            </div>
            <div className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>last used {t.last}</div>
            <div className="mono small" style={{color:'var(--text-secondary)', fontSize:11}}>{t.v}</div>
          </div>
        ))}

        <div style={{marginTop:24, display:'flex', gap:8}}>
          <button className="mono small" style={{padding:'8px 14px', fontSize:11, background:'transparent', color:'var(--text-secondary)', border:'1px solid var(--border-default)', borderRadius:'var(--r-chip)', cursor:'pointer'}}>export everything</button>
          <button className="mono small" style={{padding:'8px 14px', fontSize:11, background:'transparent', color:'var(--error)', border:'1px solid var(--error)', borderRadius:'var(--r-chip)', cursor:'pointer'}}>factory reset Anton</button>
        </div>
      </div>
    </div>
  );
}

/* ═════════ CHANGELOG ═════════ */
function ChangelogModule({ onNav }) {
  const RELEASES = [
    { v:'0.4.2', d:'Apr 14, 2025', k:'current', items:[
      ['new',  'Research module', 'Deep research now shows reasoning chain and sources for every study.'],
      ['new',  'Tasks board',      'Four-column board replaces the old inbox-style view.'],
      ['fix',  'Vision pause',     'Auto-pauses when you\'re in FaceTime/Zoom/Meet. Used to miss Meet.'],
      ['fix',  'Calendar holds',   'Reshuffled holds weren\'t showing "moved from" context. Fixed.'],
    ]},
    { v:'0.4.1', d:'Apr 7, 2025', k:'past', items:[
      ['new',  'Lock screen',      'Warm welcome-back with summary of what Anton handled while away.'],
      ['perf', 'Memory search',    '2.4× faster on large memory sets. Retro-index on first launch after update.'],
      ['fix',  'Slack handoff',    'Agents could double-post on reconnect. Now idempotent.'],
    ]},
    { v:'0.4.0', d:'Mar 30, 2025', k:'past', items:[
      ['new',  'Departments',       'Agents grouped by department. Handoff heatmap in Team view.'],
      ['new',  'Inbox triage',      'Anton drafts/files/archives/flags every thread.'],
      ['new',  'Expense categories','Auto-categorization with anomaly flags.'],
      ['sys',  'Qwen3 8B default',  'Local LLM upgrade. Noticeably better at drafting.'],
    ]},
    { v:'0.3.9', d:'Mar 22, 2025', k:'past', items:[
      ['new',  'Memory browser',    'Highlights, sources, confidence per item.'],
      ['fix',  'Approval timeouts', 'Red-tier approvals no longer silently auto-decline.'],
    ]},
  ];
  const KIND_C = { new:'var(--ok)', fix:'var(--info)', perf:'var(--accent)', sys:'var(--work)' };

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', minHeight:0, overflow:'auto'}}>
      <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)'}}>
        <div style={{fontSize:20, color:'var(--text-primary)', fontWeight:500}}>Changelog</div>
        <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>What changed, when, and why it matters</div>
      </div>
      <div style={{padding:'24px', maxWidth:860}}>
        {RELEASES.map((r,ri)=>(
          <div key={ri} style={{marginBottom:32}}>
            <div style={{display:'flex', alignItems:'baseline', gap:12, marginBottom:14}}>
              <div className="mono" style={{fontSize:20, color: r.k==='current'?'var(--accent)':'var(--text-primary)', fontWeight:500}}>v{r.v}</div>
              <div className="mono small" style={{color:'var(--text-tertiary)'}}>{r.d}</div>
              {r.k==='current' && <div className="mono small" style={{padding:'2px 8px', background:'var(--accent-soft)', color:'var(--accent)', border:'1px solid var(--accent)', borderRadius:'var(--r-chip)', fontSize:9}}>CURRENT</div>}
            </div>
            {r.items.map((it,i)=>(
              <div key={i} style={{display:'flex', gap:12, padding:'10px 0', borderBottom: i<r.items.length-1?'1px solid var(--border-subtle)':'none'}}>
                <div className="mono small" style={{width:44, fontSize:9, color:KIND_C[it[0]], letterSpacing:'0.08em', textTransform:'uppercase', paddingTop:3}}>{it[0]}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13, color:'var(--text-primary)', marginBottom:3}}>{it[1]}</div>
                  <div style={{fontSize:12, color:'var(--text-secondary)', lineHeight:1.5}}>{it[2]}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═════════ HELP ═════════ */
function HelpModule({ onNav }) {
  const SHORTCUTS = [
    ['⌘ K',      'Command palette'],
    ['⌘ ⇧ A',    'Ask Anton · text'],
    ['⌘ Space',  'Ask Anton · voice'],
    ['G A',      'Go to Mission Control'],
    ['G B',      'Go to Briefing'],
    ['G P',      'Go to Approvals'],
    ['⌘ ⇧ P',   'Approve pending · first in queue'],
    ['⌘ L',      'Lock Anton'],
    ['⌘ .',      'Pause all agents'],
  ];
  const TOPICS = [
    { k:'Concepts', items:[
      ['What Anton is',          'The orchestrator. Thinks, plans, delegates, summarizes. Talks to you.'],
      ['Agents',                  '15 specialists owned by Anton. Engineer, marketer, analyst, etc.'],
      ['Trust tiers',             'Green = auto. Amber = auto with notice. Red = ask first.'],
      ['Memory',                  'What Anton remembers. Facts, decisions, preferences, conversations.'],
      ['Hands',                   'External integrations Anton can reach into.'],
    ]},
    { k:'How-to', items:[
      ['Delegate a task',         'Ask Anton. It picks the right agent. Or name one: "@Marcus draft X."'],
      ['Stop an agent',           '⌘ . pauses all. Or click the agent and hit "halt" in detail.'],
      ['Teach Anton a preference','Tell it once, in any module. "Remember I prefer bullets." It marks as preference.'],
      ['Connect a new tool',      'Hands module → "+ add integration". OAuth or API key.'],
      ['Change what\'s auto-approved','Settings → Trust tiers. Per-agent per-action.'],
    ]},
    { k:'If something goes wrong', items:[
      ['Undo a deploy',           'Log module → find the event → "revert" in the detail. Works up to 72h after.'],
      ['Agent is stuck',          'Team module. Agents stuck >30m auto-flag red. Click "inspect last step".'],
      ['Memory feels wrong',      'Memory Browser. Any item can be edited or deleted. Confidence score shown.'],
      ['I want to start over',   'Privacy module → "factory reset Anton". Irreversible. Exports first if you\'re unsure.'],
    ]},
  ];
  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', minHeight:0, overflow:'auto'}}>
      <div style={{padding:'16px 24px', borderBottom:'1px solid var(--border-subtle)'}}>
        <div style={{fontSize:20, color:'var(--text-primary)', fontWeight:500}}>Help</div>
        <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>Shortcuts · concepts · how-to · troubleshooting</div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'260px 1fr', flex:1, minHeight:0}}>
        <div style={{padding:'20px', borderRight:'1px solid var(--border-subtle)', overflow:'auto'}}>
          <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:12, fontSize:9}}>SHORTCUTS</div>
          {SHORTCUTS.map(([k,l],i)=>(
            <div key={i} style={{display:'flex', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border-subtle)'}}>
              <Kbd>{k}</Kbd>
              <div style={{flex:1, fontSize:12, color:'var(--text-secondary)', marginLeft:10}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{padding:'24px 32px', overflow:'auto', maxWidth:780}}>
          {TOPICS.map((t,ti)=>(
            <div key={ti} style={{marginBottom:32}}>
              <div style={{fontSize:16, color:'var(--text-primary)', fontWeight:500, marginBottom:14}}>{t.k}</div>
              {t.items.map(([title,body],i)=>(
                <div key={i} style={{padding:'12px 0', borderBottom:'1px solid var(--border-subtle)'}}>
                  <div style={{fontSize:13, color:'var(--text-primary)', marginBottom:4}}>{title}</div>
                  <div style={{fontSize:12, color:'var(--text-secondary)', lineHeight:1.6}}>{body}</div>
                </div>
              ))}
            </div>
          ))}
          <div style={{marginTop:20, padding:'16px', background:'var(--accent-soft)', border:'1px solid var(--accent)', borderRadius:'var(--r-card)'}}>
            <div className="mono small caps" style={{color:'var(--accent)', marginBottom:8, fontSize:9}}>◎ OR JUST ASK ANTON</div>
            <div style={{fontSize:13, color:'var(--text-primary)', lineHeight:1.6}}>
              Say or type "how do I..." and Anton will walk you through it — and do the steps for you if you want.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeModule, HealthModule, VisionModule, VoiceModule, VaultModule, PrivacyModule, ChangelogModule, HelpModule });
