// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

import "openzeppelin-contracts-upgradable-v4/access/OwnableUpgradeable.sol";
import "openzeppelin-contracts-upgradable-v4/utils/math/SafeMathUpgradeable.sol";
import "../Distributors/TokenManagerHook.sol";
import "../Interfaces/ITokenManager.sol";

contract GardenTokenLock is TokenManagerHook {
    using SafeMathUpgradeable for uint256;

    uint256 public initialDate;
    uint256 public roundDuration;
    IERC20 public token;

    struct Lock {
        uint256 totalAmountLocked;
        mapping(uint256 => uint256) amountLockedUntilRound;
    }

    mapping(address => Lock) public lockedTokens;

    error TokensAreLocked();
    error CannotUnlockUntilRoundIsFinished();
    
    function __GardenTokenLock_init(uint256 _initialDate, uint256 _roundDuration, address _tokenManager) public initializer {
        __TokenManagerHook_initialize(_tokenManager);
        initialDate = _initialDate;
        roundDuration = _roundDuration;
        token = ITokenManager(_tokenManager).token();
    }

    function lock(uint256 _amount, uint256 _rounds) public virtual {
        Lock storage _lock = lockedTokens[msg.sender];
        uint256 lockUntilRound = currentRound().add(_rounds);
        _lock.amountLockedUntilRound[lockUntilRound] = _lock.amountLockedUntilRound[lockUntilRound].add(_amount);
        _lock.totalAmountLocked = _lock.totalAmountLocked.add(_amount);
    }

    function unlock(address[] calldata _locks, uint256 _round) public virtual {
        if (_round >= currentRound()) {
            revert CannotUnlockUntilRoundIsFinished();
        }
        for (uint i = 0; i < _locks.length; i++) {
            Lock storage _lock = lockedTokens[_locks[i]];
            _lock.totalAmountLocked = _lock.totalAmountLocked.sub(_lock.amountLockedUntilRound[_round]);
            _lock.amountLockedUntilRound[_round] = 0;
        }
    }

    function currentRound() public view returns (uint256) {
        return uint256(block.timestamp).sub(initialDate).div(roundDuration); // currentRound = (now - initialDate) / roundDuration
    }

    function _onTransfer(
        address _from,
        address/* _to*/,
        uint256 _amount
    ) internal view override returns (bool) {
        if (token.balanceOf(_from).sub(_amount) < lockedTokens[_from].totalAmountLocked) {
            revert TokensAreLocked();
        }
        return true;
    }
}
