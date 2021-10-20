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

    address public minter;
    IDistro public tokenDistro;
    address public uniswapV3Staker;
    uint256 public override totalSupply;

    uint256 private uniswapBalance;

    event ChangeMinter(address indexed minter);
    event RewardPaid(address indexed user, uint256 reward);

    modifier onlyMinter() {
        require(msg.sender == minter, "GivethUniswapV3Reward:NOT_MINTER");
        _;
    }

    function initialize(
        address _initialMinter,
        IDistro _tokenDistribution,
        address _uniswapV3Staker
    ) public initializer {
        _changeMinter(_initialMinter);
        tokenDistro = _tokenDistribution;
        uniswapV3Staker = _uniswapV3Staker;
    }

    function balanceOf(address account) public view override returns (uint256) {
        if (account == uniswapV3Staker) return uniswapBalance;
        return 0;
    }

    function _changeMinter(address newMinter) internal {
        minter = newMinter;
        emit ChangeMinter(newMinter);
    }

    function _mint(address to, uint256 value) internal {
        require(
            to == uniswapV3Staker,
            "GivethUniswapV3Reward:ONLY_TO_UNISWAP_STAKER"
        );
        totalSupply = totalSupply + value;
        uniswapBalance = uniswapBalance + value;
        emit Transfer(address(0), to, value);
    }

    function _transfer(
        address from,
        address to,
        uint256 value
    ) private {
        require(
            from == uniswapV3Staker && to != uniswapV3Staker,
            "GivethUniswapV3Reward:NOT_VALID_TRANSFER"
        );

        uniswapBalance = uniswapBalance - value;
        tokenDistro.allocate(to, value);
        emit RewardPaid(to, value);
    }

    function getChainId() public view returns (uint256 chainId) {
        assembly {
            chainId := chainid()
        }
    }

    function mint(address to, uint256 value)
        external
        onlyMinter
        returns (bool)
    {
        _mint(to, value);
        return true;
    }

    function changeMinter(address newMinter) external onlyMinter {
        _changeMinter(newMinter);
    }

    function approve(address spender, uint256 value)
        external
        override
        returns (bool)
    {
        revert("GivethUniswapV3Reward:disabled");
        return true;
    }

    function transfer(address to, uint256 value)
        external
        override
        returns (bool)
    {
        _transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external override returns (bool) {
        revert("GivethUniswapV3Reward:disabled");
        return true;
    }

    function allowance(address owner, address spender)
        external
        view
        override
        returns (uint256)
    {
        revert("GivethUniswapV3Reward:disabled");
        return 0;
    }
}
