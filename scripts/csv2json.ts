import { readFileSync, writeFile } from 'fs';

var args = process.argv.slice(2);

const file = readFileSync(args[0], 'utf-8');
let data = JSON.stringify(csvJSON(file), null, 2);

writeFile(args[1], data, function(err) {
    if (err) {
        console.log(err);
    }
});

function csvJSON(csv: any) {
    const lines = csv.split('\r\n')
    const result = []
    const headers = lines[0].split(',')
    var totalTokens = BigInt(0);

    for (let i = 1; i < lines.length; i++) {        
        if (!lines[i])
            continue
        const obj: any = {}
        const currentline = lines[i].split(',')

        obj[headers[0]] = currentline[0];
        obj[headers[1]] = '0x'+(BigInt(currentline[1]) * BigInt(10**18)).toString(16);
        obj["reasons"] = 'airdrop';
        totalTokens =  totalTokens + (BigInt(currentline[1]) * BigInt(10**18));
        result.push(obj)
    }
    console.log("Total distributed tokens:",totalTokens.toString())
    return result
}