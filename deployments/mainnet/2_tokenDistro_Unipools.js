const hre = require("hardhat");
const ethers = hre.ethers;
const upgrades = hre.upgrades;
const fs = require('fs');
const { BigNumber } = require("ethers");

var args = process.argv.slice(2);

async function main() {
    const deployer = (await ethers.getSigners())[0].address;
    /*
        Parameters
        MerkleDistro - 14,886,637
        50GIV/HNY - honeyswap - 1,200,000
        50GIV/WETH - honeyswap - 250,000
        GIVstaking xDai - xDai - 500,000
        Total: 16,836,637
        InitialPercentage: 10%
        Duration: 5 years
        Cliff: 0
    */
    const startTime = args[0]; // first parameter timestamp -> 1628935200 //Saturday, 14 August 2021 10:00:00
    const cliffPeriod = 0;
    const duration = 5631428;  // (TEST: 2 weeks = 12 hours => 5631428) final -> 5 years * 365 days * 24 hours * 3600 seconds = 157680000
    const initialPercentage = 1000; // two decimals of precision
    const tokenAddress = ethers.utils.getAddress(args[1]) // Token Address second parameter
    const cancelable = false
    const LMDuration = 43200 //  (TEST: 2 weeks = 12 hours => 43200) final -> 2 weeks * 7 days * 24 hours * 3600 seconds =
    const GIVETH_UNI = ethers.utils.getAddress(args[2]) // GIVETH_UNI pool address
    const GIVETH_UNI_AMOUNT = args[3] // GIVETH_UNI reward amount
    const GIVETH_BAL = ethers.utils.getAddress(args[4]) // GIVETH_BAL pool address
    const GIVETH_BAL_AMOUNT = args[5] // GIVETH_BAL reward amount
    const UNIGIV_MAINNET_AMOUNT = args[6] // GIVETH_BAL pool reward
    const totalTokens = ethers.utils.parseEther(GIVETH_UNI_AMOUNT).add(ethers.utils.parseEther(GIVETH_BAL_AMOUNT)).add(ethers.utils.parseEther(UNIGIV_MAINNET_AMOUNT));

    console.log("\n#######################");
    console.log("##### Deployments #####");
    console.log("#######################");
    console.log("Deployer:", deployer)
    console.log("totalTokens:", ethers.utils.formatEther(totalTokens.toString()))
    console.log("startTime:", startTime)
    console.log("cliffPeriod:", cliffPeriod)
    console.log("duration:", duration)
    console.log("initialPercentage:", initialPercentage)
    console.log("tokenAddress:", tokenAddress)
    console.log("LMDuration:", LMDuration)
    console.log("cancelable:", cancelable)


    console.log("\n#######################");
    console.log("##### TokenDistro #####");
    console.log("#######################\n");

    console.log("deployer:", deployer)
    console.log("totalTokens:", ethers.utils.formatEther(totalTokens.toString()))
    console.log("startTime:", startTime)
    console.log("cliffPeriod:", cliffPeriod)
    console.log("duration:", duration)
    console.log("initialPercentage:", initialPercentage)
    console.log("tokenAddress:", tokenAddress)
    console.log("cancelable:", cancelable)

    // Deploy TokenDistro
    const TokenDistro = await ethers.getContractFactory("TokenDistro");
    const tokenDistro = await upgrades.deployProxy(TokenDistro,
        [
            totalTokens,
            startTime,
            cliffPeriod,
            duration,
            initialPercentage,
            tokenAddress,
            cancelable
        ]);
    await tokenDistro.deployed();
    console.log("########################\n");
    console.log("TokenDistro deployed to:", tokenDistro.address);
    console.log("\n#######################");
    console.log("#####    Check    #####");
    console.log("#######################");
    console.log(
        "TokenDistro - totalTokens:", ethers.utils.formatEther(await tokenDistro.totalTokens()) + "\n" +
    "TokenDistro - startTime:", await tokenDistro.startTime() + "\n" +
    "TokenDistro - cliffPeriod:", await tokenDistro.cliffTime() + "\n" +
    "TokenDistro - duration:", await tokenDistro.duration() + "\n" +
    "TokenDistro - initialAmount:", await tokenDistro.initialAmount() + "\n" +
    "TokenDistro - token:", await tokenDistro.token() + "\n" +
    "TokenDistro - cancelable:", await tokenDistro.cancelable()
    )

    console.log("This smartcontract needs: ", ethers.utils.formatEther(await tokenDistro.totalTokens()), "Tokens")
    console.log("token.mint(\"" + tokenDistro.address + "\",\"" + await tokenDistro.totalTokens() + "\")")

    console.log("\n######################################################");
    console.log("#######   50GIV/ETH - Uni  Mainnet 1,100,000   #######");
    console.log("######################################################");
    console.log("deployer:", deployer)
    console.log("tokenDistribution:", tokenDistro.address)
    console.log("uni:", GIVETH_UNI)
    console.log("duration:", LMDuration)

    const UnipoolTokenDistributor = await ethers.getContractFactory("UnipoolTokenDistributor");
    const giveth_uni = await upgrades.deployProxy(UnipoolTokenDistributor, [tokenDistro.address, GIVETH_UNI, LMDuration]);
    await giveth_uni.deployed();
    console.log("##############################################\n");
    console.log("GIVETH_UNI deployed to:", giveth_uni.address);
    console.log("\n##############################################\n");

    // We grant permission to the MerkleDistro and assign tokens
    await (await tokenDistro.grantRole(tokenDistro.DISTRIBUTOR_ROLE(), giveth_uni.address)).wait();
    console.log("TokenDistro - assign: giveth_uni", GIVETH_UNI_AMOUNT.toString());
    await (await tokenDistro.assign(giveth_uni.address, ethers.utils.parseEther(GIVETH_UNI_AMOUNT.toString()))).wait();

    // Set reward distributor
    await (await giveth_uni.setRewardDistribution(deployer)).wait()

    console.log("\n#######################");
    console.log("#####    Check    #####");
    console.log("#######################");
    console.log("giveth_uni(tokenDistro,duration,periodFinish,uni):")
    console.log(
        "giveth_uni - tokenDistro:", await giveth_uni.tokenDistro() + "\n" +
    "giveth_uni - duration:", await giveth_uni.duration() + "\n" +
    "giveth_uni - periodFinish:", await giveth_uni.periodFinish() + "\n" +
    "giveth_uni - uni:", await giveth_uni.uni() + "\n");

    console.log("\n######################################################");
    console.log("####### 80GIV/ETH - Bal   Mainnet   200,000  #######");
    console.log("######################################################");
    console.log("deployer:", deployer)
    console.log("tokenDistribution:", tokenDistro.address)
    console.log("uni:", GIVETH_BAL)
    console.log("duration:", LMDuration)

    const giveth_bal = await upgrades.deployProxy(UnipoolTokenDistributor, [tokenDistro.address, GIVETH_BAL, LMDuration]);
    await giveth_bal.deployed();
    console.log("##############################################\n");
    console.log("GIVETH_UNI deployed to:", giveth_bal.address);
    console.log("\n##############################################\n");

    // We grant permisions to the MerkleDistro and assign tokens
    await (await tokenDistro.grantRole(tokenDistro.DISTRIBUTOR_ROLE(), giveth_bal.address)).wait();
    console.log("TokenDistro - assign: giveth_uni", GIVETH_BAL_AMOUNT.toString());
    await (await tokenDistro.assign(giveth_bal.address, ethers.utils.parseEther(GIVETH_BAL_AMOUNT.toString()))).wait();

    // Set reward distributor
    await (await giveth_bal.setRewardDistribution(deployer)).wait()

    console.log("\n#######################");
    console.log("#####    Check    #####");
    console.log("#######################");
    console.log("giveth_bal(tokenDistro,duration,periodFinish,uni):")
    console.log(
        "giveth_bal - tokenDistro:", await giveth_bal.tokenDistro() + "\n" +
    "giveth_bal - duration:", await giveth_bal.duration() + "\n" +
    "giveth_bal - periodFinish:", await giveth_bal.periodFinish() + "\n" +
    "giveth_bal - uni:", await giveth_bal.uni() + "\n");

    console.log("\n######################################################");
    console.log("#######   GIVstaking ETH    Mainnet    200,000   #######");
    console.log("######################################################");
    console.log("deployer:", deployer)
    console.log("tokenDistribution:", tokenDistro.address)
    console.log("uni:", tokenAddress)
    console.log("duration:", LMDuration)

    const unigiv = await upgrades.deployProxy(UnipoolTokenDistributor, [tokenDistro.address, tokenAddress, LMDuration]);
    await unigiv.deployed();
    console.log("##############################################\n");
    console.log("UNIGIV deployed to:", unigiv.address);
    console.log("\n##############################################\n");

    // We grant permisions to the MerkleDistro and assign tokens
    await (await tokenDistro.grantRole(tokenDistro.DISTRIBUTOR_ROLE(), unigiv.address)).wait();
    console.log("TokenDistro - assign: giveth_uni", UNIGIV_MAINNET_AMOUNT.toString());
    await (await tokenDistro.assign(unigiv.address, ethers.utils.parseEther(UNIGIV_MAINNET_AMOUNT.toString()))).wait();

    // Set reward distributor
    await (await unigiv.setRewardDistribution(deployer)).wait()

    console.log("\n#######################");
    console.log("#####    Check    #####");
    console.log("#######################");
    console.log("unigiv(tokenDistro,duration,periodFinish,uni):")
    console.log(
        "unigiv - tokenDistro:", await unigiv.tokenDistro() + "\n" +
    "unigiv - duration:", await unigiv.duration() + "\n" +
    "unigiv - periodFinish:", await unigiv.periodFinish() + "\n" +
    "unigiv - uni:", await unigiv.uni() + "\n");


    console.log("\n#######################");
    console.log("#####  Final checks ###");
    console.log("#######################");
    console.log("tokenDistro.balances(tokenDistro.address)", "allocated:", ethers.utils.formatEther((await tokenDistro.balances(tokenDistro.address)).allocatedTokens.toString()), "claimed:", ethers.utils.formatEther((await tokenDistro.balances(tokenDistro.address)).claimed.toString()));
    console.log("tokenDistro.balances(giveth_uni.address)", "allocated:", ethers.utils.formatEther((await tokenDistro.balances(giveth_uni.address)).allocatedTokens.toString()), "claimed:", ethers.utils.formatEther((await tokenDistro.balances(giveth_uni.address)).claimed.toString()));
    console.log("tokenDistro.balances(giveth_bal.address)", "allocated:", ethers.utils.formatEther((await tokenDistro.balances(giveth_bal.address)).allocatedTokens.toString()), "claimed:", ethers.utils.formatEther((await tokenDistro.balances(giveth_bal.address)).claimed.toString()));
    console.log("tokenDistro.balances(unigiv.address)", "allocated:", ethers.utils.formatEther((await tokenDistro.balances(unigiv.address)).allocatedTokens.toString()), "claimed:", ethers.utils.formatEther((await tokenDistro.balances(unigiv.address)).claimed.toString()));

    console.log("tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),giveth_uni.address)", await tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(), giveth_uni.address));
    console.log("tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),giveth_bal.address)", await tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(), giveth_bal.address));
    console.log("tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),unigiv.address)", await tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(), unigiv.address));
}

main().catch(e => {
    console.error(e)
    process.exit(1)
})
