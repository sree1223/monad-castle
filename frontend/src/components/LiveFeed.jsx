import React, { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

/**
 * LiveFeed — Right sidebar displaying recent on-chain events
 * Props:
 *   events: Array<{ id, type:'attack'|'fall', castleId, actor, value, timestamp }>
 */
const LiveFeed = ({ events = [] }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const relativeTime = (ts) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff / 60)}m ago`;
  };

  const truncAddr = (addr) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '?';

  return (
    <aside className="flex h-full w-72 flex-shrink-0 flex-col border-l border-white/5 bg-black/40 p-5 backdrop-blur-xl">
      <div className="mb-5 flex items-center space-x-2">
        <Activity className="h-3.5 w-3.5 text-[#8147FF]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Live Feed</span>
        <div className="ml-auto flex h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none">
        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className="text-3xl mb-2">⚔️</div>
            <p className="text-xs text-white/20">No battles yet.<br />Click a castle to attack!</p>
          </div>
        )}

        {events.map((ev) => (
          <div
            key={ev.id}
            className={`rounded-xl border p-3 text-[11px] transition-all
              ${ev.type === 'fall'
                ? 'border-yellow-500/30 bg-yellow-500/5'
                : 'border-white/5 bg-white/3 hover:bg-white/5'}`}
          >
            {ev.type === 'attack' ? (
              <>
                <div className="flex items-center space-x-1 mb-1">
                  <span className="text-[#c084fc] font-bold">{truncAddr(ev.actor)}</span>
                  <span className="text-white/40">⚔️ attacked</span>
                  <span className="font-semibold text-white">Castle {ev.castleId + 1}</span>
                </div>
                <div className="flex items-center justify-between text-[9px] text-white/25">
                  <span>-{ev.value} MON</span>
                  <span>{relativeTime(ev.timestamp)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="font-bold text-[#f59e0b] mb-1">
                  💥 Castle {ev.castleId + 1} FELL!
                </div>
                <div className="text-white/60 mb-1">
                  <span className="text-[#c084fc]">{truncAddr(ev.actor)}</span> won{' '}
                  <span className="text-green-400 font-bold">+{ev.value} MON</span>
                </div>
                <div className="text-[9px] text-white/25">{relativeTime(ev.timestamp)}</div>
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Bottom stats strip */}
      <div className="mt-4 border-t border-white/5 pt-4 grid grid-cols-2 gap-3">
        <div className="text-center">
          <div className="text-xs font-bold text-[#8147FF]">{events.filter(e => e.type === 'attack').length}</div>
          <div className="text-[9px] uppercase text-white/25">Attacks</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-bold text-[#f59e0b]">{events.filter(e => e.type === 'fall').length}</div>
          <div className="text-[9px] uppercase text-white/25">Castles Fallen</div>
        </div>
      </div>
    </aside>
  );
};

export default LiveFeed;
