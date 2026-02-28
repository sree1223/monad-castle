# MonCastle Frontend Guide

> React + Vite 8 + Tailwind CSS v4 + Phaser 3.90

---

## Quick Start

cd frontend
npm install
npm run dev
# Open http://localhost:5173

---

## Architecture

### Layout (App.jsx)
Three-column layout: PlayerHUD | Game Canvas | LiveFeed
Game Canvas has an absolute-positioned top bar and floating CastlePanel.

### Game Engine (Phaser 3)
Located in src/game/

GameScene.js  - Main scene, draws the full battlefield
  - 200-star twinkle field
  - 3 drifting cloud layers  
  - Perspective grid ground
  - 3 castle spawn zones with hitboxes
  - Click ripple, win banner overlay
  Public API: updateCastle(id, data), animateAttack(id), animateFall(id, winner, cb)

CastleObject.js - per-castle visual class
  - Procedural castle drawing (towers, battlements, gate, flags)
  - HP bar with color gradient (green/yellow/red)
  - Particle sparks on attack hit
  - Fire emitter when HP < 250
  - Explosion + shatter on fall
  - Pool amount + owner label

Game.jsx - React wrapper
  - Mounts Phaser with RESIZE scale mode
  - Forwards scene ref via gameRef prop
  - onAttack(castleId) callback from Phaser to React

---

## Components

### PlayerHUD.jsx (Left sidebar 280px)
Props:
  account         string | null  - wallet address
  balance         string         - USDC/token balance
  nativeBalance   string         - MON balance
  sessionActive   boolean        - is session key active
  totalWins       number
  totalEarned     string
  onConnectWallet ()
  onDeposit       ()
  onWithdraw      ()
  onEnableSession ()

### LiveFeed.jsx (Right sidebar 260px)
Props:
  events  Array<{ id, type, castleId, actor, value, timestamp }>
Displays scrolling attack/fall events with relative timestamps.
Auto-scrolls to newest event.

### CastlePanel.jsx (Floating, shown when castle selected)
Props:
  castle        { id, hp, pool, owner, roundId }
  onAttack      (castleId)
  attackPending boolean
  balance       string - player balance (for button disabled check)
Shows HP bar, pool size, projected reward, hits-to-kill, attack button.

---

## Hooks

### useGameState(signerOrNull)
  castles         array of { id, hp, pool, owner, roundId }
  events          array of recent events
  optimisticAttack(castleId)  - immediate HP -50 for responsiveness

### useSession(signerOrNull)
  session         { wallet, active, expiry }
  enableSession() - creates ephemeral key + calls setSession()
  revokeSession() - clears session storage

### useTx()
  sendAttack(castleId, signer)  - wraps attack() with toasts
  sendDeposit(amount, signer)   - wraps deposit() with toasts

---

## Utils

### utils/contract.js
  CASTLE_WAR_ABI    - minimal ABI for game interactions
  CASTLE_WAR_ADDRESS - from VITE_CONTRACT_ADDRESS env var
  getReadProvider() - JsonRpcProvider to Monad testnet
  fetchAllCastles(provider) - returns demo data if no contract
  deposit(signer, amount)
  withdraw(signer, amount)
  setSession(signer, addr, expiry)
  attack(signer, castleId)

### utils/session.js
  createSessionWallet()       - generates new Wallet
  saveSessionKey(privateKey)  - sessionStorage
  getSessionKey()             - restores Wallet from storage
  setSessionExpiry(hours)     - saves expiry timestamp
  getSessionExpiry()
  clearSession()
  isSessionActive()           - checks key + expiry

---

## Styling

Tailwind v4 via @tailwindcss/vite plugin.
Import in index.css: @import "tailwindcss"
No tailwind.config.js needed.

CSS custom properties in index.css:
  --monad-purple: #8147FF
  --monad-dark: #030108

Useful classes:
  text-[#8147FF]         monad purple text
  bg-[#8147FF]/10        10% opacity monad purple background
  border-white/5         5% white border

---

## Environment Variables

VITE_CONTRACT_ADDRESS=    (fill after deploy)
VITE_RPC_URL=https://testnet-rpc.monad.xyz
VITE_CHAIN_ID=10143
VITE_EXPLORER=https://testnet.monadexplorer.com

---

## Wallet Libraries (Installed, Not Wired)

wagmi, @rainbow-me/rainbowkit, @tanstack/react-query, viem

To wire up later:
1. Wrap app in WagmiProvider + QueryClientProvider + RainbowKitProvider
2. Replace Connect Wallet button with ConnectButton from rainbowkit
3. Use useWalletClient() hook to get signer for contract calls
4. Pass signer down to useGameState/useSession hooks

---

## Next Steps

1. Deploy contract to Monad testnet
2. Set VITE_CONTRACT_ADDRESS in frontend/.env
3. Wire RainbowKit ConnectButton
4. Enable attack() via session key signer
5. Enable deposit/withdraw via main wallet signer
