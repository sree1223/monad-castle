/**
 * GasEstimate.test.js — CastleWar v2 gas profiling
 *
 * Run:  npx hardhat test test/GasEstimate.test.js
 *
 * This is a *read-only* profiling suite — no assertions on game logic.
 * It measures gas consumed by each key operation so you can:
 *  1) Estimate on-chain costs for the Monad testnet demo
 *  2) Identify hot spots before optimising
 *  3) Verify the contract stays within block gas limits
 */
const { ethers } = require("hardhat");

async function deployFresh() {
  const [owner, alice, bob, sessionKey] = await ethers.getSigners();
  const Factory = await ethers.getContractFactory("CastleWar");
  const contract = await Factory.deploy(4);
  await contract.waitForDeployment();
  return { contract, owner, alice, bob, sessionKey };
}

function gas(receipt) {
  return Number(receipt.gasUsed).toLocaleString();
}

describe("⛽  Gas Estimates — CastleWar v2", function () {
  let contract, owner, alice, bob, sessionKey;

  before(async function () {
    ({ contract, owner, alice, bob, sessionKey } = await deployFresh());
    // Pre-fund alice and bob with 1 MON each
    await contract.connect(alice).deposit({ value: ethers.parseEther("1") });
    await contract.connect(bob).deposit({ value: ethers.parseEther("1") });
  });

  // ─── deposit / withdraw ─────────────────────────────────────────────────
  it("deposit() — initial deposit", async function () {
    const [, , , , extra] = await ethers.getSigners();
    const tx = await contract.connect(extra).deposit({ value: ethers.parseEther("0.5") });
    const r  = await tx.wait();
    console.log(`  deposit()               : ${gas(r)} gas`);
  });

  it("withdraw() — partial withdraw", async function () {
    const [, , , , extra] = await ethers.getSigners();
    await contract.connect(extra).deposit({ value: ethers.parseEther("0.5") });
    const tx = await contract.connect(extra).withdraw(ethers.parseEther("0.1"));
    const r  = await tx.wait();
    console.log(`  withdraw(0.1)           : ${gas(r)} gas`);
  });

  it("withdrawAll() — full balance", async function () {
    const [, , , , , extra2] = await ethers.getSigners();
    await contract.connect(extra2).deposit({ value: ethers.parseEther("0.2") });
    const tx = await contract.connect(extra2).withdrawAll();
    const r  = await tx.wait();
    console.log(`  withdrawAll()           : ${gas(r)} gas`);
  });

  // ─── session management ─────────────────────────────────────────────────
  it("setSession()", async function () {
    const expiry = Math.floor(Date.now() / 1000) + 86400;
    const tx = await contract.connect(alice).setSession(sessionKey.address, expiry);
    const r  = await tx.wait();
    console.log(`  setSession()            : ${gas(r)} gas`);
  });

  it("revokeSession()", async function () {
    // Revoke, then re-register for subsequent tests
    const expiry = Math.floor(Date.now() / 1000) + 86400;
    await contract.connect(alice).setSession(sessionKey.address, expiry);
    const tx = await contract.connect(alice).revokeSession();
    const r  = await tx.wait();
    console.log(`  revokeSession()         : ${gas(r)} gas`);
    // Re-register so session tests below work
    await contract.connect(alice).setSession(sessionKey.address, expiry);
  });

  it("fundSession() — push gas money to session wallet", async function () {
    // alice's session is active from above
    const tx = await contract.connect(alice).fundSession(ethers.parseEther("0.01"));
    const r  = await tx.wait();
    console.log(`  fundSession(0.01)       : ${gas(r)} gas`);
  });

  // ─── single attack ──────────────────────────────────────────────────────
  it("attack() — direct (msg.sender == mainWallet)", async function () {
    const tx = await contract.connect(bob).attack(0, bob.address);
    const r  = await tx.wait();
    console.log(`  attack() direct         : ${gas(r)} gas`);
  });

  it("attack() — via session wallet", async function () {
    const tx = await contract.connect(sessionKey).attack(0, alice.address);
    const r  = await tx.wait();
    console.log(`  attack() session        : ${gas(r)} gas`);
  });

  // ─── batch attacks ──────────────────────────────────────────────────────
  it("batchAttack(1) — sanity single via batch", async function () {
    const tx = await contract.connect(bob).batchAttack(0, 1, bob.address);
    const r  = await tx.wait();
    console.log(`  batchAttack(1)          : ${gas(r)} gas`);
  });

  it("batchAttack(5)  — 5 attacks in one tx", async function () {
    const tx = await contract.connect(bob).batchAttack(0, 5, bob.address);
    const r  = await tx.wait();
    console.log(`  batchAttack(5)          : ${gas(r)} gas  (~${Math.round(Number(r.gasUsed)/5).toLocaleString()} per attack)`);
  });

  it("batchAttack(10) — 10 attacks in one tx", async function () {
    const tx = await contract.connect(bob).batchAttack(0, 10, bob.address);
    const r  = await tx.wait();
    console.log(`  batchAttack(10)         : ${gas(r)} gas  (~${Math.round(Number(r.gasUsed)/10).toLocaleString()} per attack)`);
  });

  it("batchAttack(20) — 20 attacks (large batch)", async function () {
    // Ensure alice has enough balance
    await contract.connect(alice).deposit({ value: ethers.parseEther("1") });
    const tx = await contract.connect(alice).batchAttack(1, 20, alice.address);
    const r  = await tx.wait();
    console.log(`  batchAttack(20)         : ${gas(r)} gas  (~${Math.round(Number(r.gasUsed)/20).toLocaleString()} per attack)`);
  });

  // ─── castle fall (killing attack) ──────────────────────────────────────
  it("attack() that kills the castle — _resolveCastle + winner payout", async function () {
    // Deploy a fresh contract so we control the HP precisely
    const { contract: fc, owner: fo, alice: fa } = await deployFresh();
    await fc.connect(fa).deposit({ value: ethers.parseEther("2") });
    // 1000 HP / 50 per attack = 20 attacks needed; do 19 first
    for (let i = 0; i < 19; i++) await fc.connect(fa).attack(0, fa.address);
    // killing blow
    const tx = await fc.connect(fa).attack(0, fa.address);
    const r  = await tx.wait();
    console.log(`  attack() KILLING BLOW   : ${gas(r)} gas  (includes winner payout)`);
  });

  // ─── pixel gallery ──────────────────────────────────────────────────────
  it("claimPixel() — paint 1 pixel", async function () {
    // bob should have accumulated paint credits from prior attacks
    const credits = await contract.paintCredits(bob.address);
    if (credits === 0n) {
      // Just attack once more to earn a credit
      await contract.connect(bob).deposit({ value: ethers.parseEther("0.1") });
      await contract.connect(bob).attack(0, bob.address);
    }
    const tx = await contract.connect(bob).claimPixel(5, 7, 255, 100, 50);
    const r  = await tx.wait();
    console.log(`  claimPixel()            : ${gas(r)} gas`);
  });

  it("getCanvas() — read 900 pixels (view, no gas cost)", async function () {
    const canvas = await contract.getCanvas();
    console.log(`  getCanvas() returned ${canvas.painters.length} pixels (view call — no gas on-chain)`);
  });

  // ─── view helpers (estimateGas) ─────────────────────────────────────────
  it("getPlayerStats() — estimateGas (view call proxy)", async function () {
    const est = await contract.getPlayerStats.estimateGas(alice.address);
    console.log(`  getPlayerStats() est.   : ${Number(est).toLocaleString()} gas`);
  });

  it("getAllCastles() — estimateGas", async function () {
    const est = await contract.getAllCastles.estimateGas();
    console.log(`  getAllCastles() est.     : ${Number(est).toLocaleString()} gas`);
  });

  it("getWinHistory(0, 10) — estimateGas", async function () {
    const est = await contract.getWinHistory.estimateGas(0, 10);
    console.log(`  getWinHistory(10) est.  : ${Number(est).toLocaleString()} gas`);
  });

  // ─── fundFor ────────────────────────────────────────────────────────────
  it("fundFor() — gift balance to another address", async function () {
    const tx = await contract.connect(owner).fundFor(alice.address, { value: ethers.parseEther("0.05") });
    const r  = await tx.wait();
    console.log(`  fundFor()               : ${gas(r)} gas`);
  });

  // ─── summary ────────────────────────────────────────────────────────────
  after(function () {
    console.log("\n  ─────────────────────────────────────────────");
    console.log("  Summary: all gas numbers printed above.");
    console.log("  Monad testnet gas price ≈ 50 gwei (check dashboard).");
    console.log("  Cost per attack ≈ (attack_gas × 50e9) wei + 0.01 MON game cost.");
    console.log("  ─────────────────────────────────────────────\n");
  });
});
