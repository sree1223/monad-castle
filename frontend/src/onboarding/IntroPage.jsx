import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StoryStep from './StoryStep'

const STEPS = [
  {
    icon: '⚔',
    title: 'The War of Monad',
    text: 'In the age of the blockchain, four mighty fortresses guard the realm of Monad Testnet. Warriors from across the network clash in endless siege — each attack costs MON, the killing blow earns the prize pool.',
    btn: 'Tell me more',
  },
  {
    icon: '🏰',
    title: 'Four Kingdoms',
    text: 'Ironhold, Stonepeak, Ashveil and Dreadfort stand eternal. Each castle starts with 1000 HP. Bring a fortress to its knees and claim glory — and MON.',
    btn: 'How do I win?',
  },
  {
    icon: '💰',
    title: 'Kill to Earn',
    text: 'Every attack adds 0.01 MON to the prize pool. The warrior who delivers the killing blow claims 70% of the pool instantly, on-chain. Pure on-chain battle.',
    btn: 'What happens after?',
  },
  {
    icon: '⏳',
    title: 'Rebirth & Cooldown',
    text: "After a castle falls, it rebuilds in 30 seconds — then it's open for conquest again with a fresh prize pool. The siege never ends. The glory is eternal.",
    btn: "I'm ready to fight",
  },
  {
    icon: '🛡',
    title: 'Enter Your Name, Warrior',
    text: 'Before riding into battle, declare your war name. Your alias will echo through the halls of MonCastle history.',
    btn: 'Enter the Battlefield',
    isNameStep: true,
  },
]

// Small pixel-art castle SVG
function PixelCastle({ color = '#FFD060' }) {
  return (
    <svg width="56" height="52" viewBox="0 0 56 52" style={{ imageRendering: 'pixelated' }}>
      {/* Battlements */}
      {[4,14,24,34,44].map(x => <rect key={x} x={x} y={2} width={8} height={10} fill={color} />)}
      {/* Main wall */}
      <rect x={2} y={12} width={52} height={30} fill={color} />
      {/* Gate */}
      <rect x={20} y={28} width={16} height={14} fill="#1a0e04" />
      <rect x={20} y={28} width={16} height={6} rx={8} fill="#1a0e04" />
      {/* Windows */}
      <rect x={8}  y={18} width={8} height={8} fill="#1a0e04" />
      <rect x={40} y={18} width={8} height={8} fill="#1a0e04" />
      {/* Shadow line */}
      <rect x={2} y={40} width={52} height={2} fill="#00000033" />
      {/* Base */}
      <rect x={0} y={42} width={56} height={8} fill={color} opacity={0.5} />
    </svg>
  )
}

const CASTLE_COLORS = ['#ff6060', '#60aaff', '#60e880', '#ffb030']

