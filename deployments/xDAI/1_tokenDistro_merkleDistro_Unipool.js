/* eslint-disable no-useless-concat */
const hre = require("hardhat");
const { ethers } = hre;
const { upgrades } = hre;
const fs = require("fs");
const { BigNumber } = require("ethers");

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
    const cancelable = true;
    const LMDuration = 1_209_600; //  (TEST: 2 weeks = 24 hours => 86_400) final -> 2 weeks * 7 days * 24 hours * 3600 seconds = 1_209_600
    // eslint-disable-next-line camelcase
    const merkletree_file = "./files/merkle_distributor_xdai_result.json";
    const data = JSON.parse(fs.readFileSync(merkletree_file));
    const merkleTokens = ethers.utils.formatEther(
        BigNumber.from(data.tokenTotal).toString(),
    );
    const GIVHNY_XDAI = ethers.utils.getAddress(args[3]); // GIVHNY_XDAI pool address
    const GIVHNY_XDAI_AMOUNT = args[4]; // GIVHNY_XDAI reward amount
    const GIVWETH_XDAI = ethers.utils.getAddress(args[5]); // GIVWETH_XDAI pool address
    const GIVWETH_XDAI_AMOUNT = args[6]; // GIVWETH_XDAI reward amount
    const GARDEN_TOKEN_MANAGER_APP = ethers.utils.getAddress(args[7]); // Garden Token Manager App
    const UNIGIV_AMOUNT = args[8]; // GIV pool reward
    // const RGIV_AMOUNT = args[8]; // rGIV
    // const totalTokens = ethers.utils
    //     .parseEther(merkleTokens)
    //     .add(ethers.utils.parseEther(GIVHNY_XDAI_AMOUNT))
    //     .add(ethers.utils.parseEther(GIVWETH_XDAI_AMOUNT))
    //     .add(ethers.utils.parseEther(UNIGIV_AMOUNT))
    //     .add(ethers.utils.parseEther(RGIV_AMOUNT));

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
    console.log("merkletree_file:", merkletree_file);
    console.log("merkleTokens:", merkleTokens);

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

    console.log("\n########################");
    console.log("##### MerkleDistro #####");
    console.log("########################\n");
    console.log("deployer:", deployer);
    console.log("distroAddress:", tokenDistro.address);
    console.log("merkletree_file:", merkletree_file);

    const MerkleDistro = await ethers.getContractFactory("MerkleDistro");
    const merkleDistro = await upgrades.deployProxy(MerkleDistro, [
        tokenDistro.address,
        data.merkleRoot,
    ]);
    await merkleDistro.deployed();
    console.log("#######################\n");
    console.log("MerkleDistro deployed to:", merkleDistro.address);
    console.log("\n#######################\n");

    // We grant permisions to the MerkleDistro and assign tokens
    await (
        await tokenDistro.grantRole(
            tokenDistro.DISTRIBUTOR_ROLE(),
            merkleDistro.address,
        )
    ).wait();
    console.log(
        "TokenDistro - assign: MerkleDistro",
        ethers.utils.parseEther(merkleTokens.toString()).toString(),
    );
    await (
        await tokenDistro.assign(
            merkleDistro.address,
            ethers.utils.parseEther(merkleTokens.toString()),
        )
    ).wait();

    console.log("\n#######################");
    console.log("#####    Check    #####");
    console.log("#######################");
    console.log(
        "MerkleDistro - _tokenDistro:",
        `${await merkleDistro.tokenDistro()}\n` + `MerkleDistro - _merkleRoot:`,
        `${await merkleDistro.merkleRoot()}\n`,
    );

    console.log("\n######################################################");
    console.log(
        `####### 50GIV/HNY - honeyswap - xDai ${GIVHNY_XDAI_AMOUNT.toString()} #######`,
    );
    console.log("######################################################");
    console.log("deployer:", deployer);
    console.log("tokenDistribution:", tokenDistro.address);
    console.log("uni:", GIVHNY_XDAI);
    console.log("duration:", LMDuration);

    const UnipoolTokenDistributor = await ethers.getContractFactory(
        "UnipoolTokenDistributor",
    );
    const GardenUnipoolTokenDistributor = await ethers.getContractFactory(
        "GardenUnipoolTokenDistributor",
    );
    // eslint-disable-next-line camelcase
    const givhny_xdai = await upgrades.deployProxy(UnipoolTokenDistributor, [
        tokenDistro.address,
        GIVHNY_XDAI,
        LMDuration,
    ]);
    await givhny_xdai.deployed();
    console.log("##############################################\n");
    console.log("GIVHNY_XDAI deployed to:", givhny_xdai.address);
    console.log("\n##############################################\n");

    // We grant permissions to the MerkleDistro and assign tokens
    await (
        await tokenDistro.grantRole(
            tokenDistro.DISTRIBUTOR_ROLE(),
            givhny_xdai.address,
        )
    ).wait();
    console.log(
        "TokenDistro - assign: givhny_xdai",
        GIVHNY_XDAI_AMOUNT.toString(),
    );
    await (
        await tokenDistro.assign(
            givhny_xdai.address,
            ethers.utils.parseEther(GIVHNY_XDAI_AMOUNT.toString()),
        )
    ).wait();

    // Set reward distributor
    await (await givhny_xdai.setRewardDistribution(deployer)).wait();

    console.log("\n#######################");
    console.log("#####    Check    #####");
    console.log("#######################");
    console.log("givhny_xdai(tokenDistro,duration,periodFinish,uni):");
    console.log(
        "givhny_xdai - tokenDistro:",
        `${await givhny_xdai.tokenDistro()}\n` + `givhny_xdai - duration:`,
        `${await givhny_xdai.duration()}\n` + `givhny_xdai - periodFinish:`,
        `${await givhny_xdai.periodFinish()}\n` + `givhny_xdai - uni:`,
        `${await givhny_xdai.uni()}\n`,
    );

    console.log("\n######################################################");
    console.log(
        `####### 50GIV/WETH - honeyswap - xDai ${GIVWETH_XDAI_AMOUNT.toString()}  #######`,
    );
    console.log("######################################################");
    console.log("deployer:", deployer);
    console.log("tokenDistribution:", tokenDistro.address);
    console.log("uni:", GIVWETH_XDAI);
    console.log("duration:", LMDuration);

    // eslint-disable-next-line camelcase
    const givweth_xdai = await upgrades.deployProxy(UnipoolTokenDistributor, [
        tokenDistro.address,
        GIVWETH_XDAI,
        LMDuration,
    ]);
    await givweth_xdai.deployed();
    console.log("##############################################\n");
    console.log("GIVHNY_XDAI deployed to:", givweth_xdai.address);
    console.log("\n##############################################\n");

    // We grant permisions to the MerkleDistro and assign tokens
    await (
        await tokenDistro.grantRole(
            tokenDistro.DISTRIBUTOR_ROLE(),
            givweth_xdai.address,
        )
    ).wait();
    console.log(
        "TokenDistro - assign: givhny_xdai",
        GIVWETH_XDAI_AMOUNT.toString(),
    );
    await (
        await tokenDistro.assign(
            givweth_xdai.address,
            ethers.utils.parseEther(GIVWETH_XDAI_AMOUNT.toString()),
        )
    ).wait();

    // Set reward distributor
    await (await givweth_xdai.setRewardDistribution(deployer)).wait();

    console.log("\n#######################");
    console.log("#####    Check    #####");
    console.log("#######################");
    console.log("givweth_xdai(tokenDistro,duration,periodFinish,uni):");
    console.log(
        "givweth_xdai - tokenDistro:",
        `${await givweth_xdai.tokenDistro()}\n` + `givweth_xdai - duration:`,
        `${await givweth_xdai.duration()}\n` + `givweth_xdai - periodFinish:`,
        `${await givweth_xdai.periodFinish()}\n` + `givweth_xdai - uni:`,
        `${await givweth_xdai.uni()}\n`,
    );

    console.log("\n######################################################");
    console.log(
        `#######     GIVstaking xDai - xDai - ${UNIGIV_AMOUNT.toString()}   #######`,
    );
    console.log("######################################################");
    console.log("deployer:", deployer);
    console.log("tokenDistribution:", tokenDistro.address);
    console.log("uni:", tokenAddress);
    console.log("duration:", LMDuration);

    const unigiv = await upgrades.deployProxy(GardenUnipoolTokenDistributor, [
        tokenDistro.address,
        LMDuration,
        GARDEN_TOKEN_MANAGER_APP,
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
    console.log("TokenDistro - assign: givhny_xdai", UNIGIV_AMOUNT.toString());
    await (
        await tokenDistro.assign(
            unigiv.address,
            ethers.utils.parseEther(UNIGIV_AMOUNT.toString()),
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
        `${await unigiv.periodFinish()}\n`,
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
        "tokenDistro.balances(merkleDistro.address)",
        "allocated:",
        ethers.utils.formatEther(
            (
                await tokenDistro.balances(merkleDistro.address)
            ).allocatedTokens.toString(),
        ),
        "claimed:",
        ethers.utils.formatEther(
            (
                await tokenDistro.balances(merkleDistro.address)
            ).claimed.toString(),
        ),
    );
    console.log(
        "tokenDistro.balances(givhny_xdai.address)",
        "allocated:",
        ethers.utils.formatEther(
            (
                await tokenDistro.balances(givhny_xdai.address)
            ).allocatedTokens.toString(),
        ),
        "claimed:",
        ethers.utils.formatEther(
            (
                await tokenDistro.balances(givhny_xdai.address)
            ).claimed.toString(),
        ),
    );
    console.log(
        "tokenDistro.balances(givweth_xdai.address)",
        "allocated:",
        ethers.utils.formatEther(
            (
                await tokenDistro.balances(givweth_xdai.address)
            ).allocatedTokens.toString(),
        ),
        "claimed:",
        ethers.utils.formatEther(
            (
                await tokenDistro.balances(givweth_xdai.address)
            ).claimed.toString(),
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
        "tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),merkleDistro.address)",
        await tokenDistro.hasRole(
            tokenDistro.DISTRIBUTOR_ROLE(),
            merkleDistro.address,
        ),
    );
    console.log(
        "tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),givhny_xdai.address)",
        await tokenDistro.hasRole(
            tokenDistro.DISTRIBUTOR_ROLE(),
            givhny_xdai.address,
        ),
    );
    console.log(
        "tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),givweth_xdai.address)",
        await tokenDistro.hasRole(
            tokenDistro.DISTRIBUTOR_ROLE(),
            givweth_xdai.address,
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
