// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.6;

import "../../Distributors/BaseUnipoolDistributor.sol";
import "../../LPToken/BaseLPToken.sol";

contract BaseUnipoolDistributorMock is BaseLPToken, BaseUnipoolDistributor {
    mapping(address => uint256) private allocations;

    constructor(uint256 duration) {
        __BaseUnipoolDistributor_initialize(duration);
    }

    function _balanceOf(address account)
        internal
        view
        override
        returns (uint256)
    {
        return balanceOf(account);
    }

    function _distributionHook(address account, uint256 amount)
        internal
        override
    {
        allocations[account] = amount;
    }

    function _totalSupply() internal view override returns (uint256) {
        return totalSupply();
    }

    function setRewardDistribution(address _rewardDistribution)
        external
        onlyOwner
    {
        rewardDistribution = _rewardDistribution;
    }

    function stake(uint256 amount) public updateReward(_msgSender()) {
        _stake(_msgSender(), amount);
    }

    function withdraw(uint256 amount) public updateReward(_msgSender()) {
        _withdraw(_msgSender(), amount);
    }

    function distributedTo(address account) external view returns (uint256) {
        return allocations[account];
    }
}
