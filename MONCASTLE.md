# 🏰 MonCastle — On-Chain Castle War on Monad

> **Hackathon:** Monad Testnet Hackathon, Hyderabad  
> **Audience:** Mixed (blockchain + non-blockchain peers)  
> **Win condition:** Peer votes — engagement, demo-ability, visual impact  

---

## 🎯 Concept in One Line

A real-time, multiplayer castle-battle game where **Monad is the game engine** — every attack is a blockchain transaction, and the last player to destroy a castle wins the reward pool.

---

## 🧠 Why This Wins

| Factor | Detail |
|---|---|
| **Visual** | Animated 2D Phaser.js game — instantly understood by non-devs |
| **Interactive** | Participants can play it *during* the demo — hands-on = votes |
| **Simple story** | "Attack the castle. Last hit wins the pot." One sentence. |
| **Monad showcase** | Fast block times make it *feel* like a real game, not a slow DApp |
| **Real stakes** | Actual testnet MON on the line — exciting to watch |
| **Auto-reset loop** | Game never ends — demo is always live, always fun |

---

## 🎮 Core Game Loop

```
[Castle spawns with HP=1000 and pool=0]
         ↓
[Players attack by spending MON]
    each attack → HP drops, pool grows
         ↓
[HP hits 0 — last attacker WINS]
    → Winner gets 70% of pool
    → 30% goes to treasury
    → Castle plays fall + rebuild animation (2 min cooldown)
         ↓
[New round begins — loop forever]
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────┐
│              Monad Testnet                   │
│  ┌─────────────────────────────────────────┐ │
│  │         CastleWar.sol                   │ │
│  │  - Castle HP, owner, pool, lastAttacker │ │
│  │  - deposit() / withdraw()               │ │
│  │  - attack()                             │ │
│  │  - session wallet support               │ │
│  │  - winner history, cooldown, pixel gallery │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
              ↑ ethers.js calls / event listeners
┌──────────────────────────────────────────────┐
│  Backend API (Express 5 + Neon PostgreSQL)   │
│  Deployed on Vercel Serverless (vercelback/) │
│  - /api/health: DB connectivity check        │
│  - /api/player: upsert player profile        │
│  - /api/event: record attack/fall events     │
│  - /api/castles: latest round per castle     │
│  - /api/rounds/:castleId: round history      │
│  - /api/leaderboard: top winners             │
│  - /api/gallery: pixel grid endpoints        │
│  - /api/sessions: session wallet management  │
│  Neon DB: players, attack_events,            │
│           castle_rounds, pixel_gallery        │
└──────────────────────────────────────────────┘
              ↑ REST calls / event POSTs
┌──────────────────────────────────────────────┐
│     Frontend (React + Phaser.js + Vite)      │
│  LeftSidebar | Game Canvas | RightSidebar    │
│  - Player stats, MON balance, attack log     │
│  - Phaser world: 2800px wide, medieval theme │
│  - Castle fall/rebuild with cooldown timer   │
│  - Arrow keys for knight movement            │
│  - Onboarding intro at /intro route          │
└──────────────────────────────────────────────┘
```

---

## 💻 Frontend — Current State

### Visual Theme (Pixel-Art Overhaul — Phase 3)
- **Global background**: `#1a1404` (dark warm earth)
- **NavBar**: `#2a1c08` with gold `#c8a040` borders — big `⚔ MONCASTLE` title + icon buttons: 🔊 mute, 👤 profile, 📊 wallet, 🔗 share, 🛠 settings, ⚔ class
- **LeftSidebar**: wood `#3a2c10→#2a1e08`, gold border `#6a4808`, colorful log entries (red/blue/green/gold)
- **RightSidebar**: `#3a2c10` warm, castle emoji icons, HP bars with glow, big amber ATTACK button
- **IntroPage**: bright sky `#5BB8E8`, yellow pixel sun, rectangle clouds, 4 pixel castle SVGs, warm wood story card
- **UserPage / SettingsPage**: `#1a1404` background, amber `#ffd966` headings, warm stats

