// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

import "./GIVUnipool.sol";
import "./GardenTokenLock.sol";

contract GIVpower is GardenTokenLock, GIVUnipool {
    using SafeMathUpgradeable for uint256;

    mapping(address => mapping(uint256 => uint256)) private _powerUntilRound;

    function __GIVpower_init(uint256 _initialDate, uint256 _roundDuration, address _tokenManager, address _tokenDistribution, uint256 _duration) initializer public {
      __GardenTokenLock_init(_initialDate, _roundDuration, _tokenManager);
      __GIVUnipool_init(_tokenDistribution, _duration);
    }

    function lock(uint256 _amount, uint256 _rounds) public virtual override {
        // we check the amount is lower than the lockable amount in the parent's function
        super.lock(_amount, _rounds);
        uint256 round = currentRound().add(_rounds);
        uint256 powerAmount = _amount.mul(_rounds.add(1));
        _powerUntilRound[msg.sender][round] = _powerUntilRound[msg.sender][round].add(powerAmount);
        super.stake(msg.sender, powerAmount);
    }

    function unlock(address[] calldata _locks, uint256 _round) public virtual override {
        // we check the round has passed in the parent's function
        super.unlock(_locks, _round);
        for (uint i = 0; i < _locks.length; i++) {
            address _lock = _locks[i];
            uint256 powerAmount = _powerUntilRound[_lock][_round];
            super.withdraw(_lock, powerAmount);
            _powerUntilRound[_lock][_round] = 0;
        }
    }
}