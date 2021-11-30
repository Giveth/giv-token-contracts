// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.6;

/// @title BaseLPToken
/// @author Giveth developers
/// @notice This is the base LP token used by Unipool implementations
/// @dev Concrete LP token implementations should expose appropriate `stake` and `withdraw` methods
abstract contract BaseLPToken {
    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    /// @dev Returns the total supply of the Unipool LP token
    /// @return The total supply of tokens
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    /// @dev Returns the Unipool LP token balance of a given account
    /// @return The account balance
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    /// @dev Implementations should override this function and use it to implement `stake` functionality
    function _stake(address account, uint256 amount) internal virtual {
        _totalSupply += amount;
        _balances[account] += amount;
    }

    /// @dev Implementations should override this function and use it to implement `withdraw` functionality`
    function _withdraw(address account, uint256 amount) internal virtual {
        _totalSupply -= amount;
        _balances[account] -= amount;
    }
}
