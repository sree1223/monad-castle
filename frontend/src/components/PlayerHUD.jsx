import React from 'react'

const PlayerHUD = ({
  account        = null,
  balance        = '0.00',
  nativeBalance  = '0.00',
  sessionActive  = false,
  totalWins      = 0,
  totalEarned    = '0.00',
  monToday       = '0.0000',
  attackCount    = 0,
  onConnectWallet = () => {},
  onDeposit       = () => {},
  onWithdraw      = () => {},
  onEnableSession = () => {},
}) => {
  const trunc = (a) => a ? `${a.slice(0,6)}...${a.slice(-4)}` : null

  return (
    <aside className="flex h-full w-72 flex-shrink-0 flex-col border-r border-amber-900/20 bg-black/85 overflow-hidden" style={{ fontFamily: "'Courier New', monospace" }}>
      
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-900/20 bg-amber-900/10">
        <div className="text-2xl">🏰</div>
        <div>
          <h1 className="text-[16px] font-black tracking-widest text-amber-400 uppercase">MonCastle</h1>
          <p className="text-[9px] text-amber-600/70 uppercase tracking-widest">⚔ On-Chain Siege</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ── Wallet ── */}
        <div className="rounded-xl border border-amber-900/30 bg-amber-900/10 p-4">
          <div className="text-[9px] text-amber-500/60 uppercase tracking-widest mb-3">⚔ Warrior</div>
          {account ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-black/40 border border-amber-700/30 px-3 py-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.9)]" />
                <span className="text-amber-300 font-mono text-[11px]">{trunc(account)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-black/30 p-2.5 text-center border border-white/5">
                  <div className="text-amber-400 font-bold">{balance}</div>
                  <div className="text-[9px] text-white/30 uppercase">In Game</div>
                </div>
                <div className="rounded-lg bg-black/30 p-2.5 text-center border border-white/5">
                  <div className="text-amber-300 font-bold">{nativeBalance}</div>
                  <div className="text-[9px] text-white/30 uppercase">Wallet MON</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => onDeposit('0.1')} className="rounded-lg bg-amber-700/30 border border-amber-600/40 py-2 text-[10px] font-bold text-amber-300 hover:bg-amber-700/50 transition">⬆ Deposit</button>
                <button onClick={onWithdraw} className="rounded-lg bg-white/5 border border-white/10 py-2 text-[10px] font-bold text-white/50 hover:bg-white/10 transition">⬇ Withdraw</button>
              </div>
            </div>
          ) : (
            <button onClick={onConnectWallet} className="w-full rounded-xl border border-amber-600/50 bg-amber-900/20 py-3 text-[11px] font-bold uppercase tracking-widest text-amber-400 hover:bg-amber-700/30 transition">
              🔗 Connect Wallet
            </button>
          )}
        </div>

        {/* ── Session ── */}
        <div className="rounded-xl border border-amber-900/30 bg-amber-900/10 p-4">
          <div className="text-[9px] text-amber-500/60 uppercase tracking-widest mb-3">⚡ Session Key</div>
          <div className="flex items-center gap-2 mb-3">
            <div className={`h-2 w-2 rounded-full ${sessionActive ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-red-500/80'}`} />
            <span className={`text-xs font-semibold ${sessionActive ? 'text-green-400' : 'text-red-400/70'}`}>
              {sessionActive ? 'Active — Attack freely' : 'Inactive'}
            </span>
          </div>
          {!sessionActive && (
            <button onClick={onEnableSession} className="w-full rounded-lg bg-amber-900/30 border border-amber-700/40 py-2 text-[10px] font-bold text-amber-400 hover:bg-amber-700/30 transition">
              ⚡ Enable Fast Play
            </button>
          )}
          <p className="mt-2 text-[9px] text-white/20 leading-relaxed">One wallet click. Then attack any castle without popups.</p>
        </div>

        {/* ── Today's Battle Stats ── */}
        <div className="rounded-xl border border-amber-900/30 bg-amber-900/10 p-4">
          <div className="text-[9px] text-amber-500/60 uppercase tracking-widest mb-3">📊 Today's Battle</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-black/30 border border-white/5 p-2.5 text-center">
              <div className="text-amber-400 font-black text-lg">{attackCount}</div>
              <div className="text-[9px] text-white/30 uppercase">Attacks</div>
            </div>
            <div className="rounded-lg bg-black/30 border border-white/5 p-2.5 text-center">
              <div className="text-amber-300 font-bold text-sm">{monToday}</div>
              <div className="text-[9px] text-white/30 uppercase">MON Spent</div>
            </div>
          </div>
        </div>

        {/* ── Career Stats ── */}
        <div className="rounded-xl border border-amber-900/30 bg-amber-900/10 p-4">
          <div className="text-[9px] text-amber-500/60 uppercase tracking-widest mb-3">🏆 Career</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-black/30 border border-white/5 p-2.5 text-center">
              <div className="text-yellow-400 font-black text-xl">{totalWins}</div>
              <div className="text-[9px] text-white/30 uppercase">Castle Wins</div>
            </div>
            <div className="rounded-lg bg-black/30 border border-white/5 p-2.5 text-center">
              <div className="text-green-400 font-bold text-sm">{totalEarned}</div>
              <div className="text-[9px] text-white/30 uppercase">MON Earned</div>
            </div>
          </div>
        </div>

        {/* ── How to play ── */}
        <div className="rounded-xl border border-white/5 bg-white/3 p-4">
          <div className="text-[9px] text-white/30 uppercase tracking-widest mb-2">📖 How to Play</div>
          <ul className="space-y-1.5 text-[10px] text-white/35 leading-snug">
            <li>⚔ Click a castle to attack it</li>
            <li>💰 Each attack costs 0.01 MON</li>
            <li>❤️ Castles have 1000 HP, −50 per hit</li>
            <li>🏆 Last attacker wins 70% of pool</li>
            <li>ⓘ Click [i] on castle for details</li>
          </ul>
        </div>

      </div>
    </aside>
  )
}

export default PlayerHUD
