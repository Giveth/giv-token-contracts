import { network } from "hardhat";

export default async function setAutomine(status: boolean) {
    await network.provider.send("evm_setAutomine", [status]);
}
