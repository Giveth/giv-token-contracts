# TokenDistro Contract

This directory contains the `TokenDistro` contract. The `TokenDistro` contract handles the allocation of rewards by releasing them over time in the **GIVStream**.

The contract is based on the original `TokenDistro` contracts initially provided by Dappnode.

## Initialization

During intialization the TokenDistro defines the follwing:
- The token that is being distributed
- Start time, cliff period and duration of the distribution
- Initial percentage available to claim
- If the admin can cancel an allocation

The `msg.sender` assumes the inital `DEFAULT_ADMIN_ROLE` role used in the contract.

## Acess Control

The Token Distro contract utilizes Openzeppelin `AccessControl` roles. Two roles are recognized:

1. `DEFAULT_ADMIN_ROLE` is essentally the owner of the TokenDistro. It is assigned to the initializer address. `DEFAULT_ADMIN_ROLE` can add **distributors**, set the start time and cancel allocations. 
2. `DISTRIBUTOR_ROLE` are the only addresses allowed to allocate tokens for distribution through claims. This should usually be an address of a liquidity mining contract such as eg. `Unipool` or similar.

## Assigning Distributors

TokenDistro assumes that there exist distributors (contracts or EOAs) that will later be used to distribute tokens. There are for example:
- The UniV3 staking incentive program
- The `UnipoolDistributor` used for liquidity mining on Honeyswap an Balancer
- The `GardenUnipoolDistirbutor` used for GIVGarden staking

The `assign(address account, uint256 amount)` function will assign the given amount of tokens to an address. It must be caled by the `DEFAULT_ADMIN_ROLE`. The `DEFAULT_ADMIN_ROLE` may assign any address to be a Distributor if it has claimed a `DISTRIBUTOR` ROLE.

## Allocating/claiming GIV

When a recipient wants to claim her tokens, she is expected to interact with a deployed distributor contract. The logic of the distributor governshe how much the recipient is owed and at what time.

In an example, a deployed `MerkleDistributor` checks if an address has a GIV merkle drop available.

**IMPORTANT:** A distributor cannot allocate GIV to another `DISTRIBUTOR_ROLE`. This is to avoid tokens being trapped in a distribution contract.

### Allocating GIV

Before (or in the process of) claiming rewards, a registered distributor should call `allocate(address account, uint256 amount, bool claim)` with the address and the amount of GIV the recipient is entitled to. This will allocate the amount to the recipient where
- One part can be claimed immediately as GIV
- The rest is allocated to the GIVStream and is released over time

The proportion of GIV that can be claimed is determined by the
- Initial percentage of GIV that is set as claimable
- Current block time (percentage of duration that is elapsed)
- Amount of tokens already claimed

The globally claimable amount of tokens is:
```
/**
 * Function to get the total claimable tokens at some moment
 * @param timestamp Unix time to check the number of tokens claimable
 * @return Number of tokens claimable at that timestamp
 */
function globallyClaimableAt(uint256 timestamp)
    public
    view
    override
    returns (uint256)
{
    if (timestamp < startTime) return 0;
    if (timestamp < cliffTime) return initialAmount;
    if (timestamp > startTime + duration) return totalTokens;

    uint256 deltaTime = timestamp - startTime;
     return initialAmount + (deltaTime * lockedAmount) / duration;
}
```

This determines the current unlocked amount of allocated tokens (at a given timestamp) as:
```
uint256 unlockedAmount = (globallyClaimableAt(timestamp) *
    balances[recipient].allocatedTokens) / totalTokens;

return unlockedAmount - balances[recipient].claimed;
```

Only a registered distributor can assign tokens to be claimed to an address.

NOTE: If the claim flag is set to `true` the distributor will also perform a claim (as seen in the *Claiming GIV* section).

### SendGIVbacks wrapper

The `sendGIVbacks(address[] memory recipients, uint256[] memory amounts)` is a wrapper function that will allocate an amount of GIV tokens to a given number of recipients. It uses the underlying `_allocateMany` call. It will emit a `GivBacksPaid(address)` event that logs the function caller.

This is useful for tracking GIVBack payouts that are tracked off-chain and triggered on a regular basis. 

### Claiming GIV

Anyone can initialte a claim by calling `claim` or `claimTo` functions. This will transfer any tokens that are available to be claimed to the recipient. 

This way the recipient can access her GIVStream tokens regardless of the distributor.

## Changing adress allocations

The TokenDistro contract supports modifying the recipient of an allocation. This can be very useful if an address is compromised (invalid, lost keys etc.) This can be done by the recipient or (if enabled) by `DEFAULT_ADMIN_ROLE`.

### Regular mode

Any recipient can change the address to which she receives GIV allocations by calling `changeAddress(address newAddress)`. The new address **must not** be **in use**, that is it must not have any allocated (or claimed) tokens.

This call emits a `ChangeAddress(address prevRecipient, address newRecipient)` event.

**NOTE:** The `DISTRIBUTOR_ROLE` **cannot** change it's recipient address.

When a recipient changes her address, she will be able to claim the remainder of her tokens from existing allocations.

### Admin mode

The `DEFAULT_ADMIN_ROLE` has an option to call the `cancelAllocation(address prevRecipient, address newRecipient)` function to change a recipient by force, buy only if the `cancellable` parameter was set to `true` on TokenDistro initialization.

This call emits a `ChangeAddress(address prevRecipient, address newRecipient)` event.

**NOTE:** The `DISTRIBUTOR_ROLE` recipient address **cannot** be changed.



