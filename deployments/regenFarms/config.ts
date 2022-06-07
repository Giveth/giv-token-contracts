// import { utils } from "ethers";
import { IRegenConfig } from "../types";

// CULT/ETH
const config: IRegenConfig = {
    alreadyDeployedTokenDistroAddress: "",
    newTokenDistroParams: {
        startTime: 1655218800, // (GMT): Tuesday, June 14, 2022 15:00:00
        cliffPeriod: 0,
        duration: 157_680_000, // 5 years * 365 days * 24 hours * 3600 seconds = 157680000
        initialPercentage: 10_00, // two decimals of precision
        tokenAddress: "0xf0f9D895aCa5c8678f706FB8216fa22957685A13", // FOX
        totalTokens: "6666666666666", // CULT token total supply 6,666,666,666,666
        cancelable: true,
    },
    unipools: {
        CULT_ETH: {
            uniTokenAddress: "0x5281E311734869C64ca60eF047fd87759397EFe6", // HoneySwap FOX/HNY
            lmDuration: 1_209_600, // 2 weeks * 7 days * 24 hours * 3600 seconds = 1_209_600
            rewardAmount: "3342894344.47", // The value to assign on tokendistro 3,342,894,344.47
        },
    },
};
export default config;
