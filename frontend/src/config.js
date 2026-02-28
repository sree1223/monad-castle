/**
 * config.js — Central configuration for MonCastle frontend
 *
 * Single switch: VITE_MODE = 'demo' | 'live'
 *   demo: no wallet needed, mock data, game fully playable
 *   live: real MetaMask/Privy wallet, on-chain txs, backend API
 *
 * In both modes the UI looks identical.
 * If live mode fails (no wallet, contract not deployed, API down),
 * it auto-falls back to demo mode gracefully.
 */

export const MODE = import.meta.env.VITE_MODE || 'demo' // 'demo' | 'live'
export const IS_DEMO = MODE === 'demo'
export const IS_LIVE = MODE === 'live'

// Blockchain
export const MONAD_CHAIN_ID  = Number(import.meta.env.VITE_CHAIN_ID || 10143)
export const MONAD_RPC       = import.meta.env.VITE_RPC_URL || 'https://testnet-rpc.monad.xyz'
export const CONTRACT_ADDR   = import.meta.env.VITE_CONTRACT_ADDRESS || ''
export const EXPLORER_URL    = import.meta.env.VITE_EXPLORER || 'https://testnet.monadexplorer.com'

// Backend API
export const API_BASE        = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Privy (embedded wallet)
export const PRIVY_APP_ID    = import.meta.env.VITE_PRIVY_APP_ID || ''
export const USE_PRIVY       = !!PRIVY_APP_ID

// Game constants (match contract)
export const MAX_HP          = 1000
export const ATTACK_COST     = 0.01  // MON
export const DAMAGE_PER_HIT  = 50
export const CASTLE_COUNT    = 4
export const CASTLE_NAMES    = ['Ironhold', 'Stonepeak', 'Ashveil', 'Dreadfort']
export const COOLDOWN_SECS   = 120

// Wallet address for demo mode
export const DEMO_WALLET     = '0x53Be1c7726577B08A6E63B62015c0e2863C0C816'
