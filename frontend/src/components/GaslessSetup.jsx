/**
 * GaslessSetup.jsx
 *
 * One-time setup panel shown after Privy login when the user hasn't
 * yet deposited MON or registered a session key.
 *
 * Flow:
 *   Step 1 — Deposit MON into the CastleWar contract (in-game balance)
 *   Step 2 — Enable session key (setSession + fundSession on-chain,
 *             signed silently by the Privy embedded wallet)
 *
 * After step 2, all attack() txs are signed by the ephemeral session
 * key — zero MetaMask / Privy popups per attack ⚡
 */
import React, { useState } from 'react'

const C = {
  bg:       '#0d1021',
  card:     '#111728',
  border:   '#1e2340',
  gold:     '#f5c542',
  purple:   '#8b5cf6',
  green:    '#22c55e',
  red:      '#f87171',
  textDim:  '#5a6180',
}

const DEPOSIT_PRESETS = ['0.05', '0.1', '0.5', '1.0']

export default function GaslessSetup({ onDeposit, onEnableSession, onSkip, isPending, contractBalance, sessionActive }) {
  const [depositAmt, setDepositAmt] = useState('0.1')
  const [step, setStep]             = useState(1)  // 1 = deposit, 2 = session
  const [deposited, setDeposited]   = useState(false)

  const canDeposit   = !isPending && parseFloat(depositAmt) > 0
  const canSession   = !isPending && (deposited || parseFloat(contractBalance) > 0)

  async function handleDeposit() {
    const hash = await onDeposit(depositAmt)
    if (hash) { setDeposited(true); setStep(2) }
  }

  async function handleSession() {
    const ok = await onEnableSession()
    if (ok) onSkip?.()   // close panel after success
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 420, background: C.card, borderRadius: 16,
        border: `1px solid ${C.border}`, boxShadow: `0 24px 64px rgba(0,0,0,0.8), 0 0 48px rgba(139,92,246,0.15)`,
        fontFamily: 'monospace', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`,
          background: 'linear-gradient(135deg,rgba(139,92,246,0.12),rgba(245,197,66,0.08))',
        }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>⚡ ENABLE GASLESS ATTACKS</div>
          <div style={{ fontSize: 11, color: C.textDim, letterSpacing: 0.8 }}>
            One-time setup · Sign silently with your Privy embedded wallet
          </div>
        </div>

        {/* Steps */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            {[1, 2].map(n => (
              <div key={n} style={{
                flex: 1, height: 4, borderRadius: 2,
                background: step >= n
                  ? (n === 1 && deposited ? C.green : C.purple)
                  : C.border,
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          {/* ── STEP 1: Deposit ── */}
          <div style={{
            padding: '16px', borderRadius: 10,
            border: `1px solid ${step === 1 ? C.purple : deposited ? C.green : C.border}`,
            background: step === 1 ? 'rgba(139,92,246,0.07)' : 'transparent',
            opacity: step < 1 ? 0.5 : 1, transition: 'all 0.2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: deposited ? C.green : step === 1 ? C.purple : C.border,
                fontSize: 11, fontWeight: 700, color: '#fff',
              }}>{deposited ? '✓' : '1'}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: deposited ? C.green : '#fff' }}>
                Deposit MON (in-game balance)
              </div>
            </div>
            <div style={{ fontSize: 10, color: C.textDim, marginBottom: 12, lineHeight: 1.6 }}>
              MON in your in-game balance funds attacks (0.01 MON each) and gas for the session key.
              Current balance: <span style={{ color: C.gold }}>{contractBalance || '0.000'} MON</span>
            </div>

            {/* Preset buttons */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {DEPOSIT_PRESETS.map(p => (
                <button key={p} onClick={() => setDepositAmt(p)} style={{
                  flex: 1, padding: '5px 0', borderRadius: 6, cursor: 'pointer',
                  background: depositAmt === p ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${depositAmt === p ? C.purple : C.border}`,
                  color: depositAmt === p ? '#c4b5fd' : C.textDim,
                  fontSize: 10, fontWeight: 700,
                }}>{p} MON</button>
              ))}
            </div>

            <button
              onClick={handleDeposit}
              disabled={!canDeposit || deposited}
              style={{
                width: '100%', padding: '10px', borderRadius: 8, cursor: canDeposit && !deposited ? 'pointer' : 'not-allowed',
                background: deposited ? 'rgba(34,197,94,0.15)' : canDeposit ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${deposited ? C.green : canDeposit ? C.purple : C.border}`,
                color: deposited ? C.green : canDeposit ? '#c4b5fd' : C.textDim,
                fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
                opacity: isPending && step === 1 ? 0.7 : 1,
              }}
            >
              {deposited ? '✓ DEPOSITED' : isPending && step === 1 ? '⏳ DEPOSITING…' : `DEPOSIT ${depositAmt} MON`}
            </button>
          </div>

          {/* ── STEP 2: Session ── */}
          <div style={{
            padding: '16px', borderRadius: 10,
            border: `1px solid ${step === 2 ? C.gold : sessionActive ? C.green : C.border}`,
            background: step === 2 ? 'rgba(245,197,66,0.05)' : 'transparent',
            opacity: step < 2 ? 0.45 : 1, transition: 'all 0.2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: sessionActive ? C.green : step === 2 ? C.gold : C.border,
                fontSize: 11, fontWeight: 700, color: '#111',
              }}>{sessionActive ? '✓' : '2'}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: sessionActive ? C.green : '#fff' }}>
                Enable Session Key
              </div>
            </div>
            <div style={{ fontSize: 10, color: C.textDim, marginBottom: 12, lineHeight: 1.6 }}>
              Creates a one-time session key that signs attack() transactions automatically.
              <br/>
              <span style={{ color: C.gold }}>After this — zero popups for any attack. ⚡</span>
            </div>
            <button
              onClick={handleSession}
              disabled={!canSession || sessionActive}
              style={{
                width: '100%', padding: '10px', borderRadius: 8,
                cursor: canSession && !sessionActive ? 'pointer' : 'not-allowed',
                background: sessionActive ? 'rgba(34,197,94,0.15)' : canSession ? 'rgba(245,197,66,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${sessionActive ? C.green : canSession ? C.gold : C.border}`,
                color: sessionActive ? C.green : canSession ? C.gold : C.textDim,
                fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
                opacity: isPending && step === 2 ? 0.7 : 1,
              }}
            >
              {sessionActive ? '⚡ GASLESS ACTIVE' : isPending && step === 2 ? '⏳ SETTING UP…' : '⚡ ENABLE SESSION KEY'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px', borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 9, color: C.textDim }}>
            Session key stored in browser · Expires in 24h · Revocable anytime
          </div>
          <button onClick={onSkip} style={{
            padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
            background: 'transparent', border: `1px solid ${C.border}`,
            color: C.textDim, fontSize: 10, fontFamily: 'monospace',
          }}>SKIP</button>
        </div>
      </div>
    </div>
  )
}
