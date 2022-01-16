# Token Contracts

This directory contains different **token contracts** used by the GIVEconomy. The contracts here are mainly used for reference and testing purposes, with the execption of the `UniswapV3RewardToken`.

## UniswapV3 Reward Token

This token is used as a bridge between `UniswapV3Staker` contract which handles the liquidity mining on Uniswap V3 and the `TokenDistro`. 

We must use this bridging token because the UniV3 incentive has no way to call `TokenDistro.allocate` when rewards are claimed. If the rewards in GIV are claimed directly from UniV3, there would be no way to enforce that the correct proportion of the claim is placed in the GIVStream. 

To accomplish this, the reward token contract maintains a fake balance that represents GIV that should be assigned and claimed from the TokenDistro. When a recipient withdraws rewards from the UniV3 incentive contract, the exact amount of reward tokens is "burned" and real GIV is allocated to the recipient via `TokenDistro.allocate`.

The token implements the ERC-20 standard in such a way to **only** allow interactions between the TokenDistro and the UniV3 staker contract.

The contract implements `ownable` and is owned by the deployer address.

### The `approve` and `allowance` functions

The UniV3 incentive contract is the only account that is allowed to call transfer from, and it has a constant `MAX_UINT256` allowance.
Approve is unused, but for interface compatibility always returns `true`.

### The `transferFrom` function

This function is called by the `UniV3Staker` contract when creating a new incentive:
```
function createIncentive(IncentiveKey memory key, uint256 reward) external override {
  ...

  TransferHelper.safeTransferFrom(
      address(key.rewardToken),
      msg.sender,
      address(this),
      reward
  );

  ...
}
```

The `transferFrom` call will only succeed if:
- Is called by the UniV3 staker contract
- Is `from` the contract `owner`
- Is `to` the the UniV3 staker contract

For the `createIncentive` to succeed, the caller **must** be the `owner` of the contract.

The `transferFrom` will "mint" the reward tokens that can later be burned and instead real GIV allocated in the TokenDistro by calling `transfer`.

### The `transfer` function

This function is called by the `UniV3Staker` when a recipient claims rewards:
```
function claimReward(
    IERC20Minimal rewardToken,
    address to,
    uint256 amountRequested
) external override returns (uint256 reward) {
    ...
  
    TransferHelper.safeTransfer(address(rewardToken), to, reward);
  
    ...
}
```
To succeed, `transfer` **must** be called by the UniV3 staker contract.

When called, this function will "burn" the claimed amount of reward tokens and then call `TokenDistro.allocate` with the same amount. The `allocate` call will allocate actual GIV tokens as stream and perform a claim to transfer the released part of the stream.

This function emits a `RewardPaid(uint256 amount, address to)` event.

## GIV Token

This is the GIV token contract that is deployed to both Ethereum mainnet and Gnosis chain.

GIV is a lightweight ERC-20 token modeled after the [uniswap implementation](https://github.com/Uniswap/v2-core/blob/v1.0.1/contracts/UniswapV2ERC20.sol) with some modifications:

- It has exposed `mint` and `burn` functions
  - With associated `minter` role
    - Total supply is uncapped
- [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009) `transferWithAuthorization`
- `DOMAIN_SEPARATOR` is computed inside `_validateSignedData` to avoid reply-attacks due to Hardforks
- Forbids transfers to the contract and address(0)
  - This is to avoid losing tokens in the contract and to enforce burn events

**NOTE:** The actual GIV token is not meant to be deployed from the GIVEconomy repo, and was deployed separately before mainnet launch.
