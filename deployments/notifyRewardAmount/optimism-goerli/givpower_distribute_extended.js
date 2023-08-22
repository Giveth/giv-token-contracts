/* eslint-disable no-use-before-define */
const hre = require("hardhat");
const { ethers } = hre;

const pools = [
    {
        // Unipool GIVpower https://www.notion.so/giveth/bc46e165e9b54e3d889087d12fb04401?v=886ba9282edf47eba90542850f430c2c
        address: "0x632AC305ed88817480d12155A7F1244cC182C298",

        // https://docs.google.com/spreadsheets/d/14kj7eIJg_hTf8BwVoGvPEWAo2Z6O18lA2bd1jOGZaNc/edit#gid=1038166692
        amount: "622000",
    },
];

// Two decimals of precision -> 1558 = 15.58
const distro = [0, 0, 0, 0, 0, 0, 0, 0, 1558, 1601, 1645, 1688, 1732, 17.77];

const initTime = 1681840800; // Timestamp of first round in seconds: Tuesday, April 18, 2023 18:00:00 GMT

let UnipoolTokenDistributor, currentTime, nonce;
async function main() {
    currentTime = Math.floor(Date.now() / 1000);
    const [signer, ...addrs] = await ethers.getSigners();
    nonce = await signer.getTransactionCount();
    UnipoolTokenDistributor = await ethers.getContractFactory(
        "UnipoolTokenDistributor",
    );
    await notifyRewardAmount(pools[0]);
}

async function notifyRewardAmount(pool) {
    const unipoolTokenDistributor = await UnipoolTokenDistributor.attach(
        pool.address,
    );
    const periodFinish = await unipoolTokenDistributor.periodFinish();
    const duration = await unipoolTokenDistributor.duration();

    // 10 minutes of precision
    if (periodFinish < currentTime + 60 * 10) {
        const pos = Math.floor((currentTime - initTime) / duration);
        console.log("pos:", pos);
        if (pos < 0) return;
        if (distro[pos] === 0) return;
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
        console.log("tx:", tx);
    } else {
        console.log(
            "UnipoolTokenDistributor - notifyRewardAmount:",
            pool.address,
            "already set",
        );
    }
}

main();
