/* eslint-disable no-use-before-define */
const hre = require("hardhat");
const { ethers } = hre;

const pools = [
    // { address: "0x51F3E5C39a11fe189585FA2FD61A6b60E4Bc723a", amount: "1100000" }, // Uniswap V3 is exception, get all at the beginning
    { address: "0x087Cbc387b8746A73E3EbA9A31782F5ee7B6cC45", amount: "2500000" }, // BAL
    { address: "0x8d74ee0C611fA62210B66e051f31A0c103b6eDD6", amount: "2500000" }, // $GIV
];

// Two decimals of precision -> 760 = 7.60
const distro = [1550, 1200, 950, 750, 650, 600, 600, 650, 700, 750, 650, 550, 400];

const initTime = 1635007800;

let UnipoolTokenDistributor, currentTime, nonce;
async function main() {
    currentTime = Math.floor(Date.now() / 1000);
    const [signer, ...addrs] = await ethers.getSigners();
    nonce = await signer.getTransactionCount();
    UnipoolTokenDistributor = await ethers.getContractFactory("UnipoolTokenDistributor");
    await notifyRewardAmount(pools[0]);
    await notifyRewardAmount(pools[1]);
}

async function notifyRewardAmount(pool) {
    const unipoolTokenDistributor = await UnipoolTokenDistributor.attach(pool.address);
    const periodFinish = await unipoolTokenDistributor.periodFinish();
    const duration = await unipoolTokenDistributor.duration();
    // 1 hour of precision
    if (periodFinish < currentTime + 3600) {
        const pos = Math.floor((currentTime - initTime) / duration);
        console.log("pos:", pos);
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
        const tx = await (
            await unipoolTokenDistributor.notifyRewardAmount(amount, { nonce })
        ).wait();
        nonce += 1;
        console.log(tx);
    } else {
        console.log("UnipoolTokenDistributor - notifyRewardAmount:", pool.address, "already set");
    }
}

main();
