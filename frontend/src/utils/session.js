/**
 * session.js — ephemeral session wallet utilities
 * 
 * The session wallet is a plain EOA generated client-side.
 * Private key lives in sessionStorage — cleared on tab close.
 * Main wallet funds never leave the contract. Only the session
 * wallet signs attack() calls (no MetaMask popup).
 */
import { Wallet } from 'ethers';

const SESSION_KEY_STORAGE = 'moncastle_session_pk';
const SESSION_EXPIRY_STORAGE = 'moncastle_session_expiry';

/** Generate a new ephemeral keypair and persist PK to sessionStorage */
export function createSessionWallet() {
  const wallet = Wallet.createRandom();
  sessionStorage.setItem(SESSION_KEY_STORAGE, wallet.privateKey);
  return wallet;
}

/** Restore session wallet from sessionStorage (returns null if gone) */
export function restoreSessionWallet(provider) {
  const pk = sessionStorage.getItem(SESSION_KEY_STORAGE);
  if (!pk) return null;
  try {
    return new Wallet(pk, provider);
  } catch {
    return null;
  }
}

/** Persist expiry timestamp from on-chain setSession call */
export function saveSessionExpiry(expiry) {
  sessionStorage.setItem(SESSION_EXPIRY_STORAGE, String(expiry));
}

/** Get stored expiry (unix seconds) or null */
export function getSessionExpiry() {
  const v = sessionStorage.getItem(SESSION_EXPIRY_STORAGE);
  return v ? Number(v) : null;
}

/** Clear all session data */
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY_STORAGE);
  sessionStorage.removeItem(SESSION_EXPIRY_STORAGE);
}

/** Returns true if a live non-expired session exists */
export function isSessionActive() {
  const expiry = getSessionExpiry();
  if (!expiry) return false;
  return expiry * 1000 > Date.now();
}

/** Session duration in hours for new sessions */
export const SESSION_DURATION_HOURS = 24;
