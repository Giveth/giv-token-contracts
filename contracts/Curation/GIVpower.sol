pragma solidity =0.8.6;

import "openzeppelin-contracts-v4/token/ERC20/IERC20.sol";
import "./GardenTokenLock.sol";

contract GIVpower is GardenTokenLock, IERC20 {
    using SafeMathUpgradeable for uint256;

    struct Power {
        uint256 totalPower;
        mapping(uint256 => uint256) powerUntilRound;
    }
    mapping(address => Power) public powerTokens;
    uint256 private _totalSupply;

    error TokenNonTransferable();

    constructor(uint256 _initialDate, uint256 _roundDuration, address _token) GardenTokenLock(_initialDate, _roundDuration, _token) {
      _totalSupply = 0;
    }

    function lock(uint256 _amount, uint256 _rounds) public override {
        super.lock(_amount, _rounds);
        Power storage power = powerTokens[msg.sender];
        uint256 powerUntilRound = currentRound().add(_rounds);
        uint256 powerAmount = _amount.mul(_rounds);
        power.powerUntilRound[powerUntilRound] = power.powerUntilRound[powerUntilRound].add(powerAmount);
        power.totalPower = power.totalPower.add(powerAmount);
        _totalSupply = _totalSupply.add(powerAmount);
    }

    function unlock(address[] calldata _locks, uint256 _round) public override {
        super.unlock(_locks, _round);
        for (uint i = 0; i < _locks.length; i++) {
            Power storage power = powerTokens[_locks[i]];
            uint256 powerAmount = power.powerUntilRound[_round];
            power.totalPower = power.totalPower.sub(powerAmount);
            _totalSupply = _totalSupply.sub(powerAmount);
            power.powerUntilRound[_round] = 0;
        }
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev Returns the amount of tokens owned by `account`.
     */
    function balanceOf(address account) external view override returns (uint256) {
        return powerTokens[account].totalPower;
    }

    /**
     * @dev Moves `amount` tokens from the caller's account to `recipient`.
     */
    function transfer(address recipient, uint256 amount) external override returns (bool) {
        revert TokenNonTransferable();
    }

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     */
    function allowance(address owner, address spender) external view override returns (uint256) {
        revert TokenNonTransferable();
    }

    /**
     * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
     */
    function approve(address spender, uint256 amount) external override returns (bool) {
        revert TokenNonTransferable();
    }

    /**
     * @dev Moves `amount` tokens from `sender` to `recipient` using the
     * allowance mechanism. `amount` is then deducted from the caller's
     * allowance.
     */
    function transferFrom(
          address sender,
          address recipient,
          uint256 amount
    ) external override returns (bool) {
        revert TokenNonTransferable();
    }
}