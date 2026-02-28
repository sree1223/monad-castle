import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useMonadContext } from '../context/MonadContext'

const TABS = ['Overview', 'Battle History', 'Achievements']
const CASTLE_COLS = ['#ff4d4d', '#4db8ff', '#4dff91', '#ffd94d']

const ACHIEVEMENTS = [
  { id: 'first_attack', label: 'First Blood',     desc: 'Land your first attack.',       icon: '⚔', thresh: 1   },
  { id: 'ten_attacks',  label: 'Battle-Hardened', desc: 'Attack 10 times.',              icon: '★', thresh: 10  },
  { id: 'hundred',      label: 'Relentless',       desc: 'Attack 100 times.',             icon: '◆', thresh: 100 },
  { id: 'fortress',     label: 'Castle Breaker',   desc: 'Bring a castle to 0 HP.',       icon: '■', thresh: 0   },
  { id: 'spender',      label: 'High Roller',      desc: 'Spend more than 1 MON total.',  icon: '◉', thresh: 0   },
]

export default function UserPage({ player, attackLog = [], monSpent = 0 }) {
  const monad = useMonadContext()
  const [tab, setTab] = useState(0)
  const navigate = useNavigate()

  const username = localStorage.getItem('mc_username') || 'Warrior'
  const avatarColor = '#818cf8'
  const balance = monad.isConnected ? monad.contractBalance : '0.000'
  const displayAddr = monad.account || player?.addr || '0x···not connected'

  const totalAttacks = attackLog.length
  const todayAttacks = attackLog.filter(e => Date.now() - e.ts < 86400000).length

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#080a12',
      display: 'flex', flexDirection: 'column', fontFamily: '"Courier New", monospace',
      color: '#dde3ff', overflow: 'hidden',
    }}>
      <NavBar
        balance={balance}
        isConnected={monad.isConnected}
        account={monad.account}
        onConnect={monad.connect}
        onDisconnect={monad.disconnect}
        onClassClick={() => navigate('/')}
      />

      <div style={{ flex: 1, overflowY: 'auto', maxWidth: 820, margin: '0 auto', width: '100%', padding: '32px 24px', scrollbarWidth: 'thin', scrollbarColor: '#2a2f52 transparent' }}>

        {/* ── Profile header ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 24,
          padding: '24px',
          background: '#0e1225',
          border: '2px solid #2a2f52', borderRadius: 14,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 14, flexShrink: 0,
            background: `linear-gradient(135deg, ${avatarColor}44, ${avatarColor}18)`,
            border: `2px solid ${avatarColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, fontWeight: 900, color: avatarColor,
            boxShadow: `0 0 24px ${avatarColor}44`,
          }}>
            {username[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: '#4a5180', marginBottom: 6, fontWeight: 700 }}>PLAYER PROFILE</div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 1, color: '#ffffff', marginBottom: 6 }}>
              {player?.name || username}
            </div>
            <div style={{ fontSize: 11, color: '#6b74a8', marginBottom: 12, fontFamily: 'monospace' }}>
              {displayAddr}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Pill label="SIEGE WARRIOR" color={avatarColor} />
              <Pill label="FIGHTER" color="#c084fc" />
              <Pill label="MONAD TESTNET" color="#4db8ff" />
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 8, letterSpacing: 2, color: '#4a5180', marginBottom: 6, fontWeight: 700 }}>BALANCE</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>{parseFloat(balance).toFixed(3)}</div>
            <div style={{ fontSize: 11, color: '#a08040', marginTop: 4, fontWeight: 600 }}>MON</div>
          </div>
        </div>

        {/* ── Quick stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'TOTAL ATTACKS', val: totalAttacks,                    col: '#c084fc' },
            { label: 'TODAY',         val: todayAttacks,                    col: '#4dff91' },
            { label: 'MON SPENT',     val: monSpent.toFixed(3),             col: '#fbbf24' },
            { label: 'BALANCE',       val: parseFloat(balance).toFixed(3),  col: '#4db8ff' },
          ].map(s => (
            <div key={s.label} style={{
              padding: '16px 12px', background: '#0a0d1c',
              border: `1px solid ${s.col}38`, borderRadius: 10, textAlign: 'center',
              boxShadow: `0 0 12px ${s.col}18`,
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.col, marginBottom: 6, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 8, color: '#4a5180', letterSpacing: 1, fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Additional profile info ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          <div style={{ padding: '16px', background: '#0e1225', border: '1px solid #2a2f52', borderRadius: 10 }}>
            <div style={{ fontSize: 8, color: '#4a5180', letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>RANK</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24' }}>SIEGE WARRIOR</div>
            <div style={{ fontSize: 10, color: '#6b74a8', marginTop: 4 }}>Based on attack count</div>
          </div>
          <div style={{ padding: '16px', background: '#0e1225', border: '1px solid #2a2f52', borderRadius: 10 }}>
            <div style={{ fontSize: 8, color: '#4a5180', letterSpacing: 2, marginBottom: 8, fontWeight: 700 }}>WIN CHANCES</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#4dff91' }}>70% POOL</div>
            <div style={{ fontSize: 10, color: '#6b74a8', marginTop: 4 }}>Last hit on any castle</div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', borderBottom: '2px solid #2a2f52', marginBottom: 20 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 20px', fontSize: 11, fontFamily: '"Courier New", monospace',
              background: 'transparent', fontWeight: tab === i ? 700 : 500,
              color: tab === i ? '#c4b5fd' : '#6b74a8', border: 'none',
              borderBottom: tab === i ? '2px solid #7c56f0' : '2px solid transparent',
              marginBottom: -2,
              cursor: 'pointer', letterSpacing: 0.5, transition: 'color 0.15s',
            }}>{t}</button>
          ))}
        </div>

        {/* Overview */}
        {tab === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <InfoBlock title="About MonCastle" text="MonCastle is a last-hit-wins castle siege game on Monad Testnet. Each attack costs 0.01 MON — the player who lands the final blow wins 70% of the prize pool." />
            <InfoBlock title="Attack Style" text="Every attack deals 50 HP to the target castle. Reduce a castle to 0 HP and win the jackpot!" />
            <InfoBlock title="Wallet Address" text={displayAddr} mono />
            <InfoBlock title="Class" text={`${username} · Siege Warrior · Monad Testnet`} />
          </div>
        )}

        {/* Battle History */}
        {tab === 1 && (
          <div>
            {attackLog.length === 0 ? (
              <Empty msg="No attacks yet — select a castle and unleash your power!" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[...attackLog].reverse().map((e, i) => (
                  <LogRow key={i} entry={e} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Achievements */}
        {tab === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {ACHIEVEMENTS.map(ach => {
              const unlocked = ach.thresh > 0 ? totalAttacks >= ach.thresh : false
              return (
                <div key={ach.id} style={{
                  padding: '16px', borderRadius: 10,
                  background: unlocked ? 'rgba(77,255,145,0.08)' : '#0a0d1c',
                  border: `2px solid ${unlocked ? '#4dff9166' : '#1e2240'}`,
                  boxShadow: unlocked ? '0 0 16px rgba(77,255,145,0.1)' : 'none',
                  display: 'flex', gap: 14, alignItems: 'center',
                  opacity: unlocked ? 1 : 0.5,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: unlocked ? 'rgba(77,255,145,0.15)' : '#12151f',
                    border: `1px solid ${unlocked ? '#4dff9144' : '#2a2f52'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, color: unlocked ? '#4dff91' : '#3a4060',
                  }}>{ach.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: unlocked ? '#ffffff' : '#4a5180', marginBottom: 4 }}>
                      {ach.label}
                    </div>
                    <div style={{ fontSize: 10, color: unlocked ? '#8a94c8' : '#2a3060' }}>{ach.desc}</div>
                  </div>
                  {unlocked && <div style={{ fontSize: 16, color: '#4dff91', fontWeight: 900 }}>✓</div>}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}

function Pill({ label, color }) {
  return (
    <div style={{
      padding: '3px 10px', borderRadius: 10, fontSize: 9, letterSpacing: 1, fontWeight: 700,
      background: `${color}18`, border: `1px solid ${color}55`, color,
    }}>
      {label}
    </div>
  )
}

function InfoBlock({ title, text, mono }) {
  return (
    <div style={{
      padding: '16px 18px', background: '#0e1225',
      border: '1px solid #2a2f52', borderRadius: 10,
    }}>
      <div style={{ fontSize: 8, letterSpacing: 2, color: '#4a5180', marginBottom: 8, fontWeight: 700 }}>{title.toUpperCase()}</div>
      <div style={{ fontSize: mono ? 11 : 13, color: '#c8d0f0', fontFamily: mono ? '"Courier New", monospace' : 'inherit', lineHeight: 1.8, wordBreak: 'break-all' }}>
        {text}
      </div>
    </div>
  )
}

function LogRow({ entry }) {
  const t = new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const mon = parseFloat(entry.mon || 0.01)
  const castleCol = CASTLE_COLS[entry.castleId ?? 0] ?? '#c084fc'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 14px 8px 16px', borderRadius: 6,
      background: '#0a0d1c', borderBottom: '1px solid #0e1120',
      borderLeft: `3px solid ${castleCol}`,
      fontSize: 11,
    }}>
      <span style={{ flex: 1, color: '#dde3ff', fontWeight: 600 }}>{entry.castle || 'Unknown Castle'}</span>
      <span style={{ color: '#fbbf24', fontWeight: 700 }}>-{mon.toFixed(4)}</span>
      <span style={{ color: castleCol, fontWeight: 700, fontSize: 10 }}>-50 HP</span>
      <span style={{ color: '#4a5180', fontSize: 9 }}>{t}</span>
      {entry.txHash && (
        <a href={`https://testnet.monadexplorer.com/tx/${entry.txHash}`}
          target="_blank" rel="noreferrer"
          style={{ color: '#60a5fa', textDecoration: 'none', fontSize: 9, fontWeight: 700 }}>TX↗</a>
      )}
    </div>
  )
}

function Empty({ msg }) {
  return (
    <div style={{ padding: '60px 0', textAlign: 'center', lineHeight: 2.5 }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>⚔</div>
      <div style={{ fontSize: 14, color: '#3a4478', fontWeight: 700 }}>{msg}</div>
    </div>
  )
}
