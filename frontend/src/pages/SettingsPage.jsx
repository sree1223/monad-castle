import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useMonadContext } from '../context/MonadContext'

const TABS = ['Game', 'Audio', 'Network', 'About']
const MONAD_RPC = 'https://testnet-rpc.monad.xyz'
const MONAD_EXPLORER = 'https://testnet.monadexplorer.com'
const CHAIN_ID = 10143

export default function SettingsPage() {
  const monad = useMonadContext()
  const [tab, setTab] = useState(0)
  const navigate = useNavigate()

  // Game settings
  const [walkSpeed,   setWalkSpeed]   = useState(60)
  const [panSpeed,    setPanSpeed]    = useState(50)
  const [showHints,   setShowHints]   = useState(true)
  const [showDamage,  setShowDamage]  = useState(true)
  const [particles,   setParticles]   = useState(true)

  // Audio settings
  const [soundFX,  setSoundFX]  = useState(true)
  const [music,    setMusic]    = useState(false)
  const [volume,   setVolume]   = useState(60)

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#080a12',
      display: 'flex', flexDirection: 'column', fontFamily: '"Courier New", monospace',
      color: '#dde3ff', overflow: 'hidden',
    }}>
      <NavBar
        balance={monad.isConnected ? monad.contractBalance : '0.000'}
        isConnected={monad.isConnected}
        account={monad.account}
        onConnect={monad.connect}
        onDisconnect={monad.disconnect}
        onClassClick={() => navigate('/')}
      />

      <div style={{ flex: 1, overflowY: 'auto', maxWidth: 600, margin: '0 auto', width: '100%', padding: '32px 24px', scrollbarWidth: 'thin', scrollbarColor: '#2a2f52 transparent' }}>

        {/* ── Title ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: '#4a5180', marginBottom: 8, fontWeight: 700 }}>CONFIGURATION</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', letterSpacing: 1 }}>Settings</div>
          <div style={{ fontSize: 11, color: '#4a5180', marginTop: 6 }}>Customize your MonCastle experience</div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', borderBottom: '2px solid #2a2f52', marginBottom: 24 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 18px', fontSize: 11, fontFamily: '"Courier New", monospace',
              background: 'transparent', fontWeight: tab === i ? 700 : 500,
              color: tab === i ? '#c4b5fd' : '#6b74a8', border: 'none',
              borderBottom: tab === i ? '2px solid #7c56f0' : '2px solid transparent',
              marginBottom: -2,
              cursor: 'pointer', letterSpacing: 0.5, transition: 'color 0.15s',
            }}>{t}</button>
          ))}
        </div>

        {/* ── GAME TAB ── */}
        {tab === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SSection title="MOVEMENT">
              <SliderRow label="Walk Speed" value={walkSpeed} onChange={setWalkSpeed} min={20} max={120} color="#c084fc" hint="Character movement speed" />
              <SliderRow label="Camera Pan" value={panSpeed}  onChange={setPanSpeed}  min={20} max={100} color="#c084fc" hint="Camera panning speed" />
            </SSection>
            <SSection title="DISPLAY">
              <ToggleRow label="Show Attack Hints"   value={showHints}  onChange={setShowHints}  hint="Castle click guide indicators" />
              <ToggleRow label="Show Damage Numbers" value={showDamage} onChange={setShowDamage} hint="Floating HP numbers on hit" />
              <ToggleRow label="Battle Particles"    value={particles}  onChange={setParticles}  hint="Explosion and impact effects" />
            </SSection>
            <SSection title="DANGER ZONE">
              <DangerRow
                label="Reset All Progress"
                hint="Clears localStorage and restarts onboarding"
                btnLabel="RESET"
                onAction={() => {
                  if (window.confirm('Reset all local data? This cannot be undone.')) {
                    localStorage.clear()
                    window.location.href = '/intro'
                  }
                }}
              />
            </SSection>
          </div>
        )}

        {/* ── AUDIO TAB ── */}
        {tab === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SSection title="CHANNELS">
              <ToggleRow label="Sound Effects"    value={soundFX} onChange={setSoundFX} hint="Attack, hit, and castle sounds" />
              <ToggleRow label="Background Music" value={music}   onChange={setMusic}   hint="Ambient battle music (coming soon)" />
            </SSection>
            <SSection title="VOLUME">
              <SliderRow label="Master Volume" value={volume} onChange={setVolume} min={0} max={100} color="#4dff91" hint={`${volume}%`} />
            </SSection>
          </div>
        )}

        {/* ── NETWORK TAB ── */}
        {tab === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SSection title="MONAD TESTNET">
              <NetRow label="NETWORK"  value="Monad Testnet" />
              <NetRow label="CHAIN ID" value={CHAIN_ID.toString()} />
              <NetRow label="RPC URL"  value={MONAD_RPC} copy />
              <NetRow label="EXPLORER" value={MONAD_EXPLORER} link={MONAD_EXPLORER} />
            </SSection>
            <button
              onClick={async () => {
                if (!window.ethereum) return alert('MetaMask not found')
                try {
                  await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{ chainId: '0x279f', chainName: 'Monad Testnet',
                      nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
                      rpcUrls: [MONAD_RPC], blockExplorerUrls: [MONAD_EXPLORER] }],
                  })
                } catch(e) { console.warn(e) }
              }}
              style={{
                padding: '12px', borderRadius: 8, fontSize: 11, fontFamily: '"Courier New", monospace',
                fontWeight: 700, letterSpacing: 1, cursor: 'pointer',
                background: 'rgba(77,184,255,0.1)', border: '1px solid rgba(77,184,255,0.4)',
                color: '#4db8ff', transition: 'all 0.15s',
              }}>
              + Add Monad Testnet to MetaMask
            </button>
            <div style={{
              padding: '16px 18px',
              background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.25)',
              borderRadius: 10, fontSize: 11, color: '#fbbf24', lineHeight: 2,
            }}>
              ⚠ MonCastle runs exclusively on Monad Testnet.<br/>
              Tokens have no real monetary value.
            </div>
            <div style={{
              padding: '16px 18px',
              background: 'rgba(77,184,255,0.07)', border: '1px solid rgba(77,184,255,0.25)',
              borderRadius: 10, fontSize: 11, color: '#4db8ff', lineHeight: 2,
            }}>
              Contract Address:<br />
              <span style={{ fontFamily: 'monospace', color: '#ffffff', fontSize: 10 }}>
                {import.meta.env.VITE_CONTRACT_ADDRESS || '0x···(not yet deployed)'}
              </span>
            </div>
          </div>
        )}

        {/* ── ABOUT TAB ── */}
        {tab === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SSection title="MONCASTLE">
              <div style={{ padding: '4px 0', fontSize: 12, color: '#c8d0f0', lineHeight: 2 }}>
                MonCastle is an on-chain castle siege game built on Monad Testnet
                for the Monad Hackathon. Players select a character class and attack
                enemy fortresses — the last warrior to strike a castle before it falls
                wins 70% of that castle's prize pool.
              </div>
            </SSection>
            <SSection title="TECH STACK">
              {[
                ['Blockchain', 'Monad Testnet (EVM-compatible)'],
                ['Smart Contract', 'Solidity + Hardhat'],
                ['Frontend', 'React + Vite + Phaser 3'],
                ['Backend', 'Express + SQLite'],
                ['Wallet', 'MetaMask (EIP-1193)'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e2240' }}>
                  <span style={{ fontSize: 10, color: '#4a5180', fontWeight: 700, letterSpacing: 1 }}>{k.toUpperCase()}</span>
                  <span style={{ fontSize: 11, color: '#c8d0f0' }}>{v}</span>
                </div>
              ))}
            </SSection>
            <SSection title="VERSION">
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: 10, color: '#4a5180' }}>APP VERSION</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#c084fc' }}>v1.0.0 — Hackathon Build</span>
              </div>
            </SSection>
          </div>
        )}

        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function SSection({ title, children }) {
  return (
    <div style={{ background: '#0e1225', border: '1px solid #2a2f52', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 18px', borderBottom: '1px solid #2a2f52', background: '#0a0d1c' }}>
        <span style={{ fontSize: 8, letterSpacing: 3, color: '#4a5180', fontWeight: 700 }}>{title}</span>
      </div>
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  )
}

function SliderRow({ label, value, onChange, min, max, color, hint }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#dde3ff', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color }}>{value}<span style={{ fontSize: 9, color: '#4a5180', marginLeft: 4 }}>{hint !== `${value}%` ? hint : '%'}</span></div>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(+e.target.value)}
        style={{ width: '100%', accentColor: color, cursor: 'pointer', height: 4 }}
      />
    </div>
  )
}

function ToggleRow({ label, value, onChange, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <div style={{ fontSize: 12, color: '#dde3ff', fontWeight: 600, marginBottom: 3 }}>{label}</div>
        {hint && <div style={{ fontSize: 10, color: '#4a5180' }}>{hint}</div>}
      </div>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 42, height: 24, borderRadius: 12, cursor: 'pointer', flexShrink: 0,
          background: value ? '#7c56f0' : '#1e2240',
          border: value ? '1px solid #a78bfa' : '1px solid #2a2f52',
          position: 'relative', transition: 'all 0.2s',
          boxShadow: value ? '0 0 8px rgba(124,86,240,0.4)' : 'none',
        }}
      >
        <div style={{
          position: 'absolute', top: 4, left: value ? 20 : 4,
          width: 14, height: 14, borderRadius: '50%',
          background: value ? '#ffffff' : '#4a5180',
          transition: 'left 0.2s, background 0.2s',
          boxShadow: value ? '0 2px 6px rgba(0,0,0,0.4)' : 'none',
        }} />
      </div>
    </div>
  )
}

