/* eslint-disable no-use-before-define */
const hre = require("hardhat");
const { sendReportEmail } = require("../../mailService/mailService");
const { ethers } = hre;

// https://github.com/Giveth/giveth-dapps-v2/issues/5620
// Manual notify July 30, 2026 — Optimism: 455,310 GIV
const pool = {
    address: "0x301C739CF6bfb6B47A74878BdEB13f92F13Ae5E7",
    amount: "455310",
};

let UnipoolTokenDistributor, currentTime, nonce;
async function main() {
    console.log("Trying to call notifyRewardAmount (manual Jul 30)...", {
        date: new Date().toString(),
    });
    currentTime = Math.floor(Date.now() / 1000);
    const [signer] = await ethers.getSigners();
    console.log("signer:", signer.address);
    nonce = await signer.getTransactionCount();
    UnipoolTokenDistributor = await ethers.getContractFactory(
        "UnipoolTokenDistributor",
    );
    await notifyRewardAmount(pool);
}

async function notifyRewardAmount(poolConfig) {
    const unipoolTokenDistributor = await UnipoolTokenDistributor.attach(
        poolConfig.address,
    );
    const periodFinish = await unipoolTokenDistributor.periodFinish();

    // 10 minutes of precision
    if (periodFinish < currentTime + 60 * 10) {
        const amount = ethers.utils.parseEther(poolConfig.amount);
        console.log(
            "UnipoolTokenDistributor - notifyRewardAmount:",
            poolConfig.address,
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
            pool: poolConfig.address,
            round: "manual-jul30-2026",
            script: "givpower_manual_jul30_2026.js",
            transactionHash: tx.transactionHash,
            amount,
        });
    } else {
        console.log(
            "UnipoolTokenDistributor - notifyRewardAmount:",
            poolConfig.address,
            "already set",
        );
    }
}

main();