### Layout (Dual Sidebar)
```
┌──────────────────────────────────────────────────────────────┐
│  NavBar (48px) — ⚔ MONCASTLE | 🔊 👤 📊 🔗 🛠 ⚔ Balance   │
├──────────────┬─────────────────────────────────┬─────────────┤
│ LeftSidebar  │       GAME CANVAS (Phaser)       │ RightSidebar│
│ (260px)      │       flex-1                     │ (260px)     │
│ warm #3a2c10 │                                  │ warm #3a2c10│
│              │  World: 1600×600px               │             │
│ Player card  │  GY=420, T=32, 4 castle slots    │ 🏰🗼⛩🏯    │
│ Avatar icon  │  Pixel-art map:                  │ Castle list │
│ Log entries  │    · Checkerboard grass tiles    │ HP bars     │
│ color-coded  │    · Cobble road strip           │ Glow effect │
│              │    · Stacked-rect pixel trees    │ ATTACK btn  │
│              │    · Rectangle pixel clouds      │             │
│              │    · Square pixel sun            │             │
│              │  Castle slot positions:           │             │
│              │    Ironhold   wx=110              │             │
│              │    Stonepeak  wx=390              │             │
│              │    Ashveil    wx=740              │             │
│              │    Dreadfort  wx=1030             │             │
│              │  [👤] ProfileCornerIcon top-right │             │
└──────────────┴─────────────────────────────────┴─────────────┘
```

### Component Structure
```
frontend/src/
├── App.jsx                  ← Dual-sidebar layout, state management, muted state
├── main.jsx                 ← React Router: / /intro /profile /settings /wallet
├── index.css                ← @import tailwindcss, base resets
├── game/
│   ├── Game.jsx             ← Phaser canvas wrapper (React)
│   ├── GameScene.js         ← Pixel-art Phaser scene with sounds
│   └── CastleObject.js      ← Per-castle class with fall/rebuild
├── components/
│   ├── NavBar.jsx           ← Title + icon button bar with mute/profile/wallet/share/settings
│   ├── LeftSidebar.jsx      ← Warm wood theme, player card, colorful log
│   ├── RightSidebar.jsx     ← Warm theme, castle HP bars with glow, ATTACK btn
│   └── CharacterSelect.jsx  ← 6-character class picker (sage/brawler/reaper/hunter/slayer/hero)
├── onboarding/
│   └── IntroPage.jsx        ← Pixel-art sky/sun/castle SVG intro with wood-theme story card
├── pages/
│   ├── UserPage.jsx         ← Warm amber profile/stats/achievements page
│   └── SettingsPage.jsx     ← Warm amber game/audio/network settings page
└── game/
    └── CharacterData.js     ← 6 character definitions with projectile colors/styles
```

### GameScene.js Key Features (Pixel-Art)
- World: **1600 × 600px**, camera pans to follow knight
- **Arrow keys**: move knight left/right with foot-step sound timer (320ms)
- **Pixel-art map**: 32×32 checkerboard grass tiles (GRASS_A/GRASS_B), cobble road strip
- **Sky**: flat `0x5bb8e8` blue, stacked-rect white clouds, cross-ray pixel sun
- **Trees**: 4-layer stacked rectangles with dark `lineStyle` outlines, LCG-seeded placement
- **Rocks**: pixel highlight, pennant poles with triangle banners
- **Sounds**: `_playFootstep()` (sine 95Hz), `_playShoot()` (triangle), `_playImpact()` (sawtooth), `_playCapture()` (fanfare chord), `_playMenuClick()` (square 660Hz)
- `setMuted(bool)`: called from NavBar mute button via `sceneRef`

### CastleObject.js Key Features
- 4 themes: Crimson / Azure / Emerald / Gold
- Stone castle with mortar detail, double towers, flags
- HP bar with glow, owner strip, cooldown timer
- `playFallEffect()`: smoke → fall → FALLEN banner → winner text → 600s cooldown
- `_startCooldown(600s)`: progress bar countdown
- `_rebuild()`: fade back + notification

---

## 🎮 Onboarding — `/intro` Route

