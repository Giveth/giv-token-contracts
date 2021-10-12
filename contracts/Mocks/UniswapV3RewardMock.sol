// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

import "../Tokens/UniswapV3Reward.sol";

contract UniswapV3RewardMock is UniswapV3Reward {
	constructor(
		address _initialMinter,
		IDistro _tokenDistribution,
		address _uniswapV3Staker
	) {
		initialize(
			_initialMinter,
			_tokenDistribution,
			_uniswapV3Staker
		);
	}
}
