/**
 * useMonad.js — Unified wallet + contract hook
 *
 * Modes:
 *   DEMO: all functions return mock data, no wallet needed
 *   LIVE: MetaMask/Privy → real on-chain txs → backend sync
 *
 * Auto-fallback: if live mode encounters errors (no wallet, bad RPC),
 * it gracefully falls back to demo behavior for that call.
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
  // ── Core state ──────────────────────────────────────────────────────────
  const [account, setAccount]               = useState(null)
  const [chainId, setChainId]               = useState(null)
  const [nativeBalance, setNativeBalance]    = useState('0.000')
  const [contractBalance, setContractBalance] = useState('0.000')
  const [isPending, setIsPending]            = useState(false)
  const [error, setError]                    = useState(null)
  const [castlesOnChain, setCastlesOnChain]  = useState(null)
  const [leaderboard, setLeaderboard]        = useState([])
  const [attackLog, setAttackLog]            = useState([])
  const [playerStats, setPlayerStats]        = useState(null)
  const [sessionWallet, setSessionWallet]    = useState(null)

  const providerRef  = useRef(null)
  const signerRef    = useRef(null)
  const contractRef  = useRef(null)
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

  // ── Restore session wallet on mount ─────────────────────────────────────
  useEffect(() => {
    if (isSessionActive() && readProvider.current) {
      const wallet = restoreSessionWallet(readProvider.current)
      if (wallet) setSessionWallet(wallet)
    }
  }, [])

  // ── CONNECT ─────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setError(null)

    if (IS_DEMO) {
      setAccount(DEMO_WALLET)
      setChainId(MONAD_CHAIN_ID)
      setNativeBalance('12.500')
      setContractBalance('5.000')
      return
    }

    if (!window.ethereum) {
      setError('No browser wallet found. Install MetaMask!')
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])

      try {
        await provider.send('wallet_switchEthereumChain',
          [{ chainId: '0x' + MONAD_CHAIN_ID.toString(16) }])
      } catch (switchErr) {
        if (switchErr.code === 4902) {
          await provider.send('wallet_addEthereumChain', [{
            chainId: '0x' + MONAD_CHAIN_ID.toString(16),
            chainName: 'Monad Testnet',
            nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
            rpcUrls: [MONAD_RPC],
            blockExplorerUrls: ['https://testnet.monadexplorer.com'],
          }])
        }
      }

      const signer = await provider.getSigner()
      const addr = await signer.getAddress()
      const network = await provider.getNetwork()

      providerRef.current = provider
      signerRef.current   = signer

      if (CONTRACT_ADDR) {
        contractRef.current = new ethers.Contract(CONTRACT_ADDR, CASTLE_WAR_ABI, signer)
      }

      setAccount(addr)
      setChainId(Number(network.chainId))

      apiPost('/api/player', { address: addr, wins_delta: 0, earned_delta: 0, attack_delta: 0 })
    } catch (e) {
      setError(e.message || 'Connection failed')
    }
  }, [])

  // ── DISCONNECT ──────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setAccount(null)
    setChainId(null)
    setNativeBalance('0.000')
    setContractBalance('0.000')
    setPlayerStats(null)
    providerRef.current  = null
    signerRef.current    = null
    contractRef.current  = null
    setError(null)
  }, [])

  // ── ENABLE SESSION ──────────────────────────────────────────────────────
  const enableSession = useCallback(async () => {
    if (!signerRef.current || !contractRef.current) {
      console.warn('enableSession: no signer or contract')
      return null
    }
    setIsPending(true)
    try {
      const ephemeral = createSessionWallet()
      const expiry = Math.floor(Date.now() / 1000) + SESSION_DURATION_HOURS * 3600
      const tx = await contractRef.current.setSession(ephemeral.address, expiry)
      await tx.wait()
      saveSessionExpiry(expiry)

      try {
        const fundTx = await contractRef.current.fundSession(ethers.parseEther('0.005'))
        await fundTx.wait()
      } catch (fundErr) {
        console.warn('Session fund for gas (optional) failed:', fundErr.message)
      }

      const connected = ephemeral.connect(readProvider.current)
      setSessionWallet(connected)
      return connected
    } catch (err) {
      console.error('enableSession failed', err)
      clearSession()
      return null
    } finally {
      setIsPending(false)
    }
  }, [])

  // ── ATTACK ──────────────────────────────────────────────────────────────
  const attack = useCallback(async (castleId) => {
    if (IS_DEMO) {
      // Demo mode: fake tx, update local castle HP
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
    if (!mainAddr) { setError('Connect wallet first'); return null }

    setIsPending(true)
    setError(null)
    try {
      let tx
      const value = ethers.parseEther(String(ATTACK_COST))
      if (sessionWallet && isSessionActive()) {
        // Session wallet pays no ETH — it's pre-funded
        const sessionContract = new ethers.Contract(CONTRACT_ADDR, CASTLE_WAR_ABI, sessionWallet)
        tx = await sessionContract.attack(castleId, mainAddr)
      } else if (contractRef.current) {
        tx = await contractRef.current.attack(castleId, mainAddr, { value })
      } else {
        setError('Contract not connected')
        return null
      }
      const receipt = await tx.wait()

      apiPost('/api/events', {
        type: 'attack', castle_id: castleId, actor: mainAddr,
        tx_hash: receipt.hash, value_mon: String(value), round_id: 0,
      })
      apiPost('/api/player', { address: mainAddr, attack_delta: 1 })
      refreshCastles()

      return receipt.hash
    } catch (err) {
      console.error('attack failed', err)
      setError(err.reason || err.message?.slice(0, 100) || 'Attack failed')
      return null
    } finally {
      setIsPending(false)
    }
  }, [sessionWallet, refreshCastles])

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

  // ── Listen for account/chain changes ────────────────────────────────────
  useEffect(() => {
    if (!window.ethereum || IS_DEMO) return
    const handleAccounts = (accts) => {
      if (accts.length === 0) disconnect()
      else setAccount(accts[0])
    }
    const handleChain = (id) => setChainId(Number(id))
    window.ethereum.on('accountsChanged', handleAccounts)
    window.ethereum.on('chainChanged', handleChain)
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccounts)
      window.ethereum.removeListener('chainChanged', handleChain)
    }
  }, [disconnect])

  return {
    account, chainId, nativeBalance, contractBalance,
    castlesOnChain, playerStats,
    isConnected, isOnMonad, hasContract, isPending, error,
    mode: MODE,
    leaderboard, attackLog,
    sessionActive: isSessionActive(),
    sessionWallet,
    connect, disconnect, attack, deposit, withdraw,
    enableSession, refreshCastles,
  }
}
