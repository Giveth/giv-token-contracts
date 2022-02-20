// import { utils } from "ethers";
import { IRegenConfig } from "../types";

const config: IRegenConfig = {
    tokenDistro: {
        address: "", // Empty to deploy a new one
        startTime: 1628935200, // Saturday, 14 August 2021 10:00:00
        cliffPeriod: 0,
        duration: 157_680_000, // 5 years * 365 days * 24 hours * 3600 seconds = 157680000
        lmDuration: 1_209_600,
        initialPercentage: 10_00, // two decimals of precision
        tokenAddress: "0x18cE354571ba71bC7b3d633b254954C5A9cfC195", // TestFOX
        totalTokens: "1000000000", // 1 Billion
        cancelable: true,
    },
    unipools: {
        TestFOX_TestHNY: {
            uniTokenAddress: "0xD28C07F802212F04AF41834ec0CC81d2d283124B", // HoneySwap TestFox/TestHNY
            lmDuration: 1_209_600, // 2 weeks * 7 days * 24 hours * 3600 seconds = 1_209_600
            rewardAmount: "100000", // 100K
        },
    },
};
export default config;
