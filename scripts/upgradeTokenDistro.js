const { ethers, upgrades } = require("hardhat");

const TOKEN_DISTRO_ADDRESS = "0x73f2D115C2cBAa3b5F477A78F7A7CD348D8b70a2";

async function main() {
    const TokenDistro = await ethers.getContractFactory("TokenDistro");
    await upgrades.upgradeProxy(TOKEN_DISTRO_ADDRESS, TokenDistro);
}

main();
