const { ethers, upgrades } = require("hardhat");

const GARDEN_UNIPOOL_ADDRESS = "0xE77D387b4be1076891868060c32E81BC3b89C730";

async function main() {
    const GardenUnipool = await ethers.getContractFactory(
        "GardenUnipoolTokenDistributor",
    );
    const upgradedGardenUnipool = await upgrades.upgradeProxy(
        GARDEN_UNIPOOL_ADDRESS,
        GardenUnipool,
    );
}

main();
