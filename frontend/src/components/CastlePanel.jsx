import React from 'react';

/**
 * CastlePanel — floating panel shown when a castle is selected
 * Props:
 *   castle: { id, hp, pool, owner, roundId } | null
 *   onAttack: (castleId) => void
 *   attackPending: bool
 *   balance: string  (player's in-game balance)
 */
const CastlePanel = ({ castle, onAttack, attackPending = false, balance = '0' }) => {
  if (!castle) return null;

  const hpPct = Math.max(0, (castle.hp / 1000) * 100);
  const hpColor = hpPct > 50 ? '#22c55e' : hpPct > 25 ? '#f59e0b' : '#ef4444';

  const truncAddr = (addr) =>
    addr && addr !== '0x0000000000000000000000000000000000000000'
      ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
      : null;

  const hasBalance = parseFloat(balance) >= 0.01;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto
                    w-[440px] rounded-2xl border border-[#8147FF]/30 bg-black/90
                    backdrop-blur-xl p-5 shadow-[0_0_40px_rgba(129,71,255,0.25)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8147FF]/20 border border-[#8147FF]/30">
            <span className="text-sm">🏰</span>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#c084fc]">
              Castle {castle.id + 1}
            </h3>
            <p className="text-[9px] text-white/30 uppercase">Round #{castle.roundId}</p>
          </div>
        </div>
        {truncAddr(castle.owner) && (
          <div className="flex items-center space-x-1.5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-2.5 py-1.5">
            <span className="text-xs">👑</span>
            <span className="text-[10px] font-mono text-yellow-400">{truncAddr(castle.owner)}</span>
          </div>
        )}
      </div>

      {/* HP bar */}
      <div className="mb-4">
        <div className="mb-1.5 flex justify-between text-[10px]">
          <span className="text-white/40 uppercase tracking-widest">Fortress HP</span>
          <span className="font-mono font-bold" style={{ color: hpColor }}>
            {castle.hp} / 1000
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-white/5 border border-white/8 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out relative"
            style={{ width: `${hpPct}%`, backgroundColor: hpColor }}
          >
            <div className="absolute inset-0 rounded-full bg-white/20" style={{ height: '50%' }} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/4 border border-white/6 p-3 text-center">
          <div className="text-base font-bold text-[#8147FF]">{castle.pool || '0.00'}</div>
          <div className="text-[9px] uppercase text-white/30 mt-0.5">MON Pool</div>
        </div>
        <div className="rounded-xl bg-white/4 border border-white/6 p-3 text-center">
          <div className="text-base font-bold text-[#22c55e]">{((castle.pool || 0) * 0.7).toFixed(3)}</div>
          <div className="text-[9px] uppercase text-white/30 mt-0.5">Winner Gets</div>
        </div>
        <div className="rounded-xl bg-white/4 border border-white/6 p-3 text-center">
          <div className="text-base font-bold text-white">{Math.max(0, Math.floor(castle.hp / 50))}</div>
          <div className="text-[9px] uppercase text-white/30 mt-0.5">Hits Left</div>
        </div>
      </div>

      {/* Attack button */}
      <button
        onClick={() => onAttack && onAttack(castle.id)}
        disabled={attackPending || !hasBalance}
        className={`w-full rounded-xl py-3.5 text-sm font-black uppercase tracking-widest transition-all duration-200
          ${attackPending
            ? 'bg-[#8147FF]/40 text-white/60 cursor-wait border border-[#8147FF]/30'
            : hasBalance
              ? 'bg-[#8147FF] text-white hover:bg-[#9b5eff] hover:shadow-[0_0_30px_rgba(129,71,255,0.6)] active:scale-95'
              : 'bg-white/5 text-white/25 cursor-not-allowed border border-white/10'
          }`}
      >
        {attackPending ? (
          <span className="flex items-center justify-center space-x-2">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
            <span>Attacking…</span>
          </span>
        ) : hasBalance ? (
          '⚔️  Attack  ·  -0.01 MON'
        ) : (
          'Deposit MON to Attack'
        )}
      </button>
    </div>
  );
};

export default CastlePanel;
