/* eslint-disable no-use-before-define */
const hre = require("hardhat");
const { sendReportEmail } = require("../../mailService/mailService");
const { ethers } = hre;

const pools = [
    {
        address: "0x301C739CF6bfb6B47A74878BdEB13f92F13Ae5E7",

        // https://docs.google.com/spreadsheets/d/14kj7eIJg_hTf8BwVoGvPEWAo2Z6O18lA2bd1jOGZaNc/edit#gid=1038166692
        // Total amount of reward is 13_000_000, 10% of that is 1_300_000 for Optimism
        amount: "1300000",
    }, // Garden Unipool
];

// Two decimals of precision -> 1558 = 15.58
const distro = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 787, 808, 828, 850];

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
        await sendReportEmail({
            farm: "Giv power",
            network: "Optimisim mainnet",
            pool: pool.address,
            round: pos + 1,
            script: "givpower_distribute_extended.js",
            transactionHash: tx.transactionHash,
            amount,
        });
    } else {
        console.log(
            "UnipoolTokenDistributor - notifyRewardAmount:",
            pool.address,
            "already set",
        );
    }
}

main();