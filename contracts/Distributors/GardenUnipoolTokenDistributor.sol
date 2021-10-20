// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

import "./UnipoolTokenDistributor.sol";
import "./TokenManagerHook.sol";

/**
 * Contract will have the same functionalieis of UnipoolTokenDistributor, except
 * direct Withdraw, Stake and StakeWithPermit functions. These functions are disabled
 * in favor of hooks which will be used by 1Hive Garden
 */

contract GardenUnipoolTokenDistributor is
    UnipoolTokenDistributor,
    TokenManagerHook
{
    /**
     * @dev Overrides TokenManagerHook's `_onTransfer`
     * @notice this function is a complete copy/paste from
     * https://github.com/1Hive/unipool/blob/master/contracts/Unipool.sol
     */
    function _onTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal override returns (bool) {
        if (_from == address(0)) {
            // Token mintings (wrapping tokens)
            super.stake(_amount, _to);
            return true;
        } else if (_to == address(0)) {
            // Token burning (unwrapping tokens)
            super.withdraw(_amount, _from);
            return true;
        } else {
            // Standard transfer
            super.withdraw(_amount, _from);
            super.stake(_amount, _to);
            return true;
        }
    }

    function stakeWithPermit(uint256 amount, bytes calldata permit)
        public
        override
    {
        revert("GardenUnipoolTokenDistributor: disabled");
    }

    function stake(uint256 amount) public override {
        revert("GardenUnipoolTokenDistributor: disabled");
    }

    function withdraw(uint256 amount) public override updateReward(msg.sender) {
        revert("GardenUnipoolTokenDistributor: disabled");
    }
}