export default function IntroPage() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [leaving, setLeaving] = useState(false)
  const navigate = useNavigate()

  const handleNext = () => {
    const cur = STEPS[step]
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

  const cur = STEPS[step]

  return (
    <div style={{
      width: '100vw', height: '100vh', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: 'monospace', position: 'relative',
      opacity: leaving ? 0 : 1, transition: 'opacity 0.6s ease',
      // Pixel-art landscape background
      background: '#5BB8E8',
    }}>
      {/* Sky pixel tiles */}
      <PixelSky />

      {/* Skip */}
      <button
        onClick={handleSkip}
        style={{
          position: 'absolute', top: 14, right: 18,
          fontSize: 9, color: '#FFE880', background: 'rgba(30,20,5,0.65)',
          border: '2px solid rgba(200,160,40,0.5)', borderRadius: 4,
          padding: '5px 12px', cursor: 'pointer', letterSpacing: 2, zIndex: 10,
          fontFamily: 'monospace',
        }}
      >
        SKIP ▶
      </button>

      {/* ── BIG TITLE ── */}
      <div style={{ marginTop: 18, textAlign: 'center', zIndex: 5, position: 'relative' }}>
        <div style={{
          fontSize: 38, fontWeight: 900, letterSpacing: 6,
          color: '#FFE040',
          textShadow: '4px 4px 0 #7a4000, 2px 2px 0 #b06010, 0 0 20px rgba(255,200,40,0.5)',
          lineHeight: 1, imageRendering: 'pixelated',
        }}>⚔ MONCASTLE ⚔</div>
        <div style={{
          fontSize: 10, letterSpacing: 5, color: '#ffe88088',
          marginTop: 6, textShadow: '1px 1px 0 #4a2800',
        }}>
          ON-CHAIN SIEGE · MONAD TESTNET
        </div>
      </div>

      {/* ── 4 CASTLE ICONS ── */}
      <div style={{ display: 'flex', gap: 28, marginTop: 20, zIndex: 5, position: 'relative' }}>
        {CASTLE_COLORS.map((col, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <PixelCastle color={col} />
            <div style={{ fontSize: 8, color: col, marginTop: 4, letterSpacing: 1, textShadow: '1px 1px 0 #1a0800' }}>
              {['IRONHOLD','STONEPEAK','ASHVEIL','DREADFORT'][i]}
            </div>
          </div>
        ))}
      </div>

      {/* ── STORY CARD ── */}
      <div style={{
        marginTop: 18, zIndex: 5, position: 'relative',
        width: 420, maxWidth: '92vw',
        background: 'linear-gradient(180deg, #3a2808 0%, #2a1c04 100%)',
        border: '3px solid #c89030',
        borderRadius: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,220,100,0.1)',
        padding: '22px 26px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>{cur.icon}</div>
        <div style={{
          fontSize: 16, fontWeight: 900, color: '#FFE040', marginBottom: 12,
          textShadow: '1px 1px 0 #7a4000', letterSpacing: 1,
        }}>{cur.title}</div>
        <div style={{ fontSize: 11, color: '#f0d890', lineHeight: 1.8, marginBottom: 20 }}>
          {cur.text}
        </div>

        {cur.isNameStep && (
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNext()}
            placeholder="Your war name…"
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 14px', marginBottom: 16,
              background: '#1a1004', border: '2px solid #7a5010',
              borderRadius: 5, color: '#FFE880', fontFamily: 'monospace',
              fontSize: 13, outline: 'none', letterSpacing: 1,
            }}
          />
        )}

        <button
          onClick={handleNext}
          disabled={cur.isNameStep && !name.trim()}
          style={{
            padding: '12px 32px', fontSize: 12, letterSpacing: 2,
            fontFamily: 'monospace', fontWeight: 900, cursor: 'pointer',
            background: 'linear-gradient(135deg, #c87820, #a05010)',
            border: '3px solid #FFD060', borderRadius: 6,
            color: '#FFE840',
            textShadow: '1px 1px 0 #4a2000',
            boxShadow: '0 4px 16px rgba(180,100,10,0.5)',
            transition: 'all 0.15s',
            opacity: cur.isNameStep && !name.trim() ? 0.5 : 1,
          }}
          onMouseOver={e => { if (!(cur.isNameStep && !name.trim())) e.currentTarget.style.background = 'linear-gradient(135deg, #e89030, #c06010)' }}
          onMouseOut={e => e.currentTarget.style.background = 'linear-gradient(135deg, #c87820, #a05010)'}
        >
          {cur.btn} ⚔
        </button>
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 8, marginTop: 18, zIndex: 5, position: 'relative' }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 8, height: 8, borderRadius: 4,
            background: i === step ? '#FFE040' : i < step ? '#c87020' : 'rgba(200,160,40,0.25)',
            transition: 'all 0.35s ease',
            border: '1px solid rgba(200,150,40,0.4)',
          }} />
        ))}
      </div>

      {/* Ground strip */}
      <PixelGround />
    </div>
  )
}

function PixelSky() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
      {/* Pixel clouds */}
      {[[60,30],[200,18],[380,38],[560,22],[760,34],[940,16]].map(([x,y],i) => (
        <div key={i} style={{ position: 'absolute', left: x, top: y }}>
          <div style={{ width: 72, height: 20, background: '#fff', position: 'absolute', top: 12, left: 0, borderRadius: 2 }} />
          <div style={{ width: 44, height: 18, background: '#fff', position: 'absolute', top: 0, left: 14, borderRadius: 2 }} />
          <div style={{ width: 28, height: 14, background: '#fff', position: 'absolute', top: -8, left: 24, borderRadius: 2 }} />
          <div style={{ width: 72, height: 4, background: '#ddd', position: 'absolute', top: 28, left: 0 }} />
        </div>
      ))}
      {/* Pixel sun */}
      <div style={{ position: 'absolute', right: 80, top: 20 }}>
        <div style={{ width: 48, height: 48, background: '#FFEE44', border: '4px solid #FFD000', boxShadow: '0 0 24px rgba(255,220,40,0.6)' }} />
      </div>
    </div>
  )
}

function PixelGround() {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 64, zIndex: 2, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Horizon border */}
      <div style={{ height: 4, background: '#1e6010' }} />
      {/* Grass tiles */}
      <div style={{ flex: 1, display: 'flex', flexWrap: 'nowrap', overflow: 'hidden' }}>
        {Array.from({ length: 64 }, (_, i) => (
          <div key={i} style={{
            width: 32, height: 60, flexShrink: 0,
            background: i % 2 === 0 ? '#4aae28' : '#3e9820',
          }} />
        ))}
      </div>
    </div>
  )
}
