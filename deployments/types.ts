export interface IUnipoolContractConfig {
    uniTokenAddress: string;
    lmDuration: number;
    rewardAmount: string;
}
export interface IRegenConfig {
    tokenDistro: {
        address?: string; // Empty to deploy a new one
        startTime?: number;
        cliffPeriod?: number;
        duration?: number;
        lmDuration?: number;
        initialPercentage?: number;
        tokenAddress?: string;
        totalTokens?: string;
        cancelable?: boolean;
    };
    unipools: {
        [key: string]: IUnipoolContractConfig;
    };
}
