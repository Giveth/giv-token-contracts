import config from "./config";

import {
    TokenDistro,
    TokenDistro__factory,
    UnipoolTokenDistributor__factory,
} from "../../typechain-types";

const { ethers, upgrades } = require("hardhat");

const main = async () => {
    const deployer = (await ethers.getSigners())[0].address;

    const tokenDistroFactory = (await ethers.getContractFactory(
        "TokenDistro",
    )) as TokenDistro__factory;
    let tokenDistro: TokenDistro;

    console.log("\n#######################");
    console.log("##### Deployments #####");
    console.log("#######################");
    console.log("Deployer:", deployer);

    console.log("\n#######################");
    console.log("##### TokenDistro #####");
    console.log("#######################\n");
    // Load already deployed contract
    const {
        alreadyDeployedTokenDistroAddress,
        unipools,
        newTokenDistroParams,
    } = config;

    if (alreadyDeployedTokenDistroAddress) {
        console.log(
            "Attach to already deployed token distro at ",
            alreadyDeployedTokenDistroAddress,
        );
        tokenDistro = tokenDistroFactory.attach(
            alreadyDeployedTokenDistroAddress,
        );
    } else if (newTokenDistroParams) {
        const {
            totalTokens,
            startTime,
            cliffPeriod,
            duration,
            initialPercentage,
            tokenAddress,
            cancelable,
        } = newTokenDistroParams!;
        console.log("totalTokens:", totalTokens);
        console.log("startTime:", startTime);
        console.log("cliffPeriod:", cliffPeriod);
        console.log("duration:", duration);
        console.log("initialPercentage:", initialPercentage);
        console.log("tokenAddress:", tokenAddress);
        console.log("cancelable:", cancelable);

        tokenDistro = (await upgrades.deployProxy(tokenDistroFactory, [
            ethers.utils.parseEther(totalTokens!),
            startTime,
            cliffPeriod,
            duration,
            initialPercentage,
            tokenAddress,
            cancelable,
        ])) as TokenDistro;
        await tokenDistro.deployed();

        console.log("########################\n");
        console.log("TokenDistro deployed to:", tokenDistro.address);
        console.log("\n#######################");
        console.log("#####    Check    #####");
        console.log("#######################");
        console.log(
            "TokenDistro - totalTokens:",
            `${ethers.utils.formatEther(await tokenDistro.totalTokens())}\n` +
                `TokenDistro - startTime:`,
            `${await tokenDistro.startTime()}\nTokenDistro - cliffPeriod:`,
            `${await tokenDistro.cliffTime()}\nTokenDistro - duration:`,
            `${await tokenDistro.duration()}\nTokenDistro - initialAmount:`,
            `${await tokenDistro.initialAmount()}\nTokenDistro - token:`,
            `${await tokenDistro.token()}\nTokenDistro - cancelable:`,
            await tokenDistro.cancelable(),
        );

        console.log(
            "This smartcontract needs: ",
            ethers.utils.formatEther(await tokenDistro.totalTokens()),
            "Tokens",
        );
        console.log(
            `token.mint("${
                tokenDistro.address
            }","${await tokenDistro.totalTokens()}")`,
        );
    } else {
        console.log(
            "Either alreadyDeployedTokenDistroAddress or newTokenDistroParams should be defined in config",
        );
        return;
    }

    console.log("\n########################\n");
    console.log("Unipools");
    console.log("\n#######################\n");
    const unipoolTokenDistributorFactory = (await ethers.getContractFactory(
        "UnipoolTokenDistributor",
    )) as UnipoolTokenDistributor__factory;

    const unipoolNames = Object.keys(unipools);
    for (let i = 0; i < unipoolNames.length; i++) {
        const unipoolName = unipoolNames[i];
        const unipoolConfig = unipools[unipoolName];
        const { uniTokenAddress, lmDuration, rewardAmount } = unipoolConfig;

        console.log("\n######################################################");
        console.log(
            `####### Unipool - ${unipoolName} -  reward amount: ${rewardAmount.toString()} #######`,
        );
        console.log("######################################################");
        console.log("tokenDistribution:", tokenDistro.address);
        console.log("uni:", uniTokenAddress);
        console.log("duration:", lmDuration);

        const unipoolTokenDistributor = await upgrades.deployProxy(
            unipoolTokenDistributorFactory,
            [tokenDistro.address, uniTokenAddress, lmDuration],
        );
        await unipoolTokenDistributor.deployed();

        console.log("##############################################\n");
        console.log(
            `${unipoolName} deployed to: ${unipoolTokenDistributor.address}`,
        );
        console.log("\n##############################################\n");

        // Set reward distributor
        await (
            await unipoolTokenDistributor.setRewardDistribution(deployer)
        ).wait();

        // We grant permisions to the unipool and assign tokens
        await (
            await tokenDistro.grantRole(
                await tokenDistro.DISTRIBUTOR_ROLE(),
                unipoolTokenDistributor.address,
            )
        ).wait();
        console.log(
            `TokenDistro - assign: ${unipoolNames}`,
            rewardAmount.toString(),
        );
        await (
            await tokenDistro.assign(
                unipoolTokenDistributor.address,
                ethers.utils.parseEther(rewardAmount.toString()),
            )
        ).wait();

        console.log("\n#######################");
        console.log("#####    Check    #####");
        console.log("#######################");
        console.log(`${unipoolName}(tokenDistro,duration,periodFinish,uni):`);
        console.log(
            `${unipoolName} - tokenDistro:${await unipoolTokenDistributor.tokenDistro()}
            ${unipoolName} - duration:${await unipoolTokenDistributor.duration()}
            ${unipoolName} - periodFinish:${await unipoolTokenDistributor.periodFinish()}
            ${unipoolName} - uni:${await unipoolTokenDistributor.uni()}\n`,
        );
    }
};

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
