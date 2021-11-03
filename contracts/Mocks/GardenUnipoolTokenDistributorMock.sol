// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

import "../Distributors/GardenUnipoolTokenDistributor.sol";

contract GardenUnipoolTokenDistributorMock is GardenUnipoolTokenDistributor {
    uint256 public currentTimestamp;

    constructor(
        IDistro _tokenDistribution,
        IERC20Upgradeable _uni,
        uint256 _duration
    ) {
        initialize(_tokenDistribution, _uni, _duration);
    }

    function setTimestamp(uint256 timestamp) public {
        currentTimestamp = timestamp;
    }

    function getTimestamp() public view override returns (uint256) {
        return currentTimestamp == 0 ? super.getTimestamp() : currentTimestamp;
    }

    function _stake(address user, uint256 amount) external {
        stake(user, amount);
    }

    function _withdraw(address user, uint256 amount) external {
        withdraw(user, amount);
    }
}
