// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.6;

import "../../Distributors/GardenUnipoolTokenDistributor.sol";

contract GardenUnipoolTokenDistributorV2 is GardenUnipoolTokenDistributor {
    function checkUpgrade()
        public
        view
        returns (
            string memory,
            uint256, // totalSupply
            IDistro, // tokenDistro
            uint256, // duration
            address, // rewardDistribution
            uint256, // periodFinish
            uint256, // rewardRate
            uint256, // lastUpdateTime
            uint256 // rewardPerTokenStored
        )
    {
        return (
            "OK",
            totalSupply(),
            tokenDistro,
            duration,
            rewardDistribution,
            periodFinish,
            rewardRate,
            lastUpdateTime,
            rewardPerTokenStored
        );
    }
}
