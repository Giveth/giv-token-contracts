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
    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    event ChangeMinter(address indexed minter);
    event RewardPaid(address indexed user, uint256 reward);

    modifier onlyMinter {
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

    function _changeMinter(address newMinter) internal {
        minter = newMinter;
        emit ChangeMinter(newMinter);
    }

    function _mint(address to, uint256 value) internal {
        totalSupply = totalSupply + value;
        balanceOf[to] = balanceOf[to] + value;
        emit Transfer(address(0), to, value);
    }

    function _burn(address from, uint256 value) internal {
        // Balance is implicitly checked with solidity underflow protection
        balanceOf[from] = balanceOf[from] - value;
        totalSupply = totalSupply - value;
        emit Transfer(from, address(0), value);
    }

    function _transfer(
        address from,
        address to,
        uint256 value
    ) private {
        require(
            to != address(this) && to != address(0),
            "GivethUniswapV3Reward:NOT_VALID_TRANSFER"
        );
        if (from == minter) {
            // Balance is implicitly checked with SafeMath's underflow protection
            require(to == uniswapV3Staker, "GivethUniswapV3Reward:NOT_VALID_TRANSFER");
            balanceOf[from] = balanceOf[from] - value;
            balanceOf[to] = balanceOf[to] + value;
            emit Transfer(from, to, value);
        } else {
            require(from == uniswapV3Staker && to != uniswapV3Staker, "GivethUniswapV3Reward:NOT_VALID_TRANSFER");
            _burn(from, value);
            tokenDistro.allocate(to, value);
            emit RewardPaid(to, value);
        }
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

    function burn(uint256 value) external returns (bool) {
        _burn(msg.sender, value);
        return true;
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

}
