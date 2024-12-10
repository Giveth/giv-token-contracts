/* eslint-disable no-use-before-define */
const hre = require("hardhat");
const { sendReportEmail } = require("../../mailService/mailService");
const { ethers } = hre;

const pools = [
    {
        address: "0xc790f82bf6f8709aa4a56dc11afad7af7c2a9867",

        // https://github.com/Giveth/giveth-dapps-v2/issues/4434
        amount: "1991250",
    }, // Garden Unipool
];

// Two decimals of precision -> 615 = 6.15
const distro = [
    // https://github.com/Giveth/giveth-dapps-v2/issues/4869
    685, 700, 713, 727, 742, 756, 770, 783, 797, 811, 825, 839, 852,
];

const initTime = 1733842800; // Timestamp of first round in seconds: Tuesday, DEC 10, 2024 15:00:00 GMT

let UnipoolTokenDistributor, currentTime, nonce;
async function main() {
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
            network: "ZKEVM mainnet",
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
