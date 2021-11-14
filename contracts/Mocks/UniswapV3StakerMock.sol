// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

import "../Tokens/UniswapV3RewardToken.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract UniswapV3StakerMock {
    using SafeERC20 for IERC20;

    struct IncentiveKey {
        IERC20 rewardToken;
        IERC20 pool;
        uint256 startTime;
        uint256 endTime;
        address refundee;
    }

    constructor() {}

    function createIncentive(IncentiveKey memory key, uint256 reward) external {
        key.rewardToken.safeTransferFrom(msg.sender, address(this), reward);
    }

    function claimRewardMock(IERC20 rewardToken, uint256 amount) external {
        rewardToken.safeTransfer(msg.sender, amount);
    }
}
