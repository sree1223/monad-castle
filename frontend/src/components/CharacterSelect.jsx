import { useState } from 'react'
import { CHARACTERS } from '../game/CharacterData'

/* ── Anime-inspired SVG portrait for each character ─────────────── */
function SageSVG({ glowing }) {
  return (
    <svg viewBox="0 0 80 100" width="80" height="100">
      {/* Spiky blonde hair */}
      <polygon points="40,12 28,4 30,22" fill="#ffdd00"/>
      <polygon points="40,10 38,0 50,14" fill="#ffcc00"/>
      <polygon points="40,10 52,2 54,20" fill="#ffdd00"/>
      <polygon points="34,10 24,8 26,22" fill="#ffe033"/>
      <polygon points="46,10 56,8 54,22" fill="#ffe033"/>
      {/* Head */}
      <ellipse cx="40" cy="32" rx="16" ry="18" fill="#f5c580"/>
      {/* Blue headband */}
      <rect x="24" y="20" width="32" height="7" rx="2" fill="#2255cc"/>
      <rect x="31" y="20" width="18" height="7" rx="1" fill="#aabbcc"/>
      <text x="40" y="27" textAnchor="middle" fontSize="5" fill="#4455aa">卍</text>
      {/* Determined eyes */}
      <ellipse cx="33" cy="35" rx="5" ry="4" fill="#1144aa"/>
      <ellipse cx="47" cy="35" rx="5" ry="4" fill="#1144aa"/>
      <ellipse cx="33" cy="35" rx="3" ry="3" fill="#002266"/>
      <ellipse cx="47" cy="35" rx="3" ry="3" fill="#002266"/>
      <ellipse cx="32" cy="34" rx="1.5" ry="1.5" fill="white"/>
      <ellipse cx="46" cy="34" rx="1.5" ry="1.5" fill="white"/>
      {/* Whisker marks */}
      <rect x="20" y="38" width="8" height="1.5" rx="0.8" fill="#884400" opacity="0.7"/>
      <rect x="20" y="41" width="8" height="1.5" rx="0.8" fill="#884400" opacity="0.7"/>
      <rect x="52" y="38" width="8" height="1.5" rx="0.8" fill="#884400" opacity="0.7"/>
      <rect x="52" y="41" width="8" height="1.5" rx="0.8" fill="#884400" opacity="0.7"/>
      {/* Smile */}
      <path d="M34 44 Q40 50 46 44" stroke="#c97840" fill="none" strokeWidth="1.5"/>
      {/* Orange jacket */}
      <rect x="22" y="52" width="36" height="35" rx="3" fill="#ff6a00"/>
      <rect x="36" y="52" width="8" height="35" fill="#111"/>
      {/* Chakra glow */}
      {glowing && <ellipse cx="40" cy="70" rx="20" ry="10" fill="#5599ff" opacity="0.18"/>}
    </svg>
  )
}

function BrawlerSVG({ glowing }) {
  return (
    <svg viewBox="0 0 80 100" width="80" height="100">
      {/* Straw hat */}
      <ellipse cx="40" cy="18" rx="26" ry="8" fill="#e8b830"/>
      <ellipse cx="40" cy="16" rx="15" ry="9" fill="#f0c840"/>
      <rect x="14" y="16" width="52" height="4" rx="1" fill="#cc3311"/>
      {/* Black hair */}
      <ellipse cx="40" cy="24" rx="13" ry="10" fill="#111"/>
      <polygon points="28,22 22,32 34,28" fill="#111"/>
      <polygon points="52,22 58,32 46,28" fill="#111"/>
      {/* Head */}
      <ellipse cx="40" cy="34" rx="15" ry="17" fill="#f5c580"/>
      {/* Scar under left eye */}
      <rect x="24" y="38" width="5" height="2" rx="1" fill="#aa4433" opacity="0.8"/>
      {/* Big excited eyes */}
      <ellipse cx="32" cy="34" rx="6" ry="6" fill="#111"/>
      <ellipse cx="48" cy="34" rx="6" ry="6" fill="#111"/>
      <ellipse cx="30" cy="32" rx="2.5" ry="2.5" fill="white"/>
      <ellipse cx="46" cy="32" rx="2.5" ry="2.5" fill="white"/>
      {/* Grin */}
      <path d="M28 46 Q40 56 52 46" stroke="#1a0a00" fill="none" strokeWidth="2.5"/>
      {/* Red vest open */}
      <rect x="20" y="54" width="14" height="34" rx="2" fill="#cc2200"/>
      <rect x="46" y="54" width="14" height="34" rx="2" fill="#cc2200"/>
      <rect x="34" y="54" width="12" height="34" fill="#f0c888"/>
      {/* Stretched fist glow */}
      {glowing && <ellipse cx="62" cy="70" rx="10" ry="8" fill="#f5d020" opacity="0.3"/>}
    </svg>
  )
}

