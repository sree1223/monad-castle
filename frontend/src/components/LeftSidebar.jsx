import { useNavigate } from 'react-router-dom'

const CASTLE_NAMES = ['Ironhold', 'Stonepeak', 'Ashveil', 'Dreadfort']
const CASTLE_COLS  = ['#ff4d4d', '#4db8ff', '#4dff91', '#ffd94d']

export default function LeftSidebar({ player, attackLog = [], monSpent = 0, balance = '0.000', castles = [] }) {
  const navigate = useNavigate()
  const totalPool = castles.reduce((s, c) => s + Number(c.pool || 0), 0)

  return (
    <aside style={{
      width: 220, minWidth: 220, height: '100%',
      background: '#090c18',
      borderRight: '2px solid #2a2f52',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Courier New", monospace', userSelect: 'none',
    }}>

      {/* ── Player card ── */}
      <div
        onClick={() => navigate('/profile')}
        style={{ padding: '14px 16px', cursor: 'pointer', borderBottom: '2px solid #2a2f52', background: '#0e1225', transition: 'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background = '#181d35'}
        onMouseLeave={e => e.currentTarget.style.background = '#0e1225'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(124,86,240,0.4),rgba(79,53,199,0.3))',
            border: '2px solid rgba(124,86,240,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 900, color: '#c4b5fd',
          }}>{(player?.name || 'W')[0].toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', letterSpacing: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {player?.name || 'Warrior'}
            </div>
            <div style={{ fontSize: 10, color: '#6b74a8', marginTop: 2 }}>
              {player?.addr ? `${player.addr.slice(0,6)}...${player.addr.slice(-4)}` : 'not connected'}
            </div>
          </div>
          <span style={{ fontSize: 12, color: '#6b74a8' }}>›</span>
        </div>
        {/* Balance display */}
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 5, padding: '6px 10px', borderRadius: 6, background: 'rgba(245,197,66,0.08)', border: '1px solid rgba(245,197,66,0.3)' }}>
          <span style={{ fontSize: 9, color: '#6b74a8', letterSpacing: 1 }}>BAL</span>
          <span className="gold-num" style={{ fontSize: 18, fontWeight: 900, color: '#f5c542', lineHeight: 1 }}>{parseFloat(balance).toFixed(3)}</span>
          <span style={{ fontSize: 9, color: '#c8922a', fontWeight: 700 }}>MON</span>
        </div>
      </div>

      {/* ── Session stats ── */}
      <div style={{ padding: '12px 16px', borderBottom: '2px solid #2a2f52' }}>
        <div style={{ fontSize: 9, color: '#4a5180', letterSpacing: 3, marginBottom: 10, fontWeight: 700 }}>SESSION STATS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <StatBox label="ATTACKS" value={attackLog.length} col="#c084fc" />
          <StatBox label="MON SPENT" value={monSpent.toFixed(2)} col="#fbbf24" />
        </div>
      </div>

      {/* ── Prize pools ── */}
      <div style={{ padding: '12px 16px', borderBottom: '2px solid #2a2f52' }}>
        <div style={{ fontSize: 9, color: '#4a5180', letterSpacing: 3, marginBottom: 8, fontWeight: 700 }}>LIVE PRIZE POOLS</div>
        {castles.map((c, i) => {
          const pool = Number(c.pool || 0)
          const prize = (pool * 0.7).toFixed(3)
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: CASTLE_COLS[i], flexShrink: 0, boxShadow: `0 0 4px ${CASTLE_COLS[i]}` }} />
              <div style={{ fontSize: 10, color: '#aab4d8', flex: 1, fontWeight: 600 }}>{CASTLE_NAMES[i]}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: c.fallen ? '#3a3d60' : CASTLE_COLS[i] }}>
                  {c.fallen ? 'FALLEN' : `${pool.toFixed(3)}`}
                </div>
                {!c.fallen && pool > 0 && (
                  <div style={{ fontSize: 7, color: '#4a5180' }}>🏆 {prize}</div>
                )}
              </div>
            </div>
          )
        })}
        {totalPool > 0 && (
          <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: '#8a8fb8', fontWeight: 600 }}>TOTAL POOLS</span>
            <span className="gold-num" style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24' }}>{totalPool.toFixed(3)} MON</span>
          </div>
        )}
      </div>

      {/* ── Battle log ── */}
      <div style={{ padding: '10px 16px 6px', borderBottom: '1px solid #1e2240' }}>
        <div style={{ fontSize: 9, color: '#4a5180', letterSpacing: 3, fontWeight: 700 }}>BATTLE LOG</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#2a2f52 transparent' }}>
        {attackLog.length === 0 && (
          <div style={{ padding: '30px 16px', textAlign: 'center', color: '#2a3060', lineHeight: 2.2 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>⚔</div>
            <div style={{ fontSize: 11, fontWeight: 600 }}>No attacks yet</div>
            <div style={{ fontSize: 9 }}>Select a castle to begin</div>
          </div>
        )}
        {attackLog.map((e, i) => <LogRow key={e.id ?? i} entry={e} idx={i} />)}
      </div>

      {/* ── How to play tip ── */}
      <div style={{ padding: '8px 16px', borderTop: '2px solid #2a2f52', background: '#0e1225' }}>
        <div style={{ fontSize: 9, color: '#3a4068', lineHeight: 1.8 }}>
          Arrow keys to move · Click castle to attack<br/>
          Last hit wins <span style={{ color: '#4dff91', fontWeight: 700 }}>70%</span> of pool
        </div>
      </div>
    </aside>
  )
}

function StatBox({ label, value, col }) {
  const isGold = label === 'MON SPENT'
  return (
    <div style={{ padding: '10px 8px', borderRadius: 8, background: '#0a0d1c', border: `1px solid ${col}33`, textAlign: 'center' }}>
      <div className={isGold ? 'gold-num' : ''} style={{ fontSize: 18, fontWeight: 800, color: col, lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 8, color: '#4a5180', letterSpacing: 1, marginTop: 4 }}>{label}</div>
    </div>
  )
}

function LogRow({ entry, idx }) {
  const t   = new Date(entry.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const col = CASTLE_COLS[entry.castleId ?? idx % 4]
  return (
    <div className="log-entry" style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 12px 7px 14px',
      borderBottom: '1px solid #0e1120',
      borderLeft: `3px solid ${col}`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: '#c8d0f0', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.castle}
        </div>
        <div style={{ fontSize: 8, color: '#4a5180', marginTop: 2 }}>
          <span style={{ color: col, fontWeight: 700 }}>−50 HP</span> · 0.01 MON
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: 9, color: '#4a5180' }}>{t}</div>
        {entry.txHash && (
          <a href={`https://testnet.monadexplorer.com/tx/${entry.txHash}`}
            target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 8, color: '#60a5fa', textDecoration: 'none', fontWeight: 700 }}>TX↗</a>
        )}
      </div>
    </div>
  )
}

