const pools = [
    { address: "0x19992b52338B7B49De9679ae018A7027803dB1Aa", amount: "550000" },    // $NODE
    { address: "0x072115DbD5c8b47E971890357d2951d4569F6B27", amount: "2200000" },   // Uniswap
    { address: "0x89F2e26F20Bf66bBFAc947A3b628b4b4724AaA5c", amount: "2200000" }    // Shushi
];

// Two decimals of precision -> 760 = 7.60
const distro = [760, 600, 500, 500, 540, 620, 700, 780, 860, 940, 1020, 1100, 1080];

const initTime = 1626561000;

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
    // 1 hour of precision
    if (periodFinish < (currentTime + 3600)) {
        let pos = Math.floor((currentTime - initTime) / duration);
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