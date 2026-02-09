// frontend/app.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.5/+esm";

const CROWDFUNDING_ADDRESS = "0x38aa4d86a9e09db53550b1a21099f462de6be629";
const REWARD_TOKEN_ADDRESS = "0x36a3049b546d8021ecff9b36f9d614208736c145";

const CROWDFUNDING_ABI = [
  "function campaigns(uint256) view returns (string title,address creator,uint256 goal,uint256 collectedAmount,uint256 deadline,bool finalized)",
  "function createCampaign(string _title,uint256 _goal,uint256 _durationInDays)",
  "function contribute(uint256 _campaignId) payable",
  "function finalizeCampaign(uint256 _campaignId)",
  "function rewardToken() view returns (address)",
  "event CampaignCreated(uint256 indexed campaignId,address indexed creator,string title,uint256 goal,uint256 deadline)",
  "event Contributed(uint256 indexed campaignId,address indexed contributor,uint256 amountWei,uint256 rewardMinted)",
  "event CampaignFinalized(uint256 indexed campaignId,bool goalReached,uint256 totalCollected)"
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

let provider, signer, userAddress;
let crowdfunding, rewardToken;

const $ = (id) => document.getElementById(id);

function fmtEth(wei) {
  try { return ethers.formatEther(wei); } catch { return "0"; }
}

function fmtDate(ts) {
  const ms = Number(ts) * 1000;
  return new Date(ms).toLocaleString();
}

async function requireMetaMask() {
  if (!window.ethereum) throw new Error("MetaMask not found");
}

async function connect() {
  await requireMetaMask();

  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  userAddress = await signer.getAddress();

  crowdfunding = new ethers.Contract(CROWDFUNDING_ADDRESS, CROWDFUNDING_ABI, signer);
  rewardToken = new ethers.Contract(REWARD_TOKEN_ADDRESS, ERC20_ABI, signer);

  $("status").textContent = "Connected";
  $("address").textContent = userAddress;

  await refreshBalances();
  await loadCampaigns();
}

async function checkNetwork() {
  const network = await provider.getNetwork();
  // Sepolia chainId = 11155111
  if (Number(network.chainId) !== 11155111) {
    $("network").textContent = `Wrong network: ${network.chainId} (switch to Sepolia)`;
    $("network").className = "bad";
    return false;
  }
  $("network").textContent = `Sepolia (chainId ${network.chainId})`;
  $("network").className = "good";
  return true;
}

async function refreshBalances() {
  if (!provider || !userAddress) return;

  await checkNetwork();

  const ethBal = await provider.getBalance(userAddress);
  $("ethBalance").textContent = fmtEth(ethBal);

  try {
    const [decimals, symbol, crtBal] = await Promise.all([
      rewardToken.decimals(),
      rewardToken.symbol(),
      rewardToken.balanceOf(userAddress),
    ]);
    const human = ethers.formatUnits(crtBal, decimals);
    $("tokenBalance").textContent = `${human} ${symbol}`;
  } catch (e) {
    $("tokenBalance").textContent = "N/A";
  }
}

async function loadCampaigns() {
  $("campaigns").innerHTML = "";
  // We don’t have campaigns.length in ABI; simplest is: try IDs 0..N until fail
  // For demo: scan first 20 campaigns.
  const maxScan = 20;

  for (let i = 0; i < maxScan; i++) {
    try {
      const c = await crowdfunding.campaigns(i);
      renderCampaign(i, c);
    } catch (e) {
      // stop on first missing id
      break;
    }
  }
}

function renderCampaign(id, c) {
  const title = c.title;
  const creator = c.creator;
  const goal = c.goal;
  const collected = c.collectedAmount;
  const deadline = c.deadline;
  const finalized = c.finalized;

  const card = document.createElement("div");
  card.className = "card";

  const goalEth = fmtEth(goal);
  const collectedEth = fmtEth(collected);

  card.innerHTML = `
    <div class="row">
      <div>
        <div class="h">#${id} — ${title}</div>
        <div class="muted">Creator: ${creator}</div>
        <div class="muted">Deadline: ${fmtDate(deadline)}</div>
      </div>
      <div class="right">
        <div><b>${collectedEth}</b> / ${goalEth} ETH</div>
        <div class="${finalized ? "badge done" : "badge live"}">${finalized ? "FINALIZED" : "ACTIVE"}</div>
      </div>
    </div>

    <div class="actions">
      <input id="amt-${id}" class="input" placeholder="ETH amount (e.g. 0.01)" />
      <button class="btn" data-act="contribute" data-id="${id}">Contribute</button>
      <button class="btn secondary" data-act="finalize" data-id="${id}">Finalize</button>
    </div>

    <div id="msg-${id}" class="msg"></div>
  `;

  card.addEventListener("click", async (e) => {
    const btn = e.target?.closest("button");
    if (!btn) return;

    const act = btn.dataset.act;
    const cid = Number(btn.dataset.id);
    const msg = $(`msg-${cid}`);
    msg.textContent = "";

    const okNet = await checkNetwork();
    if (!okNet) return;

    try {
      if (act === "contribute") {
        const val = $(`amt-${cid}`).value.trim();
        if (!val) throw new Error("Enter ETH amount");
        const tx = await crowdfunding.contribute(cid, { value: ethers.parseEther(val) });
        msg.textContent = `Pending: ${tx.hash}`;
        await tx.wait();
        msg.textContent = `Success: ${tx.hash}`;
        await refreshBalances();
        await loadCampaigns();
      }

      if (act === "finalize") {
        const tx = await crowdfunding.finalizeCampaign(cid);
        msg.textContent = `Pending: ${tx.hash}`;
        await tx.wait();
        msg.textContent = `Success: ${tx.hash}`;
        await refreshBalances();
        await loadCampaigns();
      }
    } catch (err) {
      msg.textContent = `Error: ${err?.shortMessage || err?.message || String(err)}`;
    }
  });

  $("campaigns").appendChild(card);
}

async function createCampaign() {
  const okNet = await checkNetwork();
  if (!okNet) return;

  const title = $("newTitle").value.trim();
  const goalEth = $("newGoal").value.trim();
  const days = $("newDays").value.trim();

  if (!title) return alert("Title required");
  if (!goalEth) return alert("Goal ETH required");
  if (!days) return alert("Duration days required");

  // goal should be in wei in your contract
  const goalWei = ethers.parseEther(goalEth);

  try {
    $("createMsg").textContent = "";
    const tx = await crowdfunding.createCampaign(title, goalWei, BigInt(days));
    $("createMsg").textContent = `Pending: ${tx.hash}`;
    await tx.wait();
    $("createMsg").textContent = `Success: ${tx.hash}`;
    $("newTitle").value = "";
    $("newGoal").value = "";
    $("newDays").value = "";
    await loadCampaigns();
  } catch (err) {
    $("createMsg").textContent = `Error: ${err?.shortMessage || err?.message || String(err)}`;
  }
}

window.addEventListener("load", () => {
  $("connectBtn").addEventListener("click", connect);
  $("refreshBtn").addEventListener("click", refreshBalances);
  $("createBtn").addEventListener("click", createCampaign);

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => window.location.reload());
    window.ethereum.on("chainChanged", () => window.location.reload());
  }
});
