pragma solidity =0.8.6;

import "openzeppelin-contracts-v4/token/ERC20/IERC20.sol";
import "openzeppelin-contracts-upgradable-v4/access/OwnableUpgradeable.sol";
import "openzeppelin-contracts-upgradable-v4/utils/math/SafeMathUpgradeable.sol";
import "../Distributors/TokenManagerHook.sol";

contract GardenTokenLock is
    TokenManagerHook,
    OwnableUpgradeable
{
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
    
    constructor(uint256 _initialDate, uint256 _roundDuration, address _token) {
        initialDate = _initialDate;
        roundDuration = _roundDuration;
        token = IERC20(_token);
    }

    function lock(uint256 _amount, uint256 _rounds) public virtual {
        Lock storage lock = lockedTokens[msg.sender];
        uint256 lockUntilRound = currentRound().add(_rounds);
        lock.amountLockedUntilRound[lockUntilRound] = lock.amountLockedUntilRound[lockUntilRound].add(_amount);
        lock.totalAmountLocked = lock.totalAmountLocked.add(_amount);
    }

    function unlock(address[] calldata _locks, uint256 _round) public virtual {
        if (_round >= currentRound()) {
            revert CannotUnlockUntilRoundIsFinished();
        }
        for (uint i = 0; i < _locks.length; i++) {
            Lock storage lock = lockedTokens[_locks[i]];
            lock.totalAmountLocked = lock.totalAmountLocked.sub(lock.amountLockedUntilRound[_round]);
            lock.amountLockedUntilRound[_round] = 0;
        }
    }

    function currentRound() public view returns (uint256) {
        return uint256(block.timestamp).sub(initialDate).div(roundDuration); // currentRound = (now - initialDate) / roundDuration
    }

    function _onTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal override returns (bool) {
        if (token.balanceOf(_from).sub(_amount) < lockedTokens[_from].totalAmountLocked) {
            revert TokensAreLocked();
        }
    }
}
