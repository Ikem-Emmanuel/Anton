// Main app — orchestrates screens in a single canvas
const { useState, useEffect } = React;

const TWEAKS = /*EDITMODE-BEGIN*/{
  "theme": "warm-dark",
  "mission_control_variant": "activity",
  "density": "comfortable",
  "accent": "gold",
  "show_keyboard_hints": true
}/*EDITMODE-END*/;

const ACCENTS = {
  gold:   { dark:'#C4943A', light:'#925E0B', soft:'rgba(196,148,58,0.14)', softLight:'rgba(146,94,11,0.12)' },
  cyan:   { dark:'#5EC4C0', light:'#0E7C78', soft:'rgba(94,196,192,0.14)', softLight:'rgba(14,124,120,0.12)' },
  violet: { dark:'#A78BE8', light:'#6B4BC7', soft:'rgba(167,139,232,0.14)', softLight:'rgba(107,75,199,0.12)' },
  coral:  { dark:'#E4938E', light:'#B14842', soft:'rgba(228,147,142,0.14)', softLight:'rgba(177,72,66,0.12)' },
  green:  { dark:'#7BC195', light:'#2F7554', soft:'rgba(123,193,149,0.14)', softLight:'rgba(47,117,84,0.12)' },
};

function applyAccent(key, theme) {
  const a = ACCENTS[key] || ACCENTS.gold;
  const isLight = theme === 'light';
  document.documentElement.style.setProperty('--accent', isLight ? a.light : a.dark);
  document.documentElement.style.setProperty('--accent-soft', isLight ? a.softLight : a.soft);
}

function applyDensity(d) {
  const root = document.documentElement;
  if (d === 'compact') {
    root.style.setProperty('--r-card', '6px');
    root.style.setProperty('--r-panel', '8px');
    root.style.fontSize = '13px';
  } else if (d === 'spacious') {
    root.style.setProperty('--r-card', '10px');
    root.style.setProperty('--r-panel', '14px');
    root.style.fontSize = '15px';
  } else {
    root.style.setProperty('--r-card', '8px');
    root.style.setProperty('--r-panel', '12px');
    root.style.fontSize = '14px';
  }
}

function loadTweaks() {
  try { return { ...TWEAKS, ...JSON.parse(localStorage.getItem('anton.tweaks') || '{}') }; }
  catch { return TWEAKS; }
}

function Titlebar() {
  return (
    <div style={{
      height:32, borderBottom:'1px solid var(--border-subtle)',
      display:'flex', alignItems:'center', gap:14, padding:'0 14px',
      background:'var(--bg-page)',
    }}>
      <div className="mono" style={{fontSize:12, color:'var(--accent)', letterSpacing:'0.08em'}}>◉ ANTON</div>
      <div style={{width:1, height:14, background:'var(--border-default)'}}/>
      <span className="mono small" style={{color:'var(--text-tertiary)'}}>noel · personal OS</span>
      <span style={{flex:1}}/>
      <span className="mono small" style={{color:'var(--text-tertiary)'}}>14:02 · 3d 14h</span>
      <span style={{width:1, height:14, background:'var(--border-default)'}}/>
      <span className="mono small" style={{color:'var(--text-secondary)'}}>
        <Kbd>⌘</Kbd> <Kbd>K</Kbd> <span style={{marginLeft:4}}>command</span>
      </span>
    </div>
  );
}

