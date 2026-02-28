/**
 * playerApi.js — off-chain backend API for player profiles.
 *
 * Same pattern as gameApi.js: real fetch → dummy fallback.
 */

import { API_BASE } from '../config';

async function apiFetch(path, fallback) {
  if (!API_BASE) return fallback;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[playerApi] ${path} — falling back to dummy data`, err.message);
    return fallback;
  }
}

async function apiPost(path, body, fallback = { ok: true }) {
  if (!API_BASE) {
    console.info(`[playerApi] POST ${path} — stub, no API_BASE`);
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
    console.warn(`[playerApi] POST ${path} — falling back`, err.message);
    return fallback;
  }
}

async function apiPatch(path, body, fallback = { ok: true }) {
  if (!API_BASE) return fallback;
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[playerApi] PATCH ${path} — falling back`, err.message);
    return fallback;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Player profile
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a player's profile by wallet address.
 * Returns dummy shape if player not registered or API down.
 * @param {string} address  Checksummed wallet address
 */
export async function fetchPlayer(address) {
  const DUMMY = {
    address,
    username: null,
    totalAttacks: 0,
    totalWinningsEth: '0.000',
    createdAt: null,
    registered: false,
  };
  if (!address) return DUMMY;
  return apiFetch(`/api/players/${address}`, DUMMY);
}

/**
 * Register a new player (or upsert if already registered).
 * Called on first wallet connection or when user sets a username.
 * @param {string} address
 * @param {string} [username]  Optional display name
 */
export async function registerPlayer(address, username = null) {
  return apiPost('/api/players', { address, username });
}

/**
 * Update a player's username.
 * @param {string} address
 * @param {string} username
 */
export async function updateUsername(address, username) {
  return apiPatch(`/api/players/${address}`, { username });
}

// ─────────────────────────────────────────────────────────────────────────────
// Player stats
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch per-castle attack breakdown for a player.
 * Shape: { castleId, castleLabel, attacks, damageDealt }[]
 */
export async function fetchPlayerCastleStats(address) {
  if (!address) return [];
  return apiFetch(`/api/players/${address}/castle-stats`, []);
}

/**
 * Fetch the rounds won by a player.
 * Shape: { castleId, castleLabel, roundId, rewardEth, wonAt }[]
 */
export async function fetchPlayerWins(address) {
  if (!address) return [];
  return apiFetch(`/api/players/${address}/wins`, []);
}

/**
 * Increment player's attack count in backend after a confirmed tx.
 * Fire-and-forget — does not block UI.
 * @param {string} address
 * @param {number} castleId
 */
export async function recordPlayerAttack(address, castleId) {
  return apiPost(`/api/players/${address}/attacks`, { castleId });
}
