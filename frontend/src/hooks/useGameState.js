import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAllCastles } from '../utils/contract';

/**
 * useGameState — polls contract every 2s and exposes castle state.
 * Falls back to demo castle data when no contract is deployed yet.
 */
const DEMO_CASTLES = [
  { id: 0, hp: 850, pool: '0.15', owner: null, lastAttacker: null, roundId: 1 },
  { id: 1, hp: 400, pool: '0.63', owner: '0xDEADBEEF00000000000000000000000000000001', lastAttacker: null, roundId: 3 },
  { id: 2, hp: 120, pool: '1.20', owner: null, lastAttacker: null, roundId: 2 },
];

export default function useGameState(provider = null, pollInterval = 2000) {
  const [castles, setCastles] = useState(DEMO_CASTLES);
  const [events, setEvents] = useState([]);
  const prevCastlesRef = useRef(DEMO_CASTLES);
  const eventIdRef = useRef(0);

  const addEvent = useCallback((ev) => {
    setEvents(prev => [...prev.slice(-49), { ...ev, id: eventIdRef.current++ }]);
  }, []);

  const poll = useCallback(async () => {
    const fresh = await fetchAllCastles(provider);
    if (!fresh || fresh.length === 0) return;

    setCastles(prev => {
      fresh.forEach((nc, i) => {
        const old = prev[i];
        if (!old) return;
        // Detect attack
        if (nc.hp < old.hp) {
          addEvent({
            type: 'attack',
            castleId: i,
            actor: nc.lastAttacker,
            value: '0.01',
            timestamp: Date.now(),
          });
        }
        // Detect fall (roundId incremented)
        if (nc.roundId > old.roundId) {
          addEvent({
            type: 'fall',
            castleId: i,
            actor: nc.owner,
            value: (parseFloat(old.pool) * 0.7).toFixed(3),
            timestamp: Date.now(),
          });
        }
      });
      return fresh;
    });

    prevCastlesRef.current = fresh;
  }, [provider, addEvent]);

  useEffect(() => {
    const id = setInterval(poll, pollInterval);
    return () => clearInterval(id);
  }, [poll, pollInterval]);

  /** Optimistically update a castle's HP immediately after an attack tx */
  const optimisticAttack = useCallback((castleId) => {
    setCastles(prev => prev.map((c, i) =>
      i === castleId ? { ...c, hp: Math.max(0, c.hp - 50) } : c
    ));
    addEvent({
      type: 'attack',
      castleId,
      actor: 'You',
      value: '0.01',
      timestamp: Date.now(),
    });
  }, [addEvent]);

  return { castles, events, optimisticAttack };
}
