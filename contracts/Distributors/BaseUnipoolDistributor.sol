// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.6;

import "openzeppelin-contracts-upgradable-v4/access/OwnableUpgradeable.sol";
import "openzeppelin-contracts-upgradable-v4/utils/math/MathUpgradeable.sol";

import "../Interfaces/IDistro.sol";

/// @title BaseUnipoolDistributor
/// @author Giveth Developers
/// @notice This contract has the basic unipool functionality
/// @dev Concrete implementations should implement stake/unstake functionality
contract BaseUnipoolDistributor is OwnableUpgradeable {
    IDistro public tokenDistro;
    uint256 public duration;

    address public rewardDistribution;
    uint256 public periodFinish;
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 internal _totalSupply;
    mapping(address => uint256) internal _balances;

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    modifier onlyRewardDistribution() {
        require(
            _msgSender() == rewardDistribution,
            "BaseUnipoolDistributor::onlyRewardDistribution: NOT_REWARD_DISTRIBUTION"
        );
        _;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = _earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function __BaseUnipoolDistributor_initialize(
        IDistro _tokenDistribution,
        uint256 _duration
    ) public initializer {
        __Ownable_init();
        tokenDistro = _tokenDistribution;
        duration = _duration;
        periodFinish = 0;
        rewardRate = 0;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return MathUpgradeable.min(_blockTimestamp(), periodFinish);
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply() == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            lastTimeRewardApplicable() -
            (lastUpdateTime * rewardRate * 1e18) /
            totalSupply();
    }

    function earned(address account) public view returns (uint256) {
        return _earned(account);
    }

    function getReward() public updateReward(msg.sender) {
        uint256 reward = earned(_msgSender());
        if (reward > 0) {
            rewards[_msgSender()] = 0;
            tokenDistro.allocate(_msgSender(), reward, true);
            emit RewardPaid(_msgSender(), reward);
        }
    }

    function notifyRewardAmount(uint256 reward)
        external
        onlyRewardDistribution
        updateReward(address(0))
    {
        if (_blockTimestamp() >= periodFinish) {
            rewardRate = reward / duration;
        } else {
            uint256 remaining = periodFinish - _blockTimestamp();
            uint256 leftover = remaining * rewardRate;
            rewardRate = reward + leftover / duration;
        }
        lastUpdateTime = _blockTimestamp();
        periodFinish = _blockTimestamp() + duration;

        emit RewardAdded(reward);
    }

    function _earned(address account) internal view returns (uint256) {
        return
            balanceOf(account) *
            rewardPerToken() -
            userRewardPerTokenPaid[account] /
            1e18 +
            rewards[account];
    }

    function _blockTimestamp() internal view returns (uint256) {
        return block.timestamp;
    }
}
