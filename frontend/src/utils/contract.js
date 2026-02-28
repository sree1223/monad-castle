/**
 * contract.js — ethers.js contract interaction utilities
 *
 * Complete ABI matching CastleWar.sol v2 (with cooldown, gallery, session, batch)
 */
import { ethers } from 'ethers';
import { MONAD_RPC, CONTRACT_ADDR, MONAD_CHAIN_ID } from '../config';

export const CASTLE_WAR_ADDRESS = CONTRACT_ADDR;

// Full ABI — matches deployed CastleWar.sol
export const CASTLE_WAR_ABI = [
  // Read
  'function getAllCastles() view returns (tuple(address owner, uint256 hp, uint256 pool, address lastAttacker, uint256 roundId, uint256 cooldownUntil)[])',
  'function getCastle(uint256 castleId) view returns (tuple(address owner, uint256 hp, uint256 pool, address lastAttacker, uint256 roundId, uint256 cooldownUntil))',
  'function balances(address) view returns (uint256)',
  'function castleCount() view returns (uint256)',
  'function paintCredits(address) view returns (uint256)',
  'function attacksToFall(uint256 castleId) view returns (uint256)',
  'function attacksRemaining(address mainWallet) view returns (uint256)',
  'function cooldownRemaining(uint256 castleId) view returns (uint256)',
  'function isSessionValid(address mainWallet, address sessionWallet) view returns (bool)',
  'function getPlayerStats(address player) view returns (tuple(uint256 balance, uint256 attacksAffordable, address sessionWallet, uint256 sessionExpiry, uint256 paintCredits))',
  'function playerAttacksThisRound(uint256 castleId, address player) view returns (uint256)',
  'function getWinHistory(uint256 castleId, uint256 n) view returns (tuple(address winner, uint256 reward, uint256 roundId, uint256 timestamp)[])',
  // Write
  'function deposit() payable',
  'function fundFor(address recipient) payable',
  'function fundSession(uint256 amount)',
  'function withdraw(uint256 amount)',
  'function withdrawAll()',
  'function attack(uint256 castleId, address mainWallet)',
  'function batchAttack(uint256 castleId, uint256 count, address mainWallet)',
  'function setSession(address sessionWallet, uint256 expiry)',
  'function revokeSession()',
  'function claimPixel(uint8 row, uint8 col, uint8 r, uint8 g, uint8 b)',
  // Events
  'event Attacked(uint256 indexed castleId, address indexed attacker, uint256 damage, uint256 newHP, uint256 pool)',
  'event CastleFallen(uint256 indexed castleId, address indexed winner, uint256 reward, uint256 newRoundId, uint256 cooldownUntil)',
  'event Deposited(address indexed user, uint256 amount)',
  'event Withdrawn(address indexed user, uint256 amount)',
  'event SessionSet(address indexed mainWallet, address indexed sessionWallet, uint256 expiry)',
  'event PixelPainted(address indexed painter, uint8 row, uint8 col, uint8 r, uint8 g, uint8 b)',
];

/** Get a read-only provider connected to Monad */
export function getReadProvider() {
  return new ethers.JsonRpcProvider(MONAD_RPC);
}

/** Get a contract instance. Pass signer for write ops, provider for reads */
export function getContract(signerOrProvider) {
  if (!CASTLE_WAR_ADDRESS) return null;
  return new ethers.Contract(CASTLE_WAR_ADDRESS, CASTLE_WAR_ABI, signerOrProvider);
}

/** ── READ FUNCTIONS ── */

export async function fetchAllCastles(provider) {
  if (!CASTLE_WAR_ADDRESS || !provider) return null;
  try {
    const contract = getContract(provider);
    const raw = await contract.getAllCastles();
    return raw.map((c, i) => ({
      id: i,
      hp: Number(c.hp),
      pool: ethers.formatEther(c.pool),
      owner: c.owner,
      lastAttacker: c.lastAttacker,
      roundId: Number(c.roundId),
      cooldownUntil: Number(c.cooldownUntil || 0),
    }));
  } catch (err) {
    console.warn('fetchAllCastles failed', err);
    return null;
  }
}

export async function fetchPlayerBalance(provider, address) {
  if (!CASTLE_WAR_ADDRESS || !provider || !address) return '0.00';
  try {
    const contract = getContract(provider);
    const raw = await contract.balances(address);
    return ethers.formatEther(raw);
  } catch {
    return '0.00';
  }
}

export async function fetchPlayerStats(provider, address) {
  if (!CASTLE_WAR_ADDRESS || !provider || !address) return null;
  try {
    const contract = getContract(provider);
    const stats = await contract.getPlayerStats(address);
    return {
      balance: ethers.formatEther(stats.balance),
      attacksAffordable: Number(stats.attacksAffordable),
      sessionWallet: stats.sessionWallet,
      sessionExpiry: Number(stats.sessionExpiry),
      paintCredits: Number(stats.paintCredits),
    };
  } catch {
    return null;
  }
}

/** ── WRITE FUNCTIONS ── */

export async function deposit(signer, amountEther) {
  const contract = getContract(signer);
  if (!contract) throw new Error('Contract not deployed');
  return contract.deposit({ value: ethers.parseEther(amountEther) });
}

export async function withdraw(signer, amountEther) {
  const contract = getContract(signer);
  if (!contract) throw new Error('Contract not deployed');
  return contract.withdraw(ethers.parseEther(amountEther));
}

export async function setSession(mainSigner, sessionAddress, durationHours = 24) {
  const contract = getContract(mainSigner);
  if (!contract) throw new Error('Contract not deployed');
  const expiry = Math.floor(Date.now() / 1000) + durationHours * 3600;
  const tx = await contract.setSession(sessionAddress, expiry);
  return { tx, expiry };
}

export async function attack(signer, castleId, mainWalletAddress) {
  const contract = getContract(signer);
  if (!contract) throw new Error('Contract not deployed');
  return contract.attack(castleId, mainWalletAddress);
}

export async function batchAttack(signer, castleId, count, mainWalletAddress) {
  const contract = getContract(signer);
  if (!contract) throw new Error('Contract not deployed');
  return contract.batchAttack(castleId, count, mainWalletAddress);
}
