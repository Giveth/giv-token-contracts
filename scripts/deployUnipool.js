/* eslint-disable no-useless-concat */
const hre = require("hardhat");
const { ethers } = hre;
const { upgrades } = hre;

const args = process.argv.slice(2);

async function main() {
    const tokenDistroAddress = args[0];
    const tokenAddress = args[1];
    const TOTAL_REWARD_AMOUNT = args[2];

    const deployer = (await ethers.getSigners())[0].address;

    const LMDuration = 1_209_600; //  (TEST: 2 weeks = 24 hours => 86_400) final -> 2 weeks * 7 days * 24 hours * 3600 seconds = 1_209_600
    // eslint-disable-next-line camelcase

    console.log("\n#######################");
    console.log("##### Deployments #####");
    console.log("#######################");
    console.log("Deployer:", deployer);
    console.log("tokenDistroAddress:", tokenDistroAddress);
    console.log("tokenAddress:", tokenAddress);
    console.log("LMDuration:", LMDuration);

    // Deploy TokenDistro
    const TokenDistro = await ethers.getContractFactory("TokenDistro");
    const tokenDistro = await TokenDistro.attach(tokenDistroAddress);

    const UnipoolTokenDistributor = await ethers.getContractFactory(
        "UnipoolTokenDistributor",
    );

    console.log("\n######################################################");
    console.log(
        `#######     Unipool - ${TOTAL_REWARD_AMOUNT.toString()}   #######`,
    );
    console.log("######################################################");
    console.log("deployer:", deployer);
    console.log("tokenDistribution:", tokenDistro.address);
    console.log("uni:", tokenAddress);

    const unipool = await upgrades.deployProxy(UnipoolTokenDistributor, [
        tokenDistro.address,
        tokenAddress,
        LMDuration,
    ]);
    await unipool.deployed();
    console.log("##############################################\n");
    console.log("Unipool deployed to:", unipool.address);
    console.log("\n##############################################\n");

    // We grant permisions to the MerkleDistro and assign tokens
    await (
        await tokenDistro.grantRole(
            tokenDistro.DISTRIBUTOR_ROLE(),
            unipool.address,
        )
    ).wait();
    console.log(
        "TokenDistro - assign: unipool",
        TOTAL_REWARD_AMOUNT.toString(),
    );
    await (
        await tokenDistro.assign(
            unipool.address,
            ethers.utils.parseEther(TOTAL_REWARD_AMOUNT.toString()),
        )
    ).wait();

    // Set reward distributor
    await (await unipool.setRewardDistribution(deployer)).wait();

    console.log("\n#######################");
    console.log("#####    Check    #####");
    console.log("#######################");
    console.log("unipool(tokenDistro,duration,periodFinish,uni):");
    console.log(
        "unipool - tokenDistro:",
        `${await unipool.tokenDistro()}\n` + `unipool - duration:`,
        `${await unipool.duration()}\n` + `unipool - periodFinish:`,
        `${await unipool.periodFinish()}\n`,
    );

    console.log("\n#######################");
    console.log("#####  Final checks ###");
    console.log("#######################");
    console.log(
        "tokenDistro.balances(tokenDistro.address)",
        "allocated:",
        ethers.utils.formatEther(
            (
                await tokenDistro.balances(tokenDistro.address)
            ).allocatedTokens.toString(),
        ),
        "claimed:",
        ethers.utils.formatEther(
            (
                await tokenDistro.balances(tokenDistro.address)
            ).claimed.toString(),
        ),
    );
    console.log(
        "tokenDistro.balances(unipool.address)",
        "allocated:",
        ethers.utils.formatEther(
            (
                await tokenDistro.balances(unipool.address)
            ).allocatedTokens.toString(),
        ),
        "claimed:",
        ethers.utils.formatEther(
            (await tokenDistro.balances(unipool.address)).claimed.toString(),
        ),
    );

    console.log(
        "tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),unipool.address)",
        await tokenDistro.hasRole(
            tokenDistro.DISTRIBUTOR_ROLE(),
            unipool.address,
        ),
    );
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
