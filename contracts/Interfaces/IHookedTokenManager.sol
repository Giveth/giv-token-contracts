// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

// Allows anyone to claim a token if they exist in a merkle root.
interface IHookedTokenManager {
    /**
     * @notice Create a new Token Manager hook for `_hook`
     * @param _hook Contract that will be used as Token Manager hook
     */
    function registerHook(address _hook) external returns (uint256);
}
