const { ethers, upgrades } = require("hardhat");

const GARDEN_UNIPOOL_ADDRESS = "0xcdB04cb27AA12B31F30789731B94712C72080FF0";

async function main() {
    const GardenUnipool = await ethers.getContractFactory("GardenUnipoolTokenDistributor");
    const upgradedGardenUnipool = await upgrades.upgradeProxy(
        GARDEN_UNIPOOL_ADDRESS,
        GardenUnipool,
    );
    console.log("upgradedGardenUnipool upgraded: ", await upgradedGardenUnipool.implementation());
}

main();
