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

    // Only balance of minter and uniswap v3 staker are needed
    uint256 private minterBalance;
    uint256 private uniswapV3StakerBalance;

    // The only acceptable allowance is minter to staker
    uint256 private minterToStakerAllowance;

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
        if (account == uniswapV3Staker) return uniswapV3StakerBalance;
        if (account == minter) return minterBalance;
        return 0;
    }

    function _changeMinter(address newMinter) internal {
        minter = newMinter;
        emit ChangeMinter(newMinter);
    }

    function _mint(address to, uint256 value) internal {
        require(
            to == minter,
            "GivethUniswapV3Reward:ONLY_TO_MINTER"
        );
        totalSupply = totalSupply + value;
        minterBalance = minterBalance + value;
        emit Transfer(address(0), to, value);
    }

    function _approve(
        address owner,
        address spender,
        uint256 value
    ) private {
        require(
            owner == minter && spender == uniswapV3Staker,
            "GivethUniswapV3Reward:ONLY_MINTER_TO_STAKER"
        );
        minterToStakerAllowance = value;
        emit Approval(owner, spender, value);
    }

    function _transfer(
        address from,
        address to,
        uint256 value
    ) private {
        // Minter sending to staker
        if (from == minter) {
            require(to == uniswapV3Staker,
                "GivethUniswapV3Reward:MINTER_ONLY_TO_STAKER"
            );
            minterBalance = minterBalance - value;
            uniswapV3StakerBalance = uniswapV3StakerBalance + value;
            emit Transfer(from, to, value);
            return;
        }

        // Staker sends pays the reward
        require(
            from == uniswapV3Staker && to != uniswapV3Staker,
            "GivethUniswapV3Reward:NOT_VALID_TRANSFER"
        );

        uniswapV3StakerBalance = uniswapV3StakerBalance - value;
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
        _approve(msg.sender, spender, value);
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
        require(from == minter && to == uniswapV3Staker, "GivethUniswapV3Reward:ONLY_MINTER_TO_STAKER");
        if (minterToStakerAllowance != type(uint256).max) {
        // Allowance is implicitly checked with solidity underflow protection
            minterToStakerAllowance = minterToStakerAllowance - value;
        }
        _transfer(from, to, value);
        return true;
    }

    function allowance(address owner, address spender)
        external
        view
        override
        returns (uint256)
    {
        if (owner == minter && spender == uniswapV3Staker) return minterToStakerAllowance;
        return 0;
    }
}