Fully isolated in `src/onboarding/`:
- 5 story steps with animated card (fade + slide in)
- Step 1: "The War of Monad" — setting the scene
- Step 2: "Four Kingdoms" — castle lore
- Step 3: "Kill to Earn" — reward mechanics
- Step 4: "Rebirth & Cooldown" — reset cycle
- Step 5: Name entry → stored in `localStorage.mc_username`
- Progress dots, skip button, entering → navigates to `/`
- Stars particle background, medieval gold theme

---

## 📜 Smart Contract — `CastleWar.sol`

### Castle State (per castle)
```solidity
struct Castle {
    address owner;        // won the last round
    uint hp;              // current HP (resets to MAX_HP each round)
    uint pool;            // MON accumulated this round
    address lastAttacker; // wins if they reduce HP to 0
    uint roundId;         // increments each time castle falls
}
```

### Key Constants
| Constant | Value | Purpose |
|---|---|---|
| `MAX_HP` | 1000 | HP each castle starts with |
| `WINNER_SHARE` | 70% | Pool % winner receives |
| `TREASURY_SHARE` | 30% | Pool % kept as treasury |
| `ATTACK_COST` | 0.01 MON | Cost per attack |

---

## ⚙️ Monad Integration

| Item | Value |
|---|---|
| Network | Monad Testnet |
| RPC URL | `https://testnet-rpc.monad.xyz` |
| Wallet | `0x53Be1c7726577B08A6E63B62015c0e2863C0C816` |
| Chain ID | 10143 |
| Native Token | MON |
| Block Time | ~1 second |
| Explorer | `https://testnet.monadexplorer.com` |

---

## 🔔 Toast Notifications

Custom inline toast (no library): top-center of game canvas, 4s auto-dismiss.
- Shows: message text + **View TX ↗** link to Monad explorer
- Color-coded by event type (gold=attack, red=fall, green=rebuild)

---

## �️ Backend API Reference

All endpoints are RESTful and return JSON. Backend caches contract events and supports leaderboard, player stats, and pixel gallery.

### Health
- `GET /api` — Health check, returns `{ ok: true, service, version }`

### Castles
- `GET /api/castles` — Latest round per castle (cache; live HP needs chain read)

### Events
- `POST /api/events` — Persist attack/castle-fall event (body: `{ type, castle_id, actor, tx_hash, value_mon, round_id }`)
- `GET /api/events` — Recent events for live feed (`?since=<unix_ms>&limit=<n>`)
- `GET /api/events/:actor` — Events by wallet address

### Leaderboard
- `GET /api/leaderboard` — Top players by total earned (`?limit=10`)

### Player
- `GET /api/player/:address` — Player stats (win count, total earned, last-seen)
- `POST /api/player` — Upsert player record (body: `{ address, wins_delta, earned_delta, attack_delta }`)

### Rounds
- `POST /api/rounds` — Record completed round (body: `{ castle_id, round_id, winner, payout_mon, tx_hash }`)
- `GET /api/rounds/:castleId` — Round history for a castle

### Pixel Gallery
- `GET /api/gallery` — All painted pixels (≤900)
- `GET /api/gallery/:row/:col` — Single pixel
- `POST /api/gallery` — Paint a pixel (body: `{ row, col, color, painter }`)

---

### Session Wallet Support
- Session wallet registration and gas delegation handled on-chain via `setSession()` and contract logic.
- Backend supports gasless UX by tracking session wallet events and player balances.
- All gameplay actions (attack, deposit, withdraw) are on-chain; backend caches for fast UI and leaderboard.

---

## �🔑 Session Wallet (Planned)

Future integration for zero-popup gameplay. See contract notes.

---

## 🗓️ TODO — Remaining Work

