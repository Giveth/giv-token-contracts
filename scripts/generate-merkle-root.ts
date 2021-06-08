import { program } from 'commander'
import fs from 'fs'
import { parseBalanceMap } from '../src/parse-balance-map'

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

const json = JSON.parse(fs.readFileSync(program.opts().input, { encoding: 'utf8' }))

if (typeof json !== 'object') throw new Error('Invalid JSON')

let result = JSON.stringify(parseBalanceMap(json));
console.log(result)

fs.writeFile(program.opts().output, result, function (err) {
  if (err) {
    console.log(err);
  }
});