export interface IUnipoolContractConfig {
    uniTokenAddress: string; // The LP token address
    // Duration of each reward period which start after calling notify reward on
    // unipool
    lmDuration: number;
    // The amount of tokens will be paid as reward in reward period (i.e. lmDuration)
    rewardAmount: string;
}
export interface IRegenConfig {
    // This field can be used to reuse already deployed tokenDistro and not deploy
    // a new one
    alreadyDeployedTokenDistroAddress?: string;
    newTokenDistroParams?: {
        // Token distro start time (i.e. initial percentage releases at this moment
        // and the stream begins after cliff time
        startTime: number;
        // Time period between token distro start (initial amount release)
        // and stream start
        cliffPeriod: number;
        // Total duration of token distro (cliff period + streaming period)
        // Note: 100% of allocated tokens will be release at startTime+duration
        duration: number;
        // The percentage of tokens release immediately at startTime
        initialPercentage: number;
        // The address of token will be distributed by token distro
        tokenAddress: string;
        // Total number of tokens can be distributed
        totalTokens: string;
        // Whether admins can cancel stream allocated to an account and
        // transfer it to another one
        cancelable: boolean;
    };
    unipools: {
        [key: string]: IUnipoolContractConfig;
    };
}