### 🔴 Critical / Demo
- [x] Wire ethers.js to App.jsx (`useMonad.js` → real contract calls)
- [x] `attack()` tx from connected wallet (ETH value included)
- [x] Display real HP from contract (`getAllCastles()` polling)
- [x] Connect wallet button → MetaMask handshake
- [x] MON balance display (real)
- [x] Castle owner display from contract
- [x] Backend API deployed on Vercel (vercelback/) with Neon PostgreSQL
- [x] Privy embedded wallet support (PrivyWrapper.jsx — runtime load)
- [ ] Deploy `CastleWar.sol` → Monad Testnet (get real contract address)
- [ ] Set `VITE_CONTRACT_ADDRESS` + `VITE_MODE=live` for live gameplay
- [ ] Deploy vercelback to Vercel (set env vars in Vercel dashboard)
- [ ] Deploy frontend to Vercel (set `VITE_API_URL` to vercelback URL)

### 🟡 High Priority
- [x] Session wallet implementation (`useSession.js`)
- [x] Live battle feed from contract events
- [x] Demo mode: full gameplay without on-chain txs (VITE_MODE=demo)
- [ ] Deposit/withdraw UI in player panel
- [ ] Dark/castle themed font (Google Fonts CDN)
- [ ] Mobile layout fallback

### 🟢 Nice to Have
- [ ] Firebase chat integration (structure ready in LeftSidebar)
- [x] Leaderboard (top winners — backend API ready)
- [ ] Sound: castle rebuild chime
- [ ] Animated idle knight (breathing/walking cycle)
- [ ] Parallax background layers for distant mountains
- [ ] Multi-player cursor indicators
- [ ] Castle skin selector (themes already in CastleObject)

---

## 🗂️ File Registry

| File | Lines | Status |
|---|---|---|
| `frontend/src/App.jsx` | ~160 | ✅ Dual sidebars, gaming UI |
| `frontend/src/main.jsx` | 15 | ✅ React Router, /intro route |
| `frontend/src/game/GameScene.js` | 355 | ✅ Full world, keyboard, camera |
| `frontend/src/game/CastleObject.js` | 252 | ✅ Fall/rebuild/cooldown |
| `frontend/src/game/Game.jsx` | 67 | ✅ Phaser canvas wrapper |
| `frontend/src/components/LeftSidebar.jsx` | ~180 | ✅ Stats/log/chat tabs |
| `frontend/src/components/RightSidebar.jsx` | ~180 | ✅ Castles/details tabs |
| `frontend/src/onboarding/IntroPage.jsx` | ~110 | ✅ 5-step story |
| `frontend/src/onboarding/StoryStep.jsx` | ~100 | ✅ Animated card |
| `frontend/src/hooks/useMonad.js` | ~250 | ✅ Contract calls + demo mode |
| `frontend/src/hooks/useSession.js` | ~120 | ✅ Session wallet management |
| `frontend/src/context/PrivyWrapper.jsx` | ~75 | ✅ Optional Privy (runtime import) |
| `frontend/vite.config.js` | ~20 | ✅ Rolldown + Privy exclude |
| `vercelback/src/index.js` | ~250 | ✅ Express 5 API (13 routes) |
| `vercelback/src/db.js` | ~120 | ✅ Knex query helpers (Neon) |
| `vercelback/knexfile.js` | ~30 | ✅ Vercel Postgres env vars |
| `vercelback/migrate.js` | ~60 | ✅ Cross-platform migration runner |
| `vercelback/vercel.json` | 1 | ✅ Vercel serverless routing |
| `vercelback/migrations/...` | — | ✅ All 4 tables migrated on Neon |
| `contracts/CastleWar.sol` | — | ⚠️ Compiled, not yet deployed to testnet |

---

## 🎤 Demo Script

1. **Hook:** *"This is MonCastle — a live on-chain castle battle on Monad."*
2. Open `http://localhost:5173/intro` — show the onboarding story to the room
3. Enter warrior name, navigate to game
4. **Show the full layout:** knight in center, two sidebars, 4 castles
5. Click a castle — arrow fires, impact flashes, HP drops, log updates
6. Move knight with arrow keys (no tutorial — just works)
7. Let a castle fall → smoke → tilt → FALLEN banner → cooldown timer starts
8. Point to battle log in left sidebar — tx IDs, castle names, MON amounts
9. Show castle details panel in right sidebar  
10. *"The contract is the game server. Monad's 1s blocks make this feel instant."*
11. Open Monad explorer — show a real tx confirming

---