function ReaperSVG({ glowing }) {
  return (
    <svg viewBox="0 0 80 100" width="80" height="100">
      {/* Orange spiky hair */}
      <polygon points="40,12 26,6 28,22" fill="#ee5522"/>
      <polygon points="40,8 38,0 50,14" fill="#ff6633"/>
      <polygon points="40,12 52,6 52,22" fill="#ee5522"/>
      <polygon points="34,12 22,10 25,24" fill="#ff6633"/>
      {/* Head */}
      <ellipse cx="40" cy="32" rx="15" ry="18" fill="#f0c888"/>
      {/* Serious dark eyes */}
      <ellipse cx="32" cy="33" rx="5.5" ry="4" fill="#774400"/>
      <ellipse cx="48" cy="33" rx="5.5" ry="4" fill="#774400"/>
      <ellipse cx="32" cy="33" rx="3.5" ry="3" fill="#221100"/>
      <ellipse cx="48" cy="33" rx="3.5" ry="3" fill="#221100"/>
      <ellipse cx="31" cy="32" rx="1.5" ry="1.5" fill="white"/>
      <ellipse cx="47" cy="32" rx="1.5" ry="1.5" fill="white"/>
      {/* Frown */}
      <rect x="34" y="43" width="12" height="1.5" rx="0.8" fill="#996655" opacity="0.7"/>
      {/* Black shinigami robe */}
      <rect x="18" y="52" width="44" height="38" rx="3" fill="#111"/>
      {/* White undershirt */}
      <rect x="34" y="52" width="12" height="18" fill="#f8f8f8"/>
      <rect x="36" y="52" width="8" height="18" fill="#111"/>
      {/* Zanpakuto */}
      <rect x="56" y="38" width="6" height="30" rx="2" fill="#3a2808"/>
      <rect x="54" y="44" width="10" height="5" rx="1" fill="#c0a832"/>
      {glowing && <ellipse cx="60" cy="38" rx="6" ry="12" fill="#88ffee" opacity="0.25"/>}
    </svg>
  )
}

