## Install pre-requisites

```
$ npm i
```

## Compile
```
$ npm run compile
```

## Test
```
$ npm run compile
```

## Generate merkle tree files
* Pre-process csv
```
$ npm run csv2json

> hardhat-project@ csv2json /Users/edu/Development/GivethContracts
> ts-node scripts/csv2json.ts ./files/GIV_tokens_-_AIRDROP_TEST_LIST.csv ./files/merkle_distributor_xdai.json

Total distributed tokens: ./files/merkle_distributor_xdai.json amount: 14886637.0
```
* Generate merkle_distributor_result.json
```
$ npm run generate-merkle-root

> generate-merkle-root
> ts-node scripts/csv2json.ts ./files/GIV_tokens_-_AIRDROP_TEST_LIST.csv ./files/merkle_distributor.json

Total distributed tokens: 14430863000000000000000000
```
* Get merkletree root 
```
$ cat ./files/merkle_distributor_xdai_result.json  | jq '.merkleRoot'
"0x05176bac832b5a9cd000091d231638fe0e854801c447aae625ed2f710c026196"
```

## Deploy
**To select the gasPrice you need to edit the hardhat.config.ts**

### xDAI (Rinkeby)
```
/Users/amin/.nvm/versions/node/v14.17.5/bin/node /Users/amin/.nvm/versions/node/v14.17.5/lib/node_modules/npm/bin/npm-cli.js run deploy:rinkeby --scripts-prepend-node-path=auto

> hardhat-project@ deploy:rinkeby /Users/amin/Work/giveth/giv-token-contracts
> HARDHAT_NETWORK=rinkeby node deployments/xDAI/1_tokenDistro_merkleDistro_Unipool.js 1632830400 0x6F45aFf8c1e50DB099DAb43292C28240be2b7485 0xb3c4538b9413522c25e18ba1095f43ca780813f2 1200000 0x8fb2d187eba62970c13d0037304260b9fef721c5 250000 500000


#######################
##### Deployments #####
#######################
Deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
totalTokens: 16853302.0
startTime: 1632830400
cliffPeriod: 0
duration: 5631428
initialPercentage: 1000
tokenAddress: 0x6F45aFf8c1e50DB099DAb43292C28240be2b7485
LMDuration: 43200
cancelable: false
merkletree_file: ./files/merkle_distributor_xdai_result.json
merkleTokens: 14903302.0

#######################
##### TokenDistro #####
#######################

deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
totalTokens: 16853302.0
startTime: 1632830400
cliffPeriod: 0
duration: 5631428
initialPercentage: 1000
tokenAddress: 0x6F45aFf8c1e50DB099DAb43292C28240be2b7485
cancelable: false
########################

TokenDistro deployed to: 0x5703cD29e9216711b1114F53e94577A7207DBFBb

#######################
#####    Check    #####
#######################
TokenDistro - totalTokens: 16853302.0
TokenDistro - startTime: 1632830400
TokenDistro - cliffPeriod: 1632830400
TokenDistro - duration: 5631428
TokenDistro - initialAmount: 1685330200000000000000000
TokenDistro - token: 0x6F45aFf8c1e50DB099DAb43292C28240be2b7485
TokenDistro - cancelable: false
This smartcontract needs:  16853302.0 Tokens
token.mint("0x5703cD29e9216711b1114F53e94577A7207DBFBb","16853302000000000000000000")

########################
##### MerkleDistro #####
########################

deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
distroAddress: 0x5703cD29e9216711b1114F53e94577A7207DBFBb
merkletree_file: ./files/merkle_distributor_xdai_result.json
#######################

MerkleDistro deployed to: 0x946580CB35D2f027201B366F011Ad3712Aa96a2E

#######################

TokenDistro - assign: MerkleDistro 14903302000000000000000000

#######################
#####    Check    #####
#######################
MerkleDistro - _tokenDistro: 0x5703cD29e9216711b1114F53e94577A7207DBFBb
MerkleDistro - _merkleRoot: 0x7358108e9153522c01c98af4678d166a72e10d4ca33e6d251d83550121db20fe


######################################################
####### 50GIV/HNY - honeyswap - xDai 1,200,000 #######
######################################################
deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
tokenDistribution: 0x5703cD29e9216711b1114F53e94577A7207DBFBb
uni: 0xb3C4538b9413522C25E18bA1095f43Ca780813F2
duration: 43200
##############################################

GIVHNY_XDAI deployed to: 0xC3B9d4FC4A9CdD6a410A09Bae11d5619286254cE

##############################################

TokenDistro - assign: givhny_xdai 1200000

#######################
#####    Check    #####
#######################
givhny_xdai(tokenDistro,duration,periodFinish,uni):
givhny_xdai - tokenDistro: 0x5703cD29e9216711b1114F53e94577A7207DBFBb
givhny_xdai - duration: 43200
givhny_xdai - periodFinish: 0
givhny_xdai - uni: 0xb3C4538b9413522C25E18bA1095f43Ca780813F2


######################################################
####### 50GIV/WETH - honeyswap - xDai 250,000  #######
######################################################
deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
tokenDistribution: 0x5703cD29e9216711b1114F53e94577A7207DBFBb
uni: 0x8Fb2D187EBa62970C13D0037304260b9feF721c5
duration: 43200
##############################################

GIVHNY_XDAI deployed to: 0xa194A63a0F5B362C0958DC9FB2D01B2d5e2F9DB7

##############################################

TokenDistro - assign: givhny_xdai 250000

#######################
#####    Check    #####
#######################
givweth_xdai(tokenDistro,duration,periodFinish,uni):
givweth_xdai - tokenDistro: 0x5703cD29e9216711b1114F53e94577A7207DBFBb
givweth_xdai - duration: 43200
givweth_xdai - periodFinish: 0
givweth_xdai - uni: 0x8Fb2D187EBa62970C13D0037304260b9feF721c5


######################################################
#######     GIVstaking xDai - xDai - 500,000   #######
######################################################
deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
tokenDistribution: 0x5703cD29e9216711b1114F53e94577A7207DBFBb
uni: 0x6F45aFf8c1e50DB099DAb43292C28240be2b7485
duration: 43200
##############################################

UNIGIV deployed to: 0x3c44b1E8b93efb496D0946Aa132E7b4C190d28fB

##############################################

TokenDistro - assign: givhny_xdai 500000

#######################
#####    Check    #####
#######################
unigiv(tokenDistro,duration,periodFinish,uni):
unigiv - tokenDistro: 0x5703cD29e9216711b1114F53e94577A7207DBFBb
unigiv - duration: 43200
unigiv - periodFinish: 0
unigiv - uni: 0x6F45aFf8c1e50DB099DAb43292C28240be2b7485


#######################
#####  Final checks ###
#######################
tokenDistro.balances(tokenDistro.address) allocated: 0.0 claimed: 0.0
tokenDistro.balances(merkleDistro.address) allocated: 14903302.0 claimed: 0.0
tokenDistro.balances(givhny_xdai.address) allocated: 1200000.0 claimed: 0.0
tokenDistro.balances(givweth_xdai.address) allocated: 250000.0 claimed: 0.0
tokenDistro.balances(unigiv.address) allocated: 500000.0 claimed: 0.0
tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),merkleDistro.address) true
tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),givhny_xdai.address) true
tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),givweth_xdai.address) true
tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),unigiv.address) true
```

