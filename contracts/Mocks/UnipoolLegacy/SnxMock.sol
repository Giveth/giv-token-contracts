// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.6;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract SnxMock is ERC20PresetMinterPauser("Synthetix mock token", "SNX") {}
