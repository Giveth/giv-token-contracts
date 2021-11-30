// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

import "../Distributors/UnipoolTokenDistributor.sol";

contract UnipoolTokenDistributorMock is UnipoolTokenDistributor {
    uint256 public currentTimestamp = 0;

    constructor(
        IDistro _tokenDistribution,
        IERC20Upgradeable _uni,
        uint256 _duration
    ) {
        initialize(_tokenDistribution, _uni, _duration);
    }

    function setFixedBlockTimestamp(uint256 timestamp) external {
        currentTimestamp = timestamp;
    }

    function _getBlockTimestamp() internal view override returns (uint256) {
        if (currentTimestamp == 0) {
            return block.timestamp;
        }
        return currentTimestamp;
    }
}
