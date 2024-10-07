## Deploy GIV test token
1. Open ethereum remix, and use erc20 token template

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";


contract MyToken is ERC20, Ownable, ERC20Permit {
   constructor(address initialOwner)
       ERC20("Giveth", "GIV")
       Ownable(initialOwner)
       ERC20Permit("Giveth")
   {}


   function mint(address to, uint256 amount) public onlyOwner {
       _mint(to, amount);
   }
}
```

2. Deploy contract on the network
3. Verify contract (Use flatten in remix and then upload it in the remix)
4. Transfer ownership if it's needed https://cardona-zkevm.polygonscan.com/address/0xa77390562986f5d08f5aecf5d3fb82bd16b44548#writeContract
5. Mint tokens in block explorer https://cardona-zkevm.polygonscan.com/address/0xa77390562986f5d08f5aecf5d3fb82bd16b44548#writeContract

## Deploy token distro
1. Install foundry on your system https://book.getfoundry.sh/getting-started/installation
2. Run this command `Foundryup`
3. Clone this project https://github.com/giveth/giveconomy-foundry
4. `forge build`
5. Edit these parameters
```
    address givTokenOptimismMainnet = 0x528CDc92eAB044E1E39FE43B9514bfdAB4412B98; // address of giv token deployed on previous step

    // initiliaze params for token distro
    uint256 totalTokens = 2000000000000000000000000000;
    uint256 startTime = 1640361600; // read from previous published smart contract
    // like https://cardona-zkevm.polygonscan.com/address/0xa77390562986f5d08f5aecf5d3fb82bd16b44548#readContract
    uint256 cliffPeriod = 0;
    uint256 duration = 157680000; // read from previous published smart contract
    uint256 initialPercentage = 1000; // read from previous published smart contract
```
in below file https://github.com/Giveth/giveconomy-foundry/blob/develop/script/deployTokenDistro.s.sol

6. Fill `.env` file in the project with these data
```
PRIVATE_KEY=// I should start with 0x
ETHERSCAN_API_KEY= // from block explorer of that specific chain
VERIFIER_URL=https://api-cardona-zkevm.polygonscan.com/api // You can find it in block explorer
//  like https://docs.polygonscan.com/v/polygon-zkevm/getting-started/endpoint-urls

```
7. Edit https://github.com/Giveth/giveconomy-foundry/blob/develop/foundry.toml and add this line(for zkevm cardona,
for other chains you should change them based on the chain

```
cardona = { key = "${ETHERSCAN_API_KEY}", url = "https://api-cardona-zkevm.polygonscan.com/api", chain = 2442 }
```

8. Enter this command to check everything is working locally

`forge script script/deployTokenDistro.s.sol  --rpc-url  {rpcUrl}  --legacy --chain 2442 {Desired chainId}`


9. Enter this command to broadcast and verify the smart contracts on blockchain

`forge script script/deployTokenDistro.s.sol  --rpc-url  {rpcUrl}    --verify --broadcast --legacy --chain 2442 {Desired chainId}`

9. Open the block-explorer website's smart contract page (code section) and declare it as a proxy.
<img width="278" alt="image" src="https://github.com/user-attachments/assets/a9dec69a-04ef-4807-b528-cfb3d9ce533b">


This is example of published `tokenDistro`: https://cardona-zkevm.polygonscan.com/address/0x2df3e67be4e441cddd2d29c3d41dfd7d516f18e6

## Mint GIV test token for token distro
We go to [token page in the block explorer](https://cardona-zkevm.polygonscan.com/address/0xa77390562986f5d08f5aecf5d3fb82bd16b44548#writeContract) and mint as much as token that we need for token distro address

## Deploy Unipool givPower
1. change some parms in below file
https://github.com/Giveth/giveconomy-foundry/blob/develop/script/deployUnipoolGIVpower.s.sol

```
    address givTokenAddressOptimismSepolia = 0x2f2c819210191750F2E11F7CfC5664a0eB4fd5e6;
    // address tokenDistroOptimismMainnet = 0xE3Ac7b3e6B4065f4765d76fDC215606483BF3bD1;
    address tokenDistroOptimismSepolia = 0x301C739CF6bfb6B47A74878BdEB13f92F13Ae5E7;
    ProxyAdmin unipoolGIVpowerProxyAdmin = ProxyAdmin(address(0x3b197F5cDa3516bD49e193df6F1273f3f16d414a));
```
all of these params are achieved in the previous steps

2. Deploy it with foundry
`forge script script/deployUnipoolGIVpower.s.sol  --rpc-url  {rpcUrl}   --legacy --chain 2442 --verify --broadcast`

3. Verify contract with proxy admin in the block explorer

4. We call `notifyRewardAmount` method and set some reward for the contract https://cardona-zkevm.polygonscan.com/address/0x7e9f30a74fcdf035018bc007f9930aa171863e33#writeProxyContract the `rewardDistributor` address can call it (on unipool smart contract)

5. Call `transferOwnership` if it's needed

6. Call `setRewardDistribution` on Unipool GivPower to set the wallet address which will call the `notifyRewardAmount`

7. Check the Role ID of `DISTRIBUTOR_ROLE` in tokenDistro contract https://cardona-zkevm.polygonscan.com/address/0x2df3e67be4e441cddd2d29c3d41dfd7d516f18e6#readProxyContract

8. Call `grantRole` in `tokenDistro` https://cardona-zkevm.polygonscan.com/address/0x2df3e67be4e441cddd2d29c3d41dfd7d516f18e6#writeProxyContract and grant `DISTRIBUTOR_ROLE` to givPower unipool address

9. Call `assign()` method in tokenDistro and assign the reward token amount to unipool givPower


## Test
1. Call `stake` method in unipoolGivPower contract
2. See the giviverse expansion percentage in https://giveth.io/givstream
3. Call the `getReward()` method in unipool givPower contract. the `result * percentage = the amount we show in harvest modal`

## Add subgraph configs
Should add new network in https://github.com/Giveth/giveconomy-subgraph/blob/develop/networks.yaml with corresponding addresses and start block (all addresses should be in the notion file)

## Integrate with Frontend
You can know how to do it with looking at below PR
https://github.com/Giveth/giveth-dapps-v2/pull/4562/files
(LM adress is the UnipoolGivPower address, for staging ENV you should add configs to `development.tsx` and for produciton you need to add the configs to `production.tsx`

## Notify Reward Bot
1. We have a wallet address that is in charge for this purpose, we have th private key of that address in the server, so we should make sure call`setRewardDistribution` on Unipool GivPower to set the wallet address of this private key as `reward distributor`
2. We write a script in `giv-token-contract` to call it with crontab jobs https://github.com/Giveth/giv-token-contracts/commit/5188586beed3e0f73c7e0b9bbaf653134184a215
3. Transfer some gas to the reward distributor address if it doesn't have enough to make `notifyRewardAmount` transactions
4. Setup the crontab on the server to execute this script periodically

## Giv unlcok bot
1. Copy a folder of https://github.com/Giveth/givpower-bot in the server, then change config values to the new chain and bring up the docker compose, then this app will unlcok the GIVs when it's the time
2. Make sure that the wallet address of the private key that we put in the config has enough gas in it
3. Sometimes some weird things can happen, for instance we had a problem on ZKEVM unlcok bot that Amin fixed that with this PR
https://github.com/Giveth/givpower-bot/pull/8
