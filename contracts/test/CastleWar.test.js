const { expect }            = require("chai");
const { ethers }            = require("hardhat");
const { loadFixture }       = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { time }              = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ATTACK_COST  = ethers.parseEther("0.01");
const MAX_HP       = 1000n;
const DAMAGE       = 50n;
const CASTLE_COUNT = 4;
const ATTACKS_TO_KILL = Number(MAX_HP / DAMAGE); // 20 attacks per castle

/** Deploy a fresh CastleWar with 4 castles */
async function deployFixture() {
  const [owner, alice, bob, session] = await ethers.getSigners();
  const CastleWar = await ethers.getContractFactory("CastleWar");
  const game      = await CastleWar.deploy(CASTLE_COUNT);
  return { game, owner, alice, bob, session };
}

/** Deposit enough MON for `n` attacks */
async function fundFor(game, signer, attacks) {
  await game.connect(signer).deposit({ value: ATTACK_COST * BigInt(attacks) });
}

/** Attack a castle `n` times as `signer` using `mainWallet` address */
async function attackN(game, signer, mainWallet, castleId, n) {
  for (let i = 0; i < n; i++) {
    await game.connect(signer).attack(castleId, mainWallet);
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("CastleWar", function () {

  // ── Deployment ──────────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("deploys with correct castle count", async function () {
      const { game } = await loadFixture(deployFixture);
      expect(await game.castleCount()).to.equal(CASTLE_COUNT);
    });

    it("initialises all castles with MAX_HP, pool=0, roundId=1, no owner", async function () {
      const { game } = await loadFixture(deployFixture);
      const castles = await game.getAllCastles();
      for (const c of castles) {
        expect(c.hp).to.equal(MAX_HP);
        expect(c.pool).to.equal(0n);
        expect(c.roundId).to.equal(1n);
        expect(c.owner).to.equal(ethers.ZeroAddress);
        expect(c.lastAttacker).to.equal(ethers.ZeroAddress);
      }
    });

    it("reverts if castle count is 0 or > 10", async function () {
      const CastleWar = await ethers.getContractFactory("CastleWar");
      await expect(CastleWar.deploy(0)).to.be.revertedWith("Invalid castle count");
      await expect(CastleWar.deploy(11)).to.be.revertedWith("Invalid castle count");
    });
  });

  // ── Deposit ─────────────────────────────────────────────────────────────────

  describe("deposit()", function () {
    it("credits balance and emits Deposited", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("0.05");

      await expect(game.connect(alice).deposit({ value: amount }))
        .to.emit(game, "Deposited")
        .withArgs(alice.address, amount);

      expect(await game.balances(alice.address)).to.equal(amount);
    });

    it("reverts on zero-value deposit", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await expect(game.connect(alice).deposit({ value: 0n }))
        .to.be.revertedWith("Send MON to deposit");
    });

    it("accumulates multiple deposits", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await game.connect(alice).deposit({ value: ATTACK_COST });
      await game.connect(alice).deposit({ value: ATTACK_COST });
      expect(await game.balances(alice.address)).to.equal(ATTACK_COST * 2n);
    });
  });

  // ── Withdraw ────────────────────────────────────────────────────────────────

  describe("withdraw()", function () {
    it("withdraws and emits Withdrawn", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 3);

      const before = await ethers.provider.getBalance(alice.address);
      const tx     = await game.connect(alice).withdraw(ATTACK_COST);
      const rec    = await tx.wait();
      const gas    = rec.gasUsed * rec.gasPrice;
      const after  = await ethers.provider.getBalance(alice.address);

      expect(after).to.be.closeTo(before + ATTACK_COST - gas, ethers.parseEther("0.0001"));
      expect(await game.balances(alice.address)).to.equal(ATTACK_COST * 2n);
    });

    it("reverts on insufficient balance", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await expect(game.connect(alice).withdraw(ATTACK_COST))
        .to.be.revertedWith("Insufficient balance");
    });

    it("reverts on zero amount", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 1);
      await expect(game.connect(alice).withdraw(0n))
        .to.be.revertedWith("Amount must be > 0");
    });
  });

  describe("withdrawAll()", function () {
    it("withdraws entire balance", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 5);
      await game.connect(alice).withdrawAll();
      expect(await game.balances(alice.address)).to.equal(0n);
    });

    it("reverts when balance is zero", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await expect(game.connect(alice).withdrawAll())
        .to.be.revertedWith("Nothing to withdraw");
    });
  });

  // ── Attack ──────────────────────────────────────────────────────────────────

  describe("attack() — direct (mainWallet == msg.sender)", function () {
    it("deals 50 HP damage and grows pool", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 1);

      await expect(game.connect(alice).attack(0, alice.address))
        .to.emit(game, "Attacked")
        .withArgs(0, alice.address, DAMAGE, MAX_HP - DAMAGE, ATTACK_COST);

      const castle = await game.getCastle(0);
      expect(castle.hp).to.equal(MAX_HP - DAMAGE);
      expect(castle.pool).to.equal(ATTACK_COST);
      expect(castle.lastAttacker).to.equal(alice.address);
    });

    it("deducts ATTACK_COST from attacker balance", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 2);
      await game.connect(alice).attack(0, alice.address);
      expect(await game.balances(alice.address)).to.equal(ATTACK_COST);
    });

    it("reverts on invalid castle ID", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 1);
      await expect(game.connect(alice).attack(99, alice.address))
        .to.be.revertedWith("Invalid castle ID");
    });

    it("reverts when balance is insufficient", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await expect(game.connect(alice).attack(0, alice.address))
        .to.be.revertedWith("Insufficient balance");
    });

    it("multiple attacks decrement HP correctly", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 5);
      await attackN(game, alice, alice.address, 0, 5);
      const castle = await game.getCastle(0);
      expect(castle.hp).to.equal(MAX_HP - DAMAGE * 5n);
    });
  });

  // ── Castle Fall & Resolution ────────────────────────────────────────────────

  describe("Castle resolution (fall and reset)", function () {
    it("emits Attacked with newHP=0 then CastleFallen on last hit", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, ATTACKS_TO_KILL);

      // All attacks but the last
      await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL - 1);

      // Final killing blow
      const tx = await game.connect(alice).attack(0, alice.address);
      await expect(tx).to.emit(game, "Attacked")
        .withArgs(0, alice.address, DAMAGE, 0n, ATTACK_COST * BigInt(ATTACKS_TO_KILL));
      await expect(tx).to.emit(game, "CastleFallen");
    });

    it("gives winner 70% of pool and treasury 30%", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      const attacks = ATTACKS_TO_KILL;
      await fundFor(game, alice, attacks);

      const totalPool     = ATTACK_COST * BigInt(attacks);
      const expectedWin   = (totalPool * 70n) / 100n;
      const expectedTreas = (totalPool * 30n) / 100n;

      const balBefore = await game.balances(alice.address);
      await attackN(game, alice, alice.address, 0, attacks);
      const balAfter  = await game.balances(alice.address);

      // balance before = 0 (all spent on attacks), after = winnerReward
      expect(balAfter).to.equal(expectedWin);
      expect(await game.treasuryBalance()).to.equal(expectedTreas);
    });

    it("resets castle: HP=MAX, pool=0, roundId incremented, owner=winner", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL);

      const castle = await game.getCastle(0);
      expect(castle.hp).to.equal(MAX_HP);
      expect(castle.pool).to.equal(0n);
      expect(castle.roundId).to.equal(2n);       // started at 1, now 2
      expect(castle.owner).to.equal(alice.address);
      expect(castle.lastAttacker).to.equal(ethers.ZeroAddress);
    });

    it("CastleFallen event carries the NEW roundId", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL - 1);

      const tx  = await game.connect(alice).attack(0, alice.address);
      const rec = await tx.wait();
      const ev  = rec.logs.find(l => {
        try { game.interface.parseLog(l); return game.interface.parseLog(l).name === "CastleFallen"; } catch { return false; }
      });
      const parsed = game.interface.parseLog(ev);
      expect(parsed.args.newRoundId).to.equal(2n);  // new round, not old
    });

    it("reverts attack on fallen castle (HP=0 before reset processes)", async function () {
      // A second tx trying to attack while the castle is at HP=0 should be rebuffed
      // This can't happen atomically in EVM — the castle resets in same tx.
      // So we test that AFTER a fall the castle is immediately back at MAX_HP
      const { game, alice, bob } = await loadFixture(deployFixture);
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL);
      // Castle is now reset — bob can attack it again
      await fundFor(game, bob, 1);
      await expect(game.connect(bob).attack(0, bob.address)).to.not.be.reverted;
    });
  });

  // ── Session Wallet ──────────────────────────────────────────────────────────

  describe("setSession() / revokeSession() / session attacks", function () {
    it("setSession emits SessionSet", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 3600;

      await expect(game.connect(alice).setSession(session.address, expiry))
        .to.emit(game, "SessionSet")
        .withArgs(alice.address, session.address, expiry);
    });

    it("session wallet can attack on behalf of main wallet", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 3600;
      await game.connect(alice).setSession(session.address, expiry);
      await fundFor(game, alice, 1);

      await expect(game.connect(session).attack(0, alice.address))
        .to.emit(game, "Attacked")
        .withArgs(0, alice.address, DAMAGE, MAX_HP - DAMAGE, ATTACK_COST);

      // Alice's balance decreased, not session's
      expect(await game.balances(alice.address)).to.equal(0n);
    });

    it("session wallet attack deducts from mainWallet, not session wallet", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 3600;
      await game.connect(alice).setSession(session.address, expiry);
      // Fund ONLY alice, not session
      await fundFor(game, alice, 1);

      await game.connect(session).attack(0, alice.address);
      expect(await game.balances(alice.address)).to.equal(0n);
      expect(await game.balances(session.address)).to.equal(0n);
    });

    it("reverts if session wallet is wrong address", async function () {
      const { game, alice, bob, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 3600;
      await game.connect(alice).setSession(session.address, expiry);
      await fundFor(game, alice, 1);

      // bob is NOT the session wallet
      await expect(game.connect(bob).attack(0, alice.address))
        .to.be.revertedWith("Not authorized: wrong session");
    });

    it("reverts if session has expired", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 60;   // 60s from now
      await game.connect(alice).setSession(session.address, expiry);
      await fundFor(game, alice, 1);

      // Fast-forward past expiry
      await time.increase(120);

      await expect(game.connect(session).attack(0, alice.address))
        .to.be.revertedWith("Not authorized: session expired");
    });

    it("reverts setSession with expiry in the past", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const past = (await time.latest()) - 1;
      await expect(game.connect(alice).setSession(session.address, past))
        .to.be.revertedWith("Expiry must be in future");
    });

    it("reverts setSession with zero address", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 3600;
      await expect(game.connect(alice).setSession(ethers.ZeroAddress, expiry))
        .to.be.revertedWith("Invalid session wallet");
    });

    it("revokeSession invalidates the session", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 3600;
      await game.connect(alice).setSession(session.address, expiry);
      await game.connect(alice).revokeSession();
      await fundFor(game, alice, 1);

      await expect(game.connect(session).attack(0, alice.address))
        .to.be.revertedWith("Not authorized: wrong session");
    });

    it("isSessionValid returns correct bool", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      expect(await game.isSessionValid(alice.address, session.address)).to.equal(false);

      const expiry = (await time.latest()) + 3600;
      await game.connect(alice).setSession(session.address, expiry);
      expect(await game.isSessionValid(alice.address, session.address)).to.equal(true);

      await time.increase(3700);
      expect(await game.isSessionValid(alice.address, session.address)).to.equal(false);
    });
  });

  // ── Treasury ────────────────────────────────────────────────────────────────

  describe("withdrawTreasury()", function () {
    it("owner can withdraw treasury funds", async function () {
      const { game, owner, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL);

      const treasury = await game.treasuryBalance();
      expect(treasury).to.be.gt(0n);

      await expect(game.connect(owner).withdrawTreasury(treasury))
        .to.emit(game, "TreasuryWithdrawn");

      expect(await game.treasuryBalance()).to.equal(0n);
    });

    it("non-owner cannot withdraw treasury", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL);
      const treasury = await game.treasuryBalance();

      await expect(game.connect(alice).withdrawTreasury(treasury))
        .to.be.revertedWithCustomError(game, "OwnableUnauthorizedAccount");
    });

    it("reverts if amount exceeds treasury balance", async function () {
      const { game, owner } = await loadFixture(deployFixture);
      await expect(game.connect(owner).withdrawTreasury(1n))
        .to.be.revertedWith("Exceeds treasury");
    });
  });

  // ── View Helpers ────────────────────────────────────────────────────────────

  describe("View helpers", function () {
    it("getAllCastles returns correct length", async function () {
      const { game } = await loadFixture(deployFixture);
      const castles = await game.getAllCastles();
      expect(castles.length).to.equal(CASTLE_COUNT);
    });

    it("getCastle reverts on invalid ID", async function () {
      const { game } = await loadFixture(deployFixture);
      await expect(game.getCastle(99)).to.be.revertedWith("Invalid castle ID");
    });

    it("attacksToFall returns 20 for fresh castle", async function () {
      const { game } = await loadFixture(deployFixture);
      expect(await game.attacksToFall(0)).to.equal(BigInt(ATTACKS_TO_KILL));
    });

    it("attacksToFall decrements with attacks", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 5);
      await attackN(game, alice, alice.address, 0, 5);
      expect(await game.attacksToFall(0)).to.equal(BigInt(ATTACKS_TO_KILL - 5));
    });
  });

  // ── Multiple Rounds ──────────────────────────────────────────────────────────

  describe("Multiple rounds", function () {
    it("castle falls twice: roundId reaches 3, second winner owns it", async function () {
      const { game, alice, bob } = await loadFixture(deployFixture);

      // Round 1: alice kills castle 0
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL);
      const afterR1 = await game.getCastle(0);
      expect(afterR1.roundId).to.equal(2n);
      expect(afterR1.owner).to.equal(alice.address);

      // Round 2: bob kills castle 0
      await fundFor(game, bob, ATTACKS_TO_KILL);
      await attackN(game, bob, bob.address, 0, ATTACKS_TO_KILL);
      const afterR2 = await game.getCastle(0);
      expect(afterR2.roundId).to.equal(3n);
      expect(afterR2.owner).to.equal(bob.address);
      expect(afterR2.hp).to.equal(MAX_HP);   // reset back to full
    });

    it("CastleFallen event on second fall carries roundId=3", async function () {
      const { game, alice } = await loadFixture(deployFixture);

      // Fall once (roundId goes 1→2)
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL);

      // Fall again (roundId goes 2→3)
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL - 1);
      const tx  = await game.connect(alice).attack(0, alice.address);
      const rec = await tx.wait();
      const ev  = rec.logs.find(l => {
        try { return game.interface.parseLog(l).name === "CastleFallen"; } catch { return false; }
      });
      const parsed = game.interface.parseLog(ev);
      expect(parsed.args.newRoundId).to.equal(3n);
    });
  });

  // ── Pool with Mixed Attackers ─────────────────────────────────────────────────

  describe("Pool with mixed attackers", function () {
    it("bob lands killing blow; pool includes alice's attacks; bob gets 70%", async function () {
      const { game, alice, bob } = await loadFixture(deployFixture);
      const aliceHits = 15, bobHits = ATTACKS_TO_KILL - aliceHits;

      await fundFor(game, alice, aliceHits);
      await attackN(game, alice, alice.address, 0, aliceHits);

      await fundFor(game, bob, bobHits);
      await attackN(game, bob, bob.address, 0, bobHits);

      // Total pool = all 20 attacks' cost
      const totalPool   = ATTACK_COST * BigInt(ATTACKS_TO_KILL);
      const bobExpected = (totalPool * 70n) / 100n;
      expect(await game.balances(bob.address)).to.equal(bobExpected);

      // Alice gets nothing (she didn't land the kill)
      // She already spent: aliceHits * ATTACK_COST
      expect(await game.balances(alice.address)).to.equal(0n);
    });

    it("treasury accumulates from multiple castle falls", async function () {
      const { game, alice } = await loadFixture(deployFixture);

      // Kill castle 0 twice
      for (let round = 0; round < 2; round++) {
        await fundFor(game, alice, ATTACKS_TO_KILL);
        await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL);
        // Alice wins 70%, 30% stays in treasury each round
      }
      const totalPool   = ATTACK_COST * BigInt(ATTACKS_TO_KILL) * 2n;
      const expectedTreas = (totalPool * 30n) / 100n;
      expect(await game.treasuryBalance()).to.equal(expectedTreas);
    });
  });

  // ── Session Wallet Wins Castle ────────────────────────────────────────────────

  describe("Session wallet kills castle — credit goes to main wallet", function () {
    it("session does killing blow: castle.owner = mainWallet (alice), not session", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 3600;
      await game.connect(alice).setSession(session.address, expiry);

      // Alice funds, session attacks on her behalf
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, session, alice.address, 0, ATTACKS_TO_KILL);

      const castle = await game.getCastle(0);
      expect(castle.owner).to.equal(alice.address);  // alice is owner, not session
    });

    it("prize credited to main wallet (alice) after session kills castle", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 3600;
      await game.connect(alice).setSession(session.address, expiry);

      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, session, alice.address, 0, ATTACKS_TO_KILL);

      const totalPool   = ATTACK_COST * BigInt(ATTACKS_TO_KILL);
      const aliceExpect = (totalPool * 70n) / 100n;
      // Prize goes to alice's balance, session gets nothing
      expect(await game.balances(alice.address)).to.equal(aliceExpect);
      expect(await game.balances(session.address)).to.equal(0n);
    });
  });

  // ── Winner Withdraws Prize ───────────────────────────────────────────────────

  describe("Winner withdraws prize to ETH wallet", function () {
    it("alice wins prize then withdraws to ETH, receiving correct amount minus gas", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL);

      const prize = (ATTACK_COST * BigInt(ATTACKS_TO_KILL) * 70n) / 100n;
      expect(await game.balances(alice.address)).to.equal(prize);

      const ethBefore = await ethers.provider.getBalance(alice.address);
      const tx  = await game.connect(alice).withdraw(prize);
      const rec = await tx.wait();
      const gas = rec.gasUsed * rec.gasPrice;
      const ethAfter = await ethers.provider.getBalance(alice.address);

      // Net gain should be prize - gas
      expect(ethAfter).to.be.closeTo(ethBefore + prize - gas, ethers.parseEther("0.0001"));
      expect(await game.balances(alice.address)).to.equal(0n);
    });
  });

  // ── Partial Treasury Withdrawal ───────────────────────────────────────────────

  describe("Owner withdraws treasury in parts", function () {
    it("withdraw half treasury: half remains in treasury", async function () {
      const { game, owner, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL);

      const treasury = await game.treasuryBalance();
      const half = treasury / 2n;

      await game.connect(owner).withdrawTreasury(half);
      expect(await game.treasuryBalance()).to.equal(treasury - half);
    });

    it("owner cannot over-withdraw treasury in two successive calls", async function () {
      const { game, owner, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL);

      const treasury = await game.treasuryBalance();
      await game.connect(owner).withdrawTreasury(treasury);  // drain it

      // Second call: nothing left
      await expect(game.connect(owner).withdrawTreasury(1n))
        .to.be.revertedWith("Exceeds treasury");
    });
  });

  // ── Deposit-Withdraw Round-trip ────────────────────────────────────────────────

  describe("Deposit then immediate full withdrawal (no attacks)", function () {
    it("deposits 5 attacks worth, withdraws all: balance is 0 and eth returned", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      const amount = ATTACK_COST * 5n;
      await game.connect(alice).deposit({ value: amount });
      expect(await game.balances(alice.address)).to.equal(amount);

      const ethBefore = await ethers.provider.getBalance(alice.address);
      const tx  = await game.connect(alice).withdrawAll();
      const rec = await tx.wait();
      const gas = rec.gasUsed * rec.gasPrice;
      const ethAfter = await ethers.provider.getBalance(alice.address);

      expect(await game.balances(alice.address)).to.equal(0n);
      expect(ethAfter).to.be.closeTo(ethBefore + amount - gas, ethers.parseEther("0.0001"));
    });
  });

  // ── Event Verification ─────────────────────────────────────────────────────

  describe("Event verification", function () {
    it("Deposit emits Deposited with correct sender and amount", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      const amount = ATTACK_COST * 3n;
      await expect(game.connect(alice).deposit({ value: amount }))
        .to.emit(game, "Deposited")
        .withArgs(alice.address, amount);
    });

    it("Attack emits Attacked with correct castleId, attacker, damage, hp, pool", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 1);
      await expect(game.connect(alice).attack(0, alice.address))
        .to.emit(game, "Attacked")
        .withArgs(0n, alice.address, DAMAGE, MAX_HP - DAMAGE, ATTACK_COST);
    });

    it("CastleFallen emits correct winner, reward, and new roundId=2", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL - 1);
      const expectedReward = (ATTACK_COST * BigInt(ATTACKS_TO_KILL) * 70n) / 100n;
      await expect(game.connect(alice).attack(0, alice.address))
        .to.emit(game, "CastleFallen")
        .withArgs(0n, alice.address, expectedReward, 2n);
    });

    it("SessionSet emits correct mainWallet, sessionWallet, expiry", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 3600;
      await expect(game.connect(alice).setSession(session.address, expiry))
        .to.emit(game, "SessionSet")
        .withArgs(alice.address, session.address, BigInt(expiry));
    });

    it("TreasuryWithdrawn emits correct to-address and amount", async function () {
      const { game, owner, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL);
      const treas = await game.treasuryBalance();
      await expect(game.connect(owner).withdrawTreasury(treas))
        .to.emit(game, "TreasuryWithdrawn")
        .withArgs(owner.address, treas);
    });

    it("Withdrawn emits correct user and amount", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      const amount = ATTACK_COST * 2n;
      await game.connect(alice).deposit({ value: amount });
      await expect(game.connect(alice).withdraw(amount))
        .to.emit(game, "Withdrawn")
        .withArgs(alice.address, amount);
    });
  });

  // ── Access Control / Reverts ───────────────────────────────────────────────

  describe("Access control and revert conditions", function () {
    it("attack with invalid castleId reverts", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 1);
      await expect(game.connect(alice).attack(99, alice.address))
        .to.be.revertedWith("Invalid castle ID");
    });

    it("attack with zero balance reverts", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await expect(game.connect(alice).attack(0, alice.address))
        .to.be.revertedWith("Insufficient balance");
    });

    it("withdraw 0 amount reverts", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await expect(game.connect(alice).withdraw(0))
        .to.be.revertedWith("Amount must be > 0");
    });

    it("withdraw more than balance reverts", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 1);
      await expect(game.connect(alice).withdraw(ATTACK_COST * 100n))
        .to.be.revertedWith("Insufficient balance");
    });

    it("withdrawAll with zero balance reverts", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await expect(game.connect(alice).withdrawAll())
        .to.be.revertedWith("Nothing to withdraw");
    });

    it("deposit with 0 value reverts", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await expect(game.connect(alice).deposit({ value: 0 }))
        .to.be.revertedWith("Send MON to deposit");
    });

    it("session wallet cannot withdraw main wallet's prize", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      // Session attacks on alice's behalf — alice wins the prize
      const expiry = (await time.latest()) + 3600;
      await game.connect(alice).setSession(session.address, expiry);
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, session, alice.address, 0, ATTACKS_TO_KILL);
      const alicePrize = await game.balances(alice.address);
      // Session has zero balance (it never deposited under its own address)
      expect(await game.balances(session.address)).to.equal(0n);
      // Session tries to withdraw alice's prize amount — reverts because session's OWN balance is 0
      await expect(game.connect(session).withdraw(alicePrize))
        .to.be.revertedWith("Insufficient balance");
    });

    it("non-owner calling withdrawTreasury reverts", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await expect(game.connect(alice).withdrawTreasury(1n))
        .to.be.revertedWithCustomError(game, "OwnableUnauthorizedAccount");
    });

    it("attack with wrong session wallet reverts (third-party impersonation)", async function () {
      const { game, alice, bob, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 3600;
      // alice sets 'session' as her session wallet, but 'bob' tries to attack on alice's behalf
      await game.connect(alice).setSession(session.address, expiry);
      await fundFor(game, alice, 1);
      // bob is NOT alice's session wallet — should revert
      await expect(game.connect(bob).attack(0, alice.address))
        .to.be.revertedWith("Not authorized: wrong session");
    });

    it("attack with expired session reverts", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 60;
      await game.connect(alice).setSession(session.address, expiry);
      await fundFor(game, alice, 1);
      await time.increase(120);  // advance time past expiry
      await expect(game.connect(session).attack(0, alice.address))
        .to.be.revertedWith("Not authorized: session expired");
    });

    it("setSession with past expiry reverts", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const pastExpiry = (await time.latest()) - 1;
      await expect(game.connect(alice).setSession(session.address, pastExpiry))
        .to.be.revertedWith("Expiry must be in future");
    });

    it("setSession with zero address reverts", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 3600;
      await expect(game.connect(alice).setSession(ethers.ZeroAddress, expiry))
        .to.be.revertedWith("Invalid session wallet");
    });

    it("attack after revokeSession is rejected", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 3600;
      await game.connect(alice).setSession(session.address, expiry);
      await game.connect(alice).revokeSession();
      await fundFor(game, alice, 1);
      await expect(game.connect(session).attack(0, alice.address))
        .to.be.revertedWith("Not authorized: wrong session");
    });
  });

  // ── View Function Coverage ────────────────────────────────────────────────

  describe("View function coverage", function () {
    it("attacksToFall returns 20 at full HP", async function () {
      const { game } = await loadFixture(deployFixture);
      expect(await game.attacksToFall(0)).to.equal(20n);
    });

    it("attacksToFall decreases as attacks land", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 5);
      await attackN(game, alice, alice.address, 0, 5);
      expect(await game.attacksToFall(0)).to.equal(15n);
    });

    it("isSessionValid returns false after revokeSession", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 3600;
      await game.connect(alice).setSession(session.address, expiry);
      expect(await game.isSessionValid(alice.address, session.address)).to.equal(true);
      await game.connect(alice).revokeSession();
      expect(await game.isSessionValid(alice.address, session.address)).to.equal(false);
    });

    it("isSessionValid returns false after time passes expiry", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 60;
      await game.connect(alice).setSession(session.address, expiry);
      expect(await game.isSessionValid(alice.address, session.address)).to.equal(true);
      await time.increase(120);
      expect(await game.isSessionValid(alice.address, session.address)).to.equal(false);
    });

    it("attacksRemaining reflects current balance correctly", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      expect(await game.attacksRemaining(alice.address)).to.equal(0n);
      await fundFor(game, alice, 7);
      expect(await game.attacksRemaining(alice.address)).to.equal(7n);
      await attackN(game, alice, alice.address, 0, 3);
      expect(await game.attacksRemaining(alice.address)).to.equal(4n);
    });

    it("getAllCastles returns all 4 castles with correct initial fields", async function () {
      const { game } = await loadFixture(deployFixture);
      const castles = await game.getAllCastles();
      expect(castles.length).to.equal(CASTLE_COUNT);
      for (let i = 0; i < CASTLE_COUNT; i++) {
        expect(castles[i].hp).to.equal(MAX_HP);
        expect(castles[i].roundId).to.equal(1n);
        expect(castles[i].pool).to.equal(0n);
        expect(castles[i].owner).to.equal(ethers.ZeroAddress);
      }
    });

    it("attacksToFall reverts on invalid castleId", async function () {
      const { game } = await loadFixture(deployFixture);
      await expect(game.attacksToFall(99)).to.be.revertedWith("Invalid castle ID");
    });
  });

  // ── batchAttack ───────────────────────────────────────────────────────────

  describe("batchAttack", function () {
    it("batch of 5 attacks reduces hp by 5*damage", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 5);
      await game.connect(alice).batchAttack(0, 5, alice.address);
      const castle = await game.getCastle(0);
      expect(castle.hp).to.equal(MAX_HP - DAMAGE * 5n);
    });

    it("batch stops at castle fall and does NOT continue into next round", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      // Fund for more than needed — 25 attacks, only 20 needed to kill
      await fundFor(game, alice, 25);
      await game.connect(alice).batchAttack(0, 25, alice.address);
      const castle = await game.getCastle(0);
      // Castle resets to full HP after falling, roundId advances
      expect(castle.hp).to.equal(MAX_HP);
      expect(castle.roundId).to.equal(2n);
      // After the castle fell alice received a 70% prize back into her balance:
      // balance = (25 - 20) * ATTACK_COST (unspent) + (20 * ATTACK_COST * 70 / 100) (prize)
      const unspent = ATTACK_COST * 5n;
      const prize   = (ATTACK_COST * BigInt(ATTACKS_TO_KILL) * 70n) / 100n;
      expect(await game.balances(alice.address)).to.equal(unspent + prize);
    });

    it("batch stops early when balance runs out mid-count", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 3);  // only 3 attacks funded, request 10
      await game.connect(alice).batchAttack(0, 10, alice.address);
      const castle = await game.getCastle(0);
      // Only 3 attacks landed
      expect(castle.hp).to.equal(MAX_HP - DAMAGE * 3n);
      expect(await game.balances(alice.address)).to.equal(0n);
    });

    it("batch by session wallet works and credits main wallet", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 3600;
      await game.connect(alice).setSession(session.address, expiry);
      await fundFor(game, alice, 10);
      await game.connect(session).batchAttack(0, 10, alice.address);
      const castle = await game.getCastle(0);
      expect(castle.hp).to.equal(MAX_HP - DAMAGE * 10n);
      expect(await game.balances(alice.address)).to.equal(0n);
    });

    it("batch by unauthorized session reverts before touching state", async function () {
      const { game, alice, bob } = await loadFixture(deployFixture);
      await fundFor(game, alice, 5);
      // Alice has no session set — bob tries to batch on her behalf
      await expect(game.connect(bob).batchAttack(0, 5, alice.address))
        .to.be.revertedWith("Not authorized: wrong session");
    });

    it("batch with invalid castleId reverts", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 5);
      await expect(game.connect(alice).batchAttack(99, 5, alice.address))
        .to.be.revertedWith("Invalid castle ID");
    });

    it("batch count of 0 reverts", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 1);
      await expect(game.connect(alice).batchAttack(0, 0, alice.address))
        .to.be.revertedWith("Count must be 1-50");
    });

    it("batch count over 50 reverts", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 51);
      await expect(game.connect(alice).batchAttack(0, 51, alice.address))
        .to.be.revertedWith("Count must be 1-50");
    });
  });

  // ── Multi-castle Independence ─────────────────────────────────────────────

  describe("Multi-castle independence", function () {
    it("attacking castle 1 does not affect castle 0", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 5);
      // Attack castle 1
      for (let i = 0; i < 5; i++) await game.connect(alice).attack(1, alice.address);
      const c0 = await game.getCastle(0);
      const c1 = await game.getCastle(1);
      expect(c0.hp).to.equal(MAX_HP);               // untouched
      expect(c1.hp).to.equal(MAX_HP - DAMAGE * 5n); // hit 5 times
    });

    it("alice wins castle 2, bob wins castle 3 in same block-time — separate prizes", async function () {
      const { game, alice, bob } = await loadFixture(deployFixture);
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await fundFor(game, bob,   ATTACKS_TO_KILL);
      await attackN(game, alice, alice.address, 2, ATTACKS_TO_KILL);
      await attackN(game, bob,   bob.address,   3, ATTACKS_TO_KILL);

      const totalPool = ATTACK_COST * BigInt(ATTACKS_TO_KILL);
      const expected  = (totalPool * 70n) / 100n;

      expect(await game.balances(alice.address)).to.equal(expected);
      expect(await game.balances(bob.address)).to.equal(expected);
      // Pools are independent — treasury collected from both
      expect(await game.treasuryBalance()).to.equal((totalPool * 30n) / 100n * 2n);
    });

    it("getCastle on every castleId returns independent state", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 3 * CASTLE_COUNT);
      // Hit each castle 3 times
      for (let c = 0; c < CASTLE_COUNT; c++) {
        await attackN(game, alice, alice.address, c, 3);
      }
      for (let c = 0; c < CASTLE_COUNT; c++) {
        const castle = await game.getCastle(c);
        expect(castle.hp).to.equal(MAX_HP - DAMAGE * 3n);
        expect(castle.pool).to.equal(ATTACK_COST * 3n);
      }
    });
  });

  // ── fundFor ──────────────────────────────────────────────────────────────

  describe("fundFor — credit balance directly to another player", function () {
    it("sender credits recipient's balance; sender retains no in-game credit", async function () {
      const { game, alice, bob } = await loadFixture(deployFixture);
      const gift = ATTACK_COST * 5n;
      await game.connect(alice).fundFor(bob.address, { value: gift });
      expect(await game.balances(bob.address)).to.equal(gift);
      expect(await game.balances(alice.address)).to.equal(0n);
    });

    it("FundedFor event has correct sender, recipient, amount", async function () {
      const { game, alice, bob } = await loadFixture(deployFixture);
      const gift = ATTACK_COST * 3n;
      await expect(game.connect(alice).fundFor(bob.address, { value: gift }))
        .to.emit(game, "FundedFor")
        .withArgs(alice.address, bob.address, gift);
    });

    it("fundFor with zero value reverts", async function () {
      const { game, alice, bob } = await loadFixture(deployFixture);
      await expect(game.connect(alice).fundFor(bob.address, { value: 0 }))
        .to.be.revertedWith("Send MON to fund");
    });

    it("fundFor with zero address recipient reverts", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await expect(game.connect(alice).fundFor(ethers.ZeroAddress, { value: ATTACK_COST }))
        .to.be.revertedWith("Invalid recipient");
    });

    it("recipient funded by someone else can attack immediately", async function () {
      const { game, alice, bob } = await loadFixture(deployFixture);
      // Alice gifts bob 5 attacks
      await game.connect(alice).fundFor(bob.address, { value: ATTACK_COST * 5n });
      // Bob has no ETH deposited himself — attacks using alice's gift
      await attackN(game, bob, bob.address, 0, 5);
      expect(await game.balances(bob.address)).to.equal(0n);
      const castle = await game.getCastle(0);
      expect(castle.hp).to.equal(MAX_HP - DAMAGE * 5n);
    });
  });

  // ── attacksByRound / playerAttacksThisRound ───────────────────────────────

  describe("Per-round attack tracking", function () {
    it("playerAttacksThisRound returns correct count after 5 attacks", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 5);
      await attackN(game, alice, alice.address, 0, 5);
      expect(await game.playerAttacksThisRound(0, alice.address)).to.equal(5n);
    });

    it("two players, independent attack counts this round", async function () {
      const { game, alice, bob } = await loadFixture(deployFixture);
      await fundFor(game, alice, 3);
      await fundFor(game, bob,   7);
      await attackN(game, alice, alice.address, 0, 3);
      await attackN(game, bob,   bob.address,   0, 7);
      expect(await game.playerAttacksThisRound(0, alice.address)).to.equal(3n);
      expect(await game.playerAttacksThisRound(0, bob.address)).to.equal(7n);
    });

    it("attack count resets to 0 in the new round after castle falls", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      // Round 1: alice kills castle
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL);
      // Round 2 starts — alice's count for this new roundId should be 0
      expect(await game.playerAttacksThisRound(0, alice.address)).to.equal(0n);
    });

    it("batchAttack increments attacksByRound correctly", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 8);
      await game.connect(alice).batchAttack(0, 8, alice.address);
      expect(await game.playerAttacksThisRound(0, alice.address)).to.equal(8n);
    });

    it("playerAttacksThisRound reverts on invalid castleId", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await expect(game.playerAttacksThisRound(99, alice.address))
        .to.be.revertedWith("Invalid castle ID");
    });
  });

  // ── getPlayerStats ────────────────────────────────────────────────────────

  describe("getPlayerStats view", function () {
    it("returns zero balance and no session for a fresh wallet", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      const s = await game.getPlayerStats(alice.address);
      expect(s.balance).to.equal(0n);
      expect(s.attacksAffordable).to.equal(0n);
      expect(s.sessionWallet).to.equal(ethers.ZeroAddress);
    });

    it("reflects correct balance and attacksAffordable after deposit", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, 7);
      const s = await game.getPlayerStats(alice.address);
      expect(s.balance).to.equal(ATTACK_COST * 7n);
      expect(s.attacksAffordable).to.equal(7n);
    });

    it("shows active session wallet while session is valid", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 3600;
      await game.connect(alice).setSession(session.address, expiry);
      const s = await game.getPlayerStats(alice.address);
      expect(s.sessionWallet).to.equal(session.address);
      expect(s.sessionExpiry).to.equal(BigInt(expiry));
    });

    it("shows zero sessionWallet after revokeSession", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 3600;
      await game.connect(alice).setSession(session.address, expiry);
      await game.connect(alice).revokeSession();
      const s = await game.getPlayerStats(alice.address);
      expect(s.sessionWallet).to.equal(ethers.ZeroAddress);
    });

    it("shows zero sessionWallet once session expires", async function () {
      const { game, alice, session } = await loadFixture(deployFixture);
      const expiry = (await time.latest()) + 60;
      await game.connect(alice).setSession(session.address, expiry);
      await time.increase(120);
      const s = await game.getPlayerStats(alice.address);
      expect(s.sessionWallet).to.equal(ethers.ZeroAddress);
    });

    it("balance decreases after attacks, prize credited after win", async function () {
      const { game, alice } = await loadFixture(deployFixture);
      await fundFor(game, alice, ATTACKS_TO_KILL);
      await attackN(game, alice, alice.address, 0, ATTACKS_TO_KILL);
      const prize = (ATTACK_COST * BigInt(ATTACKS_TO_KILL) * 70n) / 100n;
      const s = await game.getPlayerStats(alice.address);
      expect(s.balance).to.equal(prize);
    });
  });

});

