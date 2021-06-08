import { program } from 'commander'
import ethers from 'hardhat';

console.log(ethers)
program
  .version('0.0.0')
  .requiredOption(
    '-i, --input <path>',
    'input JSON file location containing a map of account addresses to string balances',
  )
  .requiredOption(
    '-o, --output <path>',
    'output JSON file',
  )

program.parse(process.argv)
console.log(program.opts().input)
