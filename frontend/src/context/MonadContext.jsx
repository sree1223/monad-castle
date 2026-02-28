/**
 * MonadContext.jsx — Global wallet + contract state provider
 *
 * Wraps the app so that ALL routes (App, Profile, Wallet, Settings)
 * share the same useMonad hook instance instead of each creating
 * a separate provider connection.
 *
 * Usage:
 *   // In any component:
 *   import { useMonadContext } from '../context/MonadContext'
 *   const { account, connect, attack, nativeBalance } = useMonadContext()
 */

import { createContext, useContext } from 'react'
import useMonad from '../hooks/useMonad'

const MonadContext = createContext(null)

export function MonadProvider({ children }) {
  const monad = useMonad()
  return <MonadContext.Provider value={monad}>{children}</MonadContext.Provider>
}

export function useMonadContext() {
  const ctx = useContext(MonadContext)
  if (!ctx) throw new Error('useMonadContext must be used within <MonadProvider>')
  return ctx
}
