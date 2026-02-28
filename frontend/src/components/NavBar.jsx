import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const C = { bg:'#080b16', border:'#1e2340', gold:'#f5c542', textDim:'#5a6180' }

const TICKERS = [
  '⚔ LAST HIT WINS 70% OF PRIZE POOL',
  '🏰 4 CASTLES — IRONHOLD · STONEPEAK · ASHVEIL · DREADFORT',
  '⚡ EACH ATTACK COSTS 0.01 MON ON MONAD TESTNET',
  '🏆 RUNNER-UP WINS 20% · HOUSE GETS 10%',
  '💎 CASTLE FALLS AT 0 HP — PRIZE INSTANTLY DISTRIBUTED',
]

function NavBtn({ label, active, onClick, warn }) {
  const [hov, setHov] = useState(false)
  const col = warn ? '#f87171' : active ? '#c4b5fd' : hov ? '#ffffff' : '#b0b8e8'
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: '4px 11px', height: 30,
        background: active ? 'rgba(124,86,240,0.28)' : hov ? 'rgba(255,255,255,0.1)' : 'transparent',
        border: `1px solid ${active ? '#7c56f0' : hov ? '#4a5180' : C.border}`,
        borderRadius: 6, cursor: 'pointer', color: col, fontFamily: 'monospace',
        fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: 0.8,
        transition: 'all 0.13s', whiteSpace: 'nowrap',
      }}
    >{label}</button>
  )
}

