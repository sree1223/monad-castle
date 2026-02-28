import { useState, useCallback, useEffect } from 'react';
import {
  createSessionWallet,
  restoreSessionWallet,
  saveSessionExpiry,
  getSessionExpiry,
  clearSession,
  isSessionActive,
  SESSION_DURATION_HOURS,
} from '../utils/session';
import { setSession as setSessionOnChain, attack as attackOnChain } from '../utils/contract';

/**
 * useSession — manages the ephemeral session wallet lifecycle.
 *
 * Usage:
 *   const { sessionActive, sessionWallet, enableSession, expiry } = useSession(mainSigner, provider);
 */
export default function useSession(mainSigner = null, provider = null) {
  const [sessionWallet, setSessionWallet] = useState(null);
  const [expiry, setExpiry] = useState(() => getSessionExpiry());
  const [pending, setPending] = useState(false);

  const sessionActive = isSessionActive();

  // Restore existing session on mount
  useEffect(() => {
    if (isSessionActive() && provider) {
      const wallet = restoreSessionWallet(provider);
      if (wallet) setSessionWallet(wallet);
    }
  }, [provider]);

  /**
   * Enable session: generates keypair, calls setSession() on-chain,
   * then persists and reconnects to provider.
   */
  const enableSession = useCallback(async () => {
    if (!mainSigner) {
      console.warn('No main signer — wallet not connected');
      return null;
    }
    setPending(true);
    try {
      const ephemeral = createSessionWallet();
      const { tx, expiry: newExpiry } = await setSessionOnChain(
        mainSigner,
        ephemeral.address,
        SESSION_DURATION_HOURS,
      );
      await tx.wait();
      saveSessionExpiry(newExpiry);
      setExpiry(newExpiry);

      const connected = ephemeral.connect(provider);
      setSessionWallet(connected);
      return connected;
    } catch (err) {
      console.error('enableSession failed', err);
      clearSession();
      return null;
    } finally {
      setPending(false);
    }
  }, [mainSigner, provider]);

  const revokeSession = useCallback(() => {
    clearSession();
    setSessionWallet(null);
    setExpiry(null);
  }, []);

  /**
   * Send an attack transaction silently via the session wallet.
   * No MetaMask popup — session wallet signs locally.
   * Falls back to a stub (logs + returns null) when not connected.
   *
   * @param {number} castleId        0-based castle index
   * @param {string} mainWalletAddr  Main wallet address (stored in contract)
   */
  const attackViaSession = useCallback(async (castleId, mainWalletAddr) => {
    if (!sessionWallet) {
      console.warn('attackViaSession: no active session wallet');
      return null;
    }
    if (!isSessionActive()) {
      console.warn('attackViaSession: session expired');
      return null;
    }
    try {
      const tx = await attackOnChain(sessionWallet, castleId, mainWalletAddr);
      return tx;
    } catch (err) {
      console.error('attackViaSession failed', err);
      return null;
    }
  }, [sessionWallet]);

  return {
    sessionActive,
    sessionWallet,
    expiry,
    pending,
    enableSession,
    revokeSession,
    attackViaSession,
  };
}