*MonCastle — built for Monad Hackathon, Hyderabad, 2025*


---

## 🎯 Concept in One Line

A real-time, multiplayer castle-battle game where **Monad is the game engine** — every attack is a blockchain transaction, and the last player to destroy a castle wins the reward pool.

---

## 🧠 Why This Wins

| Factor | Detail |
|---|---|
| **Visual** | Animated 2D Phaser.js game — instantly understood by non-devs |
| **Interactive** | Participants can play it *during* the demo — hands-on = votes |
| **Simple story** | "Attack the castle. Last hit wins the pot." One sentence. |
| **Monad showcase** | Fast block times make it *feel* like a real game, not a slow DApp |
| **Real stakes** | Actual testnet MON on the line — exciting to watch |
| **Auto-reset loop** | Game never ends — demo is always live, always fun |

---

## 🎮 Core Game Loop

```
[Castle spawns with HP=1000 and pool=0]
         ↓
[Players attack by spending MON]
    each attack → HP drops, pool grows
         ↓
[HP hits 0 — last attacker WINS]
    → Winner gets 70% of pool
    → 30% goes to treasury
    → Castle resets immediately
         ↓
[New round begins — loop forever]
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────┐
│              Monad Testnet                   │
│  ┌─────────────────────────────────────────┐ │
│  │         CastleWar.sol                   │ │
│  │  - Castle HP, owner, pool, lastAttacker │ │
│  │  - deposit() / withdraw()               │ │
│  │  - attack()                             │ │
│  │  - session wallet support               │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
              ↑ ethers.js calls / event listeners
┌──────────────────────────────────────────────┐
│              Frontend (React + Phaser.js)    │
│  - Wallet connect (MetaMask)                 │
│  - Deposit / withdraw UI                    │
│  - Phaser game canvas (castle visuals)       │
│  - HP bars, pool counter, owner crown        │
│  - Attack button → tx → animation           │
└──────────────────────────────────────────────┘
```

**Key principle:** The contract decides all outcomes. The frontend only *renders* what the contract says.

---

## 📜 Smart Contract — `CastleWar.sol`

### Castle State (per castle)
```solidity
struct Castle {
    address owner;        // won the last round
    uint hp;              // current HP (resets to MAX_HP each round)
    uint pool;            // MON accumulated this round
    address lastAttacker; // wins if they reduce HP to 0
    uint roundId;         // increments each time castle falls
}
```

### Key Constants
| Constant | Value | Purpose |
|---|---|---|
| `MAX_HP` | 1000 | HP each castle starts with |
| `WINNER_SHARE` | 70% | Pool % winner receives |
| `TREASURY_SHARE` | 30% | Pool % kept as treasury |
| `ATTACK_COST` | 0.01 MON | Cost per attack (calibrate for demo) |

### Key Functions
| Function | Who Calls | What It Does |
|---|---|---|
| `deposit()` | Player | Sends MON → credited to `balances[msg.sender]` |
| `attack(castleId, mainWallet)` | Player / Session | Deducts cost, deals damage, checks for win |
| `withdraw()` | Player | Pulls unused balance back out |
| `setSession(addr, expiry)` | Main wallet | Registers session keypair for no-popup attacks |
| `getAllCastles()` | Frontend | Returns all castle states (for polling) |

### Key Events (what the frontend listens to)
```solidity
event Attacked(uint castleId, address attacker, uint damage, uint newHP, uint pool);
event CastleFallen(uint castleId, address winner, uint reward, uint newRoundId);
event Deposited(address user, uint amount);
```

---

## 💻 Frontend — Phaser.js + React

### Layout
```
┌─────────────────────────────────────────────────┐
│ [MONCASTLE]                      [Connect Wallet]│
├────────────┬───────────────────────┬─────────────┤
│ Player HUD │   PHASER GAME CANVAS  │  LIVE FEED  │
│ - Balance  │  [🏰] [🏰] [🏰]     │ > 0xABC     │
│ - Session  │  HP ▓▓▓▓░░  Pool     │   attacked  │
│ - Deposit  │  Pool: 0.5 MON       │   Castle 2  │
│ - Withdraw │  Owner: 0xDEF 👑     │ > Castle 3  │
│            │  [ATTACK]            │   FELL! 💥  │
└────────────┴───────────────────────┴─────────────┘
```

