// SPDX-License-Identifier: GPL-3.0

/* solium-disable function-order */

pragma solidity 0.8.6;
import "../Distributors/TokenManagerHook.sol";

contract HookedTokenManagerMock {
    mapping(uint256 => TokenManagerHook) public hooks;
    uint256 public hooksLength;

    address token;
    // Other token specific events can be watched on the token address directly (avoids duplication)
    event TokenManagerInitialized(address token, address wrappableToken);
    event NewVesting(
        address indexed receiver,
        uint256 vestingId,
        uint256 amount
    );
    event RevokeVesting(
        address indexed receiver,
        uint256 vestingId,
        uint256 nonVestedAmount
    );

    constructor(address _token) {
        token = _token;
    }

    /**
     * @notice Create a new Token Manager hook for `_hook`
     * @param _hook Contract that will be used as Token Manager hook
     */
    function registerHook(address _hook) external returns (uint256) {
        uint256 hookId = hooksLength++;
        hooks[hookId] = TokenManagerHook(_hook);
        hooks[hookId].onRegisterAsHook(hookId, token);
        return hookId;
    }

    /**
     * @notice Revoke Token Manager hook #`_hookId`
     * @param _hookId Position of the hook to be removed
     */
    function revokeHook(uint256 _hookId) external {
        hooks[_hookId].onRevokeAsHook(_hookId, token);
        delete hooks[_hookId];
    }

    /*
     * @dev Notifies the controller about a token transfer allowing the controller to decide whether
     *      to allow it or react if desired (only callable from the token).
     *      Initialization check is implicitly provided by `onlyToken()`.
     * @param _from The origin of the transfer
     * @param _to The destination of the transfer
     * @param _amount The amount of the transfer
     * @return False if the controller does not authorize the transfer
     */
    function onTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external returns (bool) {
        return _triggerOnTransferHook(_from, _to, _amount);
    }

    /**
     * @dev Notifies the controller about an approval allowing the controller to react if desired
     *      Initialization check is implicitly provided by `onlyToken()`.
     * @return False if the controller does not authorize the approval
     */
    function onApprove(
        address _holder,
        address _spender,
        uint256 _amount
    ) external returns (bool) {
        return _triggerOnApproveHook(_holder, _spender, _amount);
    }

    function _triggerOnApproveHook(
        address _holder,
        address _spender,
        uint256 _amount
    ) internal returns (bool approved) {
        approved = true;
        uint256 i = 0;
        while (approved && i < hooksLength) {
            if (address(hooks[i]) != address(0)) {
                approved = hooks[i].onApprove(_holder, _spender, _amount);
            }
            i++;
        }
    }

    function _triggerOnTransferHook(
        address _from,
        address _to,
        uint256 _amount
    ) internal returns (bool transferable) {
        transferable = true;
        uint256 i = 0;
        while (transferable && i < hooksLength) {
            if (address(hooks[i]) != address(0)) {
                transferable = hooks[i].onTransfer(_from, _to, _amount);
            }
            i++;
        }
    }
}
