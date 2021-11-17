import { Block } from "@ethersproject/abstract-provider";
import { ethers, network } from "hardhat";

export async function advanceBlock() {
    await network.provider.send("evm_mine");
}

export default async function latestBlock(): Promise<Block> {
    return ethers.provider.getBlock("latest");
}