export default function NavBar({ balance, muted, onMute, sceneRef, isConnected = false, account = null, onConnect, onDisconnect, sessionActive = false, onEnableSession, isPending = false }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [tickIdx, setTickIdx] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setTickIdx(i => (i + 1) % TICKERS.length), 4500)
    return () => clearInterval(iv)
  }, [])
  const toggleMute = () => { const n = !muted; onMute?.(n); sceneRef?.current?.setMuted(n) }
  const handleShare = () => {
    const text = '⚔ Sieging castles on Monad Testnet with @MonCastle — last hit wins the prize pool! 🏰 #MonadHackathon #MonCastle'
    const url  = 'https://moncastle.xyz'
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    if (navigator.share) {
      navigator.share({ title: 'MonCastle', text, url }).catch(() => window.open(tweetUrl, '_blank'))
    } else {
      window.open(tweetUrl, '_blank')
    }
  }
  return (
    <div style={{ flexShrink: 0, fontFamily: 'monospace', zIndex: 100 }}>
      {/* Main bar */}
      <nav style={{
        height: 48, background: C.bg, borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8,
        boxShadow: '0 2px 24px rgba(0,0,0,0.7)', userSelect: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0, marginRight: 6 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#8b5cf6,#4f35c7)',
            border: '1px solid rgba(139,92,246,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, boxShadow: '0 0 18px rgba(124,86,240,0.45)', fontWeight: 900, color: '#fff',
          }}>🏰</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: 4, lineHeight: 1 }}>MONCASTLE</div>
            <div style={{ fontSize: 7, color: '#4a5580', letterSpacing: 2, marginTop: 1 }}>ONCHAIN SIEGE · MONAD</div>
          </div>
        </div>

        <div style={{ width: 1, height: 28, background: C.border }} />

        <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.30)' }}>
          <div className="live-dot" style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e' }} />
          <span style={{ fontSize:9, color:'#22c55e', letterSpacing:1, fontWeight:700 }}>LIVE</span>
        </div>

        <div style={{ flex: 1 }} />

        {balance !== undefined && (
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 14px', borderRadius:8, background:'rgba(245,197,66,0.10)', border:'1px solid rgba(245,197,66,0.35)', boxShadow:'inset 0 0 8px rgba(245,197,66,0.08)' }}>
            <span style={{ fontSize:9, color:C.textDim, letterSpacing:1 }}>BAL</span>
            <span className="gold-num" style={{ fontSize:14, fontWeight:900, color:C.gold }}>{parseFloat(balance).toFixed(3)}</span>
            <span style={{ fontSize:9, color:'#c8922a', fontWeight:700 }}>MON</span>
          </div>
        )}

        <div style={{ width: 1, height: 28, background: C.border }} />

        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {/* Wallet connect / connected indicator */}
          {isConnected ? (
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              {/* Session badge */}
              {sessionActive ? (
                <div title="Gasless session active — attacks require no wallet popup!" style={{
                  padding: '3px 8px', height: 28, borderRadius: 6,
                  background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.5)',
                  color: '#4dff91', fontFamily: 'monospace', fontSize: 9, fontWeight: 700, letterSpacing: 0.8,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <span style={{ fontSize: 10 }}>⚡</span> GASLESS
                </div>
              ) : (
                <button
                  onClick={onEnableSession}
                  disabled={isPending}
                  title="Enable session key for one-click gasless attacks"
                  style={{
                    padding: '3px 9px', height: 28, borderRadius: 6, cursor: isPending ? 'not-allowed' : 'pointer',
                    background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.5)',
                    color: '#fbbf24', fontFamily: 'monospace', fontSize: 9, fontWeight: 700, letterSpacing: 0.8,
                    display: 'flex', alignItems: 'center', gap: 4, opacity: isPending ? 0.6 : 1,
                  }}
                >
                  <span>⚡</span> {isPending ? 'SETTING UP…' : 'ENABLE GASLESS'}
                </button>
              )}
              {/* Account badge */}
              <button
                onClick={onDisconnect}
                title="Click to log out"
                style={{
                  padding: '4px 12px', height: 30, borderRadius: 6, cursor: 'pointer',
                  background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.60)',
                  color: '#4dff91', fontFamily: 'monospace', fontSize: 10, fontWeight: 700,
                  letterSpacing: 0.8, whiteSpace: 'nowrap', transition: 'all 0.13s',
                }}
              >
                🔗 {account ? account.slice(0,6) + '…' + account.slice(-4) : 'CONNECTED'}
              </button>
            </div>
          ) : (
            <button
              onClick={onConnect}
              style={{
                padding: '5px 14px', height: 30, borderRadius: 6, cursor: 'pointer',
                background: 'linear-gradient(135deg,rgba(251,191,36,0.28),rgba(245,158,11,0.18))',
                border: '1px solid rgba(251,191,36,0.70)', color: '#fbbf24',
                fontFamily: 'monospace', fontSize: 10, fontWeight: 800,
                letterSpacing: 1, whiteSpace: 'nowrap', transition: 'all 0.13s',
                boxShadow: '0 0 12px rgba(251,191,36,0.20)', animation: 'pulse-gold 2s infinite',
              }}
            >
              🦊 LOGIN
            </button>
          )}
          <div style={{ width: 1, height: 20, background: C.border }} />
          <NavBtn label={muted ? '🔇 MUTED' : '🔊 SOUND'} active={!muted} warn={muted} onClick={toggleMute} />
          <NavBtn label='PROFILE'  active={pathname==='/profile'}  onClick={() => navigate('/profile')} />
          <NavBtn label='WALLET'   active={pathname==='/wallet'}   onClick={() => navigate('/wallet')}  />
          <NavBtn label='SHARE'    onClick={handleShare} />
          <NavBtn label='SETTINGS' active={pathname==='/settings'} onClick={() => navigate('/settings')} />
        </div>

        <div style={{ width: 1, height: 28, background: C.border }} />

      </nav>

      {/* Ticker strip */}
      <div style={{
        height: 22, background: 'rgba(124,86,240,0.12)', borderBottom: '1px solid rgba(124,86,240,0.25)',
        overflow: 'hidden', display: 'flex', alignItems: 'center', padding: '0 12px',
      }}>
        <span style={{
          fontSize: 9, color: '#a78bfa', fontWeight: 700, letterSpacing: 1.5,
          transition: 'opacity 0.4s', opacity: 1,
        }}>{TICKERS[tickIdx]}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 8, color: '#4a5180', letterSpacing: 1 }}>TESTNET v0.1</span>
      </div>
    </div>
  )
}