function HunterSVG({ glowing }) {
  return (
    <svg viewBox="0 0 80 100" width="80" height="100">
      {/* Short dark undercut hair */}
      <rect x="26" y="14" width="28" height="12" rx="6" fill="#111"/>
      <rect x="24" y="14" width="32" height="6" rx="3" fill="#1a1a1a"/>
      {/* Head */}
      <ellipse cx="40" cy="32" rx="14" ry="17" fill="#e8c090"/>
      {/* Sharp grey eyes */}
      <ellipse cx="32" cy="32" rx="5" ry="3.5" fill="#5060a0"/>
      <ellipse cx="48" cy="32" rx="5" ry="3.5" fill="#5060a0"/>
      <ellipse cx="32" cy="32" rx="3" ry="2.5" fill="#1a2050"/>
      <ellipse cx="48" cy="32" rx="3" ry="2.5" fill="#1a2050"/>
      <ellipse cx="31" cy="31" rx="1.5" ry="1" fill="white"/>
      <ellipse cx="47" cy="31" rx="1.5" ry="1" fill="white"/>
      {/* Neutral expression */}
      <rect x="35" y="42" width="10" height="1.2" rx="0.6" fill="#c09870" opacity="0.7"/>
      {/* White shirt + harness */}
      <rect x="22" y="52" width="36" height="34" rx="2" fill="#f0ece0"/>
      {/* Survey corps green cape */}
      <polygon points="22,52 10,82 22,86" fill="rgba(42,102,52,0.85)"/>
      <polygon points="58,52 70,82 58,86" fill="rgba(42,102,52,0.85)"/>
      {/* ODM blade */}
      <rect x="8" y="60" width="18" height="3" rx="1" fill="#b8d0e0"/>
      {/* Wings of freedom patch */}
      <ellipse cx="40" cy="66" rx="9" ry="5" fill="rgba(255,255,255,0.4)"/>
      {glowing && <ellipse cx="40" cy="75" rx="20" ry="8" fill="#4a8a4a" opacity="0.2"/>}
    </svg>
  )
}

function SlayerSVG({ glowing }) {
  return (
    <svg viewBox="0 0 80 100" width="80" height="100">
      {/* Dark hair with maroon tips */}
      <polygon points="40,10 26,4 28,22" fill="#111"/>
      <polygon points="27,6 22,2 24,16" fill="#442222"/>
      <polygon points="40,8 38,0 50,14" fill="#111"/>
      <polygon points="53,6 58,2 56,16" fill="#442222"/>
      <polygon points="40,10 54,4 52,22" fill="#111"/>
      {/* Head */}
      <ellipse cx="40" cy="32" rx="14" ry="17" fill="#f0c888"/>
      {/* Intense red eyes */}
      <ellipse cx="32" cy="32" rx="5.5" ry="5" fill="#cc1122"/>
      <ellipse cx="48" cy="32" rx="5.5" ry="5" fill="#cc1122"/>
      <ellipse cx="32" cy="32" rx="3.5" ry="3.5" fill="#660011"/>
      <ellipse cx="48" cy="32" rx="3.5" ry="3.5" fill="#660011"/>
      <ellipse cx="31" cy="31" rx="1.5" ry="1.5" fill="white"/>
      <ellipse cx="47" cy="31" rx="1.5" ry="1.5" fill="white"/>
      {/* Focused expression */}
      <rect x="35" y="43" width="10" height="1.5" rx="0.8" fill="#c09070" opacity="0.7"/>
      {/* Scar mark */}
      <rect x="20" y="36" width="7" height="1.5" rx="0.8" fill="#cc5533" opacity="0.7"/>
      {/* Hanafuda earring */}
      <circle cx="55" cy="39" r="3" fill="#dd2244"/>
      <circle cx="55" cy="44" r="2" fill="#ff7733"/>
      {/* Checker haori */}
      {Array.from({length: 6}).map((_,r) =>
        Array.from({length: 5}).map((_,c) => (
          <rect key={`${r}-${c}`} x={20+c*8} y={54+r*7} width="7.5" height="6.5"
            fill={(r+c)%2===0 ? '#229966' : '#111'} rx="0.5"/>
        ))
      )}
      {/* Collar */}
      <rect x="20" y="54" width="3" height="32" rx="1" fill="#f0f0f0"/>
      <rect x="57" y="54" width="3" height="32" rx="1" fill="#f0f0f0"/>
      {/* Twin katanas */}
      <rect x="12" y="28" width="4" height="44" rx="1" fill="#d8e4f0"/>
      <rect x="64" y="28" width="4" height="44" rx="1" fill="#d8e4f0"/>
      <rect x="10" y="46" width="8" height="4" rx="1" fill="#229966"/>
      <rect x="62" y="46" width="8" height="4" rx="1" fill="#229966"/>
      {glowing && <ellipse cx="40" cy="80" rx="22" ry="6" fill="#ff4422" opacity="0.2"/>}
    </svg>
  )
}

