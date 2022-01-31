// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

import "../../GivBacksRelayer/GIVBacksRelayer.sol";

contract GIVBacksRelayerV2 is GIVBacksRelayer {
    function checkUpgrade()
        public
        view
        returns (
            string memory,
            bytes32, // BATCHER_ROLE
            address, // tokenDistroContract
            uint256 // nonce
        )
    {
        return ("OK", BATCHER_ROLE, tokenDistroContract, nonce);
    }
}
