/* eslint-disable no-use-before-define */
const hre = require("hardhat");
const { ethers } = hre;

const pools = [
    {
        address: "0x7B4b9BdC1fC87f9aff08bE428e797beA642C3bAc",
        amount: "10000000",
    }, // UNI (HNY/GIV)
    {
        address: "0x579869ADcB3a3203D7876be889D58C5cbe089F05",
        amount: "2500000",
    }, // UNI (ETH/GIV)
    {
        address: "0x860C72092b7FBca277F94ba1Df11e33043724eAF",
        amount: "7500000",
    }, // $GIV
];

// Two decimals of precision -> 760 = 7.60
const distro = [
    1550, 1200, 950, 750, 650, 600, 600, 650, 700, 750, 650, 550, 400,
];

const initTime = 1638444600;

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
    console.log(periodFinish);
    console.log(currentTime);

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
        console.log(
            "UnipoolTokenDistributor - notifyRewardAmount:",
            pool.address,
            "already set",
        );
    }
}

main();
