import { utils } from "ethers";

export default {
    tokenDistro: {
        startTime: 1628935200, // Saturday, 14 August 2021 10:00:00
        cliffPeriod: 0,
        duration: 11_262_857, // 5 years * 365 days * 24 hours * 3600 seconds = 157680000
        lmDuration: 1_209_600,
        initialPercentage: 10_00, // two decimals of precision
        tokenAddress: "0x6F45aFf8c1e50DB099DAb43292C28240be2b7485",
        totalTokens: "920000000",
        cancelable: true,
    },
    merkleTree: {
        filePath: "./files/merkle_distributor_xdai_result.json",
    },
    GIV: {
        GIVHNY_XDAI_poolAddress: "0x0", // GIVHNY_XDAI pool address
        GIVHNY_XDAI_AMOUNT: 0, // GIVHNY_XDAI reward amount
        GIVWETH_XDAI: 0, // GIVWETH_XDAI reward amount
    },
    gardernTokenManagerAddress: "0x0",
    UNIGVamount: 0, // GIV pool reward
};
