// import { utils } from "ethers";
import { IRegenConfig } from "../types";

const config: IRegenConfig = {
    alreadyDeployedTokenDistroAddress: "",
    newTokenDistroParams: {
        startTime: 1649001600, // Sunday, 03 April 2022 16:00:00 GMT
        cliffPeriod: 0,
        duration: 149_040_000, // 5 years * 365 days * 24 hours * 3600 seconds = 157680000
        initialPercentage: 10_00, // two decimals of precision
        tokenAddress: "0x21a42669643f45bc0e086b8fc2ed70c23d67509d", // FOX
        totalTokens: "1000001337", // 1 Billion
        cancelable: true,
    },
    unipools: {
        FOX_HNY: {
            uniTokenAddress: "0x8a0bee989c591142414ad67fb604539d917889df", // HoneySwap FOX/HNY
            lmDuration: 1_209_600, // 2 weeks * 7 days * 24 hours * 3600 seconds = 1_209_600
            rewardAmount: "327387.1731240768", // The value to assign on tokendistro
        },
    },
};
export default config;
