const { ethers, upgrades } = require("hardhat");

const TOKEN_DISTRO_ADDRESS = "0xf11aC05c97F8845f6b974e9e327129d36683cC90";

async function main() {
    const GardenUnipool = await ethers.getContractFactory("TokenDistro");
    await upgrades.upgradeProxy(TOKEN_DISTRO_ADDRESS, GardenUnipool);
}

main();
