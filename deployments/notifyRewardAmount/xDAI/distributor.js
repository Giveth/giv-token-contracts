const hre = require("hardhat");
const ethers = hre.ethers;

const pools = [
    { address: "0xe22d49ef8384599920D2915D7cF3f79B72c5683E", amount: "1200000" },   // UNI (HNY/GIV)
    { address: "0xD2c2b6EC1c1C5Be0b5a722d00Bb085cAE7Dead0e", amount: "250000" },    // UNI (ETH/GIV)
    { address: "0xD97DfF18cCd1e0cA32d5E27245C783E195735c00", amount: "500000" },    // $GIV
];

// Two decimals of precision -> 760 = 7.60
const distro = [760, 600, 500, 500, 540, 620, 700, 780, 860, 940, 1020, 1100, 1080];

const initTime = 1629374400;

let UnipoolTokenDistributor, currentTime, nonce;
async function main() {
    currentTime = Math.floor(Date.now() / 1000);
    [signer, ...addrs] = await ethers.getSigners();
    nonce = await signer.getTransactionCount();
    UnipoolTokenDistributor = await ethers.getContractFactory("UnipoolTokenDistributor");
    await notifyRewardAmount(pools[0])
    await notifyRewardAmount(pools[1])
    await notifyRewardAmount(pools[2])
}

async function notifyRewardAmount(pool) {
    const unipoolTokenDistributor = await UnipoolTokenDistributor.attach(pool.address);
    const periodFinish = await unipoolTokenDistributor.periodFinish();
    const duration = await unipoolTokenDistributor.duration();
    console.log('Period Finish:', periodFinish.toString())
    console.log('Current Time:', currentTime)

    // 1 hour of precision
    if (periodFinish < (currentTime + 3600)) {
        let pos = Math.floor((currentTime - initTime) / duration);
        console.log("pos:", pos)
        console.log("distro[pos]", distro[pos])
        let amount = ethers.utils.parseEther(pool.amount).mul(distro[pos]).div(10000);
        console.log("UnipoolTokenDistributor - notifyRewardAmount:", pool.address, "->", ethers.utils.formatEther(amount.toString()));
        let tx = await (await unipoolTokenDistributor.notifyRewardAmount(amount, { nonce: nonce })).wait();
        nonce = nonce + 1;
        console.log(tx)
    } else {
        console.log("UnipoolTokenDistributor - notifyRewardAmount:", pool.address, "already set");
    }
}

main();
