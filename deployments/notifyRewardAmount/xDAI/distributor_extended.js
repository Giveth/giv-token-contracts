/* eslint-disable no-use-before-define */
const hre = require("hardhat");
const { ethers } = hre;

const pools = [
    {
        address: "0xe2c436E177C39A5D18AF6923Fc2Fc673f4729C05",
        amount: "1000000", // 125000 * 8 week
    }, // UNI (GIV/DAI) Honeyswap
    {
        address: "0x83535D6DeF8E881E647C00462315bae9A6E7BD09",
        amount: "680000", // 85000 * 8 week
    }, // UNI (ETH/GIV)
    {
        address: "0xDAEa66Adc97833781139373DF5B3bcEd3fdda5b1",
        amount: "600000", // 75000 * 8 week
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
