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
> HARDHAT_NETWORK=rinkeby node deployments/xDAI/1_tokenDistro_merkleDistro_Unipool.js 1629374400 0x6F45aFf8c1e50DB099DAb43292C28240be2b7485 0xb3c4538b9413522c25e18ba1095f43ca780813f2 1200000 0x8fb2d187eba62970c13d0037304260b9fef721c5 250000 500000


#######################
##### Deployments #####
#######################
Deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
totalTokens: 16853302.0
startTime: 1629374400
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
startTime: 1629374400
cliffPeriod: 0
duration: 5631428
initialPercentage: 1000
tokenAddress: 0x6F45aFf8c1e50DB099DAb43292C28240be2b7485
cancelable: false
########################

TokenDistro deployed to: 0xc35D99F05C7e340eB78E850696DbF3dbb51C4160

#######################
#####    Check    #####
#######################
TokenDistro - totalTokens: 16853302.0
TokenDistro - startTime: 1629374400
TokenDistro - cliffPeriod: 1629374400
TokenDistro - duration: 5631428
TokenDistro - initialAmount: 1685330200000000000000000
TokenDistro - token: 0x6F45aFf8c1e50DB099DAb43292C28240be2b7485
TokenDistro - cancelable: false
This smartcontract needs:  16853302.0 Tokens
token.mint("0xc35D99F05C7e340eB78E850696DbF3dbb51C4160","16853302000000000000000000")

########################
##### MerkleDistro #####
########################

deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
distroAddress: 0xc35D99F05C7e340eB78E850696DbF3dbb51C4160
merkletree_file: ./files/merkle_distributor_xdai_result.json
#######################

MerkleDistro deployed to: 0x4d6630e5c3C4f00D0B9737784e15bB0F493A23A7

#######################

TokenDistro - assign: MerkleDistro 14903302000000000000000000

#######################
#####    Check    #####
#######################
MerkleDistro - _tokenDistro: 0xc35D99F05C7e340eB78E850696DbF3dbb51C4160
MerkleDistro - _merkleRoot: 0x7358108e9153522c01c98af4678d166a72e10d4ca33e6d251d83550121db20fe


######################################################
####### 50GIV/HNY - honeyswap - xDai 1,200,000 #######
######################################################
deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
tokenDistribution: 0xc35D99F05C7e340eB78E850696DbF3dbb51C4160
uni: 0xb3C4538b9413522C25E18bA1095f43Ca780813F2
duration: 43200
##############################################

GIVHNY_XDAI deployed to: 0xe22d49ef8384599920D2915D7cF3f79B72c5683E

##############################################

TokenDistro - assign: givhny_xdai 1200000

#######################
#####    Check    #####
#######################
givhny_xdai(tokenDistro,duration,periodFinish,uni):
givhny_xdai - tokenDistro: 0xc35D99F05C7e340eB78E850696DbF3dbb51C4160
givhny_xdai - duration: 43200
givhny_xdai - periodFinish: 0
givhny_xdai - uni: 0xb3C4538b9413522C25E18bA1095f43Ca780813F2


######################################################
####### 50GIV/WETH - honeyswap - xDai 250,000  #######
######################################################
deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
tokenDistribution: 0xc35D99F05C7e340eB78E850696DbF3dbb51C4160
uni: 0x8Fb2D187EBa62970C13D0037304260b9feF721c5
duration: 43200
##############################################

GIVHNY_XDAI deployed to: 0xD2c2b6EC1c1C5Be0b5a722d00Bb085cAE7Dead0e

##############################################

TokenDistro - assign: givhny_xdai 250000

#######################
#####    Check    #####
#######################
givweth_xdai(tokenDistro,duration,periodFinish,uni):
givweth_xdai - tokenDistro: 0xc35D99F05C7e340eB78E850696DbF3dbb51C4160
givweth_xdai - duration: 43200
givweth_xdai - periodFinish: 0
givweth_xdai - uni: 0x8Fb2D187EBa62970C13D0037304260b9feF721c5


######################################################
#######     GIVstaking xDai - xDai - 500,000   #######
######################################################
deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
tokenDistribution: 0xc35D99F05C7e340eB78E850696DbF3dbb51C4160
uni: 0x6F45aFf8c1e50DB099DAb43292C28240be2b7485
duration: 43200
##############################################

UNIGIV deployed to: 0xD97DfF18cCd1e0cA32d5E27245C783E195735c00

##############################################

TokenDistro - assign: givhny_xdai 500000

#######################
#####    Check    #####
#######################
unigiv(tokenDistro,duration,periodFinish,uni):
unigiv - tokenDistro: 0xc35D99F05C7e340eB78E850696DbF3dbb51C4160
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
$ npm run deploy:kovan

> hardhat-project@ deploy:kovan /Users/amin/Work/giveth/giv-token-contracts
> HARDHAT_NETWORK=kovan node deployments/mainnet/2_tokenDistro_Unipools.js 1629374400 0x86B94D365c94De153d6023f243c2b6e6c6c7626C 0x8A094453df88D5D6B27162F949898e2d95462f80 1100000 0x632045A9CFa9d232d0dd46702033C850D0E06f0F 200000 200000


