// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.6;

import "openzeppelin-contracts-upgradable-v4/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "openzeppelin-contracts-upgradable-v4/proxy/utils/Initializable.sol";
import "openzeppelin-contracts-upgradable-v4/utils/ContextUpgradeable.sol";

import "./BaseLPToken.sol";

contract LPTokenWrapper is Initializable, ContextUpgradeable, BaseLPToken {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /// @dev This is the underlying reward token used for staking
    IERC20Upgradeable internal token;

    function __LPTokenWrapper_initialize(IERC20Upgradeable _token)
        internal
        initializer
    {
        token = _token;
    }

    /// @dev Stake the given amount of tokens from the sender, increasing balance and supply
    /// The sender should have required allowance to transfer
    /// @param amount The amount to stake
    function stake(uint256 amount) public virtual {
        _stake(_msgSender(), amount);
        token.safeTransferFrom(msg.sender, address(this), amount);
    }

    /// @dev Withdraw the given amount of tokens staked by the sender, decreaseing balance and supply
    /// @param amount Amount tokens to withdraw
    function withdraw(uint256 amount) public virtual {
        _withdraw(_msgSender(), amount);
        token.safeTransfer(msg.sender, amount);
    }
}
