/* eslint-disable no-useless-concat */
const hre = require("hardhat");
const { ethers } = hre;
const { upgrades } = hre;
const fs = require("fs");
const { BigNumber } = require("ethers");
const v3StakerABI = require("../../abi/uniswap-v3-staker.json");

const args = process.argv.slice(2);

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
    const duration = 157_680_000; // (TEST: 2 weeks = 24 hours => 11262857) final -> 5 years * 365 days * 24 hours * 3600 seconds = 157680000
    const initialPercentage = 10_00; // two decimals of precision
    const tokenAddress = ethers.utils.getAddress(args[1]); // Token Address second parameter
    const totalTokens = ethers.utils.parseEther(args[2]);
    const cancelable = false;
    const LMDuration = 1_209_600; //  (TEST: 2 weeks = 24 hours => 86_400) final -> 2 weeks * 7 days * 24 hours * 3600 seconds = 1_209_600
    const endTime = BigNumber.from(startTime)
        .add(LMDuration * 13)
        .toString();
    const GIVETH_UNI_STAKER = "0x1f98407aaB862CdDeF78Ed252D6f557aA5b0f00d"; // GIVETH_UNI staker address
    const GIVETH_UNI_POOL = ethers.utils.getAddress(args[3]); // GIVETH_UNI Pool Address
    const GIVETH_UNI_AMOUNT = args[4]; // GIVETH_UNI reward amount
    const GIVETH_BAL = ethers.utils.getAddress(args[5]); // GIVETH_BAL pool address
    const GIVETH_BAL_AMOUNT = args[6]; // GIVETH_BAL reward amount
    const GIV_MAINNET_AMOUNT = args[7]; // GIV pool reward
    // const totalTokens = ethers.utils
    //     .parseEther(GIVETH_UNI_AMOUNT)
    //     .add(ethers.utils.parseEther(GIVETH_BAL_AMOUNT))
    //     .add(ethers.utils.parseEther(GIV_MAINNET_AMOUNT));

    console.log("\n#######################");
    console.log("##### Deployments #####");
    console.log("#######################");
    console.log("Deployer:", deployer);
    console.log(
        "totalTokens:",
        ethers.utils.formatEther(totalTokens.toString()),
    );
    console.log("startTime:", startTime);
    console.log("cliffPeriod:", cliffPeriod);
    console.log("duration:", duration);
    console.log("initialPercentage:", initialPercentage);
    console.log("tokenAddress:", tokenAddress);
    console.log("LMDuration:", LMDuration);
    console.log("cancelable:", cancelable);

    console.log("\n#######################");
    console.log("##### TokenDistro #####");
    console.log("#######################\n");

    console.log("deployer:", deployer);
    console.log(
        "totalTokens:",
        ethers.utils.formatEther(totalTokens.toString()),
    );
    console.log("startTime:", startTime);
    console.log("cliffPeriod:", cliffPeriod);
    console.log("duration:", duration);
    console.log("initialPercentage:", initialPercentage);
    console.log("tokenAddress:", tokenAddress);
    console.log("cancelable:", cancelable);

    // Deploy TokenDistro
    const TokenDistro = await ethers.getContractFactory("TokenDistro");
    const tokenDistro = await upgrades.deployProxy(TokenDistro, [
        totalTokens,
        startTime,
        cliffPeriod,
        duration,
        initialPercentage,
        tokenAddress,
        cancelable,
    ]);
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
        `${await tokenDistro.startTime()}\n` + `TokenDistro - cliffPeriod:`,
        `${await tokenDistro.cliffTime()}\n` + `TokenDistro - duration:`,
        `${await tokenDistro.duration()}\n` + `TokenDistro - initialAmount:`,
        `${await tokenDistro.initialAmount()}\n` + `TokenDistro - token:`,
        `${await tokenDistro.token()}\n` + `TokenDistro - cancelable:`,
    );

    console.log(
        await tokenDistro.cancelable(),
        "This smartcontract needs: ",
        ethers.utils.formatEther(await tokenDistro.totalTokens()),
        "Tokens",
    );
    console.log(
        `token.mint("${
            tokenDistro.address
        }","${await tokenDistro.totalTokens()}")`,
    );

    console.log("\n######################################################");
    console.log(
        `#######   50GIV/ETH - Uni  Mainnet ${GIVETH_UNI_AMOUNT.toString()}   #######`,
    );
    console.log("######################################################");
    console.log("deployer:", deployer);
    console.log("tokenDistribution:", tokenDistro.address);
    console.log("uni staker:", GIVETH_UNI_STAKER);
    console.log("duration:", LMDuration);

    const UniswapV3RewardToken = await ethers.getContractFactory(
        "UniswapV3RewardToken",
    );
    // eslint-disable-next-line camelcase
    const giveth_uni_reward = await upgrades.deployProxy(UniswapV3RewardToken, [
        tokenDistro.address,
        GIVETH_UNI_STAKER,
    ]);
    await giveth_uni_reward.deployed();
    console.log("##############################################\n");
    console.log("GIVETH_UNI_REWARD deployed to:", giveth_uni_reward.address);
    console.log("\n##############################################\n");

    // We grant permission to the MerkleDistro and assign tokens
    await (
        await tokenDistro.grantRole(
            tokenDistro.DISTRIBUTOR_ROLE(),
            giveth_uni_reward.address,
        )
    ).wait();
    console.log(
        "TokenDistro - assign: giveth_uni_reward",
        GIVETH_UNI_AMOUNT.toString(),
    );
    await (
        await tokenDistro.assign(
            giveth_uni_reward.address,
            ethers.utils.parseEther(GIVETH_UNI_AMOUNT.toString()),
        )
    ).wait();

    // Setup Uniswap V3 Incentive incentive
    const uniswapV3Staker = await ethers.getContractAt(
        v3StakerABI,
        GIVETH_UNI_STAKER,
    );
    // calculate incentiveId
    const types = ["address", "address", "uint256", "uint256", "address"];
    const values = [
        giveth_uni_reward.address,
        GIVETH_UNI_POOL,
        startTime,
        endTime,
        deployer,
    ];
    const encodedKey = ethers.utils.defaultAbiCoder.encode(types, values);

    const incentiveId = ethers.utils.keccak256(encodedKey);
    console.log(`The new incentiveId will be ${incentiveId}`);

    const rewardAmount = ethers.utils.parseEther(GIVETH_UNI_AMOUNT);

    const key = {
        startTime,
        endTime,
        pool: GIVETH_UNI_POOL,
        rewardToken: giveth_uni_reward.address,
        refundee: deployer,
    };

    console.log("Key: ", key);
    const tx = await uniswapV3Staker.createIncentive(key, rewardAmount, {
        gasLimit: 200000, // similar tx on rinkeby cost ~88500, see https://rinkeby.etherscan.io/tx/0x76812c3bf5b187b3b1618289a71ad00df3bc32a2d615aa752eda67a71a77784a
    });
    console.log(`Creating incentive in tx ${tx.hash}...`);
    await tx.wait();

    console.log("\n#######################");
    console.log("#####    Check    #####");
    console.log("#######################");
    console.log("giveth_uni_reward(tokenDistro,duration,periodFinish,uni):");
    console.log(
        "giveth_uni_reward - tokenDistro:",
        `${await giveth_uni_reward.tokenDistro()}\n`,
    );
    console.log(
        "uniswap v3 staker - balance of giveth_uni_reward:",
        `${ethers.utils.formatEther(
            await giveth_uni_reward.balanceOf(GIVETH_UNI_STAKER),
        )}\n`,
    );

    console.log("\n######################################################");
    console.log(
        `####### 80GIV/ETH - Bal   Mainnet   ${GIVETH_BAL_AMOUNT.toString()}  #######`,
    );
    console.log("######################################################");
    console.log("deployer:", deployer);
    console.log("tokenDistribution:", tokenDistro.address);
    console.log("uni:", GIVETH_BAL);
    console.log("duration:", LMDuration);

    const UnipoolTokenDistributor = await ethers.getContractFactory(
        "UnipoolTokenDistributor",
    );
    // eslint-disable-next-line camelcase
    const giveth_bal = await upgrades.deployProxy(UnipoolTokenDistributor, [
        tokenDistro.address,
        GIVETH_BAL,
        LMDuration,
    ]);
    await giveth_bal.deployed();
    console.log("##############################################\n");
    console.log("GIVETH_BAL deployed to:", giveth_bal.address);
    console.log("\n##############################################\n");

    // We grant permisions to the MerkleDistro and assign tokens
    await (
        await tokenDistro.grantRole(
            tokenDistro.DISTRIBUTOR_ROLE(),
            giveth_bal.address,
        )
    ).wait();
    console.log(
        "TokenDistro - assign: giveth_uni_reward",
        GIVETH_BAL_AMOUNT.toString(),
    );
    await (
        await tokenDistro.assign(
            giveth_bal.address,
            ethers.utils.parseEther(GIVETH_BAL_AMOUNT.toString()),
        )
    ).wait();

    // Set reward distributor
    await (await giveth_bal.setRewardDistribution(deployer)).wait();

    console.log("\n#######################");
    console.log("#####    Check    #####");
    console.log("#######################");
    console.log("giveth_bal(tokenDistro,duration,periodFinish,uni):");
    console.log(
        "giveth_bal - tokenDistro:",
        `${await giveth_bal.tokenDistro()}\n` + `giveth_bal - duration:`,
        `${await giveth_bal.duration()}\n` + `giveth_bal - periodFinish:`,
        `${await giveth_bal.periodFinish()}\n` + `giveth_bal - uni:`,
        `${await giveth_bal.uni()}\n`,
    );

    console.log("\n######################################################");
    console.log(
        `#######   GIVstaking ETH    Mainnet    ${GIV_MAINNET_AMOUNT.toString()}   #######`,
    );
    console.log("######################################################");
    console.log("deployer:", deployer);
    console.log("tokenDistribution:", tokenDistro.address);
    console.log("uni:", tokenAddress);
    console.log("duration:", LMDuration);

    const unigiv = await upgrades.deployProxy(UnipoolTokenDistributor, [
        tokenDistro.address,
        tokenAddress,
        LMDuration,
    ]);
    await unigiv.deployed();
    console.log("##############################################\n");
    console.log("UNIGIV deployed to:", unigiv.address);
    console.log("\n##############################################\n");

    // We grant permisions to the MerkleDistro and assign tokens
    await (
        await tokenDistro.grantRole(
            tokenDistro.DISTRIBUTOR_ROLE(),
            unigiv.address,
        )
    ).wait();
    console.log(
        "TokenDistro - assign: giveth_uni_reward",
        GIV_MAINNET_AMOUNT.toString(),
    );
    await (
        await tokenDistro.assign(
            unigiv.address,
            ethers.utils.parseEther(GIV_MAINNET_AMOUNT.toString()),
        )
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
        `${await unigiv.periodFinish()}\n` + `unigiv - uni:`,
        `${await unigiv.uni()}\n`,
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
        "tokenDistro.balances(giveth_uni_reward.address)",
        "allocated:",
        ethers.utils.formatEther(
            (
                await tokenDistro.balances(giveth_uni_reward.address)
            ).allocatedTokens.toString(),
        ),
        "claimed:",
        ethers.utils.formatEther(
            (
                await tokenDistro.balances(giveth_uni_reward.address)
            ).claimed.toString(),
        ),
    );
    console.log(
        "tokenDistro.balances(giveth_bal.address)",
        "allocated:",
        ethers.utils.formatEther(
            (
                await tokenDistro.balances(giveth_bal.address)
            ).allocatedTokens.toString(),
        ),
        "claimed:",
        ethers.utils.formatEther(
            (await tokenDistro.balances(giveth_bal.address)).claimed.toString(),
        ),
    );
    console.log(
        "tokenDistro.balances(unigiv.address)",
        "allocated:",
        ethers.utils.formatEther(
            (
                await tokenDistro.balances(unigiv.address)
            ).allocatedTokens.toString(),
        ),
        "claimed:",
        ethers.utils.formatEther(
            (await tokenDistro.balances(unigiv.address)).claimed.toString(),
        ),
    );

    console.log(
        "tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),giveth_uni_reward.address)",
        await tokenDistro.hasRole(
            tokenDistro.DISTRIBUTOR_ROLE(),
            giveth_uni_reward.address,
        ),
    );
    console.log(
        "tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),giveth_bal.address)",
        await tokenDistro.hasRole(
            tokenDistro.DISTRIBUTOR_ROLE(),
            giveth_bal.address,
        ),
    );
    console.log(
        "tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),unigiv.address)",
        await tokenDistro.hasRole(
            tokenDistro.DISTRIBUTOR_ROLE(),
            unigiv.address,
        ),
    );
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
