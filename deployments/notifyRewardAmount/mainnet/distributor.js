/* eslint-disable no-use-before-define */
const hre = require("hardhat");
const { ethers } = hre;

const pools = [
  { address: "0x51F3E5C39a11fe189585FA2FD61A6b60E4Bc723a", amount: "1100000" }, // Uniswap
  { address: "0x3A2F69aC62888DbBa4fb36e18a76435E8357465E", amount: "200000" }, // BAL
  { address: "0x9cA5A8c67677A6341D147978c2661Dc6abc82E2c", amount: "200000" }, // $GIV
];

// Two decimals of precision -> 760 = 7.60
const distro = [760, 600, 500, 500, 540, 620, 700, 780, 860, 940, 1020, 1100, 1080];

const initTime = 1629374400;

let UnipoolTokenDistributor, currentTime, nonce;
async function main() {
  currentTime = Math.floor(Date.now() / 1000);
  const [signer, ...addrs] = await ethers.getSigners();
  nonce = await signer.getTransactionCount();
  UnipoolTokenDistributor = await ethers.getContractFactory("UnipoolTokenDistributor");
  await notifyRewardAmount(pools[0]);
  await notifyRewardAmount(pools[1]);
  await notifyRewardAmount(pools[2]);
}

async function notifyRewardAmount(pool) {
  const unipoolTokenDistributor = await UnipoolTokenDistributor.attach(pool.address);
  const periodFinish = await unipoolTokenDistributor.periodFinish();
  const duration = await unipoolTokenDistributor.duration();
  // 1 hour of precision
  if (periodFinish < currentTime + 3600) {
    const pos = Math.floor((currentTime - initTime) / duration);
    const amount = ethers.utils
      .parseEther(pool.amount)
      .mul(distro[pos])
      .div(10000);
    console.log(
      "UnipoolTokenDistributor - notifyRewardAmount:",
      pool.address,
      "->",
      ethers.utils.formatEther(amount.toString()),
    );
    const tx = await (await unipoolTokenDistributor.notifyRewardAmount(amount, { nonce })).wait();
    nonce += 1;
    console.log(tx);
  } else {
    console.log("UnipoolTokenDistributor - notifyRewardAmount:", pool.address, "already set");
  }
}

main();
