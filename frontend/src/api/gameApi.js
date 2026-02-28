/**
 * gameApi.js — off-chain backend API for game data.
 *
 * All functions attempt a real HTTP fetch first.
 * If API is unavailable, they silently fall back to dummy/mock data.
 */

import { API_BASE } from '../config';

/** Small wrapper: GET request with automatic fallback. */
async function apiFetch(path, fallback) {
  if (!API_BASE) return fallback;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[gameApi] ${path} — falling back to dummy data`, err.message);
    return fallback;
  }
}

/** Small wrapper: POST request with automatic fallback. */
async function apiPost(path, body, fallback = { ok: true }) {
  if (!API_BASE) {
    console.info(`[gameApi] POST ${path} — stub, no API_BASE`);
    return fallback;
  }
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[gameApi] POST ${path} — falling back`, err.message);
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Castle state (off-chain mirror / caching layer)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all castle metadata from backend (off-chain mirror).
 * Shape: { id, label, hp, pool, lastAttacker, roundId }[]
 */
export async function fetchCastles() {
  const DUMMY = [
    { id: 0, label: 'Ironhold',  hp: 1000, pool: '0.00', lastAttacker: null, roundId: 1 },
    { id: 1, label: 'Stonepeak', hp: 1000, pool: '0.00', lastAttacker: null, roundId: 1 },
    { id: 2, label: 'Ashveil',   hp: 1000, pool: '0.00', lastAttacker: null, roundId: 1 },
    { id: 3, label: 'Dreadfort', hp: 1000, pool: '0.00', lastAttacker: null, roundId: 1 },
  ];
  return apiFetch('/api/castles', DUMMY);
}

// ─────────────────────────────────────────────────────────────────────────────
// Attack log
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the latest attack events from the backend.
 * @param {number} limit  Max rows to return (default 50)
 * Shape: { id, castleId, castleLabel, attacker, damage, hpAfter, txHash, timestamp }[]
 */
export async function fetchAttackLog(limit = 50) {
  return apiFetch(`/api/attacks?limit=${limit}`, []);
}

/**
 * Fetch attack log for a specific castle.
 * @param {number} castleId  0-based index
 * @param {number} limit
 */
export async function fetchAttackLogByCastle(castleId, limit = 50) {
  return apiFetch(`/api/attacks?castleId=${castleId}&limit=${limit}`, []);
}

/**
 * Post a new attack event to the backend (called after tx confirmed).
 * @param {{ castleId, attacker, damage, hpAfter, txHash, blockTimestamp }} data
 */
export async function postAttackEvent(data) {
  return apiPost('/api/attacks', data);
}

// ─────────────────────────────────────────────────────────────────────────────
// Rounds / falls
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch completed round history.
 * Shape: { id, castleId, castleLabel, roundId, winner, rewardEth, endedAt }[]
 */
export async function fetchRoundHistory(limit = 20) {
  return apiFetch(`/api/rounds?limit=${limit}`, []);
}

/**
 * Post a completed round (called when CastleFallen event is indexed).
 * @param {{ castleId, roundId, winner, rewardEth, txHash }} data
 */
export async function postRoundCompleted(data) {
  return apiPost('/api/rounds', data);
}

// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the global leaderboard (sorted by total winnings desc).
 * Shape: { rank, address, username, totalAttacks, totalWinningsEth }[]
 */
export async function fetchLeaderboard(limit = 25) {
  return apiFetch(`/api/leaderboard?limit=${limit}`, []);
}
