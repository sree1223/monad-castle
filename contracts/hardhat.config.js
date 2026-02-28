require("@nomicfoundation/hardhat-toolbox");
const path = require("path");
// Resolve .env regardless of which directory hardhat is run from
require("dotenv").config({ path: path.join(__dirname, "../.env") });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  // Explicit paths so hardhat works from any CWD
  paths: {
    sources:   path.join(__dirname, "contracts"),
    tests:     path.join(__dirname, "test"),
    cache:     path.join(__dirname, "cache"),
    artifacts: path.join(__dirname, "artifacts"),
  },
  networks: {
    hardhat: {},
    monad_testnet: {
      url: "https://testnet-rpc.monad.xyz",
      chainId: 10143,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
