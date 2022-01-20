// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.6;

/**
 * @title IGIVBacksRelayer
 * @dev This is the interface for a GivBacks `Relayer`.
 *
 * The purpose of the relayer is to allow a `Distributor` to split a call to
 * the `sendGIVbacks` `TokenDistro` function into multiple batches. This is
 * useful as the number of GIVBacks the distirbutor can send can exceed the
 * block gas limit.
 *
 * The relayer implementation allows a `Batcher` role to upload a number of
 * batch hashes. Each batch hash is a keccak256 hash of an ordered list of
 * parameters passed to `sendGIVBacks`.
 *
 * The relayer implementation is not expected to store batch data, so relay
 * callers, should keep it available offline.
 *
 * Once the list of batches is uploaded, anyone can perform an `executeBatch`
 * call by passing a list of parameters to be passed to `sendGIVBacks`. The
 * relayer will validate the batch parameters against the hash and execute the
 * `sendGIVBacks` call.
 *
 * The contract is upgradeable using the cannonical OpenZeppelin transparent
 * transparent proxy.
 */
interface IGIVBacksRelayer {
    /**
     * @dev Emit when batches are created.
     * @param batcher - The address of the `BATCHER_ROLE` that created the batch
     */
    event CreatedBatches(address indexed batcher);

    /**
     * @dev Emit when a batch is sucessfully executed.
     * @param executor - The address that called this function
     * @param batch - The batch hash
     */
    event Executed(address indexed executor, bytes32 batch);

    /**
     * @dev This function will create a list of batches that can later be
     * executed calling `executeBatch`.
     *
     * NOTE: This does not take into account possible collisions, a valid nonce
     * MUST be passed during batch creation.
     *
     * @param batches - A list of batches that can be executed
     */
    function createBatches(bytes32[] calldata batches) external;

    /**
     * @dev This funciton will try and execute a batch.
     * The batch is formed from a nonce and parameters that are expected to be
     * passed to `TokenDistro.sendGIVbacks`.
     *
     * The function will revert if the batch is not pending to be executed.
     * @param nonce - Nonce to prevent batch collisons
     * @param recipients - Parameter passed
     * @param amounts  - Parameter passed
     */
    function executeBatch(
        uint256 nonce,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external;

    /**
     * @dev This function will produce a hash of parameters for the
     * `TokenDistro.sendGIVbacks` call. The hash uniquely identifies a batch
     * that a `BATCHER_ROLE` can pass to `createBatches` to prepare for
     * execution.
     *
     * NOTE: a valid nonce must be passed to prevent batch collisions.
     *
     * @param nonce - Nonce to prevent batch collisons
     * @param recipients - Parameter passed
     * @param amounts  - Parameter passed
     * @return The batch hash
     */
    function hashBatch(
        uint256 nonce,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external pure returns (bytes32);

    /**
     * @dev This function will return the pending status of a batch.
     * @param batch - The hash of the batch to check
     * @return True, if the batch is pending.
     */
    function isPending(bytes32 batch) external view returns (bool);
}