function HeroSVG({ glowing }) {
  return (
    <svg viewBox="0 0 80 100" width="80" height="100">
      {/* Wild green hair */}
      <polygon points="40,10 26,4 28,22" fill="#114422"/>
      <polygon points="40,6 36,0 50,10" fill="#226633"/>
      <polygon points="40,10 54,4 52,22" fill="#114422"/>
      <polygon points="32,10 20,10 24,24" fill="#226633"/>
      <polygon points="48,10 60,10 56,24" fill="#226633"/>
      {/* Hero cowl ears */}
      <rect x="30" y="0" width="6" height="14" rx="3" fill="#1a7a30"/>
      <rect x="44" y="0" width="6" height="14" rx="3" fill="#1a7a30"/>
      {/* Head mask */}
      <ellipse cx="40" cy="34" rx="15" ry="17" fill="#111"/>
      {/* Glowing green visor */}
      <rect x="26" y="28" width="28" height="12" rx="4" fill="#44cc66" opacity="0.9"/>
      <ellipse cx="32" cy="34" rx="5.5" ry="5" fill="#44cc66"/>
      <ellipse cx="48" cy="34" rx="5.5" ry="5" fill="#44cc66"/>
      <ellipse cx="32" cy="34" rx="3.5" ry="3.5" fill="#004422"/>
      <ellipse cx="48" cy="34" rx="3.5" ry="3.5" fill="#004422"/>
      <ellipse cx="31" cy="33" rx="1.5" ry="1.5" fill="#88ffcc"/>
      <ellipse cx="47" cy="33" rx="1.5" ry="1.5" fill="#88ffcc"/>
      {/* Emerald hero costume */}
      <rect x="20" y="54" width="40" height="36" rx="3" fill="#22aa44"/>
      <rect x="18" y="54" width="6" height="36" rx="2" fill="#116633"/>
      <rect x="56" y="54" width="6" height="36" rx="2" fill="#116633"/>
      {/* OFA lightning aura */}
      {glowing && <>
        <rect x="14" y="54" width="4" height="36" fill="#55aaff" opacity="0.3"/>
        <rect x="62" y="54" width="4" height="36" fill="#55aaff" opacity="0.3"/>
      </>}
      <text x="40" y="72" textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.5)">PLUS</text>
    </svg>
  )
}

const PORTRAIT_MAP = {
  sage: SageSVG,
  brawler: BrawlerSVG,
  reaper: ReaperSVG,
  hunter: HunterSVG,
  slayer: SlayerSVG,
  hero: HeroSVG,
}

const CLASS_COLORS = {
  sage: '#5599ff',
  brawler: '#f5d020',
  reaper: '#ff6633',
  hunter: '#4a8a4a',
  slayer: '#229966',
  hero: '#44cc66',
}

