/**
 * PrivyWrapper.jsx — Real Privy embedded wallet integration.
 *
 * Architecture:
 *   1. User logs in via Privy (email / Google / Twitter / external wallet).
 *   2. Privy auto-creates an embedded wallet for them (their "main" wallet).
 *   3. That embedded wallet deposits MON and registers a session key once.
 *   4. Session key (ephemeral EOA) signs all attack() txs — zero popups.
 *
 * noPromptOnSignature: true  →  setSession() / deposit() sign silently
 * allowlistAddresses         →  contract address whitelisted so Privy
 *                               won't show security warnings per tx
 */
import React from 'react'
import { PrivyProvider } from '@privy-io/react-auth'
import { PRIVY_APP_ID, MONAD_CHAIN_ID, MONAD_RPC, CONTRACT_ADDR } from '../config'

// Re-export Privy hooks so the rest of the app can import from here
export { usePrivy, useWallets } from '@privy-io/react-auth'

// Monad Testnet chain definition (viem-compatible format used by Privy)
const monadTestnet = {
  id: MONAD_CHAIN_ID,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [MONAD_RPC] },
    public:  { http: [MONAD_RPC] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
}

export function PrivyWrapper({ children }) {
  // If no Privy App ID configured at all, fall back to passthrough
  if (!PRIVY_APP_ID) {
    console.warn('[PrivyWrapper] VITE_PRIVY_APP_ID not set — running without Privy')
    return <>{children}</>
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // Login options shown in Privy modal
        loginMethods: ['email', 'google', 'twitter', 'wallet'],

        appearance: {
          theme: 'dark',
          accentColor: '#f5c542',   // MonCastle gold
          logo: '/assets/logo.png',
          showWalletLoginFirst: false,
          walletList: ['metamask', 'rainbow', 'coinbase_wallet'],
        },

        // Embedded wallet: created automatically for every new user
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          noPromptOnSignature: true, // silent signing for setSession + deposit
          // Whitelist contract so Privy skips extra security warnings
          ...(CONTRACT_ADDR ? { allowlistAddresses: [CONTRACT_ADDR] } : {}),
        },

        // Default chain = Monad Testnet
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet],

        // MFA (optional — users can enable in dashboard)
        mfa: { noPromptOnMfaRequired: false },
      }}
    >
      {children}
    </PrivyProvider>
  )
}

