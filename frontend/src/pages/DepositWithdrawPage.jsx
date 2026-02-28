import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NavBar from '../components/NavBar'
import { useMonadContext } from '../context/MonadContext'

const MONAD_EXPLORER = 'https://testnet.monadexplorer.com'
const FAUCET_URL     = 'https://faucet.monad.xyz'
const TABS = ['Deposit', 'Withdraw', 'History']

export default function DepositWithdrawPage() {
  const monad = useMonadContext()
  const [tab, setTab] = useState(0)
  const [depositAmt, setDepositAmt] = useState('')
  const [withdrawAmt, setWithdrawAmt] = useState('')
  const [txMsg, setTxMsg] = useState(null)
  const [history, setHistory] = useState([])
  const navigate = useNavigate()

  const contractBal = parseFloat(monad.contractBalance) || 0
  const nativeBal   = parseFloat(monad.nativeBalance)   || 0
  const pending     = monad.isPending

  const handleAction = async (type, amount) => {
    const n = parseFloat(amount)
    if (isNaN(n) || n <= 0) return
    setTxMsg(null)
    try {
      let tx
      if (type === 'deposit')  tx = await monad.deposit(n.toFixed(4))
      else                     tx = await monad.withdraw(n.toFixed(4))
      const hash = tx?.hash || ('0x' + Math.random().toString(16).slice(2, 18))
      setTxMsg({ ok: true, msg: `${type === 'deposit' ? 'Deposited' : 'Withdrawn'} ${n.toFixed(4)} MON`, hash })
      setHistory(h => [{ type, amount: n.toFixed(3), ts: Date.now(), hash }, ...h])
      if (type === 'deposit')  setDepositAmt('')
      else                     setWithdrawAmt('')
    } catch (err) {
      setTxMsg({ ok: false, msg: err?.reason || err?.message || 'Transaction failed', hash: null })
    }
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#080a12',
      display: 'flex', flexDirection: 'column', fontFamily: '"Courier New", monospace', color: '#dde3ff',
      overflow: 'hidden',
    }}>
      <NavBar
        balance={monad.isConnected ? monad.contractBalance : '0.000'}
        isConnected={monad.isConnected}
        account={monad.account}
        onConnect={monad.connect}
        onDisconnect={monad.disconnect}
        onClassClick={() => navigate('/')}
      />

      <div style={{ flex: 1, overflowY: 'auto', maxWidth: 560, margin: '0 auto', width: '100%', padding: '32px 24px' }}>

        {/* Not connected banner */}
        {!monad.isConnected && (
          <div style={{
            padding: '16px 20px', marginBottom: 24, borderRadius: 10,
            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <span style={{ fontSize: 11, color: '#fbbf24', lineHeight: 1.6 }}>
              Connect your wallet to deposit, withdraw, and join live battles.
            </span>
            <button onClick={monad.connect} style={{
              padding: '8px 16px', borderRadius: 7, fontSize: 10, fontFamily: 'monospace',
              fontWeight: 700, letterSpacing: 1, cursor: 'pointer',
              background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.5)',
              color: '#fbbf24', whiteSpace: 'nowrap',
            }}>🔗 CONNECT</button>
          </div>
        )}

        {/* Balance card */}
        <div style={{
          padding: '24px', background: '#0e1225',
          border: '2px solid #2a2f52', borderRadius: 14, marginBottom: 28,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: '#4a5180', marginBottom: 8, fontWeight: 700 }}>GAME BALANCE</div>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#fbbf24', marginBottom: 4, letterSpacing: -1 }}>
            {contractBal.toFixed(3)}
          </div>
          <div style={{ fontSize: 12, color: '#a08040', letterSpacing: 2, fontWeight: 700 }}>MON</div>
          {monad.isConnected && (
            <div style={{ marginTop: 10, fontSize: 10, color: '#4a5180' }}>
              Wallet: <span style={{ color: '#94a3b8' }}>{nativeBal.toFixed(4)} MON</span>
            </div>
          )}
          {/* Faucet hint when balance is 0 */}
          {monad.isConnected && nativeBal < 0.01 && (
            <div style={{ marginTop: 8, fontSize: 10, color: '#6b74a8' }}>
              Need testnet MON?{' '}
              <a href={FAUCET_URL} target="_blank" rel="noreferrer"
                style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 700 }}>
                Get from faucet ↗
              </a>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #2a2f52', marginBottom: 24 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 20px', fontSize: 11, fontFamily: '"Courier New", monospace', background: 'transparent',
              fontWeight: tab === i ? 700 : 500,
              color: tab === i ? '#c4b5fd' : '#6b74a8', border: 'none',
              borderBottom: tab === i ? '2px solid #7c56f0' : '2px solid transparent',
              marginBottom: -2,
              cursor: 'pointer', letterSpacing: 0.5, transition: 'color 0.15s',
            }}>{t}</button>
          ))}
        </div>

        {/* Deposit */}
        {tab === 0 && (
          <WalletPanel
            title="Deposit MON"
            desc="Send MON from your wallet into MonCastle to use for attacks."
            label="Amount to deposit"
            value={depositAmt}
            onValue={setDepositAmt}
            onSubmit={() => handleAction('deposit', depositAmt)}
            pending={pending}
            btnLabel="DEPOSIT"
            btnColor="#4dff91"
            hint="0.01 MON = 1 attack attempt"
            disabled={!monad.isConnected || !monad.hasContract}
            disabledMsg={!monad.isConnected ? 'Connect wallet to deposit' : 'No contract deployed yet'}
          />
        )}

        {/* Withdraw */}
        {tab === 1 && (
          <WalletPanel
            title="Withdraw MON"
            desc="Withdraw your remaining balance back to your wallet."
            label="Amount to withdraw"
            value={withdrawAmt}
            onValue={setWithdrawAmt}
            onSubmit={() => handleAction('withdraw', withdrawAmt)}
            pending={pending}
            btnLabel="WITHDRAW"
            btnColor="#fbbf24"
            maxAvailable={contractBal}
            onMax={() => setWithdrawAmt(contractBal.toFixed(4))}
            hint={`Available: ${contractBal.toFixed(4)} MON`}
            disabled={!monad.isConnected || !monad.hasContract}
            disabledMsg={!monad.isConnected ? 'Connect wallet to withdraw' : 'No contract deployed yet'}
          />
        )}

        {/* History */}
        {tab === 2 && (
          <div>
            {history.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#2a3444', fontSize: 12 }}>
                No transactions yet this session
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.map((tx, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 8,
                    background: '#0a0d1c',
                    border: '1px solid #1e2240',
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: tx.type === 'deposit' ? 'rgba(77,255,145,0.12)' : 'rgba(251,191,36,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, flexShrink: 0,
                    }}>
                      {tx.type === 'deposit' ? '↓' : '↑'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: tx.type === 'deposit' ? '#4dff91' : '#fbbf24', fontWeight: 600, marginBottom: 2 }}>
                        {tx.type === 'deposit' ? '+ ' : '− '}{tx.amount} MON
                      </div>
                      <div style={{ fontSize: 9, color: '#4a5180' }}>
                        {new Date(tx.ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    </div>
                    <a href={`${MONAD_EXPLORER}/tx/${tx.hash}`} target="_blank" rel="noreferrer"
                      style={{ color: '#60a5fa', textDecoration: 'none', fontSize: 9, fontWeight: 700 }}>↗</a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Transaction feedback */}
        {txMsg && (
          <div style={{
            marginTop: 16, padding: '12px 16px', borderRadius: 8,
            background: txMsg.ok ? 'rgba(77,255,145,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${txMsg.ok ? 'rgba(77,255,145,0.3)' : 'rgba(239,68,68,0.3)'}`,
            fontSize: 11, color: txMsg.ok ? '#4dff91' : '#f87171',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{txMsg.msg}</span>
            <a href={`${MONAD_EXPLORER}/tx/${txMsg.hash}`} target="_blank" rel="noreferrer"
              style={{ color: '#60a5fa', textDecoration: 'none', fontSize: 9, marginLeft: 12, fontWeight: 700 }}>
              View ↗
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function WalletPanel({ title, desc, label, value, onValue, onSubmit, pending, btnLabel, btnColor, hint, maxAvailable, onMax, disabled, disabledMsg }) {
  return (
    <div>
      <div style={{ padding: '20px', background: '#0e1225', border: '2px solid #2a2f52', borderRadius: 12, marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 11, color: '#6b74a8', lineHeight: 1.8 }}>{desc}</div>
      </div>

      {disabled && disabledMsg && (
        <div style={{ padding: '10px 16px', marginBottom: 16, borderRadius: 8,
          background: 'rgba(107,116,168,0.1)', border: '1px solid rgba(107,116,168,0.3)',
          fontSize: 11, color: '#6b74a8', textAlign: 'center' }}>
          {disabledMsg}
        </div>
      )}

      <div style={{ marginBottom: 16, background: '#0a0d1c', border: '1px solid #2a2f52', borderRadius: 10, padding: '16px', opacity: disabled ? 0.5 : 1 }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: '#4a5180', marginBottom: 10, fontWeight: 700 }}>{label.toUpperCase()}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number"
            placeholder="0.0000"
            min="0"
            step="0.01"
            value={value}
            onChange={e => onValue(e.target.value)}
            disabled={disabled}
            style={{
              flex: 1, padding: '12px 14px', borderRadius: 8, fontSize: 15,
              background: '#090c18', border: '2px solid #2a2f52',
              color: '#ffffff', fontFamily: '"Courier New", monospace', outline: 'none',
              fontWeight: 700,
            }}
          />
          {onMax && (
            <button onClick={onMax} disabled={disabled} style={{
              padding: '0 14px', borderRadius: 8, fontSize: 9, fontFamily: '"Courier New", monospace',
              background: 'rgba(124,86,240,0.15)', border: '2px solid rgba(124,86,240,0.4)',
              color: '#c4b5fd', cursor: disabled ? 'not-allowed' : 'pointer', letterSpacing: 1, fontWeight: 700,
            }}>MAX</button>
          )}
        </div>
        {hint && <div style={{ fontSize: 10, color: '#6b74a8', marginTop: 8, fontWeight: 600 }}>{hint}</div>}
      </div>

      <button
        onClick={onSubmit}
        disabled={disabled || pending || !value || parseFloat(value) <= 0}
        style={{
          width: '100%', padding: '11px 0', borderRadius: 8, fontSize: 12,
          fontFamily: 'monospace', fontWeight: 700, letterSpacing: 2,
          background: `${btnColor}22`, border: `1px solid ${btnColor}55`,
          color: btnColor, cursor: (disabled || pending) ? 'not-allowed' : 'pointer',
          opacity: disabled || pending || !value ? 0.5 : 1, transition: 'all 0.15s',
        }}
      >
        {pending ? 'PROCESSING…' : btnLabel}
      </button>
    </div>
  )
}
