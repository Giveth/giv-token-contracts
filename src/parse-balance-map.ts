import { BigNumber, utils } from 'ethers'
import BalanceTree from './balance-tree'

const { isAddress, getAddress } = utils

// This is the blob that gets distributed and pinned to IPFS.
// It is completely sufficient for recreating the entire merkle tree.
// Anyone can verify that all air drops are included in the tree,
// and the tree has no additional distributions.
interface MerkleDistributorInfo {
  merkleRoot: string
  tokenTotal: string
  claims: {
    [account: string]: {
      index: number
      amount: string
      proof: string[]
      flags?: {
        [flag: string]: boolean
      }
    }
  }
}

type NewFormat = { address: string; allocation: string; name: string; reasons: string }

export function parseBalanceMap(balances: NewFormat[]): MerkleDistributorInfo {

  const dataByAddress = balances.reduce<{
    [address: string]: { amount: BigNumber; flags?: { [flag: string]: boolean } }
  }>((memo, { address: account, allocation, reasons }) => {
    if (!isAddress(account)) {
      throw new Error(`Found invalid address: ${account}`)
    }
    const parsed = getAddress(account)
    if (memo[parsed]) throw new Error(`Duplicate address: ${parsed}`)
    const parsedNum = BigNumber.from(allocation)
    if (parsedNum.lte(0)) throw new Error(`Invalid amount for account: ${account}`)

    const flags = {
      isAirdrop: reasons.includes('airdrop'),
    }

    memo[parsed] = { amount: parsedNum, ...(reasons === '' ? {} : { flags }) }
    return memo
  }, {})

  const sortedAddresses = Object.keys(dataByAddress).sort()

  // construct a tree
  const tree = new BalanceTree(
    sortedAddresses.map((address) => ({ account: address, amount: dataByAddress[address].amount }))
  )

  // generate claims
  const claims = sortedAddresses.reduce<{
    [address: string]: { amount: string; index: number; proof: string[]; flags?: { [flag: string]: boolean } }
  }>((memo, address, index) => {
    const { amount, flags } = dataByAddress[address]
    memo[address] = {
      index,
      amount: amount.toHexString(),
      proof: tree.getProof(index, address, amount),
      ...(flags ? { flags } : {}),
    }
    return memo
  }, {})

  const tokenTotal: BigNumber = sortedAddresses.reduce<BigNumber>(
    (memo, key) => memo.add(dataByAddress[key].amount),
    BigNumber.from(0)
  )

  return {
    merkleRoot: tree.getHexRoot(),
    tokenTotal: tokenTotal.toHexString(),
    claims,
  }
}