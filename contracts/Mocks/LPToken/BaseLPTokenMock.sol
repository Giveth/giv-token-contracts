// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.6;

import "../../LPToken/BaseLPToken.sol";

contract BaseLPTokenMock is BaseLPToken {
    function stake(address account, uint256 amount) public {
        _stake(account, amount);
    }

    function withdraw(address account, uint256 amount) public {
        _withdraw(account, amount);
    }
}
