/**
 * useMonad.js — Unified wallet + contract hook  (Privy Edition)
 *
 * Auth flow:
 *   1. User clicks LOGIN → Privy modal (email / Google / Twitter / wallet)
 *   2. Privy creates an embedded wallet automatically for the user
 *   3. Embedded wallet IS their main wallet — no MetaMask needed
 *   4. One-time setup via enableSession():
 *        a. deposit() MON from embedded wallet → funding in-game balance
 *        b. setSession(ephemeralKey, expiry) → registers session key on-chain
 *        c. fundSession(gasAmount) → give session key gas budget
 *   5. All attacks signed by ephemeral session key — zero popups forever
 *
 * Modes:
 *   DEMO: mock data, no wallet needed
 *   LIVE: real Privy + session key + on-chain txs + backend sync
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import {
  MODE, IS_DEMO, MONAD_CHAIN_ID, MONAD_RPC, CONTRACT_ADDR,
  CASTLE_NAMES, DEMO_WALLET, API_BASE, ATTACK_COST,
} from '../config'
import { CASTLE_WAR_ABI } from '../utils/contract'
import {
  restoreSessionWallet, createSessionWallet, saveSessionExpiry,
  clearSession, isSessionActive, SESSION_DURATION_HOURS,
} from '../utils/session'
import { usePrivy, useWallets } from '../context/PrivyWrapper'

const API_POLL_INTERVAL = 5_000

export const shortAddr = (addr) => addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : ''

// ── API helpers (never throw) ────────────────────────────────────────────────
async function apiFetch(path, fallback = []) {
  try {
    const res = await fetch(`${API_BASE}${path}`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch { return fallback }
}

async function apiPost(path, body) {
  try {
    await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch { /* fire-and-forget */ }
}

