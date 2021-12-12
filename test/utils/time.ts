import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { network } from "hardhat";
import { advanceBlock, latestBlock } from "./block";

export async function latestBlockNumber(): Promise<BigNumber> {
    return BigNumber.from((await latestBlock()).number);
}

export async function latestTimestamp(): Promise<BigNumber> {
    return BigNumber.from((await latestBlock()).timestamp);
}

export async function increaseTime(amount: BigNumberish) {
    const inc = BigNumber.from(amount);

    if (inc.isNegative()) {
        throw Error(`Increase amount must not be negative, is (${amount})`);
    }

    await network.provider.send("evm_increaseTime", [inc.toNumber()]);
}

export async function increaseTimeAndMine(amount: BigNumberish) {
    await increaseTime(amount);
    await advanceBlock();
}

export async function increaseTimeToAndMine(target: BigNumberish) {
    const newT = BigNumber.from(target);
    const now = await latestTimestamp();

    if (newT.lt(now)) {
        throw Error(
            `Cannot increase current time (${now.toString()}) to a moment in the past (${newT.toString()})`,
        );
    }

    const diff = newT.sub(now);
    return increaseTimeAndMine(diff);
}

function seconds(val: BigNumberish) {
    return BigNumber.from(val);
}

function minutes(val: BigNumberish) {
    return BigNumber.from(val).mul(seconds("60"));
}

function hours(val: BigNumberish) {
    return BigNumber.from(val).mul(minutes("60"));
}

function days(val: BigNumberish) {
    return BigNumber.from(val).mul(hours("24"));
}

function weeks(val: BigNumberish) {
    return BigNumber.from(val).mul(days("7"));
}

function years(val: BigNumberish) {
    return BigNumber.from(val).mul(days("365"));
}

export const duration = { seconds, minutes, hours, days, weeks, years };
