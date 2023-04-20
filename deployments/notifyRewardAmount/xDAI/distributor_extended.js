/* eslint-disable no-use-before-define */
const hre = require("hardhat");
const { ethers } = hre;

const pools = [
    {
        address: "0x24A6067fEd46dc8663794c4d39Ec91b074cf85D4",
        amount: "1000000", // 125000 * 8 week
    }, // UNI (GIV/DAI) Honeyswap
    {
        address: "0xfB429010C1e9D08B7347F968a7d88f0207807EF0",
        amount: "680000", // 85000 * 8 week
    }, // UNI (ETH/GIV)
    {
        address: "0xD93d3bDBa18ebcB3317a57119ea44ed2Cf41C2F2",
        amount: "600000", // 75000 * 8 week
    }, // $GIV
];

// Two decimals of precision -> 760 = 7.60
const distro = [2500, 2500, 2500, 2500];

/* START TIME
 * GIVeconomy start time + last reward round (13 * 2 weeks)
 * 1640361600 + 13 * 2 * 7 * 24 * 3600 = 1656086400
 */
const initTime = 1656086400;

let UnipoolTokenDistributor, currentTime, nonce;
async function main() {
    currentTime = Math.floor(Date.now() / 1000);
    const [signer, ...addrs] = await ethers.getSigners();
    nonce = await signer.getTransactionCount();
    UnipoolTokenDistributor = await ethers.getContractFactory(
        "UnipoolTokenDistributor",
    );
    await notifyRewardAmount(pools[0]);
    await notifyRewardAmount(pools[1]);
    await notifyRewardAmount(pools[2]);
}

async function notifyRewardAmount(pool) {
    const unipoolTokenDistributor = await UnipoolTokenDistributor.attach(
        pool.address,
    );
    const periodFinish = await unipoolTokenDistributor.periodFinish();
    const duration = await unipoolTokenDistributor.duration();

    // 1 hour of precision
    if (periodFinish < currentTime + 3600) {
        const pos = Math.floor((currentTime - initTime) / duration);
        console.log("pos:", pos);
        if (pos < 0) return;
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
        console.log(
            "UnipoolTokenDistributor - notifyRewardAmount:",
            pool.address,
            "already set",
        );
    }
}

main();
