const hre = require("hardhat");
const { upgrades } = hre;

const args = process.argv.slice(2);
const contractAddress = args[0];
async function main() {
    console.log(
        await upgrades.erc1967.getImplementationAddress(contractAddress),
        " getImplementationAddress",
    );
    console.log(
        await upgrades.erc1967.getAdminAddress(contractAddress),
        " getProxyAdmin",
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
