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
$ npm run csv2json

> generate-merkle-root
> ts-node scripts/csv2json.ts ./files/GIV_tokens_-_AIRDROP_TEST_LIST.csv ./files/merkle_distributor.json

Total distributed tokens: 14430863000000000000000000
```
* Get merkletree root 
```
$ cat files/merkle_distributor_result.json | jq '.merkleRoot'
"0x05176bac832b5a9cd000091d231638fe0e854801c447aae625ed2f710c026196"
```

## Deploy
**To select the gasPrice you need to edit the hardhat.config.ts**

### xDAI (Rinkeby)
```
npm run deploy:rinkeby

> hardhat-project@ deploy:rinkeby /Users/edu/Development/GivethContracts
> HARDHAT_NETWORK=rinkeby node deployments/xDAI/1_tokenDistro_merkleDistro_Unipool.js 1628935200 0x1f039430895e75623676768068b9c337c50632a0 0x32Bb791A4815ABa5458033111abE6803e3C89011 1200000 0x8cdD816791ce1dCDD64cbE8ffBB1C40632d705F3 250000 500000


#######################
##### Deployments #####
#######################
Deployer: 0x552C0c7F1eeBfeB80688170A654492d8240076FA
totalTokens: 16836637.0
startTime: 1628935200
cliffPeriod: 0
duration: 157680000
initialPercentage: 1000
tokenAddress: 0x1f039430895e75623676768068b9C337C50632A0
LMDuration: 1209600
cancelable: false
merkletree_file: ./files/merkle_distributor_xdai_result.json
merkleTokens: 14886637.0

#######################
##### TokenDistro #####
#######################

deployer: 0x552C0c7F1eeBfeB80688170A654492d8240076FA
totalTokens: 16836637.0
startTime: 1628935200
cliffPeriod: 0
duration: 157680000
initialPercentage: 1000
tokenAddress: 0x1f039430895e75623676768068b9C337C50632A0
cancelable: false
########################

TokenDistro deployed to: 0xdd8b26E3E6C487298966C45Ec141544C7967bF95

#######################
#####    Check    #####
#######################
TokenDistro - totalTokens: 16836637.0
TokenDistro - startTime: 1628935200
TokenDistro - cliffPeriod: 1628935200
TokenDistro - duration: 157680000
TokenDistro - initialAmount: 1683663700000000000000000
TokenDistro - token: 0x1f039430895e75623676768068b9C337C50632A0
TokenDistro - cancelable: false
This smartcontract needs:  16836637.0 Tokens
token.mint("0xdd8b26E3E6C487298966C45Ec141544C7967bF95","16836637000000000000000000")

########################
##### MerkleDistro #####
########################

deployer: 0x552C0c7F1eeBfeB80688170A654492d8240076FA
distroAddress: 0xdd8b26E3E6C487298966C45Ec141544C7967bF95
merkletree_file: ./files/merkle_distributor_xdai_result.json
#######################

MerkleDistro deployed to: 0x53eA14b58A99A4D6Ba34E1808749bfC201eB6Df8

#######################

TokenDistro - assign: MerkleDistro 14886637000000000000000000

#######################
#####    Check    #####
#######################
MerkleDrop - _tokenDistro: 0xdd8b26E3E6C487298966C45Ec141544C7967bF95
MerkleDrop - _merkleRoot: 0xfc1900e7ef233d04ced12d8f259d64a6389459837552f1887aed6cdb746e572c


######################################################
####### 50GIV/HNY - honeyswap - xDai 1,200,000 #######
######################################################
deployer: 0x552C0c7F1eeBfeB80688170A654492d8240076FA
tokenDistribution: 0xdd8b26E3E6C487298966C45Ec141544C7967bF95
uni: 0x32Bb791A4815ABa5458033111abE6803e3C89011
duration: 1209600
##############################################

GIVHNY_XDAI deployed to: 0x7d759439E1C5dDE3796852f950D522Dc7de38E25

##############################################

TokenDistro - assign: givhny_xdai 1200000

#######################
#####    Check    #####
#######################
givhny_xdai(tokenDistro,duration,periodFinish,uni):
givhny_xdai - tokenDistro: 0xdd8b26E3E6C487298966C45Ec141544C7967bF95
givhny_xdai - duration: 1209600
givhny_xdai - periodFinish: 0
givhny_xdai - uni: 0x32Bb791A4815ABa5458033111abE6803e3C89011


######################################################
####### 50GIV/WETH - honeyswap - xDai 250,000  #######
######################################################
deployer: 0x552C0c7F1eeBfeB80688170A654492d8240076FA
tokenDistribution: 0xdd8b26E3E6C487298966C45Ec141544C7967bF95
uni: 0x8cdD816791ce1dCDD64cbE8ffBB1C40632d705F3
duration: 1209600
##############################################

GIVHNY_XDAI deployed to: 0xD8db35876A1DdcA662e3993C36ef0346E548aaB6

##############################################

TokenDistro - assign: givhny_xdai 250000

#######################
#####    Check    #####
#######################
givweth_xdai(tokenDistro,duration,periodFinish,uni):
givweth_xdai - tokenDistro: 0xdd8b26E3E6C487298966C45Ec141544C7967bF95
givweth_xdai - duration: 1209600
givweth_xdai - periodFinish: 0
givweth_xdai - uni: 0x8cdD816791ce1dCDD64cbE8ffBB1C40632d705F3


######################################################
#######     GIVstaking xDai - xDai - 500,000   #######
######################################################
deployer: 0x552C0c7F1eeBfeB80688170A654492d8240076FA
tokenDistribution: 0xdd8b26E3E6C487298966C45Ec141544C7967bF95
uni: 0x1f039430895e75623676768068b9C337C50632A0
duration: 1209600
##############################################

