import { BigNumber } from "@ethersproject/bignumber";
import { Contract, ContractFactory } from "@ethersproject/contracts";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { beforeEach, describe, it } from "mocha";
import { duration } from "../utils/time";

const { deployProxy, upgradeProxy } = upgrades;
const { parseEther: toWei, formatBytes32String: toBytes32 } = ethers.utils;
const { days, years } = duration;

const upgradeText = "OK";
const testAddress = "0x000000000000000000000000000000000000dEaD";
const testVal = toBytes32("0xdead");

// Values for TokenDistro state after initialization:
const totalAmount = toWei("200000");
const initialPercentage = 500;
const initialAmount = totalAmount.mul(initialPercentage).div(10000);
const lockedAmount = totalAmount.sub(initialAmount);

const contractsToTest = [
    {
        name: "TokenDistro",
        initParams: [
            toWei("200000"), // totalAmount
            BigNumber.from(0), // startTime
            days(180), // startToCliff
            years(5), // duration
            initialPercentage,
            testAddress, // token
            false, // cancellable
        ],
        upgradeCheckParams: [
            toWei("200000"), // totalAmount
            BigNumber.from(0), // startTime
            days(180), // startToCliff
            years(5), // duration
            initialAmount,
            lockedAmount,
            testAddress, // token
            false, // cancellable
        ],
    },
    {
        name: "MerkleDistro",
        initParams: [
            testAddress, // tokenDistro
            testVal, // merkleRoot
        ],
        upgradeCheckParams: [
            testAddress, // tokenDistro
            testVal, // merkleRoot
        ],
    },
    {
        name: "UniswapV3RewardToken",
        initParams: [
            testAddress, // tokenDistro
            testAddress, // uniswapV3Staker
        ],
        upgradeCheckParams: [
            "Giveth Uniswap V3 Reward Token", // name
            "GUR", // symbol
            18, // decimals
            testAddress, // tokenDistro
            testAddress, // uniswapV3Staker
            BigNumber.from("0"), // totalSupply
        ],
    },
    {
        name: "GardenUnipoolTokenDistributor",
        initParams: [
            testAddress, // tokenDistro
            years(5), // startToEnd
            testAddress, // tokenManager
        ],
        upgradeCheckParams: [
            BigNumber.from(0), // totalSupply
            testAddress, // tokenDistro
            years(5), // startToEnd
            testAddress, // rewardDistribution
            BigNumber.from(0), // periodFinish
            BigNumber.from(0), // rewardRate
            BigNumber.from(0), // lastUpdateTime,
            BigNumber.from(0), // rewardPerTokenStored,
        ],
        beforeUpgrade: async (contractInstance: Contract) => {
            await contractInstance.setRewardDistribution(testAddress);
        },
    },
];

describe("Proxy upgradeability tests", () => {
    contractsToTest.map((contract) => {
        const { name, initParams, upgradeCheckParams, beforeUpgrade } =
            contract;
        return describe(name, () => {
            let instance: Contract;
            let factory: ContractFactory;
            let factoryV2: ContractFactory;

            beforeEach(async () => {
                factory = await ethers.getContractFactory(name);
                factoryV2 = await ethers.getContractFactory(`${name}V2`);
            });

            it("should be deployable", async () => {
                instance = await deployProxy(factory, initParams);
            });

            it("should be upgradeable", async () => {
                instance = instance || (await deployProxy(factory, initParams));

                if (beforeUpgrade) {
                    await beforeUpgrade(instance);
                }

                const upgradedInstance = await upgradeProxy(
                    instance.address,
                    factoryV2,
                );

                expect(upgradedInstance.address).to.be.eq(instance.address);

                expect(upgradedInstance.checkUpgrade).to.not.eq(undefined);
                const upgradeResult = await upgradedInstance.checkUpgrade();

                if (typeof upgradeResult === "string") {
                    expect(upgradeResult).to.be.eq(upgradeText);
                } else {
                    expect(upgradeResult[0]).to.be.eq(upgradeText);

                    if (
                        upgradeCheckParams &&
                        Array.isArray(upgradeCheckParams)
                    ) {
                        for (let i = 0; i < upgradeCheckParams.length; i++) {
                            const expected = upgradeCheckParams[i];
                            const actual = upgradeResult[i + 1];
                            expect(expected).to.eq(actual);
                        }
                    }
                }
            });
        });
    });
});