### Mainnet (Kovan)
```
/Users/amin/.nvm/versions/node/v14.17.5/bin/node /Users/amin/.nvm/versions/node/v14.17.5/lib/node_modules/npm/bin/npm-cli.js run deploy:kovan --scripts-prepend-node-path=auto

> hardhat-project@ deploy:kovan /Users/amin/Work/giveth/giv-token-contracts
> HARDHAT_NETWORK=kovan node deployments/mainnet/2_tokenDistro_Unipools.js 1635007800 0x03472537CB64652Aa1224E4aaF6f33a34e73E877 0x487195072fB88ddE7DDA2Ef1A688C6380b995478 10000000 0x1ee71e1ed744ae6d4058f5c7797c2e583dbfb095 2500000 2500000


#######################
##### Deployments #####
#######################
Deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
totalTokens: 15000000.0
startTime: 1635007800
cliffPeriod: 0
duration: 11262857
initialPercentage: 1000
tokenAddress: 0x03472537CB64652Aa1224E4aaF6f33a34e73E877
LMDuration: 43200
cancelable: false

#######################
##### TokenDistro #####
#######################

deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
totalTokens: 15000000.0
startTime: 1635007800
cliffPeriod: 0
duration: 11262857
initialPercentage: 1000
tokenAddress: 0x03472537CB64652Aa1224E4aaF6f33a34e73E877
cancelable: false
########################

TokenDistro deployed to: 0x60A936F085403160864653B7d0d2c3bc133d18D0

#######################
#####    Check    #####
#######################
TokenDistro - totalTokens: 15000000.0
TokenDistro - startTime: 1635007800
TokenDistro - cliffPeriod: 1635007800
TokenDistro - duration: 11262857
TokenDistro - initialAmount: 1500000000000000000000000
TokenDistro - token: 0x03472537CB64652Aa1224E4aaF6f33a34e73E877
TokenDistro - cancelable:
false This smart-contract needs:  15000000.0 Tokens
token.mint("0x60A936F085403160864653B7d0d2c3bc133d18D0","15000000000000000000000000")

######################################################
#######   50GIV/ETH - Uni  Mainnet 10000000   #######
######################################################
deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
tokenDistribution: 0x60A936F085403160864653B7d0d2c3bc133d18D0
uni staker: 0x1f98407aaB862CdDeF78Ed252D6f557aA5b0f00d
duration: 43200
##############################################

GIVETH_UNI_REWARD deployed to: 0x6b66368EddB78E61179523cf21049af40f797F4E

##############################################

UniswapV3RewardToken - mint: GIVETH_UNI_STAKER 10000000
TokenDistro - assign: giveth_uni_reward 10000000
The new incentiveId will be 0x550595f7254e7d91d5e063bf0a09cabe6632ab716e56bc9962905ca659e6c1f2
Checking if deployer (0x5f672d71399d8cDbA64f596394b4f4381247E025) has enough rewards token balance...
Balance 10000000.0 (10000000000000000000000000) is sufficient.
Checking if deployer (0x5f672d71399d8cDbA64f596394b4f4381247E025) has approved staker contract to spend the reward...
Missing 10000000000000000000000000 allowance. Setting up allowance...
Creating approve() tx 0x02dcfc046e3e496f22ecf7bc36fe8888c8d3543eef3d1c75a8bf4d71e7ae2308...
Tx 0x02dcfc046e3e496f22ecf7bc36fe8888c8d3543eef3d1c75a8bf4d71e7ae2308 confirmed!


Key:  {
  startTime: '1635007800',
  endTime: '1646270657',
  pool: '0x487195072fB88ddE7DDA2Ef1A688C6380b995478',
  rewardToken: '0x6b66368EddB78E61179523cf21049af40f797F4E',
  refundee: '0x5f672d71399d8cDbA64f596394b4f4381247E025'
}



Creating incentive in tx 0xc6dbc2bd743dce7b86e297b218ad843818b3373e79e4bae8df00d7690a899421...

#######################
#####    Check    #####
#######################
giveth_uni_reward(tokenDistro,duration,periodFinish,uni):
giveth_uni_reward - tokenDistro: 0x60A936F085403160864653B7d0d2c3bc133d18D0

uniswap v3 staker - balance of giveth_uni_reward: 10000000.0


######################################################
####### 80GIV/ETH - Bal   Mainnet   2500000  #######
######################################################
deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
tokenDistribution: 0x60A936F085403160864653B7d0d2c3bc133d18D0
uni: 0x1eE71e1Ed744AE6D4058F5c7797C2e583DbfB095
duration: 43200
##############################################

GIVETH_BAL deployed to: 0x087Cbc387b8746A73E3EbA9A31782F5ee7B6cC45

##############################################

TokenDistro - assign: giveth_uni_reward 2500000

#######################
#####    Check    #####
#######################
giveth_bal(tokenDistro,duration,periodFinish,uni):
giveth_bal - tokenDistro: 0x60A936F085403160864653B7d0d2c3bc133d18D0
giveth_bal - duration: 43200
giveth_bal - periodFinish: 0
giveth_bal - uni: 0x1eE71e1Ed744AE6D4058F5c7797C2e583DbfB095


######################################################
#######   GIVstaking ETH    Mainnet    2500000   #######
######################################################
deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
tokenDistribution: 0x60A936F085403160864653B7d0d2c3bc133d18D0
uni: 0x03472537CB64652Aa1224E4aaF6f33a34e73E877
duration: 43200
##############################################

UNIGIV deployed to: 0x8d74ee0C611fA62210B66e051f31A0c103b6eDD6

##############################################

TokenDistro - assign: giveth_uni_reward 2500000

#######################
#####    Check    #####
#######################
unigiv(tokenDistro,duration,periodFinish,uni):
unigiv - tokenDistro: 0x60A936F085403160864653B7d0d2c3bc133d18D0
unigiv - duration: 43200
unigiv - periodFinish: 0
unigiv - uni: 0x03472537CB64652Aa1224E4aaF6f33a34e73E877


#######################
#####  Final checks ###
#######################
tokenDistro.balances(tokenDistro.address) allocated: 0.0 claimed: 0.0
tokenDistro.balances(giveth_uni_reward.address) allocated: 10000000.0 claimed: 0.0
tokenDistro.balances(giveth_bal.address) allocated: 2500000.0 claimed: 0.0
tokenDistro.balances(unigiv.address) allocated: 2500000.0 claimed: 0.0
tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),giveth_uni_reward.address) true
tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),giveth_bal.address) true
tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),unigiv.address) true
```