function NetRow({ label, value, copy, link }) {
  const handleCopy = () => navigator.clipboard?.writeText(value)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0',
      borderBottom: '1px solid #1e2240',
    }}>
      <span style={{ fontSize: 9, color: '#4a5180', letterSpacing: 1, width: 72, flexShrink: 0, fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 11, color: '#c8d0f0', flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {value}
      </span>
      {copy && (
        <button onClick={handleCopy} style={{
          padding: '3px 10px', borderRadius: 5, fontSize: 9, fontFamily: 'monospace',
          background: 'rgba(124,86,240,0.15)', border: '1px solid rgba(124,86,240,0.4)',
          color: '#c4b5fd', cursor: 'pointer', flexShrink: 0, fontWeight: 700,
        }}>COPY</button>
      )}
      {link && (
        <a href={link} target="_blank" rel="noreferrer"
          style={{ color: '#4db8ff', textDecoration: 'none', fontSize: 11, flexShrink: 0, fontWeight: 700 }}>↗</a>
      )}
    </div>
  )
}

function DangerRow({ label, hint, btnLabel, onAction }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 12, color: '#fca5a5', fontWeight: 700, marginBottom: 4 }}>{label}</div>
        {hint && <div style={{ fontSize: 10, color: '#6b3a3a' }}>{hint}</div>}
      </div>
      <button onClick={onAction} style={{
        padding: '7px 16px', borderRadius: 7, fontSize: 10, fontFamily: '"Courier New", monospace',
        background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)',
        color: '#fca5a5', cursor: 'pointer', letterSpacing: 1, flexShrink: 0, fontWeight: 700,
        transition: 'all 0.15s',
      }}
        onMouseOver={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.28)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.7)' }}
        onMouseOut={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)' }}
      >{btnLabel}</button>
    </div>
  )
}
