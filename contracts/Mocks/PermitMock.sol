// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

contract PermitMock {
    bytes4 constant _PERMIT_SIGNATURE = 0xd505accf;

    constructor() {}

    /**
     * @notice Function to extract the selector of a bytes calldata
     * @param _data The calldata bytes
     */
    function _getSelector(
        bytes memory _data
    ) private pure returns (bytes4 sig) {
        assembly {
            sig := mload(add(_data, 32))
        }
    }

    /**
     * @notice Function to call token permit method of extended ERC20
     + @param token ERC20 token address
     * @param _amount Quantity that is expected to be allowed
     * @param _permitData Raw data of the call `permit` of the token
     */
    function permit(
        address token,
        uint256 _amount,
        bytes calldata _permitData
    ) public {
        bytes4 sig = _getSelector(_permitData);
        require(
            sig == _PERMIT_SIGNATURE,
            "PermitMock::_permit: NOT_VALID_CALL"
        );
        (
            address owner,
            address spender,
            uint256 value,
            uint256 deadline,
            uint8 v,
            bytes32 r,
            bytes32 s
        ) = abi.decode(
                _permitData[4:],
                (address, address, uint256, uint256, uint8, bytes32, bytes32)
            );
        require(
            owner == msg.sender,
            "PermitMock::_permit: PERMIT_OWNER_MUST_BE_THE_SENDER"
        );
        require(
            spender == address(this),
            "PermitMock::_permit: SPENDER_MUST_BE_THIS"
        );
        require(
            value == _amount,
            "PermitMock::_permit: PERMIT_AMOUNT_DOES_NOT_MATCH"
        );

        // we call without checking the result, in case it fails and he doesn't have enough balance
        // the following transferFrom should be fail. This prevents DoS attacks from using a signature
        // before the smartcontract call
        /* solhint-disable avoid-low-level-calls */
        address(token).call(
            abi.encodeWithSelector(
                _PERMIT_SIGNATURE,
                owner,
                spender,
                value,
                deadline,
                v,
                r,
                s
            )
        );
    }
}
