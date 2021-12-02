import { Block } from "@ethersproject/abstract-provider";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { ethers, network } from "hardhat";

export async function setAutomine(status: boolean) {
    await ethers.provider.send("evm_setAutomine", [status]);
}

export async function advanceBlock() {
    await network.provider.send("evm_mine");
}

export async function setNextBlockTimestamp(timestamp: BigNumberish) {
    const newTimestamp = BigNumber.from(timestamp).toNumber();
    const { timestamp: latestTimestamp } = await latestBlock();
    if (newTimestamp > latestTimestamp) {
        await ethers.provider.send("evm_setNextBlockTimestamp", [newTimestamp]);
    }
}

export async function latestBlock(): Promise<Block> {
    return ethers.provider.getBlock("latest");
}
