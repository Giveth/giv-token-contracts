/* eslint-disable no-use-before-define */
const hre = require("hardhat");
const { ethers } = hre;

const pools = [
    { address: "0x491f1Cc76d619061b833287F493136A2D52BB18e", amount: "10000000" }, // UNI (HNY/GIV)
    { address: "0x00e97BCf2E9A5F6ECF006f89B094255263B16686", amount: "2500000" }, // UNI (ETH/GIV)
    { address: "0x4358c99abFe7A9983B6c96785b8870b5412C5B4B", amount: "7500000" }, // $GIV
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
    await notifyRewardAmount(pools[2]);
}

async function notifyRewardAmount(pool) {
    const unipoolTokenDistributor = await UnipoolTokenDistributor.attach(pool.address);
    const periodFinish = await unipoolTokenDistributor.periodFinish();
    const duration = await unipoolTokenDistributor.duration();
    console.log(periodFinish);
    console.log(currentTime);

    // 1 hour of precision
    if (periodFinish < currentTime + 3600) {
        const pos = Math.floor((currentTime - initTime) / duration);
        console.log("pos:", pos);
        const amount = ethers.utils.parseEther(pool.amount).mul(distro[pos]).div(10000);
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
