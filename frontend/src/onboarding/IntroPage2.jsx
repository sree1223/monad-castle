/**
 * IntroPage2 — Experimental enhanced intro.
 * Accessible at /intro2 — does NOT replace IntroPage.jsx (/intro).
 * Revert by simply routing back to IntroPage.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/* ── Story content — more dramatic / longer ── */
const STEPS = [
  {
    tag: 'THE LEGEND',
    title: 'A Realm in Flames',
    text: 'Four ancient fortresses rise from the hills of Monad Testnet. For centuries, warlords battled for dominance. Now, the siege continues on-chain — transparent, permissionless, relentless.',
    sub: 'Every block is a battle. Every wallet is a warrior.',
    btn: 'Enter the siege',
    icon: '🌋',
  },
  {
    tag: 'THE FOUR KINGDOMS',
    title: 'Ironhold · Stonepeak · Ashveil · Dreadfort',
    text: 'Each fortress commands its own hill, guarded by stone and blood. 1000 HP stands between a castle and its conqueror. Coordinate your strikes, deplete its walls, and claim glory.',
    sub: 'Pick a target. Spend 0.01 MON. Deal 50 damage.',
    btn: 'How do I win?',
    icon: '🏰',
  },
  {
    tag: 'THE PRIZE',
    title: 'Kill to Earn',
    text: 'Every attack funds the prize pool. The warrior who lands the killing blow takes 70% of everything — instantly, on-chain, verified by the contract. Second place earns 20%. No server, no middleman.',
    sub: 'The last arrow matters most.',
    btn: 'What happens next?',
    icon: '💰',
  },
  {
    tag: 'THE CYCLE',
    title: 'Fall. Rebuild. Siege Again.',
    text: 'No castle stays fallen forever. 30 seconds after defeat, walls rise from rubble and a fresh prize pool begins. The war machine never stops. There is always a target. There is always a winner.',
    sub: 'Every round, a new conqueror rises.',
    btn: 'Sounds dangerous',
    icon: '⚔',
  },
  {
    tag: 'THE COMMUNITY',
    title: 'Shared Victory. Public Glory.',
    text: 'All conquests are public. All rewards are on-chain. Coordinate with strangers to bring down a castle and share in the spoils. Your name will echo across every wallet connected to the siege.',
    sub: 'Glory is louder when witnessed.',
    btn: "I'm ready to fight",
    icon: '🛡',
  },
  {
    tag: 'YOUR WAR NAME',
    title: 'Declare Yourself, Warrior',
    text: 'Before riding into battle, carve your name into the ledger. Your alias will appear above every attack, every kill, every conquest.',
    sub: 'Choose wisely. It echoes on-chain.',
    btn: 'Enter the Battlefield',
    icon: '👑',
    isNameStep: true,
  },
]

/* ── Castle colors by slot ── */
const CASTLE_COLS = ['#ff5c5c', '#4db8ff', '#4dff91', '#ffd94d']

