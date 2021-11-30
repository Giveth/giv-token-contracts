// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.6;

import "openzeppelin-contracts-upgradable-v4/proxy/utils/Initializable.sol";

import "./BaseLPToken.sol";

/// @title TokenManagerLPToken
/// @author Giveth developers
/// @notice This is a Unipool LP token wrapper to be used in conjuction with TokenManager
/// @dev There is no underlying token implementation, no transfers nor balance checks
contract TokenManagerLPToken is Initializable, BaseLPToken {
    function __GardenLPToken_initializer() internal initializer {}

    /// @dev Stake method used by the GardenTokenDistributor
    /// Controlled by the TokenManager
    /// @param account Address to stake tokens
    /// @param amount Amount of tokens to stake
    function stake(address account, uint256 amount) internal virtual {
        _stake(account, amount);
    }

    /// @dev Withdraw method used by the GardenTokenDistributor
    /// Controlled by the TokenManager
    /// @param account Address to stake tokens
    /// @param amount Amount of tokens to stake
    function withdraw(address account, uint256 amount) internal virtual {
        _withdraw(account, amount);
    }
}
