// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.6;

import "openzeppelin-contracts-upgradable-v4/token/ERC20/IERC20Upgradeable.sol";

import "../../LPToken/LPTokenWrapper.sol";

contract LPTokenWrapperMock is LPTokenWrapper {
    constructor(IERC20Upgradeable token) {
        __LPTokenWrapper_initialize(token);
    }
}
