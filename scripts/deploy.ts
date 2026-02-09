// scripts/deploy.ts
import "dotenv/config";
import fs from "fs";
import path from "path";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";


function loadArtifact(contractFile: string, contractName: string) {
  const p = path.join(
    process.cwd(),
    "artifacts",
    "contracts",
    contractFile,
    `${contractName}.json`
  );

  if (!fs.existsSync(p)) {
    throw new Error(`Artifact not found: ${p}. Run: npx hardhat compile`);
  }

  const json = JSON.parse(fs.readFileSync(p, "utf-8"));
  return { abi: json.abi, bytecode: json.bytecode as `0x${string}` };
}

async function main() {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const pk = process.env.PRIVATE_KEY;

  if (!rpcUrl) throw new Error("Missing SEPOLIA_RPC_URL in .env");
  if (!pk) throw new Error("Missing PRIVATE_KEY in .env");

  const privateKey = (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  const publicClient = createPublicClient({
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    transport: http(rpcUrl),
  });

  console.log("Deployer:", account.address);

  const RewardTokenArt = loadArtifact("RewardToken.sol", "RewardToken");
  const CrowdfundingArt = loadArtifact("Crowdfunding.sol", "Crowdfunding");
  const rewardTokenHash = await walletClient.deployContract({
    abi: RewardTokenArt.abi,
    bytecode: RewardTokenArt.bytecode,
    args: [],
  });
  const rewardTokenReceipt = await publicClient.waitForTransactionReceipt({
    hash: rewardTokenHash,
  });
  const rewardTokenAddress = rewardTokenReceipt.contractAddress;
  if (!rewardTokenAddress) throw new Error("RewardToken deploy failed (no address)");
  console.log("RewardToken:", rewardTokenAddress);
  const crowdfundingHash = await walletClient.deployContract({
    abi: CrowdfundingArt.abi,
    bytecode: CrowdfundingArt.bytecode,
    args: [],
  });
  const crowdfundingReceipt = await publicClient.waitForTransactionReceipt({
    hash: crowdfundingHash,
  });
  const crowdfundingAddress = crowdfundingReceipt.contractAddress;
  if (!crowdfundingAddress) throw new Error("Crowdfunding deploy failed (no address)");
  console.log("Crowdfunding:", crowdfundingAddress);
  const setTxHash = await walletClient.writeContract({
    address: crowdfundingAddress,
    abi: CrowdfundingArt.abi,
    functionName: "setRewardToken",
    args: [rewardTokenAddress],
  });
  await publicClient.waitForTransactionReceipt({ hash: setTxHash });
  console.log("setRewardToken done");

  const ownTxHash = await walletClient.writeContract({
    address: rewardTokenAddress,
    abi: RewardTokenArt.abi,
    functionName: "transferOwnership",
    args: [crowdfundingAddress],
  });
  await publicClient.waitForTransactionReceipt({ hash: ownTxHash });
  console.log("transferOwnership done");

  console.log(" DONE");
  console.log("REWARD_TOKEN_ADDRESS =", rewardTokenAddress);
  console.log("CROWDFUNDING_ADDRESS =", crowdfundingAddress);
}

main().catch((e) => {
  console.error("Deploy failed:", e);
  process.exit(1);
});