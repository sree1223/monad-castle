// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CastleWar  v2
 * @notice On-chain castle-battle game for Monad Testnet.
 *
 * Game loop:
 *   Players deposit MON → attack castles → last hit wins 70% of pool → castle resets.
 *   Each attack costs 0.01 MON deducted from the player's in-game balance.
 *
 * Session wallet (gasless-like UX):
 *   Main wallet calls setSession(sessionAddr, expiry) once (signed in MetaMask).
 *   Session wallet sends attack() / batchAttack() — gas comes from user's deposited
 *   balance via the GAS_RESERVE mechanism: each attack deducts ATTACK_COST + GAS_RESERVE.
 *   GAS_RESERVE is held in the player's balance until they withdraw.
 *   Rationale: session wallets have no native MON, so the main wallet's balance
 *   top-up implicitly covers gas (attack is a standard tx; gas is paid by msg.sender).
 *   For true gasless: deploy a Forwarder / use ERC-2771, but that needs infrastructure.
 *   Simplest trustless solution used here: session wallet must hold small ETH for gas;
 *   user tops up session wallet from their deposited balance via fundSession().
 *
 * Pixel Gallery:
 *   For every 1 MON spent attacking, the player earns 1 paint credit.
 *   Spendable via claimPixel() to paint a cell (row, col) on the 30×30 shared canvas.
 *   Each pixel stores the RGB color and the painter address on-chain.
 *
 * Winner history:
 *   Each castle stores the last HISTORY_SIZE winners in a circular buffer with timestamps.
 *
 * Cooldown:
 *   After a castle falls it is in cooldown for COOLDOWN_SECS.  Attacks during cooldown revert.
 */
