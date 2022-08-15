/* eslint-disable no-use-before-define */
const hre = require("hardhat");
const { ethers } = hre;

// https://github.com/Giveth/giveth-dapps-v2/issues/1353

const pools = [
    {
        address: "0xc0dbDcA66a0636236fAbe1B3C16B1bD4C84bB1E1",
        amount: " 900000", // 75000 * 6 (rounds) * 2 (weeks) = 900,000,
    }, // BAL GIV/ETH
];

// Two decimals of precision -> 1666 = 16.66
const distro = [1666, 1666, 1666, 1666, 1666, 1666];

/* START TIME
 * GIVeconomy start time + last reward round (17 * 2 weeks)
 * 1640361600 + 17 * 2 * 7 * 24 * 3600 = 1660924800
 */
const initTime = 1660924800;

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
    console.log(
        "notifyReward has been called for",
        JSON.stringify(pool, null, 4),
    );
    const unipoolTokenDistributor = await UnipoolTokenDistributor.attach(
        pool.address,
    );
    const periodFinish = await unipoolTokenDistributor.periodFinish();
    const duration = await unipoolTokenDistributor.duration();
    // 1 hour of precision
    if (periodFinish < currentTime + 3600) {
        const pos = Math.floor((currentTime - initTime) / duration);
        console.log("pos:", pos);
        if (pos < 0) {
            console.log("The currentTime is lower than initTime ", {
                currentTime,
                initTime,
            });
            return;
        }
        if (pos >= distro.length) {
            console.log("There is no distro for this pool", {
                pos,
                poolAddress: pool.address,
            });
            return;
        }
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
