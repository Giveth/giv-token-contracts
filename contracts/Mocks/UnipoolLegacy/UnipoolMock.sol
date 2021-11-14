// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.6;

import "../../UnipoolLegacy/Unipool.sol";

contract UnipoolMock is Unipool {
    constructor(
        IERC20 _uniToken,
        IERC20 _snxToken,
        uint256 _duration
    ) Unipool(_duration) {
        uni = _uniToken;
        snx = _snxToken;
    }
}