#######################
##### Deployments #####
#######################
Deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
totalTokens: 1500000.0
startTime: 1629374400
cliffPeriod: 0
duration: 5631428
initialPercentage: 1000
tokenAddress: 0x86B94D365c94De153d6023f243c2b6e6c6c7626C
LMDuration: 43200
cancelable: false

#######################
##### TokenDistro #####
#######################

deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
totalTokens: 1500000.0
startTime: 1629374400
cliffPeriod: 0
duration: 5631428
initialPercentage: 1000
tokenAddress: 0x86B94D365c94De153d6023f243c2b6e6c6c7626C
cancelable: false
########################

TokenDistro deployed to: 0x3087Aa93143f23BB0da42c9FAD6C1D5993bE6Fe6

#######################
#####    Check    #####
#######################
TokenDistro - totalTokens: 1500000.0
TokenDistro - startTime: 1629374400
TokenDistro - cliffPeriod: 1629374400
TokenDistro - duration: 5631428
TokenDistro - initialAmount: 150000000000000000000000
TokenDistro - token: 0x86B94D365c94De153d6023f243c2b6e6c6c7626C
TokenDistro - cancelable: false
This smartcontract needs:  1500000.0 Tokens
token.mint("0x3087Aa93143f23BB0da42c9FAD6C1D5993bE6Fe6","1500000000000000000000000")

######################################################
#######   50GIV/ETH - Uni  Mainnet 1,100,000   #######
######################################################
deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
tokenDistribution: 0x3087Aa93143f23BB0da42c9FAD6C1D5993bE6Fe6
uni: 0x8A094453df88D5D6B27162F949898e2d95462f80
duration: 43200
##############################################

GIVETH_UNI deployed to: 0x51F3E5C39a11fe189585FA2FD61A6b60E4Bc723a

##############################################

TokenDistro - assign: giveth_uni 1100000

#######################
#####    Check    #####
#######################
giveth_uni(tokenDistro,duration,periodFinish,uni):
giveth_uni - tokenDistro: 0x3087Aa93143f23BB0da42c9FAD6C1D5993bE6Fe6
giveth_uni - duration: 43200
giveth_uni - periodFinish: 0
giveth_uni - uni: 0x8A094453df88D5D6B27162F949898e2d95462f80


######################################################
####### 80GIV/ETH - Bal   Mainnet   200,000  #######
######################################################
deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
tokenDistribution: 0x3087Aa93143f23BB0da42c9FAD6C1D5993bE6Fe6
uni: 0x632045A9CFa9d232d0dd46702033C850D0E06f0F
duration: 43200
##############################################

GIVETH_UNI deployed to: 0x3A2F69aC62888DbBa4fb36e18a76435E8357465E

##############################################

TokenDistro - assign: giveth_uni 200000

#######################
#####    Check    #####
#######################
giveth_bal(tokenDistro,duration,periodFinish,uni):
giveth_bal - tokenDistro: 0x3087Aa93143f23BB0da42c9FAD6C1D5993bE6Fe6
giveth_bal - duration: 43200
giveth_bal - periodFinish: 0
giveth_bal - uni: 0x632045A9CFa9d232d0dd46702033C850D0E06f0F


######################################################
#######   GIVstaking ETH    Mainnet    200,000   #######
######################################################
deployer: 0x5f672d71399d8cDbA64f596394b4f4381247E025
tokenDistribution: 0x3087Aa93143f23BB0da42c9FAD6C1D5993bE6Fe6
uni: 0x86B94D365c94De153d6023f243c2b6e6c6c7626C
duration: 43200
##############################################

UNIGIV deployed to: 0x9cA5A8c67677A6341D147978c2661Dc6abc82E2c

##############################################

TokenDistro - assign: giveth_uni 200000

#######################
#####    Check    #####
#######################
unigiv(tokenDistro,duration,periodFinish,uni):
unigiv - tokenDistro: 0x3087Aa93143f23BB0da42c9FAD6C1D5993bE6Fe6
unigiv - duration: 43200
unigiv - periodFinish: 0
unigiv - uni: 0x86B94D365c94De153d6023f243c2b6e6c6c7626C


#######################
#####  Final checks ###
#######################
tokenDistro.balances(tokenDistro.address) allocated: 0.0 claimed: 0.0
tokenDistro.balances(giveth_uni.address) allocated: 1100000.0 claimed: 0.0
tokenDistro.balances(giveth_bal.address) allocated: 200000.0 claimed: 0.0
tokenDistro.balances(unigiv.address) allocated: 200000.0 claimed: 0.0
tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),giveth_uni.address) true
tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),giveth_bal.address) true
tokenDistro.hasRole(tokenDistro.DISTRIBUTOR_ROLE(),unigiv.address) true
```
