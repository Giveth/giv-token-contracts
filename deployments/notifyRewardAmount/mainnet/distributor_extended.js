/* eslint-disable no-use-before-define */
const hre = require("hardhat");
const { ethers } = hre;

const pools = [
    {
        address: "0x9e4EcF5fE5F58C888C84338525422A1D0915f6ff",
        amount: "920000", // 115000 * 8 week
    }, // UniswapV2 GIV/DAI
    {
        address: "0x4B319c068685aF260c91407B651918307df30061",
        amount: "600000", // 75000 * 8 week
    }, // BAL
    {
        address: "0x17207684344B206A06BF8651d6e5e1833660418b",
        amount: "200000", // 25000 * 8
    }, // $GIV
];

// Two decimals of precision -> 760 = 7.60
const distro = [2500, 2500, 2500, 2500];

/* START TIME
 * Test deployment 7 start time + last reward round (13 * 2 weeks)
 * 1640272200 + 13 * 2 * 7 * 24 * 3600 = 1655997000
 */
const initTime = 1655997000;

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
