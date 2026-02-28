import { useState, useEffect, useRef } from 'react'
import GalleryUpload from './GalleryUpload'

const CASTLE_NAMES = ['Ironhold', 'Stonepeak', 'Ashveil', 'Dreadfort']
const CASTLE_COLS  = ['#ff4d4d', '#4db8ff', '#4dff91', '#ffd94d']

const NPC_CHAT = [
  { name: 'CryptoKnight', col: '#ff4d4d', msg: 'Ironhold is almost down! 🔥' },
  { name: 'ShadowBlade',  col: '#4db8ff', msg: 'who took Stonepeak?' },
  { name: 'IronClad',     col: '#4dff91', msg: 'gg last hit wins 0.3 MON' },
  { name: '0xGhost',      col: '#ffd94d', msg: 'all in on Dreadfort rn' },
  { name: 'NightOwl',     col: '#c084fc', msg: 'coordinate attack on Ironhold!!' },
  { name: 'ChainSlayer',  col: '#fb923c', msg: 'this is actual DeFi PvP lol' },
  { name: 'DarkForge',    col: '#a78bfa', msg: 'joining Stonepeak siege' },
  { name: 'SilverFang',   col: '#34d399', msg: 'dropped 3 MON in an hour lmao' },
  { name: 'MonWarrior',   col: '#f472b6', msg: 'Ashveil pool at 2.5 already' },
  { name: 'VaultBreaker', col: '#60a5fa', msg: 'builders on monad are insane' },
]

