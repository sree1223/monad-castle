import React, { useRef, useState, useCallback, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import './App.css'
import Game from './game/Game'
import LeftSidebar from './components/LeftSidebar'
import RightSidebar from './components/RightSidebar'
import NavBar from './components/NavBar'
import GaslessSetup from './components/GaslessSetup'
import { useMonadContext } from './context/MonadContext'
import { IS_DEMO, CASTLE_NAMES, EXPLORER_URL, ATTACK_COST, DAMAGE_PER_HIT } from './config'

const NPC_NAMES = ['CryptoKnight','ShadowBlade','IronClad','0xGhost','ChainSlayer','NightOwl','DarkForge','SilverFang']
const NPC_COLS  = ['#ff4d4d',    '#4db8ff',   '#4dff91', '#ffd94d', '#c084fc',   '#fb923c', '#a78bfa', '#34d399']

const upsertLeader = (prev, name, col, dAttacks, dKills) => {
  const idx = prev.findIndex(l => l.name === name)
  const updated = idx >= 0
    ? prev.map((l, i) => i === idx ? { ...l, attacks: l.attacks + dAttacks, mon: +(l.mon + dAttacks * 0.01).toFixed(3), kills: l.kills + dKills } : l)
    : [...prev, { name, col, attacks: dAttacks, mon: +(dAttacks * 0.01).toFixed(3), kills: dKills }]
  return updated.sort((a, b) => b.attacks - a.attacks)
}

// Mock initial castle state
const mkCastle = (id) => ({ id, hp: 1000, maxHp: 1000, pool: 0, owner: null, roundId: 1, fallen: false })

// ── Main App ────────────────────────────────────────────
export default function App() {
  // NOTE: localStorage check MUST happen before hooks, but
  // the Navigate MUST come AFTER all hooks (React rules of hooks)
  const needsIntro = !localStorage.getItem('mc_username')

  // ── Blockchain layer (gracefully no-ops when contract not deployed) ──
  const monad    = useMonadContext()
  const isLive   = monad.isConnected && monad.hasContract
  const monadRef = useRef(null)
  monadRef.current = monad       // stable ref to latest monad state (no deps change)
  const sceneRef = useRef(null)
  const logIdRef = useRef(0)
  const [log,       setLog]    = useState([])
  const [castles,   setCastles] = useState([0,1,2,3].map(mkCastle))
  const [selectedId, setSelectedId] = useState(null)
  const [monSpent,  setMonSpent]  = useState(0)
  const [balance,   setBalance]   = useState('12.500')
  const [toasts,         setToasts]         = useState([])
  const [castleOwners,   setCastleOwners]   = useState([0,1,2,3].map(() => ({ name: null, since: null })))
  const [captureAnnounce, setCaptureAnnounce] = useState(null)
  const [muted,          setMuted]           = useState(() => localStorage.getItem('mc_muted') === '1')
  const [leaders,        setLeaders]         = useState([])
  const [chatEvent,      setChatEvent]       = useState(null)
  // Gasless setup panel: show after login when contract is deployed and session not yet active
  const [showSetup,      setShowSetup]       = useState(false)
  const player = { name: localStorage.getItem('mc_username') || 'Warrior', addr: monad.account || null }

  // Open gasless setup when user first connects with a deployed contract
  useEffect(() => {
    if (monad.isConnected && monad.hasContract && !monad.sessionActive && !IS_DEMO) {
      setShowSetup(true)
    }
    if (!monad.isConnected) setShowSetup(false)
  }, [monad.isConnected, monad.hasContract, monad.sessionActive])

  // ── REDIRECT: first-time visitors go to /intro AFTER all hooks run ──
  if (needsIntro) return <Navigate to="/intro" replace />

  // When live: sync on-chain castle state into local React state for UI
  useEffect(() => {
    if (!monad.castlesOnChain || !isLive) return
    setCastles(prev => monad.castlesOnChain.map((c, i) => ({
      ...mkCastle(i), ...prev[i], ...c, fallen: c.hp === 0,
    })))
  }, [monad.castlesOnChain, isLive])

  const showToast = useCallback((msg, color = '#ffd700', txHash = null, dur = 3000) => {
    const id = Date.now()
    setToasts(prev => [...prev.slice(-3), { id, msg, color, txHash }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), dur)
  }, [])

  // Wallet connection events → toast
  useEffect(() => {
    if (monad.isConnected) showToast('🔗 Wallet connected to Monad!', '#4dff91', null, 3500)
  }, [monad.isConnected])   // intentionally simple dep: only trigger on connected change

  useEffect(() => {
    if (monad.error) showToast(`❌ ${monad.error}`, '#ff4d4d', null, 5000)
  }, [monad.error])

  /* ── ATTACK ── */
  const handleAttack = useCallback(async (castleId) => {
    const name   = CASTLE_NAMES[castleId] ?? `Castle ${castleId + 1}`
    const castle = castles[castleId]
    if (castle?.fallen) return

    // ── Not connected in live mode: prompt to connect ──
    if (!monadRef.current?.isConnected) {
      showToast('🦊 Connect your wallet to attack!', '#fbbf24', null, 4000)
      return
    }

    // ── LIVE MODE: real blockchain tx (also works in demo via monad.attack()) ──
    if (monadRef.current?.isConnected && monadRef.current?.hasContract) {
      showToast(`⚔ Sending attack on ${name}…`, '#ffaa44', null, 4500)
      const txHash = await monadRef.current.attack(castleId)
      if (txHash) {
        setLog(prev => [{ id: logIdRef.current++, castleId, castle: name, mon: '0.01', ts: Date.now(), txHash }, ...prev].slice(0, 60))
        setMonSpent(m => +(m + ATTACK_COST).toFixed(4))
        setLeaders(prev => upsertLeader(prev, player.name, '#a78bfa', 1, 0))
        showToast(`⚔ ${name} hit! −${DAMAGE_PER_HIT}HP`, '#ffaa44', txHash, 3500)
        sceneRef.current?.animateAttack(castleId)
        // Castle state will auto-sync via polling useEffect above
      } else {
        showToast(`❌ Attack failed`, '#ff4d4d', null, 3000)
      }
      return
    }

    // ── DEMO / OFFLINE MODE: local state updates ──
    const txHash = await monadRef.current?.attack(castleId)
    const mockTx = txHash || '0x' + Math.random().toString(16).slice(2, 66).padEnd(64, '0')
    const newHp = Math.max(0, (castle?.hp ?? 1000) - DAMAGE_PER_HIT)
    setCastles(prev => prev.map((c, i) => i === castleId ? { ...c, hp: newHp, pool: +(c.pool + ATTACK_COST * 0.9).toFixed(4) } : c))
    setMonSpent(m => +(m + ATTACK_COST).toFixed(4))
    sceneRef.current?.animateAttack(castleId)
    setLog(prev => [{ id: logIdRef.current++, castleId, castle: name, mon: ATTACK_COST.toFixed(4), ts: Date.now(), txHash: mockTx }, ...prev].slice(0, 60))
    setLeaders(prev => upsertLeader(prev, player.name, '#a78bfa', 1, 0))
    showToast(`⚔ ${name} hit! −${DAMAGE_PER_HIT}HP`, '#ffaa44', mockTx, 3500)
    if (newHp <= 0) {
      setCastles(prev => prev.map((c, i) => i === castleId ? { ...c, hp: 0, fallen: true, cooldownEnd: Date.now() + 30000 } : c))
      const prize = (castle.pool * 0.9 * 0.7).toFixed(3)
      setLeaders(prev => upsertLeader(prev, player.name, '#a78bfa', 0, 1))
      setCastleOwners(prev => prev.map((o, i) => i === castleId ? { name: player.name, since: Date.now() } : o))
      setCaptureAnnounce({ castleName: name, winner: player.name, prize, ts: Date.now() })
      setChatEvent({ name: '🏰 SYSTEM', col: '#ffd700', msg: `${player.name} captured ${name}! Won ${prize} MON 🏆`, ts: Date.now() })
      setTimeout(() => setCaptureAnnounce(null), 7000)
      setTimeout(() => {
        showToast(`🏰 ${name} CAPTURED!`, '#ffd700', mockTx, 7000)
        sceneRef.current?.animateFall(castleId, player.name, () => {
          setTimeout(() => {
            setCastles(prev => prev.map((c, i) => i === castleId ? mkCastle(i) : c))
            setCastleOwners(prev => prev.map((o, i) => i === castleId ? { name: null, since: null } : o))
          }, 32000) // 32s — matches Phaser's 30s cooldown + small buffer
        })
      }, 600)
    }
  }, [castles, showToast])

  const handleCastleInfo = useCallback((id) => {
    setSelectedId(prev => prev === id ? null : id)
  }, [])

  /* ── NPC DEMO LOOP — disabled; re-enable when needed ── */
  // To re-enable: uncomment the setInterval block below
  // useEffect(() => { if (needsIntro || isLive) return; const iv = setInterval(() => { ... }, 2000); return () => clearInterval(iv) }, [needsIntro, isLive])

  // Resolved balance: real on-chain when connected, 0 when not
  const displayBalance = monad.isConnected ? monad.nativeBalance : '0.000'

  return (
    <div className="app-root">

      {/* ── GASLESS SETUP PANEL ── */}
      {showSetup && (
        <GaslessSetup
          onDeposit={monad.deposit}
          onEnableSession={async () => {
            const ok = await monad.enableSession()
            if (ok) setShowSetup(false)
            return ok  // let GaslessSetup react to success too
          }}
          onSkip={() => setShowSetup(false)}
          isPending={monad.isPending}
          contractBalance={monad.contractBalance}
          sessionActive={monad.sessionActive}
        />
      )}

      {/* ── NAV BAR ── */}
      <NavBar
        balance={displayBalance}
        muted={muted}
        onMute={(m) => { setMuted(m); localStorage.setItem('mc_muted', m ? '1' : '0') }}
        sceneRef={sceneRef}
        isConnected={monad.isConnected}
        account={monad.account}
        onConnect={monad.connect}
        onDisconnect={monad.disconnect}
        sessionActive={monad.sessionActive}
        onEnableSession={monad.enableSession}
        isPending={monad.isPending}
      />

      {/* ── MAIN ROW ── */}
      <div className="app-main-row">

        {/* LEFT SIDEBAR */}
        <LeftSidebar player={player} attackLog={log} monSpent={monSpent} balance={displayBalance} castles={castles} />

        {/* GAME CANVAS CENTER */}
        <div className="app-game-area">
          <Game onAttack={handleAttack} onCastleInfo={handleCastleInfo} gameRef={sceneRef} />

          {/* Capture announce overlay */}
          {captureAnnounce && (
            <div key={captureAnnounce.ts} className="app-capture-overlay">
              <div className="app-capture-card">
                <div className="app-capture-icon">🏰</div>
                <div className="app-capture-title">CASTLE FALLEN!</div>
                <div className="app-capture-desc">
                  <span className="app-capture-winner">{captureAnnounce.winner}</span>
                  {' captured '}
                  <span className="app-capture-castle">{captureAnnounce.castleName}</span>
                </div>
                <div className="app-capture-prize">+{captureAnnounce.prize} MON</div>
                <div className="app-capture-footer">CASTLE REBUILDING IN 30 SEC</div>
              </div>
            </div>
          )}

          {/* Hint bar */}
          <div className="app-hint-bar">
            Click castle to attack · Arrow keys to move · Drag to pan
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <RightSidebar
          castles={castles}
          selectedId={selectedId}
          onSelectCastle={setSelectedId}
          onAttack={handleAttack}
          castleOwners={castleOwners}
          balance={displayBalance}
          leaders={leaders}
          chatEvent={chatEvent}
        />

      </div>

      {/* animations & utility classes are in App.css */}

      {/* Toast Stack — fixed bottom-right, stacks up to 4, each auto-dismisses after 3s */}
      <div className="app-toast-stack">
        {toasts.map(t => (
          <div key={t.id} className="app-toast" style={{ borderColor: `${t.color}55`, boxShadow: `0 6px 28px rgba(0,0,0,0.88), 0 0 14px ${t.color}28` }}>
            <span className="app-toast-msg" style={{ color: t.color }}>{t.msg}</span>
            {t.txHash && (
              <a href={`${EXPLORER_URL}/tx/${t.txHash}`}
                target="_blank" rel="noreferrer" className="app-toast-tx">
                🔗 TX: {t.txHash.slice(0, 10)}…{t.txHash.slice(-4)} ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
