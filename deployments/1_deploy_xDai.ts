import { ethers, upgrades } from "hardhat";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { prompt } from "enquirer";

import config from "./config";
import { readFileSync } from "fs";
import { BigNumber } from "@ethersproject/bignumber";
// const { parseEther, commify } = ethers.utils;

const { error, log } = console;

async function mustConfirm(promptMessage?: string) {
    type ResponseType = {
        ok: string;
    };

    const message = promptMessage || "is this correct";
    const response = (await prompt({
        type: "confirm",
        name: "ok",
        message,
    })) as ResponseType;

    if (!response.ok) {
        throw Error("Aborted");
    }
}

const argv = yargs(hideBin(process.argv))
    .option("force-confirm", {
        alias: "f",
        type: "boolean",
        description: "Confirm everything, yolo mode (dangerous!)",
        default: false,
    })
    .parse();

async function executeDeployments() {
    // Set up accounts:
    const signers = await ethers.getSigners();
    const deployer = signers[0];

    // Read the data from the merkle tree file:
    const merkleData = JSON.parse(
        readFileSync(config.merkleTree.filePath).toString(),
    );
    const merkleTotalTokens = BigNumber.from(merkleData.tokenTotal).toString();

    log("\n#######################");
    log("##### Deployments #####");
    log("#######################");

    log("deploying from: ", deployer.address);

    log("\n################");
    log("##### Params #####");
    log("##################");

    log("total tokens:", config.tokenDistro.totalTokens);
    log("start time:", config.tokenDistro.startTime);
    log("total duration: ", config.tokenDistro.duration);
    log("liquidity minig duration: ", config.tokenDistro.lmDuration);
    log("cancellable", config.tokenDistro.cancelable);

    await mustConfirm("Are general distirbution parameters correct?");

    log("merkle tree file path:", config.merkleTree.filePath);
    log("merkle tree tokens: ", merkleTotalTokens);

    await mustConfirm("Are merkle distribution parameters correct?");

    log("start time:", config.tokenDistro.startTime);
    log("cliff period", config.tokenDistro.cliffPeriod);
    log("duration", config.tokenDistro.duration);
    log("initial percentage", config.tokenDistro.tokenAddress);
    log("cancellable", config.tokenDistro.cancelable);

    await mustConfirm("Are `TokenDistro` init parameters correct?");

    /// //////////////////////////
    // TOKEN DISTRO DEPLOYMENT: //
    /// //////////////////////////

    await mustConfirm(
        "Are you sure you want to deploy the `TokenDistro` contract?",
    );

    const TokenDistro = await ethers.getContractFactory("TokenDistro");
    const tokenDistro = await upgrades.deployProxy(TokenDistro, [
        config.tokenDistro.totalTokens,
        config.tokenDistro.startTime,
        config.tokenDistro.cliffPeriod,
        config.tokenDistro.duration,
        config.tokenDistro.initialPercentage,
        config.tokenDistro.tokenAddress,
        config.tokenDistro.cancelable,
    ]);

    log("\n\n Deployment in progress, please wait...\n\n");

    await tokenDistro.deployed();

    log("########################");
    log("SUCCESS!");
    log("deploy tx: ", tokenDistro.deployTransaction.hash);
    log("contract address: ", tokenDistro.address);
    log("########################");

    log(
        "\n\nToken distro:\n===============\n",
        "totalTokens:",
        `${ethers.utils.formatEther(await tokenDistro.totalTokens())}\n`,
        `startTime:`,
        `${await tokenDistro.startTime()}\n`,
        `cliffPeriod:`,
        `${await tokenDistro.cliffTime()}\n`,
        `duration:`,
        `${await tokenDistro.duration()}\n`,
        `initialAmount:`,
        `${await tokenDistro.initialAmount()}\n`,
        `token:`,
        `${await tokenDistro.token()}\n`,
        `cancelable:`,
        await tokenDistro.cancelable(),
    );

    log(
        "\n\nThis MUST be funded with: ",
        ethers.utils.formatEther(await tokenDistro.totalTokens()),
        "tokens",
    );
    log(
        `token.mint("${
            tokenDistro.address
        }","${await tokenDistro.totalTokens()}")`,
    );
}

async function main() {
    try {
        await executeDeployments();
    } catch (e) {
        error(e);
        process.exit(1);
    }
}

main();