### Castle Panel (per castle)
- **HP bar** — color shifts green → yellow → red as HP drops
- **Pool counter** — MON accumulated (updates each attack)
- **Owner** — truncated address + 👑 crown icon
- **ATTACK button** — signs and sends `attack()` tx

### Frontend Data Flow
```
User clicks ATTACK
      ↓
ethers.js sends tx (session or main wallet)
      ↓
Monad confirms tx (~1s block time)
      ↓
Contract emits Attacked / CastleFallen
      ↓
Frontend polls getAllCastles() every 2s
  OR subscribes to events via WebSocket
      ↓
Phaser scene updates HP bars, pool, owner
Castle fall → explosion animation → winner banner
```

---

## 🔑 Session Wallet (No-Popup Gameplay)

> **Problem:** MetaMask popup on every attack ruins the game feel.  
> **Solution:** One-time session key registration.

```
1. User connects MetaMask (main wallet)
2. User deposits MON into contract → balances[mainWallet] credited
3. App generates ephemeral keypair in-browser (ethers.Wallet.createRandom())
4. User signs setSession(sessionAddr, expiry) — ONE MetaMask popup only
5. Session wallet gets topped up with tiny MON for gas fees (~0.001 MON)
6. Attack txs are now signed by sessionWallet — NO more popups
7. Rewards always go to mainWallet
8. Session key stored in sessionStorage — cleared on browser close
9. If session lost → set new session → funds always safe in contract
```

> [!IMPORTANT]
> The session wallet is a **plain EOA keypair** — NOT an EIP-4337 smart contract wallet.
> It needs a tiny amount of MON to pay gas. The frontend auto-tops it up on session creation.
> It **cannot withdraw** — only `mainWallet` can call `withdraw()`.

---

## 🧭 Full Player Onboarding Flow

Every step with a ⛓️ touches the blockchain and triggers a **toast notification**.

| Step | Action | On-chain? | Toast shown |
|---|---|---|---|
| 1 | Connect MetaMask | ❌ | — |
| 2 | Register player account | ⛓️ | ✅ Account created! [Tx ↗] |
| 3 | Deposit MON | ⛓️ | ✅ Deposited X MON! [Tx ↗] |
| 4 | Activate session wallet | ⛓️ | ✅ Session live! Play without popups. |
| 5 | Attack a castle | ⛓️ (session signs) | ⚔️ Hit! Castle HP: Y→Z [Tx ↗] |
| 5b | Win a castle | ⛓️ (same tx) | 🏆 YOU WON! +X MON [Tx ↗] |
| 6 | Withdraw balance | ⛓️ | ✅ X MON in your wallet! [Tx ↗] |

---

## 🔔 Toast Notification System

Every blockchain action shows a bottom-right toast with **3 states**:

```
[Pending]  ⟳ Attacking...                           (spinner, stays until confirmed)
[Success]  ⚔️ Hit! -0.01 MON | Castle 2: HP 800→750  [Tx: 0xabc...↗]
[Failed]   ❌ Attack failed (session expired?)       (dismiss after 10s)
```

### Toast per action
| Action | Success Toast |
|---|---|
| `deposit()` | ✅ Deposited X MON! [Tx ↗] |
| `setSession()` | ✅ Session live! Play without popups. |
| `registerPlayer()` | ✅ Account created on Monad! [Tx ↗] |
| `attack()` (hit) | ⚔️ Hit! -0.01 MON \| Castle X HP: Y→Z [Tx ↗] |
| `attack()` (kill) | 🏆 YOU DESTROYED CASTLE X! +Y MON! [Tx ↗] |
| `withdraw()` | ✅ X MON sent to your wallet! [Tx ↗] |

**Implementation:** `react-hot-toast` or `react-toastify`. Wrap app in `<ToastProvider />`.
TX explorer link: `https://testnet.monadexplorer.com/tx/{txHash}`

---

