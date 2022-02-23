export interface IUnipoolContractConfig {
    uniTokenAddress: string;
    lmDuration: number;
    rewardAmount: string;
}
export interface IRegenConfig {
    tokenDistro: {
        address?: string; // Empty to deploy a new one, otherwise the already deployed on will be reused and rest of parameters will be unused
        startTime?: number;
        cliffPeriod?: number;
        duration?: number;
        initialPercentage?: number;
        tokenAddress?: string;
        totalTokens?: string;
        cancelable?: boolean;
    };
    unipools: {
        [key: string]: IUnipoolContractConfig;
    };
}
