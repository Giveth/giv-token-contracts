// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

import "../Distributors/UnipoolTokenDistributor.sol";

contract UnipoolTokenDistributorMock is UnipoolTokenDistributor {
    uint256 public currentTimestamp;

    constructor(
        IDistro _tokenDistribution,
        IERC20Upgradeable _uni,
        uint256 _duration
    ) {
        initialize(_tokenDistribution, _uni, _duration);
    }
}
