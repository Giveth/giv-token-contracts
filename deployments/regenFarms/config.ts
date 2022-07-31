// import { utils } from "ethers";
import { IRegenConfig } from "../types";

// CULT/ETH
const config: IRegenConfig = {
    alreadyDeployedTokenDistroAddress:
        "0x2C84Ab41b53C52959a794830fe296Fd717c33337",
    // newTokenDistroParams: {
    //     startTime: 1655218800, // (GMT): Tuesday, June 14, 2022 15:00:00
    //     cliffPeriod: 0,
    //     duration: 157_680_000, // 5 years * 365 days * 24 hours * 3600 seconds = 157680000
    //     initialPercentage: 10_00, // two decimals of precision
    //     tokenAddress: "0xf0f9D895aCa5c8678f706FB8216fa22957685A13", // FOX
    //     totalTokens: "6666666666666", // CULT token total supply 6,666,666,666,666
    //     cancelable: true,
    // },
    unipools: {
        ANGEL_VAULT: {
            uniTokenAddress: "0xA0D500fd3479CBCb64a2238082b7a1Df9f87d98D", // HoneySwap FOX/HNY
            lmDuration: 1_209_600, // 2 weeks * 7 days * 24 hours * 3600 seconds = 1_209_600
            rewardAmount: "6000000", // The value to assign on tokendistro 3,342,894,344.47
        },
    },
};
export default config;