UNIGIV deployed to: 0x9D63b38f61F3C8053f891F1B918a7c75DFE5FBC8

##############################################

TokenDistro - assign: givhny_xdai 500000

#######################
#####    Check    #####
#######################
unigiv(tokenDistro,duration,periodFinish,uni):
unigiv - tokenDistro: 0xdd8b26E3E6C487298966C45Ec141544C7967bF95
unigiv - duration: 1209600
unigiv - periodFinish: 0
unigiv - uni: 0x1f039430895e75623676768068b9C337C50632A0


#######################
#####  Final checks ###
#######################
tokenDistro.balances(tokenDistro.address) allocated: 0.0 claimed: 0.0
tokenDistro.balances(merkleDistro.address) allocated: 14886637.0 claimed: 0.0
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

> hardhat-project@ deploy:kovan /Users/edu/Development/GivethContracts
> HARDHAT_NETWORK=kovan node deployments/mainnet/2_tokenDistro_Unipools.js 1628935200 0x86B94D365c94De153d6023f243c2b6e6c6c7626C 0x8A094453df88D5D6B27162F949898e2d95462f80 1100000 0x632045A9CFa9d232d0dd46702033C850D0E06f0F 200000 200000


#######################
##### Deployments #####
#######################
Deployer: 0x552C0c7F1eeBfeB80688170A654492d8240076FA
totalTokens: 1500000.0
startTime: 1628935200
cliffPeriod: 0
duration: 157680000
initialPercentage: 1000
tokenAddress: 0x86B94D365c94De153d6023f243c2b6e6c6c7626C
LMDuration: 1209600
cancelable: false

#######################
##### TokenDistro #####
#######################

deployer: 0x552C0c7F1eeBfeB80688170A654492d8240076FA
totalTokens: 1500000.0
startTime: 1628935200
cliffPeriod: 0
duration: 157680000
initialPercentage: 1000
tokenAddress: 0x86B94D365c94De153d6023f243c2b6e6c6c7626C
cancelable: false
########################

TokenDistro deployed to: 0xBc30Ffa2Ec0ebc845da2eef94C91c1D6019c4399

#######################
#####    Check    #####
#######################
TokenDistro - totalTokens: 1500000.0
TokenDistro - startTime: 1628935200
TokenDistro - cliffPeriod: 1628935200
TokenDistro - duration: 157680000
TokenDistro - initialAmount: 150000000000000000000000
TokenDistro - token: 0x86B94D365c94De153d6023f243c2b6e6c6c7626C
TokenDistro - cancelable: false
This smartcontract needs:  1500000.0 Tokens
token.mint("0xBc30Ffa2Ec0ebc845da2eef94C91c1D6019c4399","1500000000000000000000000")

######################################################
#######   50GIV/ETH - Uni  Mainnet 1,100,000   #######
######################################################
deployer: 0x552C0c7F1eeBfeB80688170A654492d8240076FA
tokenDistribution: 0xBc30Ffa2Ec0ebc845da2eef94C91c1D6019c4399
uni: 0x8A094453df88D5D6B27162F949898e2d95462f80
duration: 1209600
##############################################

GIVETH_UNI deployed to: 0x2E4957d624dC26D4BA6564Ca962F859FBD7f4931

##############################################

TokenDistro - assign: giveth_uni 1100000

#######################
#####    Check    #####
#######################
giveth_uni(tokenDistro,duration,periodFinish,uni):
giveth_uni - tokenDistro: 0xBc30Ffa2Ec0ebc845da2eef94C91c1D6019c4399
giveth_uni - duration: 1209600
giveth_uni - periodFinish: 0
giveth_uni - uni: 0x8A094453df88D5D6B27162F949898e2d95462f80


######################################################
####### 80GIV/ETH - Bal   Mainnet   200,000  #######
######################################################
deployer: 0x552C0c7F1eeBfeB80688170A654492d8240076FA
tokenDistribution: 0xBc30Ffa2Ec0ebc845da2eef94C91c1D6019c4399
uni: 0x632045A9CFa9d232d0dd46702033C850D0E06f0F
duration: 1209600
##############################################

GIVETH_UNI deployed to: 0x673beb49D51947E33BE53FfAcB1b7024487AC97A

##############################################

TokenDistro - assign: giveth_uni 200000

#######################
#####    Check    #####
#######################
giveth_bal(tokenDistro,duration,periodFinish,uni):
giveth_bal - tokenDistro: 0xBc30Ffa2Ec0ebc845da2eef94C91c1D6019c4399
giveth_bal - duration: 1209600
giveth_bal - periodFinish: 0
giveth_bal - uni: 0x632045A9CFa9d232d0dd46702033C850D0E06f0F


######################################################
#######   GIVstaking ETH    Mainnet    200,000   #######
######################################################
deployer: 0x552C0c7F1eeBfeB80688170A654492d8240076FA
tokenDistribution: 0xBc30Ffa2Ec0ebc845da2eef94C91c1D6019c4399
uni: 0x86B94D365c94De153d6023f243c2b6e6c6c7626C
duration: 1209600
##############################################

UNIGIV deployed to: 0x53886aDf203eeC9e04FAe71473753cC9761f075E

##############################################

TokenDistro - assign: giveth_uni 200000

#######################
#####    Check    #####
#######################
unigiv(tokenDistro,duration,periodFinish,uni):
unigiv - tokenDistro: 0xBc30Ffa2Ec0ebc845da2eef94C91c1D6019c4399
unigiv - duration: 1209600
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