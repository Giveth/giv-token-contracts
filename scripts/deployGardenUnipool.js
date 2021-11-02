/* eslint-disable no-useless-concat */
const hre = require("hardhat");
const { ethers } = hre;
const { upgrades } = hre;

async function main() {
    const tokenAddress = "0x5d32A9BaF31A793dBA7275F77856A47A0F5d09b3";
    const tokenDistroAddress = "0xf11aC05c97F8845f6b974e9e327129d36683cC90";
    const unipoolRewardAmount = 0;
    const UNIGIV_AMOUNT = ethers.utils.formatEther(unipoolRewardAmount);

    const deployer = (await ethers.getSigners())[0].address;

    const LMDuration = 86_400; //  (TEST: 2 weeks = 24 hours => 86_400) final -> 2 weeks * 7 days * 24 hours * 3600 seconds = 1_209_600
    // eslint-disable-next-line camelcase

    console.log("\n#######################");
    console.log("##### Deployments #####");
    console.log("#######################");
    console.log("Deployer:", deployer);
    console.log("tokenAddress:", tokenAddress);
    console.log("LMDuration:", LMDuration);

    // Deploy TokenDistro
    const TokenDistro = await ethers.getContractFactory("TokenDistro");
    const tokenDistro = await TokenDistro.attach(tokenDistroAddress);

    const GardenUnipoolTokenDistributor = await ethers.getContractFactory(
        "GardenUnipoolTokenDistributor",
    );

    console.log("\n######################################################");
    console.log(`#######     GIVstaking xDai - xDai - ${UNIGIV_AMOUNT.toString()}   #######`);
    console.log("######################################################");
    console.log("deployer:", deployer);
    console.log("tokenDistribution:", tokenDistro.address);
    console.log("uni:", tokenAddress);

    const unigiv = await upgrades.deployProxy(GardenUnipoolTokenDistributor, [
        tokenDistro.address,
        tokenAddress,
        LMDuration,
    ]);
    await unigiv.deployed();
    console.log("##############################################\n");
    console.log("UNIGIV deployed to:", unigiv.address);
    console.log("\n##############################################\n");

    // We grant permisions to the MerkleDistro and assign tokens
    await (await tokenDistro.grantRole(tokenDistro.DISTRIBUTOR_ROLE(), unigiv.address)).wait();
    console.log("TokenDistro - assign: givhny_xdai", UNIGIV_AMOUNT.toString());
    await (
        await tokenDistro.assign(unigiv.address, ethers.utils.parseEther(UNIGIV_AMOUNT.toString()))
    ).wait();

    // Set reward distributor
    await (await unigiv.setRewardDistribution(deployer)).wait();

    console.log("\n#######################");
    console.log("#####    Check    #####");
    console.log("#######################");
    console.log("unigiv(tokenDistro,duration,periodFinish,uni):");
    console.log(
        "unigiv - tokenDistro:",
        `${await unigiv.tokenDistro()}\n` + `unigiv - duration:`,
        `${await unigiv.duration()}\n` + `unigiv - periodFinish:`,
        `${await unigiv.periodFinish()}\n`,
    );

    console.log("\n#######################");
    console.log("#####  Final checks ###");
    console.log("#######################");
    console.log(
        "tokenDistro.balances(tokenDistro.address)",
        "allocated:",
        ethers.utils.formatEther(
            (await tokenDistro.balances(tokenDistro.address)).allocatedTokens.toString(),
        ),
        "claimed:",
        ethers.utils.formatEther(
            (await tokenDistro.balances(tokenDistro.address)).claimed.toString(),
        ),
    );
    console.log(
        "tokenDistro.balances(unigiv.address)",
        "allocated:",
        ethers.utils.formatEther(
            (await tokenDistro.balances(unigiv.address)).allocatedTokens.toString(),
        ),
        "claimed:",
        ethers.utils.formatEther((await tokenDistro.balances(unigiv.address)).claimed.toString()),
    );

    console.log(
        "tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),unigiv.address)",
        await tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(), unigiv.address),
    );
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
