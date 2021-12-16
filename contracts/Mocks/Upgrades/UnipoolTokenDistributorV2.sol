// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.6;

import "../../Distributors/UnipoolTokenDistributor.sol";

contract UnipoolTokenDistributorV2 is UnipoolTokenDistributor {
    function checkUpgrade()
        public
        view
        returns (
            string memory,
            IERC20Upgradeable, // uni
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
            uni,
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
