# MonCastle - Project Guide

> **Status:** Active Development - Hackathon Build  
> **Network:** Monad Testnet (ChainId 10143)  
> **Last Updated:** Session 3

---

## What is MonCastle?

MonCastle is an on-chain castle siege game built on Monad Testnet. Three castles compete simultaneously - players pay 0.01 MON per attack, each dealing 50 HP of damage. When a castle falls (HP to 0), the last attacker wins 70% of the entire pool. The contract resets automatically for the next round.

---

## Key Addresses

| Item | Value |
|------|-------|
| Deployer wallet | 0x53Be1c7726577B08A6E63B62015c0e2863C0C816 |
| Contract (testnet) | deploy first - then update here |
| Monad RPC | https://testnet-rpc.monad.xyz |
| Explorer | https://testnet.monadexplorer.com |

---

## Project Structure

```
moncastle/
|-- .env                         # Root secrets (PRIVATE_KEY, PUBLIC_KEY, etc.)
|-- PROJECT_GUIDE.md
|-- MONCASTLE.md                 # Original design doc
|
|-- contracts/                   # Hardhat smart contract workspace
|   |-- contracts/CastleWar.sol  # Core game contract (compiled)
|   |-- scripts/deploy.js        # Deploy to Monad testnet
|   |-- hardhat.config.js        # Monad testnet + optimizer config
|   `-- artifacts/               # Compiled ABI + bytecode
|
|-- backend/                     # Express.js API (serverless-ready)
|   |-- api/index.js             # Main Express app + all routes
|   |-- api/db.js                # Knex query helpers
|   |-- knexfile.js              # SQLite (dev) / Postgres (prod)
|   |-- migrations/              # DB schema migrations
|   `-- moncastle.sqlite3        # Local dev database
|
`-- frontend/                    # React + Vite + Tailwind v4 + Phaser 3
    |-- .env                     # VITE_CONTRACT_ADDRESS, RPC, etc.
    `-- src/
        |-- App.jsx
        |-- game/
        |   |-- Game.jsx         # Phaser React wrapper
        |   |-- GameScene.js     # Full procedural battlefield scene
        |   `-- CastleObject.js  # Per-castle animated class
        |-- components/
        |   |-- PlayerHUD.jsx    # Left sidebar
        |   |-- LiveFeed.jsx     # Right sidebar - scrolling event log
        |   `-- CastlePanel.jsx  # Floating attack panel
        |-- hooks/
        |   |-- useGameState.js  # Polls castles (demo fallback)
        |   |-- useSession.js    # Session wallet lifecycle
        |   `-- useTx.js         # Tx wrapper + toasts
        `-- utils/
            |-- contract.js      # ethers.js stubs + ABI
            `-- session.js       # Ephemeral session wallet helpers
```

---

## Smart Contract - CastleWar.sol

| Constant | Value |
|----------|-------|
| MAX_HP | 1000 |
| ATTACK_COST | 0.01 ETH/MON |
| DAMAGE | 50 HP per attack |
| Winner share | 70% of pool |
| Treasury share | 30% of pool |
| Castles | 3 (indices 0, 1, 2) |

### Key Functions
attack(uint8 castleId)              // payable 0.01 MON
deposit()                           // payable - top up balance
withdraw(uint256 amount)            // withdraw from internal balance
setSession(address session, uint256 expiry)
getAllCastles()                      // view - returns HP, pool, round

### Events
- Attacked(castleId, attacker, newHp, pool)
- CastleFallen(castleId, winner, payout, newRoundId)
- Deposited(player, amount)
- Withdrawn(player, amount)
- SessionSet(player, session, expiry)

---

## Backend API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api | Health check |
| GET | /api/castles | Latest castle snapshot |
| POST | /api/events | Persist event |
| GET | /api/events | Recent events |
| GET | /api/leaderboard | Top winners |
| GET | /api/player/:address | Player stats |
| POST | /api/player | Upsert player |
| POST | /api/rounds | Record round |

Run locally: cd backend && npm run dev  -> http://localhost:3001

---

## Frontend Stack

| Library | Version | Role |
|---------|---------|------|
| React | 19 | UI framework |
| Vite | 8 beta | Build tool |
| Tailwind CSS | v4 | Styling |
| Phaser | 3.90 | Game engine (WebGL) |
| ethers.js | v6 | Blockchain interaction |
| wagmi | latest | Wallet hooks (installed, not wired) |
| rainbowkit | latest | Wallet UI (installed, not wired) |
| react-hot-toast | latest | Notifications |
| lucide-react | latest | Icons |

---

## Dev Commands

cd frontend && npm run dev          # http://localhost:5173
cd backend && npm run dev           # http://localhost:3001
cd contracts && npx hardhat compile
cd contracts && npx hardhat run scripts/deploy.js --network monad_testnet

---

## Session Wallet Architecture

1. User connects MetaMask (main wallet - deposit/withdraw only)
2. User clicks Enable Session -> app generates ephemeral EOA in memory
3. App calls setSession(ephemeral.address, expiry) via MetaMask (one popup)
4. Subsequent attacks signed by ephemeral key - zero popups
5. Stored in sessionStorage (clears on tab close)

---

## Roadmap

DONE:
- CastleWar.sol written + compiled
- Hardhat config for Monad testnet + deploy script
- Backend Express API + SQLite migrations (3 tables)
- React + Vite + Tailwind v4 + Phaser 3 setup
- Phaser game scene with castles, starfield, HP bars, animations
- PlayerHUD, LiveFeed, CastlePanel components
- useGameState hook (demo mode working)
- ethers.js stubs + full ABI in utils/contract.js
- Session wallet utils + hook
- wagmi + rainbowkit installed

TODO:
- Connect MetaMask via rainbowkit
- Wire deposit/withdraw to UI
- Wire attack() to signed transactions
- Wire setSession() to Enable Session button
- Deploy contract to Monad testnet
- Deploy backend to Vercel
- Event indexer (poll chain -> write to SQLite)
- Live leaderboard panel
