// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

import "openzeppelin-contracts-v4/token/ERC20/IERC20.sol";

interface ITokenManager {
    function token() external view returns (IERC20);
}