// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

import "../Tokens/UniswapV3RewardToken.sol";

contract UniswapV3RewardTokenMock is UniswapV3RewardToken {
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
