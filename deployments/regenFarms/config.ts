// import { utils } from "ethers";
import { IRegenConfig } from "../types";

// CULT/ETH
const config: IRegenConfig = {
    // alreadyDeployedTokenDistroAddress:
    //     "0x4358c99abFe7A9983B6c96785b8870b5412C5B4B",
    newTokenDistroParams: {
        startTime: 1640190600, // (GMT): Tuesday, June 14, 2022 15:00:00
        cliffPeriod: 0,
        duration: 157_680_000, // 5 years * 365 days * 24 hours * 3600 seconds = 157680000
        initialPercentage: 10_00, // two decimals of precision
        tokenAddress: "0xc916Ce4025Cb479d9BA9D798A80094a449667F5D", // GIV Optimism-Goerli
        totalTokens: "1000000000", // CULT token total supply 6,666,666,666,666
        cancelable: true,
    },
    unipools: {
        // UNI_ETH_GIV: {
        //     uniTokenAddress: "0xDADe0F0f5759FB1F041217BD9cC680950796339F", // HoneySwap FOX/HNY
        //     lmDuration: 1_209_600, // 2 weeks * 7 days * 24 hours * 3600 seconds = 1_209_600
        //     rewardAmount: "100000", // The value to assign on tokendistro 3,342,894,344.47
        // },
        // UNI_DAI_GIV: {
        //     uniTokenAddress: "0x0551f038a84cb0d42584a8E3eaf5a409D22F4211", // HoneySwap FOX/HNY
        //     lmDuration: 1_209_600, // 2 weeks * 7 days * 24 hours * 3600 seconds = 1_209_600
        //     rewardAmount: "100000", // The value to assign on tokendistro 3,342,894,344.47
        // },
        // BALANCER: {
        //     uniTokenAddress: "0xFaEb6A8B5F15Af77673666E51A44f6B9B6CA5Da2", // HoneySwap FOX/HNY
        //     lmDuration: 1_209_600, // 2 weeks * 7 days * 24 hours * 3600 seconds = 1_209_600
        //     rewardAmount: "100000", // The value to assign on tokendistro 3,342,894,344.47
        // },
    },
};
export default config;
