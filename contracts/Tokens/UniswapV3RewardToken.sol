// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "../Interfaces/IDistro.sol";

contract UniswapV3RewardToken is IERC20, OwnableUpgradeable {
    uint256 public initialBalance;

    string public constant name = "Giveth Uniswap V3 Reward Token";
    string public constant symbol = "GUR";
    uint8 public constant decimals = 18;

    IDistro public tokenDistro;
    address public uniswapV3Staker;
    uint256 public override totalSupply;

    event RewardPaid(address indexed user, uint256 reward);

    function initialize(IDistro _tokenDistribution, address _uniswapV3Staker)
        public
        initializer
    {
        __Ownable_init();
        tokenDistro = _tokenDistribution;
        uniswapV3Staker = _uniswapV3Staker;
    }

    function balanceOf(address account) public view override returns (uint256) {
        if (account == uniswapV3Staker) return totalSupply;
        return 0;
    }

    function approve(address spender, uint256 value)
        external
        override
        returns (bool)
    {
        return true;
    }

    function transfer(address to, uint256 value)
        external
        override
        returns (bool)
    {
        require(
            msg.sender == uniswapV3Staker,
            "GivethUniswapV3Reward:NOT_VALID_TRANSFER"
        );

        totalSupply = totalSupply - value;
        tokenDistro.allocate(to, value, true);

        emit RewardPaid(to, value);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external override returns (bool) {
        require(
            tx.origin == owner(),
            "GivethUniswapV3Reward:transferFrom:ONLY_OWNER_CAN_ADD_INCENTIVES"
        );

        // Only uniswapV3Staker can do the transferFrom
        require(
            msg.sender == uniswapV3Staker,
            "GivethUniswapV3Reward:ONLY_STAKER"
        );

        // Only to uniswapV3Staker is allowed
        require(to == uniswapV3Staker, "GivethUniswapV3Reward:ONLY_TO_STAKER");

        totalSupply = totalSupply + value;

        emit Transfer(address(0), to, value);
        return true;
    }

    function allowance(address owner, address spender)
        external
        view
        override
        returns (uint256)
    {
        if (spender == uniswapV3Staker) return type(uint256).max;
        return 0;
    }
}