export default function IntroPage2() {
  const [step, setStep]     = useState(0)
  const [name, setName]     = useState('')
  const [leaving, setLeaving] = useState(false)
  const [tick, setTick]     = useState(0)
  const navigate = useNavigate()
  const cur = STEPS[step]

  // Tick for arrow animations
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 50)
    return () => clearInterval(iv)
  }, [])

  const handleNext = () => {
    if (cur.isNameStep) {
      if (!name.trim()) return
      localStorage.setItem('mc_username', name.trim())
      setLeaving(true)
      setTimeout(() => navigate('/'), 700)
    } else {
      setStep(s => s + 1)
    }
  }

  const handleSkip = () => {
    setLeaving(true)
    setTimeout(() => navigate('/'), 500)
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      display: 'flex', fontFamily: 'monospace', position: 'relative',
      opacity: leaving ? 0 : 1, transition: 'opacity 0.6s ease',
      background: 'linear-gradient(180deg, #0a0e1a 0%, #0d1428 50%, #111830 100%)',
    }}>
      <style>{`
        @keyframes arrowFly {
          0%   { transform: translateX(-60px) rotate(-22deg); opacity: 0; }
          10%  { opacity: 0.9; }
          90%  { opacity: 0.9; }
          100% { transform: translateX(105vw) rotate(-22deg); opacity: 0; }
        }
        @keyframes arrowFlyUp {
          0%   { transform: translateX(110vw) rotate(160deg); opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.8; }
          100% { transform: translateX(-60px) rotate(160deg); opacity: 0; }
        }
        @keyframes castlePulse {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(255,210,50,0.5)); }
          50% { filter: drop-shadow(0 0 18px rgba(255,210,50,0.9)); }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes slideUp {
          0% { opacity: 0; transform: translateY(18px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes expandIn {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
      `}</style>

      {/* ── SKIP ── */}
      <button onClick={handleSkip} style={{
        position: 'absolute', top: 14, right: 18, zIndex: 30,
        fontSize: 9, color: '#FFE880', background: 'rgba(30,20,5,0.65)',
        border: '2px solid rgba(200,160,40,0.5)', borderRadius: 4,
        padding: '5px 12px', cursor: 'pointer', letterSpacing: 2, fontFamily: 'monospace',
      }}>SKIP ▶</button>

      {/* ══════ LEFT PANEL — battle art ══════ */}
      <div style={{
        flex: '0 0 48%', position: 'relative', overflow: 'hidden',
        borderRight: '2px solid rgba(255,210,50,0.12)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Animated sky background */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, #0d1a3a 0%, #1a2a50 35%, #2a3f22 70%, #1a2d10 100%)',
        }} />

        {/* Star field */}
        {[...Array(28)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 37 + 11) % 100}%`, top: `${(i * 23 + 7) % 55}%`,
            width: i % 4 === 0 ? 3 : 2, height: i % 4 === 0 ? 3 : 2,
            borderRadius: '50%', background: '#ffffff',
            opacity: 0.4 + (i % 5) * 0.1,
            animation: `blink ${1.5 + (i % 5) * 0.4}s ease-in-out infinite`,
            animationDelay: `${(i * 0.18) % 3}s`,
          }} />
        ))}

        {/* Flying arrows — left to right */}
        {[16, 36, 56, 74, 88].map((top, i) => (
          <div key={i} style={{
            position: 'absolute', top: `${top}%`, left: 0, zIndex: 4,
            animation: `arrowFly ${2.2 + i * 0.3}s linear infinite`,
            animationDelay: `${i * 0.7}s`,
          }}>
            <svg width="36" height="8" viewBox="0 0 36 8">
              <line x1="0" y1="4" x2="28" y2="4" stroke="#c8903c" strokeWidth="2"/>
              <polygon points="28,0 36,4 28,8" fill="#888"/>
              <line x1="0" y1="2" x2="6" y2="6" stroke="#cc3333" strokeWidth="2" opacity="0.8"/>
              <line x1="0" y1="6" x2="6" y2="2" stroke="#cc3333" strokeWidth="2" opacity="0.8"/>
            </svg>
          </div>
        ))}

        {/* Flying arrows — right to left (return fire) */}
        {[26, 48, 66].map((top, i) => (
          <div key={i} style={{
            position: 'absolute', top: `${top}%`, zIndex: 4,
            animation: `arrowFlyUp ${2.6 + i * 0.35}s linear infinite`,
            animationDelay: `${i * 0.9 + 0.4}s`,
          }}>
            <svg width="36" height="8" viewBox="0 0 36 8">
              <line x1="8" y1="4" x2="36" y2="4" stroke="#6890c8" strokeWidth="2"/>
              <polygon points="8,0 0,4 8,8" fill="#4488cc"/>
              <line x1="36" y1="2" x2="30" y2="6" stroke="#2244aa" strokeWidth="2" opacity="0.8"/>
              <line x1="36" y1="6" x2="30" y2="2" stroke="#2244aa" strokeWidth="2" opacity="0.8"/>
            </svg>
          </div>
        ))}

        {/* 4 pixel castles in a row */}
        <div style={{
          display: 'flex', gap: 22, marginBottom: 18, zIndex: 5, position: 'relative',
          animation: 'floatY 3.2s ease-in-out infinite',
        }}>
          {CASTLE_COLS.map((col, i) => (
            <div key={i} style={{
              textAlign: 'center',
              animation: `castlePulse ${2 + i * 0.4}s ease-in-out infinite`,
              animationDelay: `${i * 0.25}s`,
            }}>
              <PixelCastle2 color={col} />
            </div>
          ))}
        </div>

        {/* Battle ground strip */}
        <div style={{
          position: 'relative', zIndex: 5,
          width: '80%', height: 8, borderRadius: 4,
          background: 'linear-gradient(90deg, #2a4a10, #3a6018, #2a4a10)',
          borderTop: '2px solid #5a9028', marginBottom: 20,
        }} />

        {/* Live battle stats (mock) */}
        <div style={{
          position: 'relative', zIndex: 5,
          display: 'flex', gap: 20, marginBottom: 24,
        }}>
          {[
            { label: 'TOTAL ATTACKS', val: '14,892' },
            { label: 'MON IN POOLS', val: '148.9' },
            { label: 'CASTLES FALLEN', val: '392' },
          ].map(({ label, val }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 18, fontWeight: 900, color: '#FFD840',
                textShadow: '0 0 10px rgba(255,210,40,0.6)',
                background: 'linear-gradient(90deg, #ffd700, #ffaa00, #ffd700)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                animation: 'shimmer 3s linear infinite',
              }}>{val}</div>
              <div style={{ fontSize: 7, color: '#5a6498', letterSpacing: 2, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Title */}
        <div style={{ position: 'relative', zIndex: 5, textAlign: 'center' }}>
          <div style={{
            fontSize: 42, fontWeight: 900, letterSpacing: 6,
            color: '#FFE040',
            textShadow: '4px 4px 0 #7a4000, 2px 2px 0 #b06010, 0 0 30px rgba(255,200,40,0.4)',
            lineHeight: 1.1,
          }}>⚔ MONCASTLE</div>
          <div style={{
            fontSize: 9, letterSpacing: 6, color: '#ffe88066',
            marginTop: 6, textShadow: '1px 1px 0 #4a2800',
          }}>ON-CHAIN SIEGE · MONAD TESTNET</div>
        </div>

        {/* Ground decoration — shields + broken arrows */}
        <div style={{
          position: 'absolute', bottom: 32, left: 0, right: 0,
          display: 'flex', justifyContent: 'space-around', zIndex: 5,
        }}>
          {['🛡', '⚔', '💀', '🏹', '🛡'].map((em, i) => (
            <span key={i} style={{
              fontSize: 18, opacity: 0.35, filter: 'grayscale(0.5)',
            }}>{em}</span>
          ))}
        </div>

        {/* Dev credit */}
        <div style={{
          position: 'absolute', bottom: 10, left: 0, right: 0, textAlign: 'center', zIndex: 5,
        }}>
          <span style={{ fontSize: 8, color: '#3a4068', letterSpacing: 1 }}>
            built by{' '}
            <a href="https://dheram.com" target="_blank" rel="noreferrer"
              style={{ color: '#6b74a8', textDecoration: 'none', fontWeight: 700 }}>
              dheram.com
            </a>
            {' · '}
            <a href="https://github.com/sree1223" target="_blank" rel="noreferrer"
              style={{ color: '#6b74a8', textDecoration: 'none', fontWeight: 700 }}>
              github/sree1223
            </a>
          </span>
        </div>
      </div>

      {/* ══════ RIGHT PANEL — story stepper ══════ */}
      <div style={{
        flex: '1 1 52%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px 32px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle vignette left edge */}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 40,
          background: 'linear-gradient(90deg, rgba(10,14,26,0.6), transparent)',
          pointerEvents: 'none',
        }} />

        {/* Progress bar at top */}
        <div style={{ width: '100%', maxWidth: 420, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 8, color: '#3a4068', letterSpacing: 2 }}>CHAPTER {step + 1} / {STEPS.length}</span>
            <span style={{ fontSize: 8, color: '#3a4068' }}>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div style={{ height: 4, background: '#0e1225', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: 'linear-gradient(90deg, #7c56f0, #c87820)',
              width: `${((step + 1) / STEPS.length) * 100}%`,
              transition: 'width 0.45s ease',
              animation: 'expandIn 0.45s ease',
            }} />
          </div>
        </div>

        {/* Story card */}
        <div key={step} style={{
          width: '100%', maxWidth: 420,
          background: 'linear-gradient(160deg, #1a1204 0%, #120e04 60%, #0e0c1a 100%)',
          border: '2px solid rgba(200,120,32,0.6)',
          borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,0.8), 0 0 40px rgba(200,120,32,0.08), inset 0 1px 0 rgba(255,220,100,0.08)',
          padding: '28px 28px 24px',
          animation: 'slideUp 0.38s ease',
        }}>
          {/* Tag */}
          <div style={{
            fontSize: 8, letterSpacing: 4, color: '#c87820', fontWeight: 700, marginBottom: 10,
            borderLeft: '3px solid #c87820', paddingLeft: 8,
          }}>{cur.tag}</div>

          {/* Icon */}
          <div style={{ fontSize: 36, marginBottom: 12, lineHeight: 1 }}>{cur.icon}</div>

          {/* Title */}
          <div style={{
            fontSize: 20, fontWeight: 900, color: '#FFE040', marginBottom: 14,
            lineHeight: 1.25, letterSpacing: 0.5,
            textShadow: '1px 1px 0 #7a4000',
          }}>{cur.title}</div>

          {/* Main text */}
          <div style={{
            fontSize: 12, color: '#d4c090', lineHeight: 1.85, marginBottom: 10,
          }}>{cur.text}</div>

          {/* Sub text */}
          <div style={{
            fontSize: 10, color: '#98814c', fontStyle: 'italic',
            borderLeft: '2px solid rgba(200,130,32,0.4)', paddingLeft: 10,
            marginBottom: 22, lineHeight: 1.6,
          }}>{cur.sub}</div>

          {/* Name input */}
          {cur.isNameStep && (
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNext()}
              placeholder="Your war name…"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '11px 14px', marginBottom: 14,
                background: '#0e0c04', border: '2px solid #6a4010',
                borderRadius: 7, color: '#FFE880', fontFamily: 'monospace',
                fontSize: 14, outline: 'none', letterSpacing: 1,
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#c87820'}
              onBlur={e => e.target.style.borderColor = '#6a4010'}
            />
          )}

          {/* Next button */}
          <button
            onClick={handleNext}
            disabled={cur.isNameStep && !name.trim()}
            style={{
              width: '100%', padding: '13px 0', fontSize: 12, letterSpacing: 2,
              fontFamily: 'monospace', fontWeight: 900, cursor: cur.isNameStep && !name.trim() ? 'not-allowed' : 'pointer',
              background: cur.isNameStep && !name.trim()
                ? 'rgba(100,60,10,0.4)'
                : 'linear-gradient(135deg, #c87820, #a05010)',
              border: '2px solid rgba(255,210,80,0.6)', borderRadius: 8,
              color: '#FFE840',
              textShadow: '1px 1px 0 #4a2000',
              boxShadow: cur.isNameStep && !name.trim() ? 'none' : '0 4px 20px rgba(180,100,10,0.45)',
              transition: 'all 0.18s',
              opacity: cur.isNameStep && !name.trim() ? 0.45 : 1,
            }}
            onMouseOver={e => { if (!(cur.isNameStep && !name.trim())) { e.currentTarget.style.background = 'linear-gradient(135deg, #e89030, #c06010)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(220,130,20,0.6)' } }}
            onMouseOut={e => { if (!(cur.isNameStep && !name.trim())) { e.currentTarget.style.background = 'linear-gradient(135deg, #c87820, #a05010)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(180,100,10,0.45)' } }}
          >
            {cur.btn} ⚔
          </button>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 8, marginTop: 22, alignItems: 'center' }}>
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => i < step && setStep(i)}
              style={{
                width: i === step ? 28 : 9, height: 9, borderRadius: 5, border: 'none',
                background: i === step ? '#c87820' : i < step ? '#6a4010' : 'rgba(200,160,40,0.18)',
                cursor: i < step ? 'pointer' : 'default',
                transition: 'all 0.35s ease', padding: 0,
              }}
            />
          ))}
        </div>

        {/* Faction teaser at bottom */}
        <div style={{
          width: '100%', maxWidth: 420, marginTop: 24,
          display: 'flex', gap: 8, justifyContent: 'center',
        }}>
          {[
            { col: '#ff5c5c', name: 'Ironhold',  power: '⚔' },
            { col: '#4db8ff', name: 'Stonepeak', power: '❄' },
            { col: '#4dff91', name: 'Ashveil',   power: '🌿' },
            { col: '#ffd94d', name: 'Dreadfort', power: '🔥' },
          ].map(({ col, name, power }) => (
            <div key={name} style={{
              flex: 1, padding: '7px 4px', borderRadius: 8, textAlign: 'center',
              background: `${col}0d`, border: `1px solid ${col}40`,
            }}>
              <div style={{ fontSize: 14 }}>{power}</div>
              <div style={{ fontSize: 7, color: col, fontWeight: 700, marginTop: 3, letterSpacing: 1 }}>
                {name.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Pixel castle SVG (larger than IntroPage version) ── */
function PixelCastle2({ color = '#FFD060' }) {
  const dark = '#1a0e04'
  return (
    <svg width="44" height="46" viewBox="0 0 44 46" style={{ imageRendering: 'pixelated', display: 'block' }}>
      {/* Left tower battlements */}
      <rect x="1" y="2"  width="6" height="8"  fill={color} />
      <rect x="9" y="2"  width="6" height="8"  fill={color} />
      {/* Right tower battlements */}
      <rect x="29" y="2" width="6" height="8"  fill={color} />
      <rect x="37" y="2" width="6" height="8"  fill={color} />
      {/* Wall battlements */}
      <rect x="17" y="4" width="5" height="6"  fill={color} />
      <rect x="23" y="4" width="5" height="6"  fill={color} />
      {/* Left tower body */}
      <rect x="1"  y="10" width="14" height="28" fill={color} />
      {/* Right tower body */}
      <rect x="29" y="10" width="14" height="28" fill={color} />
      {/* Main wall */}
      <rect x="15" y="16" width="14" height="22" fill={color} />
      {/* Gate */}
      <rect x="18" y="26" width="8" height="12" fill={dark} />
      <rect x="18" y="26" width="8" height="5"  rx="4" fill={dark} />
      {/* Tower windows */}
      <rect x="4"  y="16" width="4" height="5" fill={dark} />
      <rect x="9"  y="16" width="4" height="5" fill={dark} />
      <rect x="31" y="16" width="4" height="5" fill={dark} />
      <rect x="36" y="16" width="4" height="5" fill={dark} />
      {/* Flag pole + flag */}
      <rect x="7"  y="0" width="2" height="10" fill="#9a9a9a" />
      <polygon points="9,0 9,6 20,3" fill={color} />
      <rect x="35" y="0" width="2" height="10" fill="#9a9a9a" />
      <polygon points="37,0 37,6 26,3" fill={color} />
      {/* Ground base */}
      <rect x="0" y="38" width="44" height="8" fill={color} opacity="0.45" />
      <rect x="0" y="36" width="44" height="2" fill="rgba(0,0,0,0.25)" />
    </svg>
  )
}
