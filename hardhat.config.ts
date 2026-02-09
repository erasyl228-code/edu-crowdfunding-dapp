import "@nomicfoundation/hardhat-ethers";
import "dotenv/config";
import { defineConfig } from "hardhat/config";

export default defineConfig({
  solidity: "0.8.20",
  networks: {
    sepolia: {
      type: "http",
      chainId: 11155111,
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
});