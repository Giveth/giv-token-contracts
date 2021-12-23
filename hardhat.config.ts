import * as dotenv from "dotenv";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const DEFAULT_MNEMONIC =
    "test test test test test test test test test test test test";
// // This is a sample Hardhat task. To learn how to create your own go to
// // https://hardhat.org/guides/create-task.html
// // eslint-disable-next-line no-undef
// task("accounts", "Prints the list of accounts", async () => {
//     // eslint-disable-next-line no-undef
//     const accounts = await ethers.getSigners();

//     // eslint-disable-next-line no-restricted-syntax
//     for (const account of accounts) {
//         console.log(account.address);
//     }
// });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
    solidity: {
        compilers: [
            {
                version: "0.7.6",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999,
                    },
                },
            },
            {
                version: "0.8.6",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999,
                    },
                },
            },
            {
                version: "0.4.24",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999,
                    },
                },
            },
        ],
        overrides: {
            "@uniswap/v3-periphery/contracts/libraries/PoolAddress.sol": {
                version: "0.7.6",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999,
                    },
                },
            },
            "@uniswap/v3-core/contracts/libraries/FullMath.sol": {
                version: "0.7.6",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 999999,
                    },
                },
            },
        },
    },
    networks: {
        ropsten: {
            url: `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            accounts: {
                mnemonic: process.env.MNEMONIC || DEFAULT_MNEMONIC,
                path: "m/44'/60'/0'/0",
                initialIndex: 0,
                count: 20,
            },
        },
        goerli: {
            url: `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            gasPrice: 123000000000,
            accounts: {
                mnemonic: process.env.MNEMONIC || DEFAULT_MNEMONIC,
                path: "m/44'/60'/0'/0",
                initialIndex: 0,
                count: 20,
            },
        },
        rinkeby: {
            url: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            gasPrice: 123000000000,
            accounts: process.env.PRIVATE_KEY
                ? [`${process.env.PRIVATE_KEY}`]
                : [],
        },
        kovan: {
            url: `https://kovan.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            gasPrice: 123000000000,
            accounts: process.env.PRIVATE_KEY
                ? [`${process.env.PRIVATE_KEY}`]
                : [],
        },
        mainnet: {
            url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            gasPrice: 120000000000,
            accounts: process.env.PRIVATE_KEY
                ? [`${process.env.PRIVATE_KEY}`]
                : [],
        },
        xDAI: {
            url: `https://rpc.xdaichain.com/`,
            gasPrice: 2000000000,
            accounts: process.env.PRIVATE_KEY
                ? [`${process.env.PRIVATE_KEY}`]
                : [],
        },
    },
    gasReporter: {
        currency: "USD",
        coinmarketcap: process.env.COINMARKETCAP_KEY,
        enabled: !!process.env.REPORT_GAS,
    },
    etherscan: {
        apiKey: `${process.env.ETHERSCAN_API_KEY}`,
    },
};

export default config;
