// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.6;

import "openzeppelin-contracts-v4/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract UniMock is ERC20PresetMinterPauser("Uniswap mock token", "UNI") {}
