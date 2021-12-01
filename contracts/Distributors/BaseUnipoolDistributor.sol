// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.6;

import "openzeppelin-contracts-upgradable-v4/access/OwnableUpgradeable.sol";
import "openzeppelin-contracts-upgradable-v4/utils/math/MathUpgradeable.sol";

import "../Interfaces/IDistro.sol";

// import "../LPToken/BaseLPToken.sol";

/// @title BaseUnipoolDistributor
/// @author Giveth Developers
/// @notice This contract has the basic unipool functionality
/// @dev Concrete implementations should inherit an LP Token and implement stake/unstake functionality
abstract contract BaseUnipoolDistributor is OwnableUpgradeable {
    uint256 public duration;

    address public rewardDistribution;
    uint256 public periodFinish;
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

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
            rewards[account] = _caculateEarned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function __BaseUnipoolDistributor_initialize(uint256 _duration)
        public
        initializer
    {
        __Ownable_init();
        duration = _duration;
        periodFinish = 0;
        rewardRate = 0;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return MathUpgradeable.min(_blockTimestamp(), periodFinish);
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply() == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            ((lastTimeRewardApplicable() - lastUpdateTime) *
                rewardRate *
                1e18) /
            _totalSupply();
    }

    function earned(address account) public view returns (uint256) {
        return _caculateEarned(account);
    }

    function getReward() public updateReward(msg.sender) {
        uint256 reward = earned(_msgSender());
        if (reward > 0) {
            rewards[_msgSender()] = 0;
            _distributionHook(_msgSender(), reward);
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

    /// @dev Notify the distirbution hook that the user is collecting the reward
    /// Implementations should override and call the appropiate token distribution reward function
    /// @param account Account getting the reward tokens
    /// @param amount Amount of reward tokens claimed
    function _distributionHook(address account, uint256 amount)
        internal
        virtual;

    /// @dev Calculate the current earned reward of the given account
    /// Implementations that use a different reward calculation (such as a payment stream) should override this method
    /// @param account The account to check the earned amount for
    /// @return The earned amount
    function _caculateEarned(address account) internal view returns (uint256) {
        return
            (_balanceOf(account) *
                (rewardPerToken() - userRewardPerTokenPaid[account])) /
            1e18 +
            rewards[account];
    }

    /// @dev Implementation defined total supply calculation.
    /// Should return the LP token total supply
    /// @return Total supply of the LP token
    function _totalSupply() internal view virtual returns (uint256);

    /// @dev Implementation defined account balance calculation.
    /// Should return the LP token balance of an account
    /// @param account Address of the account
    /// @return Token Balance of the given account
    function _balanceOf(address account)
        internal
        view
        virtual
        returns (uint256);

    /// @dev Returns the block timestamp
    /// Regular implementations should leave this alone.
    /// Test implementations can override this function to set an arbitrary fixed timestamp
    /// @return The proper timestamp of the current block
    function _blockTimestamp() internal view virtual returns (uint256) {
        return block.timestamp;
    }
}
