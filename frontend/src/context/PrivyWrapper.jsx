/**
 * PrivyWrapper.jsx — Disabled. Using session wallet + MetaMask only.
 */
import React from 'react'

const noop = () => {}
export const usePrivy = () => ({ ready: true, authenticated: false, login: noop, logout: noop, user: null })
export const useWallets = () => ({ wallets: [] })

export function PrivyWrapper({ children }) {
  return <>{children}</>
}

