/**
 * Deploy CastleWar to Monad Testnet
 *
 * Usage:
 *   cd contracts
 *   npx hardhat run scripts/deploy.js --network monad_testnet
 *
 * After deploy:
 *   1. Copy the printed address into frontend/.env  →  VITE_CONTRACT_ADDRESS=<addr>
 *   2. Copy it into root .env                       →  GAME_CONTRACT_ADDRESS=<addr>
 */
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("─".repeat(60));
  console.log("Deploying CastleWar from:", deployer.address);
  console.log("Balance:                ", ethers.formatEther(balance), "MON");
  console.log("─".repeat(60));

  const CastleWar = await ethers.getContractFactory("CastleWar");

  // Deploy with 4 castles: Ironhold, Stonepeak, Ashveil, Dreadfort
  const CASTLE_COUNT = 4;
  const castleWar = await CastleWar.deploy(CASTLE_COUNT);
  await castleWar.waitForDeployment();

  const address = await castleWar.getAddress();

  console.log("✅  CastleWar deployed to:", address);
  console.log("    Explorer:              https://testnet.monadexplorer.com/address/" + address);
  console.log("─".repeat(60));
  console.log("Next steps:");
  console.log("  1. Set VITE_CONTRACT_ADDRESS=" + address + " in frontend/.env");
  console.log("  2. Set GAME_CONTRACT_ADDRESS=" + address + " in root .env");
  console.log("─".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
