// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

import "../../Distributors/MerkleDistro.sol";

contract MerkleDistroV2 is MerkleDistro {
    function checkUpgrade()
        public
        view
        returns (
            string memory,
            IDistro, // tokenDistro
            bytes32 // merkleRoot
        )
    {
        return ("OK", tokenDistro, merkleRoot);
    }
}