function LeftRail({ active, onNav, showHints = true }) {
  const items = [
    { sec:'OVERVIEW' },
    { id:'mc',       label:'Mission Control', glyph:'◎', k:'G A' },
    { id:'brief',    label:'Briefing',        glyph:'☰', k:'G B' },
    { id:'pending',  label:'Approvals',       glyph:'✓', k:'G P', badge: 5 },

    { sec:'DO' },
    { id:'tasks',    label:'Tasks',           glyph:'▤', k:'G K', badge: 3 },
    { id:'inbox',    label:'Inbox',           glyph:'▥', k:'G I', badge: 4 },
    { id:'calendar', label:'Calendar',        glyph:'▦', k:'G D' },
    { id:'docs',     label:'Documents',       glyph:'◨', k:'G O' },
    { id:'chat',     label:'Chat',            glyph:'◇', k:'G C' },

    { sec:'KNOW' },
    { id:'research', label:'Research',        glyph:'❃', k:'G R' },
    { id:'people',   label:'People',          glyph:'◉', k:'G E' },
    { id:'memory',   label:'Memory',          glyph:'■', k:'G M' },

    { sec:'RUN' },
    { id:'expenses', label:'Expenses',        glyph:'$', k:'G X' },
    { id:'travel',   label:'Travel',          glyph:'✈', k:'G V' },
    { id:'usage',    label:'Usage',           glyph:'◐', k:'G U' },

    { sec:'MIND' },
    { id:'team',     label:'Team',            glyph:'⚏', k:'G T' },
    { id:'log',      label:'Log',             glyph:'◌', k:'G L' },
    { id:'hands',    label:'Hands',           glyph:'◈', k:'G H' },

    { sec:'SYSTEM' },
    { id:'settings', label:'Settings',        glyph:'⋯', k:'G S' },
    { id:'lock',     label:'Lock',            glyph:'⌐', k:'⌘ L' },
  ];
  return (
    <div style={{
      width:220, borderRight:'1px solid var(--border-subtle)',
      display:'flex', flexDirection:'column',
      background:'var(--bg-page)', minHeight:0,
    }}>
      <div style={{flex:1, overflowY:'auto', padding:'10px 8px', display:'flex', flexDirection:'column', gap:1}}>
      {items.map((i, idx) => {
        if (i.sec) return (
          <div key={'sec'+idx} className="mono small caps" style={{
            color:'var(--text-tertiary)', letterSpacing:'0.1em', fontSize:9,
            padding: idx===0 ? '2px 10px 6px' : '12px 10px 4px',
          }}>{i.sec}</div>
        );
        return (
          <button key={i.id} onClick={()=>onNav(i.id)} style={{
            display:'flex', alignItems:'center', gap:10, padding:'5px 10px',
            background: active===i.id ? 'var(--bg-hover)' : 'transparent',
            color: active===i.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            border:'none', borderRadius:6, cursor:'pointer', textAlign:'left', fontSize:13,
            fontFamily:'var(--font-sans)',
          }}>
            <span className="mono" style={{width:16, color: active===i.id ? 'var(--accent)' : 'var(--text-tertiary)'}}>{i.glyph}</span>
            <span style={{flex:1}}>{i.label}</span>
            {i.badge && <span className="mono small" style={{color:'var(--work)'}}>{i.badge}</span>}
            {showHints && <span className="mono small" style={{color:'var(--text-tertiary)', fontSize:10}}>{i.k}</span>}
          </button>
        );
      })}
      </div>
      <div style={{padding:'10px 12px', borderTop:'1px solid var(--border-subtle)', flexShrink:0}}>
        <div className="mono small" style={{color:'var(--text-secondary)', lineHeight:1.5, fontSize:10}}>
          <div>qwen3:8b <span style={{color:'var(--ok)'}}>●</span> · mem 1,487</div>
          <div style={{color:'var(--text-tertiary)'}}>claude ● fallback</div>
        </div>
      </div>
    </div>
  );
}

function CommandBar() {
  return (
    <div style={{
      height:48, borderTop:'1px solid var(--border-subtle)',
      display:'flex', alignItems:'center', padding:'0 16px', gap:12,
      background:'var(--bg-page)',
    }}>
      <span className="mono" style={{color:'var(--accent)'}}>▸</span>
      <input placeholder="delegate, ask, or just type…" className="mono" style={{
        flex:1, background:'transparent', border:'none', outline:'none',
        color:'var(--text-primary)', fontSize:14,
      }}/>
      <span className="mono small" style={{color:'var(--text-tertiary)'}}>@local</span>
      <button className="mono small" style={{
        background:'transparent', border:'1px solid var(--border-default)', color:'var(--text-secondary)',
        padding:'3px 8px', borderRadius:'var(--r-chip)', cursor:'pointer',
      }}>mic</button>
      <Kbd>⌘</Kbd><Kbd>⏎</Kbd>
    </div>
  );
}

/* ─────────── Section wrapper used across the canvas ─────────── */
function Frame({ label, sub, w = 1280, h = 820, children, chrome = true }) {
  return (
    <div style={{display:'flex', flexDirection:'column', flexShrink:0}}>
      <div style={{marginBottom:10}}>
        <div className="mono" style={{fontSize:11, color:'var(--accent)', letterSpacing:'0.1em', textTransform:'uppercase'}}>{label}</div>
        {sub && <div className="mono small" style={{color:'var(--text-tertiary)', marginTop:2}}>{sub}</div>}
      </div>
      <div style={{
        width:w, height:h, background:'var(--bg-page)',
        border:'1px solid var(--border-default)', borderRadius:chrome?'var(--r-panel)':0,
        overflow:'hidden', boxShadow:'0 8px 30px rgba(0,0,0,0.4)', display:'flex', flexDirection:'column',
      }}>
        {children}
      </div>
    </div>
  );
}

