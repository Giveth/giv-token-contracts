// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "../TokenDistro/TokenDistro.sol";

contract TokenDistroMock is TokenDistro {
    uint256 public currentTimestamp;

    constructor(
        uint256 _totalVestedTokens,
        uint256 _startTime,
        uint256 _cliffPeriod,
        uint256 _duration,
        uint256 _initialPercentage,
        IERC20Upgradeable _token
    ) {
        initialize(
            _totalVestedTokens,
            _startTime,
            _cliffPeriod,
            _duration,
            _initialPercentage,
            _token
        );
    }

    function setTimestamp(uint256 timestamp) public {
        currentTimestamp = timestamp;
    }

    function getTimestamp() public view override returns (uint256) {
        return currentTimestamp == 0 ? super.getTimestamp() : currentTimestamp;
    }
}
