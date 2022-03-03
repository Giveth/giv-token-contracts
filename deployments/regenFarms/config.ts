// import { utils } from "ethers";
import { IRegenConfig } from "../types";

const config: IRegenConfig = {
    alreadyDeployedTokenDistroAddress: "",
    newTokenDistroParams: {
        startTime: 1648857600, // Sunday, 20 February 2022 10:00:00
        cliffPeriod: 0,
        duration: 157_680_000, // 5 years * 365 days * 24 hours * 3600 seconds = 157680000
        initialPercentage: 10_00, // two decimals of precision
        tokenAddress: "0x6c16216484069C19530a57762AD6630fB678D00E", // TestFOX
        totalTokens: "1000000000", // 1 Billion
        cancelable: true,
    },
    unipools: {
        TestFOX_TestHNY: {
            uniTokenAddress: "0x6a5689435Fb27f235f4cfe05ADDabf8fF173f0Ea", // HoneySwap DRGIV3/TestELK
            lmDuration: 1_209_600, // 2 weeks * 7 days * 24 hours * 3600 seconds = 1_209_600
            rewardAmount: "100000", // The value to assign on tokendistro
        },
    },
};
export default config;