/* ─────────── Full web shell frame ─────────── */
function WebShell({ center, activeRail = 'mc', trayMode = 'normal', showHints = true, onNav }) {
  return (
    <>
      <Titlebar/>
      <div style={{flex:1, display:'flex', minHeight:0}}>
        <LeftRail active={activeRail} onNav={onNav || (()=>{})} showHints={showHints}/>
        <div style={{flex:1, minWidth:0, background:'var(--bg-page)', display:'flex', flexDirection:'column'}}>
          {center}
        </div>
        <div style={{
          width: trayMode==='hidden' ? 0 : trayMode==='collapsed' ? 48 : 320,
          display: trayMode==='hidden' ? 'none' : 'block',
          borderLeft: trayMode==='hidden' ? 'none' : '1px solid var(--border-subtle)',
          background:'var(--bg-page)',
        }}>
          {trayMode === 'empty' && <ApprovalTrayEmpty/>}
          {trayMode === 'normal' && <ApprovalTray/>}
          {trayMode === 'collapsed' && (
            <div style={{padding:10, display:'flex', flexDirection:'column', alignItems:'center', gap:12}}>
              <div className="mono small caps" style={{color:'var(--text-tertiary)', writingMode:'vertical-rl'}}>PENDING</div>
              <div style={{width:24, height:24, borderRadius:12, background:'var(--work)', color:'var(--bg-page)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontFamily:'var(--font-mono)'}}>5</div>
            </div>
          )}
        </div>
      </div>
      <CommandBar/>
    </>
  );
}

/* ─────────── TWEAKS PANEL ─────────── */
function TweakRow({ label, children }) {
  return (
    <div style={{marginBottom:12}}>
      <div className="mono small caps" style={{color:'var(--text-tertiary)', marginBottom:6}}>{label}</div>
      {children}
    </div>
  );
}

function TweakBtnRow({ options, value, onChange }) {
  return (
    <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
      {options.map(([k,l]) => (
        <button key={k} onClick={()=>onChange(k)} className="mono small" style={{
          flex:'1 0 auto', padding:'5px 8px',
          background: value===k ? 'var(--accent-soft)' : 'transparent',
          color: value===k ? 'var(--accent)' : 'var(--text-secondary)',
          border:`1px solid ${value===k?'var(--accent)':'var(--border-default)'}`,
          borderRadius:'var(--r-chip)', cursor:'pointer', fontSize:10,
        }}>{l}</button>
      ))}
    </div>
  );
}

function TweaksPanel({ tweaks, onChange, visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position:'fixed', bottom:20, right:20, zIndex:1000,
      background:'var(--bg-raised)', border:'1px solid var(--border-strong)',
      borderRadius:'var(--r-panel)', padding:16, width:280,
      boxShadow:'0 8px 24px rgba(0,0,0,0.5)', fontFamily:'var(--font-sans)',
      maxHeight:'calc(100vh - 40px)', overflow:'auto',
    }}>
      <div className="mono caps" style={{color:'var(--text-primary)', marginBottom:12, fontSize:11, display:'flex', alignItems:'center', gap:6}}>
        <span style={{color:'var(--accent)'}}>◉</span> TWEAKS
      </div>

      <TweakRow label="Theme">
        <TweakBtnRow options={[['warm-dark','warm'],['true-dark','black'],['light','light']]}
          value={tweaks.theme} onChange={v=>onChange({theme:v})}/>
      </TweakRow>

      <TweakRow label="Accent">
        <div style={{display:'flex', gap:6}}>
          {Object.entries(ACCENTS).map(([k, v]) => (
            <button key={k} onClick={()=>onChange({accent:k})} title={k} style={{
              flex:1, aspectRatio:'1', padding:0,
              background: tweaks.theme==='light' ? v.light : v.dark,
              border: tweaks.accent===k ? '2px solid var(--text-primary)' : '1px solid var(--border-default)',
              borderRadius:'var(--r-chip)', cursor:'pointer',
            }}/>
          ))}
        </div>
      </TweakRow>

      <TweakRow label="Density">
        <TweakBtnRow options={[['compact','compact'],['comfortable','normal'],['spacious','spacious']]}
          value={tweaks.density} onChange={v=>onChange({density:v})}/>
      </TweakRow>

      <TweakRow label="Mission Control variant">
        <TweakBtnRow options={[['activity','list'],['rails','dept'],['grid','grid'],['orbit','orbit'],['terminal','term']]}
          value={tweaks.mission_control_variant} onChange={v=>onChange({mission_control_variant:v})}/>
      </TweakRow>

      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderTop:'1px solid var(--border-subtle)', marginTop:4}}>
        <span className="mono small" style={{color:'var(--text-secondary)'}}>Keyboard hints</span>
        <div onClick={()=>onChange({show_keyboard_hints:!tweaks.show_keyboard_hints})} style={{
          width:30, height:18, borderRadius:9,
          background: tweaks.show_keyboard_hints ? 'var(--accent)' : 'var(--border-default)',
          position:'relative', cursor:'pointer',
        }}>
          <div style={{
            position:'absolute', top:2, left: tweaks.show_keyboard_hints ? 14 : 2,
            width:14, height:14, borderRadius:7, background:'var(--bg-page)',
            transition:'left 120ms',
          }}/>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Titlebar, LeftRail, CommandBar, Frame, WebShell, TweaksPanel, loadTweaks, applyAccent, applyDensity, ACCENTS });
