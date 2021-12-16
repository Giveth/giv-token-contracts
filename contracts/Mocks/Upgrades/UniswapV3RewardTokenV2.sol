// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

import "../../Tokens/UniswapV3RewardToken.sol";

contract UniswapV3RewardTokenV2 is UniswapV3RewardToken {
    function checkUpgrade()
        public
        view
        returns (
            string memory,
            string memory, // name
            string memory, // symbol
            uint8, // decimals
            IDistro, // tokenDistro
            address, // uniswapV3Staker
            uint256 // totalSuply
        )
    {
        return (
            "OK",
            name,
            symbol,
            decimals,
            tokenDistro,
            uniswapV3Staker,
            totalSupply
        );
    }
}