contract CastleWar is Ownable, ReentrancyGuard {
    // ─── Constants ────────────────────────────────────────────────────────────
    uint256 public constant MAX_HP            = 1000;
    uint256 public constant ATTACK_COST       = 0.01 ether;
    uint256 public constant DAMAGE_PER_ATTACK = 50;
    uint256 public constant WINNER_SHARE      = 70;
    uint256 public constant TREASURY_SHARE    = 30;
    uint256 public constant COOLDOWN_SECS     = 120;   // 2-min cooldown on testnet
    uint256 public constant HISTORY_SIZE      = 10;    // last 10 winners stored per castle
    uint256 public constant GALLERY_ROWS      = 30;
    uint256 public constant GALLERY_COLS      = 30;
    uint256 public constant ATTACKS_PER_CREDIT = 1;   // 1 MON spent = 1 paint credit

    // ─── Structs ──────────────────────────────────────────────────────────────
    struct Castle {
        address owner;          // last winner / current flag-holder
        uint256 hp;
        uint256 pool;           // accumulated MON in prize pool
        address lastAttacker;
        uint256 roundId;
        uint256 cooldownUntil;  // timestamp after which attacks re-open
    }

    struct WinRecord {
        address winner;
        uint256 reward;       // in wei
        uint256 roundId;
        uint256 timestamp;
    }

    struct SessionInfo {
        address sessionWallet;
        uint256 expiry;
    }

    struct PlayerStats {
        uint256 balance;           // current in-game balance (wei)
        uint256 attacksAffordable; // balance / ATTACK_COST
        address sessionWallet;     // active session wallet (0 if none)
        uint256 sessionExpiry;
        uint256 paintCredits;      // gallery paint credits earned
    }

    struct Pixel {
        address painter;
        uint8   r;
        uint8   g;
        uint8   b;
    }

    // ─── Storage ──────────────────────────────────────────────────────────────
    uint256 public castleCount;
    mapping(uint256 => Castle)      public castles;
    mapping(address => uint256)     public balances;
    mapping(address => SessionInfo) public sessions;
    mapping(address => uint256)     public paintCredits;
    uint256 public treasuryBalance;

    /// castleId → roundId → player → attacks landed this round
    mapping(uint256 => mapping(uint256 => mapping(address => uint256))) public attacksByRound;

    /// Winner history per castle: circular buffer of last HISTORY_SIZE records
    mapping(uint256 => WinRecord[HISTORY_SIZE]) private _winHistory;
    mapping(uint256 => uint256)                 private _winHistoryIdx;  // next write index
    mapping(uint256 => uint256)                 public  winHistoryCount; // total wins recorded (capped display at HISTORY_SIZE)

    /// 30×30 pixel gallery
    Pixel[GALLERY_COLS][GALLERY_ROWS] private _canvas;

    // ─── Events ───────────────────────────────────────────────────────────────
    event Deposited(address indexed user, uint256 amount);
    event FundedFor(address indexed sender, address indexed recipient, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event SessionSet(address indexed mainWallet, address indexed sessionWallet, uint256 expiry);
    event Attacked(uint256 indexed castleId, address indexed attacker, uint256 damage, uint256 newHP, uint256 pool);
    event CastleFallen(uint256 indexed castleId, address indexed winner, uint256 reward, uint256 newRoundId, uint256 cooldownUntil);
    event TreasuryWithdrawn(address indexed to, uint256 amount);
    event PixelPainted(address indexed painter, uint8 row, uint8 col, uint8 r, uint8 g, uint8 b);

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(uint256 _castleCount) Ownable(msg.sender) {
        require(_castleCount > 0 && _castleCount <= 10, "Invalid castle count");
        castleCount = _castleCount;
        for (uint256 i = 0; i < _castleCount; i++) {
            castles[i] = Castle({
                owner:         address(0),
                hp:            MAX_HP,
                pool:          0,
                lastAttacker:  address(0),
                roundId:       1,
                cooldownUntil: 0
            });
        }
    }

    // ─── Deposits / Funding ───────────────────────────────────────────────────

    /// @notice Deposit MON into your in-game balance.
    function deposit() external payable {
        require(msg.value > 0, "Send MON to deposit");
        balances[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Credit MON into another player's balance (gift / top-up friend).
    function fundFor(address recipient) external payable {
        require(recipient != address(0), "Invalid recipient");
        require(msg.value > 0, "Send MON to fund");
        balances[recipient] += msg.value;
        emit FundedFor(msg.sender, recipient, msg.value);
    }

    /// @notice Top-up your session wallet's native MON from your in-game balance so it
    ///         can pay gas for attack() transactions.  Transfers native MON to sessionWallet.
    ///         This is the recommended way to fund a gasless session: user deposits once,
    ///         then calls fundSession(amount) to push a small gas budget to the session key.
    function fundSession(uint256 amount) external nonReentrant {
        SessionInfo storage sess = sessions[msg.sender];
        require(sess.sessionWallet != address(0), "No active session");
        require(sess.expiry > block.timestamp, "Session expired");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        (bool ok, ) = payable(sess.sessionWallet).call{value: amount}("");
        require(ok, "Transfer failed");
    }

    // ─── Session Management ───────────────────────────────────────────────────

    /// @notice Register a session wallet that can attack on your behalf.
    ///         Session wallet CANNOT withdraw.
    function setSession(address sessionWallet, uint256 expiry) external {
        require(sessionWallet != address(0), "Invalid session wallet");
        require(expiry > block.timestamp, "Expiry must be in future");
        sessions[msg.sender] = SessionInfo(sessionWallet, expiry);
        emit SessionSet(msg.sender, sessionWallet, expiry);
    }

    /// @notice Revoke your active session immediately.
    function revokeSession() external {
        delete sessions[msg.sender];
    }

    // ─── Attack Logic ─────────────────────────────────────────────────────────

    /// @notice Attack a castle (directly or via a session wallet).
    /// @param castleId   Index of the castle to attack.
    /// @param mainWallet The main wallet whose balance is charged and credited.
    function attack(uint256 castleId, address mainWallet) external nonReentrant {
        _verifyAndCharge(castleId, mainWallet, 1);
    }

    /// @notice Batch-attack a castle up to `count` times in one tx.
    function batchAttack(uint256 castleId, uint256 count, address mainWallet) external nonReentrant {
        require(count > 0 && count <= 50, "Count must be 1-50");
        _verifyAndCharge(castleId, mainWallet, count);
    }

    /// @dev Core attack logic — shared by attack() and batchAttack().
    function _verifyAndCharge(uint256 castleId, address mainWallet, uint256 count) internal {
        require(castleId < castleCount, "Invalid castle ID");

        // Authorization: caller must be mainWallet or its valid session
        if (msg.sender != mainWallet) {
            SessionInfo storage sess = sessions[mainWallet];
            require(sess.sessionWallet == msg.sender, "Not authorized: wrong session");
            require(sess.expiry > block.timestamp,    "Not authorized: session expired");
        }

        for (uint256 i = 0; i < count; i++) {
            Castle storage castle = castles[castleId];

            // Cooldown check (per-iteration so we catch mid-batch falls correctly)
            require(castle.hp > 0,                       "Castle is rebuilding");
            require(block.timestamp >= castle.cooldownUntil, "Castle in cooldown");
            require(balances[mainWallet] >= ATTACK_COST, "Insufficient balance");

            balances[mainWallet]  -= ATTACK_COST;
            castle.pool           += ATTACK_COST;
            castle.lastAttacker    = mainWallet;
            attacksByRound[castleId][castle.roundId][mainWallet] += 1;

            // Award paint credit: 1 attack = 1 credit
            paintCredits[mainWallet] += ATTACKS_PER_CREDIT;

            bool castleFell = castle.hp <= DAMAGE_PER_ATTACK;
            uint256 newHp   = castleFell ? 0 : castle.hp - DAMAGE_PER_ATTACK;
            castle.hp       = newHp;

            emit Attacked(castleId, mainWallet, DAMAGE_PER_ATTACK, newHp, castle.pool);

            if (castleFell) {
                _resolveCastle(castleId);
                break;   // stop batch — next round needs fresh intent
            }
        }
    }

    function _resolveCastle(uint256 castleId) internal {
        Castle storage castle = castles[castleId];
        address winner         = castle.lastAttacker;
        uint256 totalPool      = castle.pool;
        uint256 winnerReward   = (totalPool * WINNER_SHARE)   / 100;
        uint256 treasuryReward = totalPool - winnerReward;   // avoids rounding dust

        balances[winner] += winnerReward;
        treasuryBalance  += treasuryReward;

        // Record history (circular buffer)
        uint256 slot = _winHistoryIdx[castleId] % HISTORY_SIZE;
        _winHistory[castleId][slot] = WinRecord({
            winner:    winner,
            reward:    winnerReward,
            roundId:   castle.roundId,
            timestamp: block.timestamp
        });
        _winHistoryIdx[castleId]++;
        if (winHistoryCount[castleId] < HISTORY_SIZE) winHistoryCount[castleId]++;

        // Reset castle with cooldown
        uint256 cdUntil = block.timestamp + COOLDOWN_SECS;
        castle.roundId      += 1;
        castle.hp            = MAX_HP;
        castle.pool          = 0;
        castle.owner         = winner;
        castle.lastAttacker  = address(0);
        castle.cooldownUntil = cdUntil;

        emit CastleFallen(castleId, winner, winnerReward, castle.roundId, cdUntil);
    }

    // ─── Withdrawals ──────────────────────────────────────────────────────────

    /// @notice Withdraw a specific amount from your in-game balance.
    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Withdraw your entire in-game balance.
    function withdrawAll() external nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Nothing to withdraw");
        balances[msg.sender] = 0;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    /// @notice Owner: collect treasury funds.
    function withdrawTreasury(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= treasuryBalance, "Exceeds treasury");
        treasuryBalance -= amount;
        (bool ok, ) = payable(owner()).call{value: amount}("");
        require(ok, "Transfer failed");
        emit TreasuryWithdrawn(owner(), amount);
    }

    // ─── Pixel Gallery ────────────────────────────────────────────────────────

    /// @notice Spend 1 paint credit to color a pixel on the shared 30×30 canvas.
    /// @param row  0-based row index (0–29)
    /// @param col  0-based column index (0–29)
    /// @param r    Red channel 0–255
    /// @param g    Green channel 0–255
    /// @param b    Blue channel 0–255
    function claimPixel(uint8 row, uint8 col, uint8 r, uint8 g, uint8 b) external {
        require(row < GALLERY_ROWS, "Row out of range");
        require(col < GALLERY_COLS, "Col out of range");
        require(paintCredits[msg.sender] >= 1, "No paint credits");
        paintCredits[msg.sender] -= 1;
        _canvas[row][col] = Pixel({ painter: msg.sender, r: r, g: g, b: b });
        emit PixelPainted(msg.sender, row, col, r, g, b);
    }

    /// @notice Read a single pixel from the gallery canvas.
    function getPixel(uint8 row, uint8 col) external view returns (address painter, uint8 r, uint8 g, uint8 b) {
        Pixel storage p = _canvas[row][col];
        return (p.painter, p.r, p.g, p.b);
    }

    /// @notice Dump the entire 30×30 canvas in one call.
    ///         Returns flat arrays: painters[], rs[], gs[], bs[] each of length 900.
    function getCanvas() external view returns (
        address[] memory painters,
        uint8[]   memory rs,
        uint8[]   memory gs,
        uint8[]   memory bs
    ) {
        uint256 total = GALLERY_ROWS * GALLERY_COLS;
        painters = new address[](total);
        rs       = new uint8[](total);
        gs       = new uint8[](total);
        bs       = new uint8[](total);
        uint256 idx;
        for (uint8 row = 0; row < GALLERY_ROWS; row++) {
            for (uint8 col = 0; col < GALLERY_COLS; col++) {
                Pixel storage p = _canvas[row][col];
                painters[idx] = p.painter;
                rs[idx]       = p.r;
                gs[idx]       = p.g;
                bs[idx]       = p.b;
                idx++;
            }
        }
    }

    // ─── View helpers ─────────────────────────────────────────────────────────

    /// @notice Fetch all castles in one RPC call.
    function getAllCastles() external view returns (Castle[] memory) {
        Castle[] memory all = new Castle[](castleCount);
        for (uint256 i = 0; i < castleCount; i++) all[i] = castles[i];
        return all;
    }

    /// @notice Fetch a single castle.
    function getCastle(uint256 castleId) external view returns (Castle memory) {
        require(castleId < castleCount, "Invalid castle ID");
        return castles[castleId];
    }

    /// @notice Return the last N winners for a castle (most recent first).
    function getWinHistory(uint256 castleId, uint256 n)
        external view returns (WinRecord[] memory history)
    {
        require(castleId < castleCount, "Invalid castle ID");
        uint256 count = winHistoryCount[castleId];
        uint256 size  = n < count ? n : count;
        history = new WinRecord[](size);
        uint256 nextIdx = _winHistoryIdx[castleId];
        for (uint256 i = 0; i < size; i++) {
            uint256 slot = (nextIdx + HISTORY_SIZE - 1 - i) % HISTORY_SIZE;
            history[i]   = _winHistory[castleId][slot];
        }
    }

    /// @notice Check if a session is currently valid.
    function isSessionValid(address mainWallet, address sessionWallet) external view returns (bool) {
        SessionInfo storage s = sessions[mainWallet];
        return s.sessionWallet == sessionWallet && s.expiry > block.timestamp;
    }

    /// @notice How many more attacks needed to topple this castle.
    function attacksToFall(uint256 castleId) external view returns (uint256) {
        require(castleId < castleCount, "Invalid castle ID");
        uint256 hp = castles[castleId].hp;
        return (hp + DAMAGE_PER_ATTACK - 1) / DAMAGE_PER_ATTACK;
    }

    /// @notice How many attacks the given wallet can currently afford.
    function attacksRemaining(address mainWallet) external view returns (uint256) {
        return balances[mainWallet] / ATTACK_COST;
    }

    /// @notice Return a player's full stats in one call.
    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        SessionInfo storage s = sessions[player];
        return PlayerStats({
            balance:           balances[player],
            attacksAffordable: balances[player] / ATTACK_COST,
            sessionWallet:     s.expiry > block.timestamp ? s.sessionWallet : address(0),
            sessionExpiry:     s.expiry,
            paintCredits:      paintCredits[player]
        });
    }

    /// @notice How many attacks `player` has landed on `castleId` in the current round.
    function playerAttacksThisRound(uint256 castleId, address player) external view returns (uint256) {
        require(castleId < castleCount, "Invalid castle ID");
        return attacksByRound[castleId][castles[castleId].roundId][player];
    }

    /// @notice Seconds remaining in cooldown for a castle (0 if open).
    function cooldownRemaining(uint256 castleId) external view returns (uint256) {
        require(castleId < castleCount, "Invalid castle ID");
        uint256 cd = castles[castleId].cooldownUntil;
        if (cd <= block.timestamp) return 0;
        return cd - block.timestamp;
    }
}