export default function useMonad() {
  // ── Privy hooks ─────────────────────────────────────────────────────────
  const { ready, authenticated, login, logout, user } = usePrivy()
  const { wallets } = useWallets()

  // ── Core state ──────────────────────────────────────────────────────────
  const [account, setAccount]               = useState(null)
  const [chainId, setChainId]               = useState(null)
  const [nativeBalance, setNativeBalance]   = useState('0.000')
  const [contractBalance, setContractBalance] = useState('0.000')
  const [isPending, setIsPending]           = useState(false)
  const [error, setError]                   = useState(null)
  const [castlesOnChain, setCastlesOnChain] = useState(null)
  const [leaderboard, setLeaderboard]       = useState([])
  const [attackLog, setAttackLog]           = useState([])
  const [playerStats, setPlayerStats]       = useState(null)
  const [sessionWallet, setSessionWallet]   = useState(null)

  // Whether deposit + setSession one-time setup is done
  const [sessionSetupDone, setSessionSetupDone] = useState(false)

  const providerRef  = useRef(null)  // Privy embedded wallet provider
  const signerRef    = useRef(null)  // Privy embedded wallet signer (main)
  const contractRef  = useRef(null)  // CastleWar contract via embedded wallet
  const accountRef   = useRef(null)
  accountRef.current = account

  const isConnected = !!account
  const isOnMonad   = chainId === MONAD_CHAIN_ID
  const hasContract = !!CONTRACT_ADDR && isOnMonad

  // ── Read-only provider (always available) ───────────────────────────────
  const readProvider = useRef(null)
  if (!readProvider.current) {
    try { readProvider.current = new ethers.JsonRpcProvider(MONAD_RPC) } catch {}
  }

  // ── Wire up embedded wallet when Privy authenticates ───────────────────
  useEffect(() => {
    if (IS_DEMO || !authenticated || !ready) return

    const embeddedWallet = wallets.find(w => w.walletClientType === 'privy')
    if (!embeddedWallet) return

    async function initEmbedded() {
      try {
        // Switch embedded wallet to Monad Testnet
        await embeddedWallet.switchChain(MONAD_CHAIN_ID)

        const eip1193Provider = await embeddedWallet.getEthereumProvider()
        const ethersProvider  = new ethers.BrowserProvider(eip1193Provider)
        const signer          = await ethersProvider.getSigner()
        const addr            = await signer.getAddress()
        const network         = await ethersProvider.getNetwork()

        providerRef.current = ethersProvider
        signerRef.current   = signer

        if (CONTRACT_ADDR) {
          contractRef.current = new ethers.Contract(CONTRACT_ADDR, CASTLE_WAR_ABI, signer)
        }

        setAccount(addr)
        setChainId(Number(network.chainId))

        // Register player in backend
        apiPost('/api/player', { address: addr, wins_delta: 0, earned_delta: 0, attack_delta: 0 })

        // Restore session wallet if still valid
        if (isSessionActive() && readProvider.current) {
          const restored = restoreSessionWallet(readProvider.current)
          if (restored) setSessionWallet(restored)
        }
      } catch (err) {
        console.error('[useMonad] embedded wallet init failed', err)
        setError('Wallet setup failed: ' + err.message)
      }
    }

    initEmbedded()
  }, [authenticated, ready, wallets])

  // ── Backend polling ─────────────────────────────────────────────────────
  useEffect(() => {
    if (IS_DEMO) {
      setLeaderboard([
        { address: DEMO_WALLET, total_attacks: 42, total_wins: 3, total_earned: '1.50' },
      ])
      setAttackLog([
        { id: 1, type: 'attack', castle_id: 0, actor: DEMO_WALLET, tx_hash: '0xdemo', created_at: new Date().toISOString() },
      ])
      return
    }
    let cancelled = false
    async function refresh() {
      const [lb, log] = await Promise.all([
        apiFetch('/api/leaderboard?limit=25'),
        apiFetch('/api/events?limit=50'),
      ])
      if (!cancelled) {
        setLeaderboard(lb)
        setAttackLog(log)
      }
    }
    refresh()
    const id = setInterval(refresh, API_POLL_INTERVAL)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  // ── Castle polling (chain or API) ───────────────────────────────────────
  const refreshCastles = useCallback(async () => {
    if (IS_DEMO) {
      setCastlesOnChain(CASTLE_NAMES.map((name, i) => ({
        id: i, name, hp: 800 + Math.floor(Math.random() * 200),
        pool: (Math.random() * 2).toFixed(3), owner: ethers.ZeroAddress,
        lastAttacker: DEMO_WALLET, roundId: 1, cooldownUntil: 0,
      })))
      return
    }
    if (CONTRACT_ADDR && readProvider.current) {
      try {
        const c = new ethers.Contract(CONTRACT_ADDR, CASTLE_WAR_ABI, readProvider.current)
        const raw = await c.getAllCastles()
        const mapped = raw.map((castle, i) => ({
          id: i,
          name: CASTLE_NAMES[i] || `Castle ${i}`,
          hp: Number(castle.hp),
          pool: ethers.formatEther(castle.pool),
          owner: castle.owner,
          lastAttacker: castle.lastAttacker,
          roundId: Number(castle.roundId),
          cooldownUntil: Number(castle.cooldownUntil || 0),
        }))
        setCastlesOnChain(mapped)
        return
      } catch (err) {
        console.warn('[useMonad] chain castle poll failed, trying API', err.message)
      }
    }
    const apiCastles = await apiFetch('/api/castles', null)
    if (apiCastles) setCastlesOnChain(apiCastles)
  }, [])

  useEffect(() => {
    refreshCastles()
    const id = setInterval(refreshCastles, 3000)
    return () => clearInterval(id)
  }, [refreshCastles])

  // ── Balance polling ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!account || !readProvider.current || IS_DEMO) return
    let cancelled = false
    async function poll() {
      try {
        const native = await readProvider.current.getBalance(account)
        if (!cancelled) setNativeBalance(ethers.formatEther(native))
      } catch {}
      if (CONTRACT_ADDR) {
        try {
          const c = new ethers.Contract(CONTRACT_ADDR, CASTLE_WAR_ABI, readProvider.current)
          const bal = await c.balances(account)
          if (!cancelled) setContractBalance(ethers.formatEther(bal))
        } catch {}
      }
      try {
        const stats = await apiFetch(`/api/player/${account}`, null)
        if (!cancelled && stats) setPlayerStats(stats)
      } catch {}
    }
    poll()
    const id = setInterval(poll, 8000)
    return () => { cancelled = true; clearInterval(id) }
  }, [account])

  // ── CONNECT ─────────────────────────────────────────────────────────────
  // Triggers Privy login modal — embedded wallet setup handled in useEffect above
  const connect = useCallback(async () => {
    setError(null)
    if (IS_DEMO) {
      setAccount(DEMO_WALLET)
      setChainId(MONAD_CHAIN_ID)
      setNativeBalance('12.500')
      setContractBalance('5.000')
      return
    }
    if (!ready) { setError('Privy not ready yet, try again…'); return }
    if (authenticated) {
      // Already logged in via Privy — re-init embedded wallet
      const embeddedWallet = wallets.find(w => w.walletClientType === 'privy')
      if (embeddedWallet) {
        try {
          await embeddedWallet.switchChain(MONAD_CHAIN_ID)
          const eip1193Provider = await embeddedWallet.getEthereumProvider()
          const ethersProvider  = new ethers.BrowserProvider(eip1193Provider)
          const signer          = await ethersProvider.getSigner()
          const addr            = await signer.getAddress()
          const network         = await ethersProvider.getNetwork()
          providerRef.current = ethersProvider
          signerRef.current   = signer
          if (CONTRACT_ADDR) contractRef.current = new ethers.Contract(CONTRACT_ADDR, CASTLE_WAR_ABI, signer)
          setAccount(addr)
          setChainId(Number(network.chainId))
        } catch (e) { setError(e.message) }
      }
      return
    }
    // Not yet logged in — open Privy modal
    login()
  }, [ready, authenticated, login, wallets])

  // ── DISCONNECT ──────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    try { await logout() } catch {}
    setAccount(null)
    setChainId(null)
    setNativeBalance('0.000')
    setContractBalance('0.000')
    setPlayerStats(null)
    setSessionWallet(null)
    setSessionSetupDone(false)
    providerRef.current  = null
    signerRef.current    = null
    contractRef.current  = null
    clearSession()
    setError(null)
  }, [logout])

  // ── ENABLE SESSION (one-time gasless setup) ─────────────────────────────
  /**
   * Creates an ephemeral session key, registers it on-chain via the Privy
   * embedded wallet (no MetaMask popup), and funds it with a tiny gas budget.
   * After this, attack() never needs any wallet interaction.
   */
  const enableSession = useCallback(async () => {
    if (!signerRef.current || !contractRef.current) {
      console.warn('enableSession: no signer or contract — make sure wallet is connected')
      return null
    }
    setIsPending(true)
    try {
      const ephemeral = createSessionWallet()
      const expiry    = Math.floor(Date.now() / 1000) + SESSION_DURATION_HOURS * 3600

      // Register session on-chain (Privy embedded wallet signs silently)
      const tx = await contractRef.current.setSession(ephemeral.address, expiry)
      await tx.wait()
      saveSessionExpiry(expiry)

      // Fund session wallet with gas from in-game balance (0.005 MON ≈ ~500 attacks of gas)
      let sessionFunded = false
      try {
        const fundTx = await contractRef.current.fundSession(ethers.parseEther('0.005'))
        await fundTx.wait()
        sessionFunded = true
      } catch (fundErr) {
        console.warn('[enableSession] fundSession failed (session active but no gas budget):', fundErr.message)
        // Session is still registered — attacks from session wallet will fail due to no gas
        // User must ensure session wallet has native MON (or reduce fundSession amount)
      }

      const connected = ephemeral.connect(readProvider.current)
      setSessionWallet(connected)
      setSessionSetupDone(true)
      return connected
    } catch (err) {
      console.error('[enableSession] failed', err)
      setError(err.reason || err.message?.slice(0, 120) || 'Session setup failed')
      clearSession()
      return null
    } finally {
      setIsPending(false)
    }
  }, [])

  // ── DEPOSIT ─────────────────────────────────────────────────────────────
  const deposit = useCallback(async (amountEth) => {
    if (IS_DEMO) return '0xDEMO_DEPOSIT'
    if (!contractRef.current) return null
    setIsPending(true)
    try {
      const tx = await contractRef.current.deposit({ value: ethers.parseEther(amountEth) })
      const receipt = await tx.wait()
      return receipt.hash
    } catch (err) {
      setError(err.reason || err.message?.slice(0, 80) || 'Deposit failed')
      return null
    } finally {
      setIsPending(false)
    }
  }, [])

  // ── WITHDRAW ────────────────────────────────────────────────────────────
  const withdraw = useCallback(async (amountEth) => {
    if (IS_DEMO) return '0xDEMO_WITHDRAW'
    if (!contractRef.current) return null
    setIsPending(true)
    try {
      const tx = await contractRef.current.withdraw(ethers.parseEther(amountEth))
      const receipt = await tx.wait()
      return receipt.hash
    } catch (err) {
      setError(err.reason || err.message?.slice(0, 80) || 'Withdraw failed')
      return null
    } finally {
      setIsPending(false)
    }
  }, [])

  // ── ATTACK ──────────────────────────────────────────────────────────────
  const attack = useCallback(async (castleId) => {
    if (IS_DEMO) {
      const fakeHash = '0x' + Math.random().toString(16).slice(2, 66).padEnd(64, '0')
      setCastlesOnChain(prev => prev
        ? prev.map(c => c.id === castleId
            ? { ...c, hp: Math.max(0, c.hp - 50), lastAttacker: DEMO_WALLET }
            : c)
        : prev
      )
      apiPost('/api/events', {
        type: 'attack', castle_id: castleId, actor: DEMO_WALLET,
        tx_hash: fakeHash, value_mon: String(ethers.parseEther(String(ATTACK_COST))),
        round_id: 0,
      })
      apiPost('/api/player', { address: DEMO_WALLET, attack_delta: 1 })
      return fakeHash
    }

    const mainAddr = accountRef.current
    if (!mainAddr) { setError('Connect your wallet first'); return null }

    setIsPending(true)
    setError(null)
    try {
      let tx

      if (sessionWallet && isSessionActive()) {
        // ✅ GASLESS PATH: session key attacks on behalf of main wallet
        const sessionContract = new ethers.Contract(CONTRACT_ADDR, CASTLE_WAR_ABI, sessionWallet)
        tx = await sessionContract.attack(castleId, mainAddr)
      } else if (contractRef.current) {
        // Fallback: main wallet (Privy embedded) attacks directly
        // attack() is NOT payable — uses in-game balance deposited via deposit()
        tx = await contractRef.current.attack(castleId, mainAddr)
      } else {
        setError('Wallet not connected to contract')
        return null
      }

      const receipt = await tx.wait()

      apiPost('/api/events', {
        type: 'attack', castle_id: castleId, actor: mainAddr,
        tx_hash: receipt.hash, value_mon: String(ethers.parseEther(String(ATTACK_COST))), round_id: 0,
      })
      apiPost('/api/player', { address: mainAddr, attack_delta: 1 })
      refreshCastles()

      return receipt.hash
    } catch (err) {
      console.error('[attack] failed', err)
      setError(err.reason || err.message?.slice(0, 100) || 'Attack failed')
      return null
    } finally {
      setIsPending(false)
    }
  }, [sessionWallet, refreshCastles])

  return {
    // Auth state
    privyReady: ready,
    privyUser: user,
    authenticated,

    // Wallet state
    account, chainId, nativeBalance, contractBalance,
    castlesOnChain, playerStats,
    isConnected, isOnMonad, hasContract, isPending, error,
    mode: MODE,

    // Data
    leaderboard, attackLog,

    // Session
    sessionActive: isSessionActive(),
    sessionWallet,
    sessionSetupDone,

    // Actions
    connect, disconnect,
    attack, deposit, withdraw,
    enableSession, refreshCastles,
  }
}
