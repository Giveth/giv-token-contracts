import { readFileSync, writeFile } from 'fs';
import { BigNumber, ethers } from 'ethers';

type recipient = {
    address: string;
    allocation: string;
    reasons: string[]
};

var args = process.argv.slice(2);

const file = readFileSync(args[0], 'utf-8');

let dataxDAI = JSON.stringify(csvJSON(file, args[1]), null, 2);

writeFile(args[1], dataxDAI, function (err) {
    if (err) {
        console.log(err);
    }
});

function csvJSON(csv: any, file: string) {
    const lines = csv.replace(/(\r\n|\n|\r)/gm, "\n").split('\n')
    var totalTokens = ethers.utils.parseEther("0");
    var totalTokensFinal = ethers.utils.parseEther("0");
    var result: { [address: string]: recipient } = {};

    for (let i = 0; i < lines.length; i++) {
        if (!lines[i])
            continue
        const currentline = lines[i].split(',');
        const currentAddress = ethers.utils.getAddress(currentline[0]);
        const currentAllocation = ethers.utils.parseEther(currentline[1])
        const currentReason = currentline[2];
        if (!result[currentAddress]) {
            result[currentAddress] = {
                address: currentAddress,
                allocation: currentAllocation.toString(),
                reasons: currentReason ? [currentReason] : ["-"]
            }
            totalTokens = totalTokens.add(currentAllocation);
        } else {
            var previousAllocation = BigNumber.from(result[currentAddress].allocation);
            var newAllocation = currentAllocation.add(previousAllocation);
            result[currentAddress].allocation = newAllocation.toString();
            totalTokens = totalTokens.add(currentAllocation);
            if (currentReason && !result[currentAddress].reasons.includes(currentReason)) {
                result[currentAddress].reasons.push(currentReason)
            }
        }
    }
    Object.entries(result).forEach(
        ([key]) => {
            let split = BigNumber.from(result[key].allocation)
            let hexValue = split.toHexString();
            totalTokensFinal = totalTokensFinal.add(split.toString())
            result[key].allocation = hexValue;
        }
    );

    console.log("Total distributed tokens:", file, "amount:", ethers.utils.formatEther(totalTokensFinal.toString()).toString())
    return Array.from(Object.keys(result), k => result[k])
}