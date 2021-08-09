// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Interfaces/IMerkleTreeDistributor.sol";
import "../Interfaces/IDistro.sol";

// Based on: https://github.com/Uniswap/merkle-distributor/blob/master/contracts/MerkleDistributor.sol
/*
 * Changelog:
 *      * Added SPDX-License-Identifier
 *      * Update to solidity ^0.8.0
 *      * Update openzeppelin imports
 *      * Make it upgradable
 *      * Add claimTo function that allows the owner to claim on behalf of someone
 */

contract MerkleDrop is IMerkleTreeDistributor, Initializable, OwnableUpgradeable {
    address public token;
    bytes32 public override merkleRoot;

    // This is a packed array of booleans.
    mapping(uint256 => uint256) private claimedBitMap;

    function initialize(address _token, bytes32 _merkleRoot) public initializer {
        __Ownable_init();
        token = _token;
        merkleRoot = _merkleRoot;
    }

    function isClaimed(uint256 index) public view override returns (bool) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    function _setClaimed(uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[claimedWordIndex] =
            claimedBitMap[claimedWordIndex] |
            (1 << claimedBitIndex);
    }

    function claim(
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external override {
        require(
            !isClaimed(index),
            "MerkleDrop::claim Drop already claimed."
        );

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        require(
            MerkleProofUpgradeable.verify(merkleProof, merkleRoot, node),
            "MerkleDrop::claim Invalid proof."
        );

        // Mark it claimed and send and grant the vested tokens
        _setClaimed(index);
        require(IERC20(token).transfer(account, amount), 'MerkleDrop: Transfer failed.');

        emit Claimed(index, account, account, amount);
    }

    /**
        This function allows to the owner to claim tokens in behalf of another to a different address
        It is intended for those cases in which the owner knows that the recipient is no longer in possession of the account.
     */
    function claimTo(
        uint256 index,
        address account,
        address recipient,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external override onlyOwner {
        require(
            !isClaimed(index),
            "MerkleDrop::claim Drop already claimed."
        );

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        require(
            MerkleProofUpgradeable.verify(merkleProof, merkleRoot, node),
            "MerkleDrop::claim Invalid proof."
        );

        // Mark it claimed and send the tokens
        _setClaimed(index);
        require(IERC20(token).transfer(recipient, amount), 'MerkleDrop: Transfer failed.');

        emit Claimed(index, account, recipient, amount);
    }
}
