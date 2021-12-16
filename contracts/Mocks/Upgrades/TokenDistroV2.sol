// SPDX-License-Identifier: GPL-3.0
pragma solidity =0.8.6;

import "../../TokenDistro/TokenDistro.sol";

contract TokenDistroV2 is TokenDistro {
    function checkUpgrade()
        public
        view
        returns (
            string memory,
            uint256, // totalTokens - Total tokens to be distribute
            uint256, // startTime - Instant of time in which distribution begins
            uint256, // cliffTime - Instant of time in which tokens will begin to be released
            uint256, // duration
            uint256, // initialAmount - Initial amount that will be available from startTime
            uint256, // lockedAmount - Amount that will be released over time from cliffTime
            IERC20Upgradeable, // token - Token to be distribute
            bool // cancelable
        )
    {
        return (
            "OK",
            totalTokens,
            startTime,
            cliffTime,
            duration,
            initialAmount,
            lockedAmount,
            token,
            cancelable
        );
    }
}
