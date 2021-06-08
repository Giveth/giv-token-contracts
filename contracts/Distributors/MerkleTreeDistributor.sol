// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../Interfaces/IMerkleTreeDistributor.sol";
import "../Interfaces/IDistro.sol";

contract MerkleDistributorVested is IMerkleTreeDistributor, Initializable, OwnableUpgradeable {
    bytes32 public override merkleRoot;
    IDistro public tokenDistro;

    // This is a packed array of booleans.
    mapping(uint256 => uint256) private claimedBitMap;

    function initialize(IDistro _tokenDistro, bytes32 merkleRoot_) public initializer {
        tokenDistro = _tokenDistro;
        merkleRoot = merkleRoot_;
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
            "MerkleDistributorVested::claim Drop already claimed."
        );

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        require(
            MerkleProofUpgradeable.verify(merkleProof, merkleRoot, node),
            "MerkleDistributorVested::claim Invalid proof."
        );

        // Mark it claimed and send and grant the vested tokens
        _setClaimed(index);
        tokenDistro.allocate(account, amount);

        emit Claimed(index, account, account, amount);
    }

    /**
        This function allows to the owner to claim tokens in behalf of another to a different address
        It is intended for those cases in which the owner knows that the recipient is no longer in possession of the account.
     */
    function claim(
        uint256 index,
        address account,
        address recipient,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external override onlyOwner {
        require(
            !isClaimed(index),
            "MerkleDistributorVested::claim Drop already claimed."
        );

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        require(
            MerkleProofUpgradeable.verify(merkleProof, merkleRoot, node),
            "MerkleDistributorVested::claim Invalid proof."
        );

        // Mark it claimed and send and grant the vested tokens
        _setClaimed(index);
        tokenDistro.allocate(recipient, amount);

        emit Claimed(index, account, recipient, amount);
    }
}
