const pools = [
    { address: "0xF66823fdc33B9F4C66dB4C3394FF139872C12f16", amount: "550000" },    // $NODE
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
}

async function notifyRewardAmount(pool) {
    const unipoolTokenDistributor = await UnipoolTokenDistributor.attach(pool.address);
    const periodFinish = await unipoolTokenDistributor.periodFinish();
    const duration = await unipoolTokenDistributor.duration();
    console.log(periodFinish)
    console.log(currentTime)

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