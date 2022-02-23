// import { utils } from "ethers";
import { IRegenConfig } from "../types";

const config: IRegenConfig = {
    tokenDistro: {
        address: "", // Empty to deploy a new one, otherwise the already deployed on will be reused and rest of parameters will be unused
        startTime: 1645351200, // Sunday, 20 February 2022 10:00:00
        cliffPeriod: 0,
        duration: 157_680_000, // 5 years * 365 days * 24 hours * 3600 seconds = 157680000
        initialPercentage: 10_00, // two decimals of precision
        tokenAddress: "0x18cE354571ba71bC7b3d633b254954C5A9cfC195", // TestFOX
        totalTokens: "1000000000", // 1 Billion
        cancelable: true,
    },
    unipools: {
        TestFOX_TestHNY: {
            uniTokenAddress: "0xD28C07F802212F04AF41834ec0CC81d2d283124B", // HoneySwap TestFox/TestHNY
            lmDuration: 1_209_600, // 2 weeks * 7 days * 24 hours * 3600 seconds = 1_209_600
            rewardAmount: "100000", // The value to assign on tokendistro
        },
    },
};
export default config;
