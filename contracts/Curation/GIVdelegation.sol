// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;


import "./GIVpower.sol";

contract GIVdelegation is GIVpower {
    using SafeMathUpgradeable for uint256;

    mapping (address => address) private _delegateOf;
    mapping (address => uint256) private _delegatedBalanceOf;

    function __GIVdelegation_init(uint256 _initialDate, uint256 _roundDuration, address _tokenManager, address _tokenDistribution, uint256 _duration) initializer public {
        __GIVpower_init(_initialDate, _roundDuration, _tokenManager, _tokenDistribution, _duration);
    }

    function lock(uint256 _amount, uint256 _rounds) public override {
        address _delegate = _delegateOf[msg.sender];
        if (_delegate != address(0)) {
            delegateTo(address(0));
        }
        // we check the amount is lower than the lockable amount in the parent's function
        super.lock(_amount, _rounds);
        if (_delegate != address(0)) {
            delegateTo(_delegate);
        }
    }

    function unlock(address[] calldata _locks, uint256 _round) public virtual override {
        address _delegate = _delegateOf[msg.sender];
        if (_delegate != address(0)) {
            delegateTo(address(0));
        }
        // we check the round has passed in the parent's function
        super.unlock(_locks, _round);
        if (_delegate != address(0)) {
            delegateTo(_delegate);
        }
    }

    function delegateTo(address _delegate) public {
        require (_delegate != msg.sender, "Use zero address to delegate on yourself");
        require (_delegateOf[_delegate] == address(0), "Can not delegate on a delegator");
        address _oldDelegate = _delegateOf[msg.sender];
        if (_oldDelegate != address(0)) {
            _delegatedBalanceOf[_oldDelegate] = _delegatedBalanceOf[_oldDelegate].sub(balanceOf(msg.sender));
        }
        _delegateOf[msg.sender] = _delegate;
        if (_delegate != address(0)) {
            _delegatedBalanceOf[_delegate] = _delegatedBalanceOf[_delegate].add(balanceOf(msg.sender));
        }
    }

    function delegateOf(address _account) external view returns (address) {
        return _delegateOf[_account];
    }

    function delegatedBalanceOf(address _account) public view returns (uint256) {
        if (_delegateOf[_account] != address(0)) { // if an account has a delegate, do not count its balance
            return _delegatedBalanceOf[_account];
        } else { // otherwise, count the delegated balance on top of the balance
            return balanceOf(_account).add(_delegatedBalanceOf[_account]);
        }
    }
}