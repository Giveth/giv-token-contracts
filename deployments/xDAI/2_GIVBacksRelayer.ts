/* eslint-disable no-console */
import { ethers, network, upgrades, run } from "hardhat";
import { GIVBacksRelayer } from "../../typechain-types";

const { getAddress: toAddr } = ethers.utils;

async function main() {
    const [deployer] = await ethers.getSigners();

    const BATCHER_ROLE =
        "0xeccb356c360bf90186ea17a138ef77420582d0f2a31f7c029d6ae4c3a7c2e186";

    const TOKEN_DISTRO_ADDRESS = toAddr(
        "0x6f45aff8c1e50db099dab43292c28240be2b7485",
    );
    const BATCHER_ADDRESS = toAddr(
        "0xaC0984DfD8fd559C832756684E978C58eD26c366",
    );

    const MULTISIG_ADDRESS = toAddr(
        "0x4D9339dd97db55e3B9bCBE65dE39fF9c04d1C2cd",
    );

    console.log("\n### Deploying Relayer contract");
    console.log("Network:", network.name);
    console.log("Deployer:", deployer.address);

    console.log("\nParameters:");
    console.log("TOKEN_DISTRO_ADDRESS:", TOKEN_DISTRO_ADDRESS);
    console.log("BATCHER_ADDRESS:", BATCHER_ADDRESS);
    console.log("MULTISIG_ADDRESS:", MULTISIG_ADDRESS);

    const relayerFactory = await ethers.getContractFactory("GIVBacksRelayer");
    const relayer = (await upgrades.deployProxy(relayerFactory, [
        TOKEN_DISTRO_ADDRESS,
        BATCHER_ADDRESS,
        MULTISIG_ADDRESS,
    ])) as GIVBacksRelayer;

    await relayer.deployed();

    console.log("\nDeployment complete!\n");
    console.log("Deployed GIVBacksRelayer contract at:", relayer.address);
    console.log(
        `Deployment tx hash (${network.name}): ${relayer.deployTransaction.hash}`,
    );

    console.log("\nChecking deployment:\n");

    console.log("TokenDistro contract:", await relayer.tokenDistroContract());
    console.log(
        "Default admin:",
        await relayer.getRoleMember(await relayer.DEFAULT_ADMIN_ROLE(), 0),
    );
    console.log(
        `Batcher ${BATCHER_ADDRESS} has role: ${await relayer.hasRole(
            BATCHER_ROLE,
            BATCHER_ADDRESS,
        )}`,
    );
    console.log("\nDeployed OK");

    console.log("\nTransferring admin rights:");

    const proxyAdminContract = await upgrades.admin.getInstance();
    const proxyAdminOwner = await proxyAdminContract.owner();

    console.log(
        `Current proxy admin at ${proxyAdminContract.address}: ${proxyAdminOwner}`,
    );

    await upgrades.admin.transferProxyAdminOwnership(MULTISIG_ADDRESS);

    const newProxyAdminOwner = await proxyAdminContract.owner();
    console.log(`New proxy admin owner: ${newProxyAdminOwner}`);

    console.log("\nStarting nonce:", (await relayer.nonce()).toNumber());
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