export default function RightSidebar({ castles = [], selectedId = null, onSelectCastle, onAttack, castleOwners = [], balance = '0.000', leaders = [], chatEvent = null }) {
  const [tab, setTab]       = useState('about')
  const [messages, setMsgs] = useState([])
  const [input, setInput]   = useState('')
  const [tick, setTick]     = useState(0)
  const chatRef             = useRef(null)
  const msgIdRef            = useRef(0)
  const npcIdxRef           = useRef(0)

  // Auto NPC chat
  useEffect(() => {
    const iv = setInterval(() => {
      const npc = NPC_CHAT[npcIdxRef.current % NPC_CHAT.length]
      npcIdxRef.current++
      setMsgs(prev => [...prev, { id: msgIdRef.current++, ...npc, ts: Date.now() }].slice(-60))
      setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 50)
    }, Math.floor(Math.random() * 4000) + 6000)
    return () => clearInterval(iv)
  }, [])

  // Castle capture system announcements
  useEffect(() => {
    if (!chatEvent) return
    setMsgs(prev => [...prev, { id: msgIdRef.current++, name: chatEvent.name, col: chatEvent.col, msg: chatEvent.msg, ts: chatEvent.ts, isSystem: true }].slice(-60))
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 50)
  }, [chatEvent])

  // Cooldown ticker
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  const sendMsg = () => {
    if (!input.trim()) return
    setMsgs(prev => [...prev, { id: msgIdRef.current++, name: 'You', col: '#a78bfa', msg: input.trim(), ts: Date.now(), isUser: true }].slice(-60))
    setInput('')
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, 50)
  }

  const selCastle = selectedId !== null ? (castles[selectedId] ?? null) : null
  const col       = selectedId !== null ? CASTLE_COLS[selectedId] : '#4dff91'
  const totalPool = castles.reduce((s, c) => s + Number(c.pool || 0), 0)

  return (
    <aside style={{
      width: 230, minWidth: 230, height: '100%',
      background: '#090c18',
      borderLeft: '2px solid #2a2f52',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Courier New", monospace', userSelect: 'none',
    }}>

      {/* Header */}
      <div style={{
        padding: '10px 14px', borderBottom: '2px solid #2a2f52', background: '#0e1225',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 3, color: '#4a5180', fontWeight: 700 }}>GLOBAL</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: '#dde3ff', marginTop: 1, letterSpacing: 1 }}>WAR ARENA</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(92,255,100,0.12)', border: '1px solid rgba(92,255,100,0.35)' }}>
            <span style={{ fontSize: 8, color: '#4dff91', fontWeight: 700, letterSpacing: 1 }}>● LIVE</span>
          </div>
          {totalPool > 0 && (
            <div style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24' }}>{totalPool.toFixed(3)} MON</div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #2a2f52' }}>
        <TabBtn label="ⓘ ABOUT"   active={tab === 'about'}   onClick={() => setTab('about')} />
        <TabBtn label="🏰 STATUS"  active={tab === 'castles'} onClick={() => setTab('castles')} />
        <TabBtn label="💬 CHAT"    active={tab === 'chat'}    onClick={() => setTab('chat')} />        <TabBtn label="🎨 GALLERY" active={tab === 'gallery'} onClick={() => setTab('gallery')} />      </div>

      {tab === 'about' && (
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#2a2f52 transparent' }}>
          {/* Creator block */}
          <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #1a1e36' }}>
            <div style={{ fontSize: 8, letterSpacing: 3, color: '#4a5180', fontWeight: 700, marginBottom: 8 }}>BUILT BY</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, #7c56f0, #4db8ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, border: '2px solid rgba(124,86,240,0.6)',
              }}>S</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#e2e8f0', letterSpacing: 0.5 }}>Sree</div>
                <div style={{ fontSize: 9, color: '#6b74a8', marginTop: 2 }}>Full-stack · Web3 builder</div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#8090b8', lineHeight: 1.75, marginBottom: 12 }}>
              MonCastle is an <span style={{ color: '#4dff91', fontWeight: 700 }}>on-chain siege game</span> on Monad Testnet.
              Attack, coordinate, claim the kill shot, split the prize pool.
            </div>
            {/* Social links */}
            {[
              { icon: '💼', label: 'Portfolio', href: 'https://dheram.com',              sub: 'dheram.com' },
              { icon: '🐛', label: 'GitHub',    href: 'https://github.com/sree1223',  sub: 'sree1223' },
              { icon: '🔗', label: 'LinkedIn',  href: 'https://linkedin.com/in/sree1223', sub: 'sree1223' },
            ].map(({ icon, label, href, sub }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                borderRadius: 7, marginBottom: 5, textDecoration: 'none',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(124,86,240,0.2)',
                transition: 'all 0.15s',
              }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(124,86,240,0.12)'; e.currentTarget.style.borderColor = 'rgba(124,86,240,0.5)' }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(124,86,240,0.2)' }}
              >
                <span style={{ fontSize: 14 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#c4b5fd' }}>{label}</div>
                  <div style={{ fontSize: 8, color: '#4a5180' }}>{sub}</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 9, color: '#3a4068' }}>↗</span>
              </a>
            ))}
          </div>
          {/* Game stats snapshot */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #1a1e36' }}>
            <div style={{ fontSize: 8, letterSpacing: 3, color: '#4a5180', fontWeight: 700, marginBottom: 8 }}>GAME RULES</div>
            {[
              ['Each attack costs',  '0.01 MON'],
              ['Killing blow wins',  '70% of pool'],
              ['Runner-up earns',    '20% of pool'],
              ['Castle cooldown',    '30 seconds'],
              ['Castles on map',     '4 fortresses'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: '#4a5180' }}>{k}</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#fbbf24' }}>{v}</span>
              </div>
            ))}
          </div>
          {/* Prize pool snapshot */}
          <div style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 8, letterSpacing: 3, color: '#4a5180', fontWeight: 700, marginBottom: 8 }}>LIVE PRIZE POOLS</div>
            {['Ironhold','Stonepeak','Ashveil','Dreadfort'].map((name, i) => {
              const c = castles[i] || {}
              const cc = ['#ff4d4d','#4db8ff','#4dff91','#ffd94d'][i]
              const pool = Number(c.pool || 0)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: cc, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 9, color: '#7a84a8' }}>{name}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: pool > 0 ? '#fbbf24' : '#2a3060' }}>{pool.toFixed(3)} MON</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'castles' && (
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#2a2f52 transparent' }}>
          <div style={{ padding: '10px 10px 4px', fontSize: 8, color: '#4a5180', letterSpacing: 2, fontWeight: 700 }}>CASTLE STATUS</div>
          {CASTLE_NAMES.map((name, i) => {
            const c    = castles[i] || {}
            const cc   = CASTLE_COLS[i]
            const pool = Number(c.pool || 0)
            const hp   = Math.round(Math.max(0, Math.min(100, ((c.hp ?? 1000) / (c.maxHp || 1000)) * 100)))
            const owner = castleOwners[i] || {}
            const sinceMin = owner.since ? Math.round((Date.now() - owner.since) / 60000) : null
            let cooldownStr = null
            if (c.fallen && c.cooldownEnd) {
              const rem = Math.max(0, Math.ceil((c.cooldownEnd - Date.now()) / 1000))
              const m = Math.floor(rem / 60), s = rem % 60
              cooldownStr = `${m}:${String(s).padStart(2, '0')}`
            }
            return (
              <div key={i}
                style={{
                  padding: '10px 10px', borderBottom: '1px solid #0e1120', cursor: 'pointer',
                  background: selectedId === i ? `${cc}14` : 'transparent',
                  borderLeft: selectedId === i ? `3px solid ${cc}` : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
                onClick={() => onSelectCastle?.(selectedId === i ? null : i)}
                onMouseEnter={e => { if (selectedId !== i) e.currentTarget.style.background = `${cc}08` }}
                onMouseLeave={e => { if (selectedId !== i) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 2, background: cc, flexShrink: 0, boxShadow: `0 0 5px ${cc}` }} />
                  <div style={{ fontSize: 11, fontWeight: 800, color: selectedId === i ? '#fff' : '#ccd3f0', flex: 1 }}>{name}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: c.fallen ? '#ff4d4d' : '#4dff91' }}>
                    {c.fallen ? (cooldownStr ? `🔄 ${cooldownStr}` : '🔄 REBUILDING') : `${hp}% HP`}
                  </div>
                </div>
                {!c.fallen && (
                  <div style={{ height: 4, background: '#0a0d1c', borderRadius: 4, overflow: 'hidden', marginBottom: 5 }}>
                    <div style={{ width: `${hp}%`, height: '100%', background: hp > 60 ? cc : hp > 30 ? '#fbbf24' : '#ff4d4d', borderRadius: 4, boxShadow: `0 0 4px ${cc}`, transition: 'width 0.4s' }} />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <div style={{ fontSize: 8, color: '#4a5180' }}>
                      {owner.name
                        ? <><span style={{ color: '#a78bfa', fontWeight: 700 }}>{owner.name}</span><span style={{ color: '#3a4068' }}> · {sinceMin === 0 ? 'just now' : sinceMin === 1 ? '1m ago' : sinceMin !== null ? `${sinceMin}m ago` : ''}</span></>
                        : <span style={{ color: '#2a3060' }}>no owner yet</span>
                      }
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: c.fallen ? '#3a3d60' : '#fbbf24' }}>{pool.toFixed(3)}</div>
                    <div style={{ fontSize: 7, color: '#4a5180' }}>🏆 {(pool * 0.7).toFixed(3)}</div>
                  </div>
                </div>
              </div>
            )
          })}
          <div style={{ padding: '8px 10px', fontSize: 8, color: '#3a4068', lineHeight: 1.9, borderTop: '1px solid #1a1e36' }}>
            Last hit wins <span style={{ color: '#4dff91', fontWeight: 700 }}>70%</span> · Runner-up <span style={{ color: '#fbbf24', fontWeight: 700 }}>20%</span>
          </div>
        </div>
      )}

      {tab === 'chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '6px 10px', fontSize: 8, color: '#4a5180', letterSpacing: 2, fontWeight: 700, borderBottom: '1px solid #1a1e36' }}>
            BATTLE CHAT
          </div>
          <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '6px 0', scrollbarWidth: 'thin', scrollbarColor: '#2a2f52 transparent' }}>
            {messages.length === 0 && (
              <div style={{ padding: '20px 14px', textAlign: 'center', color: '#2a3060', fontSize: 10 }}>Waiting for players…</div>
            )}
            {messages.map(m => (
              <div key={m.id} style={{ padding: '4px 10px', borderLeft: m.isUser ? '3px solid #7c56f0' : m.isSystem ? '3px solid #ffd700' : '3px solid transparent', background: m.isSystem ? 'rgba(255,215,0,0.04)' : 'transparent' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: m.col || '#a78bfa' }}>{m.name}: </span>
                <span style={{ fontSize: 9, color: m.isUser ? '#e2e8f0' : m.isSystem ? '#ffd700cc' : '#8a94c4' }}>{m.msg}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '8px 8px', borderTop: '1px solid #1a1e36', display: 'flex', gap: 4 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMsg()}
              placeholder="say something…"
              style={{
                flex: 1, background: '#060810', border: '1px solid #2a2f52', borderRadius: 5,
                color: '#c8d0f0', fontFamily: 'monospace', fontSize: 9, padding: '5px 8px',
                outline: 'none',
              }}
            />
            <button onClick={sendMsg} style={{
              padding: '5px 10px', borderRadius: 5, border: '1px solid #7c56f0',
              background: 'rgba(124,86,240,0.25)', color: '#c4b5fd',
              fontFamily: 'monospace', fontSize: 9, fontWeight: 700, cursor: 'pointer',
            }}>→</button>
          </div>
        </div>
      )}

      <div style={{ borderTop: '2px solid #2a2f52', background: '#0b0e1d', padding: selCastle ? '12px 10px' : '10px 12px' }}>
        {!selCastle ? (
          <div style={{ textAlign: 'center', padding: '6px 0' }}>
            <div style={{ fontSize: 22, opacity: 0.35 }}>⚔</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#3a4478', marginTop: 4 }}>CLICK A CASTLE</div>
            <div style={{ fontSize: 8, color: '#2a3060', marginTop: 2 }}>in game or via CASTLES tab</div>
          </div>
        ) : (
          <>
            <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 8, background: `${col}12`, border: `2px solid ${col}55`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 8, letterSpacing: 2, color: col, fontWeight: 700 }}>TARGET</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: 1, textShadow: `0 0 10px ${col}` }}>
                  {CASTLE_NAMES[selectedId]}
                </div>
                <div style={{ fontSize: 10, color: col, marginTop: 2, fontWeight: 600 }}>
                  {selCastle.fallen ? '🔄 REBUILDING' : `${Math.round(Math.max(0, Math.min(100, ((selCastle.hp ?? 1000) / (selCastle.maxHp || 1000)) * 100)))}% HP`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#fbbf24' }}>{Number(selCastle.pool || 0).toFixed(3)}</div>
                <div style={{ fontSize: 7, color: '#6b74a8' }}>pool MON</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#4dff91', marginTop: 3 }}>🏆 {(Number(selCastle.pool || 0) * 0.7).toFixed(3)}</div>
                <div style={{ fontSize: 7, color: '#4a5180' }}>last hit prize</div>
              </div>
            </div>
            {!selCastle.fallen && (() => {
              const hp = Math.max(0, Math.min(100, ((selCastle.hp ?? 1000) / (selCastle.maxHp || 1000)) * 100))
              const hc = hp > 60 ? col : hp > 30 ? '#fbbf24' : '#ff4d4d'
              return (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ height: 8, background: '#0a0d1c', borderRadius: 4, border: '1px solid #2a2f52', overflow: 'hidden' }}>
                    <div style={{ width: `${hp}%`, height: '100%', background: `linear-gradient(90deg, ${hc}cc, ${hc})`, borderRadius: 4, boxShadow: `0 0 5px ${hc}`, transition: 'width 0.4s' }} />
                  </div>
                </div>
              )
            })()}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 9, color: '#4a5180' }}>COST PER HIT</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: col }}>0.01 MON</span>
            </div>
            {selCastle.fallen ? (
              <div style={{ padding: '11px 0', borderRadius: 8, textAlign: 'center', background: '#0e1225', border: '2px solid #2a2f52', color: '#3a4478', fontSize: 10, fontWeight: 700 }}>REBUILDING…</div>
            ) : (
              <button onClick={() => onAttack?.(selectedId)} style={{
                  width: '100%', padding: '13px 0', borderRadius: 8,
                  background: `linear-gradient(135deg, ${col}44, ${col}22)`,
                  border: `2px solid ${col}`, color: '#ffffff', fontSize: 14,
                  fontFamily: '"Courier New", monospace', fontWeight: 900, cursor: 'pointer',
                  letterSpacing: 3, textShadow: `0 0 10px ${col}`,
                  boxShadow: `0 0 18px ${col}44, inset 0 0 10px ${col}11`, transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${col}66, ${col}44)`; e.currentTarget.style.boxShadow = `0 0 30px ${col}77, inset 0 0 14px ${col}22` }}
                onMouseOut={e => { e.currentTarget.style.background = `linear-gradient(135deg, ${col}44, ${col}22)`; e.currentTarget.style.boxShadow = `0 0 18px ${col}44, inset 0 0 10px ${col}11` }}
              >⚔ ATTACK</button>
            )}
          </>
        )}
      </div>

      {tab === 'gallery' && (
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#2a2f52 transparent' }}>
          <GalleryUpload wallet={null} />
        </div>
      )}
    </aside>
  )
}

function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '8px 2px', border: 'none', cursor: 'pointer',
      background: active ? '#0e1631' : 'transparent',
      borderBottom: active ? '2px solid #7c56f0' : '2px solid transparent',
      color: active ? '#c4b5fd' : '#4a5180',
      fontSize: 8, fontFamily: '"Courier New", monospace', fontWeight: 700, letterSpacing: 0.5,
      transition: 'all 0.15s',
    }}>{label}</button>
  )
}

function LeaderRow({ rank, player }) {
  const rankCols = ['#ffd700','#c0c0c0','#cd7f32','#a78bfa','#60a5fa']
  const rc = rankCols[rank - 1] || '#4a5180'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderBottom: '1px solid #0e1120' }}>
      <div style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, background: `${rc}22`, border: `1px solid ${rc}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: rc }}>{rank}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#ccd3f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</div>
        <div style={{ fontSize: 8, color: '#4a5180', marginTop: 1 }}>{player.attacks} attacks · {player.kills} kills</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#fbbf24' }}>{player.mon.toFixed(2)}</div>
        <div style={{ fontSize: 7, color: '#4a5180' }}>MON</div>
      </div>
    </div>
  )
}