export default function CharacterSelect({ onSelect, defaultChar }) {
  const [hovered, setHovered]     = useState(null)
  const [chosen, setChosen]       = useState(defaultChar || CHARACTERS[0].id)
  const [confirmed, setConfirmed] = useState(false)

  const selected = CHARACTERS.find(c => c.id === chosen) ?? CHARACTERS[0]
  const accentColor = CLASS_COLORS[chosen] ?? '#5599ff'

  const handleConfirm = () => {
    setConfirmed(true)
    localStorage.setItem('mc_character', chosen)
    setTimeout(() => onSelect(chosen), 380)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'radial-gradient(ellipse at 50% 20%, #1a0e38 0%, #0a0814 65%, #060308 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'monospace',
      opacity: confirmed ? 0 : 1, transition: 'opacity 0.35s ease',
    }}>
      {/* Ambient floating particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {Array.from({length: 20}).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%`,
            width: i % 3 === 0 ? 2 : 1, height: i % 3 === 0 ? 2 : 1,
            borderRadius: '50%', background: accentColor,
            opacity: 0.15 + (i % 5) * 0.05,
          }} />
        ))}
      </div>

      {/* Title */}
      <div style={{ marginBottom: 28, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: 11, letterSpacing: 5, color: accentColor, marginBottom: 10, opacity: 0.8 }}>
          ⚔ CHOOSE YOUR WARRIOR ⚔
        </div>
        <div style={{
          fontSize: 28, fontWeight: 900, letterSpacing: 2,
          background: `linear-gradient(135deg, #ffffff 0%, ${accentColor} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {selected.name}
        </div>
        <div style={{ fontSize: 11, color: accentColor, marginTop: 4, opacity: 0.75 }}>
          {selected.title}
        </div>
      </div>

      {/* Character cards grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
        position: 'relative', zIndex: 1,
      }}>
        {CHARACTERS.map(char => {
          const Portrait = PORTRAIT_MAP[char.id]
          const isChosen = char.id === chosen
          const isHovered = char.id === hovered
          const cardAccent = CLASS_COLORS[char.id] ?? '#5599ff'

          return (
            <div
              key={char.id}
              onClick={() => setChosen(char.id)}
              onMouseEnter={() => setHovered(char.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: 130, height: 180, borderRadius: 12, cursor: 'pointer', position: 'relative',
                background: isChosen
                  ? 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.35) 100%)'
                  : 'rgba(255,255,255,0.025)',
                border: isChosen
                  ? `2px solid ${cardAccent}`
                  : '1px solid rgba(255,255,255,0.07)',
                boxShadow: isChosen
                  ? `0 0 28px ${cardAccent}55, inset 0 1px 0 rgba(255,255,255,0.08)`
                  : isHovered ? `0 0 12px ${cardAccent}30` : 'none',
                transform: isChosen ? 'scale(1.05) translateY(-3px)' : isHovered ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.2s ease',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                overflow: 'hidden', padding: '0 0 12px',
              }}
            >
              {isChosen && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 12, pointerEvents: 'none',
                  background: `radial-gradient(ellipse at 50% 40%, ${cardAccent}22 0%, transparent 70%)`,
                }}/>
              )}
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 12 }}>
                {Portrait ? <Portrait glowing={isChosen} /> : <div style={{ fontSize: 40 }}>⚔</div>}
              </div>
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5, color: isChosen ? '#fff' : '#8090a8' }}>
                  {char.name}
                </div>
                <div style={{ fontSize: 9, marginTop: 2, color: isChosen ? cardAccent : '#3a4555', letterSpacing: 0.5 }}>
                  {char.attackStyle.toUpperCase()}
                </div>
              </div>
              {isChosen && (
                <div style={{
                  position: 'absolute', top: 8, right: 8, width: 16, height: 16,
                  borderRadius: '50%', background: cardAccent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: '#000', fontWeight: 900,
                }}>✓</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Description */}
      <div style={{
        marginTop: 20, maxWidth: 420, textAlign: 'center', position: 'relative', zIndex: 1,
        color: '#8090a8', fontSize: 11, lineHeight: 1.7, padding: '0 24px',
      }}>
        {selected.desc}
      </div>

      {/* Confirm button */}
      <button
        onClick={handleConfirm}
        style={{
          marginTop: 20, padding: '12px 40px', borderRadius: 8,
          background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor}88)`,
          border: `1px solid ${accentColor}88`, color: '#fff', fontSize: 13, fontWeight: 700,
          fontFamily: 'monospace', cursor: 'pointer', letterSpacing: 2,
          boxShadow: `0 0 20px ${accentColor}44`,
          transition: 'all 0.2s ease', position: 'relative', zIndex: 1,
        }}
      >
        ENTER BATTLE
      </button>
    </div>
  )
}
