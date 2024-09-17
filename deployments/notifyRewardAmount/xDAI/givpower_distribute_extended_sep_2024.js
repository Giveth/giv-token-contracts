/* eslint-disable no-use-before-define */
const hre = require("hardhat");
const { sendReportEmail } = require("../../mailService/mailService");
const { ethers } = hre;

const pools = [
    {
        address: "0xD93d3bDBa18ebcB3317a57119ea44ed2Cf41C2F2",

        // https://github.com/Giveth/giveth-dapps-v2/issues/4434
        amount: "1510975",
    }, // Garden Unipool
];

// Two decimals of precision -> 615 = 6.15
const distro = [1959, 1980, 1999, 2020, 2042];

const initTime = 1725375600; // Timestamp of first round in seconds: Tuesday, SEP 3, 2024 15:00:00 GMT

let UnipoolTokenDistributor, currentTime, nonce;
async function main() {
    try {
        console.log("Trying to call notifyRewardAmount...", {
            date: new Date().toString(),
        });
        currentTime = Math.floor(Date.now() / 1000);
        const [signer, ...addrs] = await ethers.getSigners();
        nonce = await signer.getTransactionCount();
        UnipoolTokenDistributor = await ethers.getContractFactory(
            "UnipoolTokenDistributor",
        );
        await notifyRewardAmount(pools[0]);
    } catch (e) {
        console.log("error when calling notifyRewardAmount:", e);
        throw e;
    }
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
            network: "Gnosis",
            pool: pool.address,
            round: pos + 1,
            script: "givpower_distribute_extended_sep_2024.js",
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