## 🗂️ Project Structure

```
moncastle/
├── contracts/
│   └── CastleWar.sol          ← all game logic
├── scripts/
│   └── deploy.js              ← Hardhat deploy to Monad testnet
├── test/
│   └── CastleWar.test.js
├── hardhat.config.js
└── frontend/
    ├── src/
    │   ├── App.jsx             ← layout, wallet connect
    │   ├── game/
    │   │   ├── GameScene.js    ← Phaser scene
    │   │   └── CastleObject.js ← per-castle visual class
    │   ├── hooks/
    │   │   ├── useContract.js  ← ethers.js contract wrapper
    │   │   └── useSession.js   ← session keypair management
    │   ├── components/
    │   │   ├── PlayerHUD.jsx
    │   │   ├── LiveFeed.jsx
    │   │   └── CastlePanel.jsx
    │   └── utils/
    │       └── session.js
    └── package.json
```

---

## 🏗️ Build Priority (Hackathon Time-Box)

### ✅ Tier 1 — Must Have (demo-critical)
- [ ] `CastleWar.sol` deployed on Monad testnet
- [x] Phaser canvas with 4 castles + visible HP bars
- [x] Attack button → MetaMask → tx confirms → HP drops
- [x] Castle fall animation + winner display
- [ ] Deposit UI
- [x] Backend API (Neon PostgreSQL on Vercel Serverless)
- [x] Frontend production build passes (Vite 8 / Rolldown)
- [x] Demo mode for hackathon presentation without live chain

### 🟡 Tier 2 — Should Have (wow factor)
- [x] Pool counter updating live
- [x] Owner address + 👑 crown
- [x] Live feed of attack events (battle log)
- [x] Smooth HP bar tween animation
- [x] Explosion/fire particle on castle fall

### 🟢 Tier 3 — Nice to Have (if time remains)
- [x] Session wallet (zero-popup attacks via `useSession.js`)
- [x] Sound effects on attack and fall
- [x] Leaderboard (most castle wins — backend ready)
- [ ] Privy email/social login (SDK installed at runtime)

---

## 🎤 Demo Script

1. **Hook:** *"This is MonCastle — a live on-chain castle battle. Every attack is a real Monad transaction."*
2. Open the live game URL — show it to the room.
3. **Invite people to play.** Give them your testnet MON.
4. Show an attack landing → HP drops → crowd sees it.
5. Let a castle fall live → explosion animation → winner banner pops.
6. *"The smart contract is the game server. Monad's 1-second blocks are why this feels real."*
7. Show the Monad explorer — point to the actual tx confirming.
8. **Invite judges to attack.** Let them feel the speed.

---

## ⚙️ Monad Integration

| Item | Value |
|---|---|
| Network | Monad Testnet |
| RPC URL | `https://testnet-rpc.monad.xyz` |
| Native Token | MON |
| Block Time | ~1 second |
| EVM Compatible | Yes (Solidity, Hardhat, ethers.js all work) |
| Explorer | `https://testnet.monadexplorer.com` |

---

## 🗓️ Optional / Post-Hackathon Features

- Treasury management UI
- Anti-front-run mechanic (commit-reveal scheme)
- Mobile responsive layout
- True multiplayer lobby / matchmaking
- Multiple battlefields / rooms
- NFT owner badges (castle ownership as NFT)
- DAO-controlled game parameters (HP, % splits)
- Multiple castle visual themes/skins
- **SQL/Database layer** (see below)

---

## 🗃️ SQL / Database Layer (Implemented — Neon PostgreSQL)

> **Status:** Backend API is live on Vercel Serverless using Neon PostgreSQL.
> All tables migrated. All endpoints tested against live Neon DB.

### What’s in Neon
| Table | Purpose |
|---|---|
| `players` | Wallet → username, stats, win count |
| `attack_events` | Full attack history log (tx_hash, castle_id, damage, HP before/after) |
| `castle_rounds` | Each round: winner, reward, tx, timestamp |
| `pixel_gallery` | Pixel art painted by players (ON CONFLICT update) |

