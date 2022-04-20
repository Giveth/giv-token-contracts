/* eslint-disable no-use-before-define */
const hre = require("hardhat");
const { ethers } = hre;

const pools = [
    {
        address: "0xa4523D703F663615Bd41606B46B58dEb2F926D98",
        // Total reward to pay 750K, but this farm has started later
        // when other farms have rewarded 76.5% of their capacities
        // So amount * 23.5% == 750K
        amount: "3191489",
    }, // UniswapV2 GIV/DAI
    {
        address: "0xc0dbDcA66a0636236fAbe1B3C16B1bD4C84bB1E1",
        amount: "2500000",
    }, // BAL
    {
        address: "0x4B9EfAE862a1755F7CEcb021856D467E86976755",
        amount: "2500000",
    }, // $GIV
];

// Two decimals of precision -> 760 = 7.60
const distro = [
    1550, 1200, 950, 750, 650, 600, 600, 650, 700, 750, 650, 550, 400,
];

const initTime = 1640361600;

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