### What NEVER goes in SQL (contract is source of truth)
- `balances[mainWallet]` — contract only
- Castle HP / pool / owner — contract only
- Session wallet mappings — contract only

**Stack:** Node.js + Knex 3 + pg 8 + Neon PostgreSQL (serverless driver via pooled connection)
**Deployed via:** `vercelback/` → Vercel Serverless Functions
**DB Host:** `ep-bold-haze-ajt2c2vw-pooler.c-3.us-east-2.aws.neon.tech`

---

## 🤔 Is the Session Wallet Idea Original?

**Short answer:** The concept exists, but your hand-rolled implementation on Monad is rare and valuable.

| Existing Prior Art | How Similar | Key Difference |
|---|---|---|
| **EIP-4337 Session Keys** (Argent, Sequence) | Very similar concept | Requires bundlers, paymasters, complex infra |
| **Starknet Session Keys** | Very similar | Starknet-only, native account model |
| **Ronin / Axie (Sky Mavis)** | Similar outcome | Uses MPC keyless wallets, not EOA delegation |
| **MUD Framework Burner Wallets** | **Closest match** | Ephemeral EOA + contract balance, same idea |

### Why yours is still strong

> [!TIP]
> **You build it yourself.** Using Argent SDK = black box. Writing it in Solidity = you understand every line and can explain it to judges.

- **Monad-native** — none of these exist on Monad. You're pioneering it here.
- **Self-contained** — one contract, no external AA infra needed.
- **Explainable in 30 seconds** — "register once, play freely, funds always safe."
- **Peer-vote friendly** — non-blockchain people understand the UX benefit immediately.

### How to pitch it
> *"The biggest UX killer in blockchain games is the MetaMask popup on every action. I built a session wallet system — you approve once, then play freely. Your funds are locked in the contract. The session wallet can't withdraw anything. If you lose it, just register a new one. This is how on-chain games should feel."*

---

*MonCastle — built for Monad Hackathon, Hyderabad, 2026*


---

## Social, Reward and Engagement System — Design Ideas

> Core: "last hit wins 70% pool". Extensions below for max engagement.

### 1. Shared Victory — Contributor Leaderboard
Track top-3 attackers per round in backend. Show their addresses in the victory banner. Future: allocate 5% to top-3 proportionally (65% last attacker, 30% treasury, 5% contributors).

### 2. Public Victory Parade
When a castle falls: full-screen confetti + banner shows winner name + reward to ALL viewers. Win is permanent in on-chain events. Screenshot-worthy, shareable moment.

### 3. Era System — Winner Leaves a Mark
Winner can set an era name (e.g. 'sreehari.eth Golden Hour') stored in contract per roundId. Appears on castle HUD until next capture. Social pride mechanic.

### 4. Streak Recognition (Castle Lord)
Same address wins same castle 3+ consecutive rounds = flagged as 'Castle Lord' in UI. No ETH cost – pure social reward. Backend derives from on-chain event history.

### 5. Spectator Prediction Market (Advanced)
Spectators bet 0.005 MON on which castle falls first. Winners split a prediction pool from treasury. Reason to WATCH even without playing.

### 6. Clan Coordination
Groups of wallets coordinate in Discord/Telegram to mass-attack one castle. Backend detects patterns, awards Clan Victory badge. Future: on-chain clan treasury.

### 7. On-Chain Leaderboard (Already implemented)
CastleFallen events are permanent, public, permissionless. Any frontend can rebuild full winner history. MonCastle's leaderboard is decentralised and uncensorable.

### 8. Season Tournaments
Daily: badge for top damage dealer. Weekly: 'Champion' title for most wins. Grand Finale: 1-hour blitz where all accrued treasury = single prize. Off-chain tracking via events.

### 9. Social Sharing as Gameplay
Victory generates a shareable image card + auto-filled tweet. Share link shows castle state at that round. Twitter/X thread integration → viral loop.

### 10. Attack Power-ups (Future)
- Normal arrow: 0.01 MON → 50 HP
- Fire arrow: 0.025 MON → 130 HP  
- Siege shot: 0.05 MON → 280 HP
Adds strategy around risk/reward trade-offs.

---
