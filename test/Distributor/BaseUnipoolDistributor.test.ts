import { ethers } from "hardhat";
import { expect } from "chai";
import { describe, beforeEach, it } from "mocha";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumberish, BigNumber } from "ethers";

import { BaseUnipoolDistributorMock } from "../../typechain-types";
import {
    duration,
    latestTimestamp,
    increaseTimeToAndMine,
} from "../utils/time";
import { advanceBlock, setAutomine } from "../utils/block";

const { parseEther: toWei } = ethers.utils;
const { WeiPerEther } = ethers.constants;

let pool: BaseUnipoolDistributorMock;

let deployer: SignerWithAddress;
let rewardDistribution: SignerWithAddress;
let recipient1: SignerWithAddress;
let recipient2: SignerWithAddress;
let recipient3: SignerWithAddress;
let other: SignerWithAddress;

let rewardDistributionAddress: string;
let recipientAddress1: string;
let recipientAddress2: string;
let recipientAddress3: string;
let otherAddress: string;

let started: BigNumber;

function expectAlmostEqual(
    expectedOrig: BigNumberish,
    actualOrig: BigNumberish,
) {
    const expected = BigNumber.from(expectedOrig).div(WeiPerEther);
    const actual = BigNumber.from(actualOrig).div(WeiPerEther);

    expect(actual).to.be.closeTo(expected, 2);
}

async function notifyRewardAmount(amount: BigNumberish) {
    return await pool.connect(rewardDistribution).notifyRewardAmount(amount);
}

describe("BaseUnipoolDistributor", () => {
    beforeEach(async () => {
        [
            deployer,
            rewardDistribution,
            recipient1,
            recipient2,
            recipient3,
            other,
        ] = await ethers.getSigners();

        rewardDistributionAddress = await rewardDistribution.getAddress();
        recipientAddress1 = await recipient1.getAddress();
        recipientAddress2 = await recipient2.getAddress();
        recipientAddress3 = await recipient3.getAddress();
        otherAddress = await other.getAddress();

        const unipoolFactory = await ethers.getContractFactory(
            "BaseUnipoolDistributorMock",
        );

        pool = (await unipoolFactory
            .connect(deployer)
            .deploy(duration.weeks(1))) as BaseUnipoolDistributorMock;
        await pool.setRewardDistribution(rewardDistributionAddress);

        started = (await latestTimestamp()).add("10");
    });

    describe("should pass unit tests", () => {
        it("should revert if notifyRewardAmount not called by reward distirbution", async () => {
            await expect(
                pool.connect(other).notifyRewardAmount(toWei("10000")),
            ).to.be.revertedWith(
                "BaseUnipoolDistributor::onlyRewardDistribution: NOT_REWARD_DISTRIBUTION",
            );
        });
    });

    describe("should pass base Unipool tests", () => {
        it("Two stakers with the same stakes wait 1 w", async () => {
            // Distribute 72k tokens per week:
            await notifyRewardAmount(toWei("72000"));

            // No rewards before the first distribution period:
            expectAlmostEqual(await pool.rewardPerToken(), "0");
            expect(await pool.earned(recipientAddress1)).to.be.eq("0");
            expect(await pool.earned(recipientAddress2)).to.be.eq("0");

            // In order to keep the reward calculation the same, mint the two staking
            // transactions in the same block:
            await setAutomine(false);

            // Mint the same amount of tokens to both recipients:
            await pool.connect(recipient1).stake(toWei("1"));
            await pool.connect(recipient2).stake(toWei("1"));
            await advanceBlock(); // <= transactions are confirmed in the same block

            // Normal block propagation resumes:
            await setAutomine(true);

            // No rewards before the first distribution period:
            expectAlmostEqual(await pool.rewardPerToken(), "0");
            expect(await pool.earned(recipientAddress1)).to.be.eq("0");
            expect(await pool.earned(recipientAddress2)).to.be.eq("0");

            // Advance time 1 week:
            await increaseTimeToAndMine(started.add(duration.weeks(1)));

            // In the first distribution period
            // There are a total of 2 tokens staked
            // Reward per token should be 1/2 of total = 36k
            //   recipient 1 should receive 1 * 36k = 36k
            //   recipient 2 should receive 1 * 36k = 36k
            expectAlmostEqual(await pool.rewardPerToken(), toWei("36000"));
            expectAlmostEqual(
                await pool.earned(recipientAddress1),
                toWei("36000"),
            );
            expectAlmostEqual(
                await pool.earned(recipientAddress2),
                toWei("36000"),
            );
        });

        it("Two stakers with the different (1:3) stakes wait 1 w", async () => {
            // Distribute 72k tokens per week:
            notifyRewardAmount(toWei("72000"));

            expectAlmostEqual(await pool.rewardPerToken(), "0");
            expect(await pool.balanceOf(recipientAddress1)).to.be.eq("0");
            expect(await pool.balanceOf(recipientAddress2)).to.be.eq("0");
            expect(await pool.earned(recipientAddress1)).to.be.eq("0");
            expect(await pool.earned(recipientAddress2)).to.be.eq("0");

            // In order to keep the reward calculation the same, mint the two staking
            // transactions in the same block:
            await setAutomine(false);

            // Mint 1x to the first and 3x to the second recipient:
            await pool.connect(recipient1).stake(toWei("1"));
            await pool.connect(recipient2).stake(toWei("3"));
            await advanceBlock(); // <= transactions are confirmed in the same block

            // Normal block propagation resumes:
            await setAutomine(true);

            // No rewards before the distribution period:
            expectAlmostEqual(await pool.rewardPerToken(), "0");
            expect(await pool.earned(recipientAddress1)).to.be.eq("0");
            expect(await pool.earned(recipientAddress2)).to.be.eq("0");

            // Advance time 1 week:
            await increaseTimeToAndMine(started.add(duration.weeks(1)));

            // In the first distribution period
            // There are a total of 4 tokens staked
            // Reward per token should be 1/4 of total = 18k
            //   recipient 1 should receive 1 * 18k = 18k
            //   recipient 2 should receive 2 * 18k = 54k
            expectAlmostEqual(await pool.rewardPerToken(), toWei("18000"));
            expectAlmostEqual(
                await pool.earned(recipientAddress1),
                toWei("18000"),
            );
            expectAlmostEqual(
                await pool.earned(recipientAddress2),
                toWei("54000"),
            );
        });

        it("Two stakers with the different (1:3) stakes wait 2 weeks", async () => {
            //
            // 1x: +----------------+ = 72k for 1w + 18k for 2w
            // 3x:         +--------+ =  0k for 1w + 54k for 2w
            //
            // Distribute 72000 tokens per week:
            notifyRewardAmount(toWei("72000"));

            // Mint to the first recipient:
            await pool.connect(recipient1).stake(toWei("1"));

            // Advance 1 week:
            await increaseTimeToAndMine(started.add(duration.weeks(1)));

            // Mint 3x to the second recipient:
            await pool.connect(recipient2).stake(toWei("3"));

            // After the first distribution period
            // Reward per token should be 100% of distribution
            // There was 1 token staked
            //   recipient 1 should recieve 100% of the reward
            expectAlmostEqual(await pool.rewardPerToken(), toWei("72000"));
            expectAlmostEqual(
                await pool.earned(recipientAddress1),
                toWei("72000"),
            );
            expectAlmostEqual(await pool.earned(recipientAddress2), toWei("0"));

            // Advance time 1 week:
            await increaseTimeToAndMine(started.add(duration.weeks(2)));

            // Distribute 72000 tokens per week:
            await notifyRewardAmount(toWei("72000"));

            // Advance time 1 week:
            await increaseTimeToAndMine(started.add(duration.weeks(3)));

            // Distribute 72000 tokens per week:
            await notifyRewardAmount(toWei("72000"));

            // After the 2nd distribution period
            // There were 4 tokens staked
            // Reward per token is 72k (first) + 18k (second) = 90k
            //   recipient 1 should have earned 72k (first) + 18k (second) = 90k
            //   recipient 2 should have earned 0 (first) + 2 * 18k = 54k
            expectAlmostEqual(await pool.rewardPerToken(), toWei("90000"));
            expectAlmostEqual(
                await pool.earned(recipientAddress1),
                toWei("90000"),
            );
            expectAlmostEqual(
                await pool.earned(recipientAddress2),
                toWei("54000"),
            );
        });

        it("Three stakers with the different (1:3:5) stakes wait 3 weeks", async () => {
            //
            // 1x: +----------------+--------+ = 18k for 1w +  8k for 2w + 12k for 3w
            // 3x: +----------------+          = 54k for 1w + 24k for 2w +  0k for 3w
            // 5x:         +-----------------+ =  0k for 1w + 40k for 2w + 60k for 3w
            //
            // Distribute 72k tokens per week:
            notifyRewardAmount(toWei("72000"));

            // In order to keep the reward calculation the same, mint the two staking
            // transactions in the same block:
            await setAutomine(false);

            // Mint 1x to the first and 3x to the second recipient:
            await pool.connect(recipient1).stake(toWei("1"));
            await pool.connect(recipient2).stake(toWei("3"));
            await advanceBlock(); // <= transactions are confirmed in the same block

            // Normal block propagation resumes:
            await setAutomine(true);

            // Advance time 1 week:
            await increaseTimeToAndMine(started.add(duration.weeks(1)));

            // Mint 5x to recipient 3:
            await pool.connect(recipient3).stake(toWei("5"));

            // At the end of the first distribution period
            // There were 4 tokens staked
            // Reward per token is should be 1/4 of total
            //   recipient 1 receives 1/4 of the distribution = 18k
            //   recipient 2 receives 3/4 of the distribution = 54k
            //   recipient 3 recieves 0 (did not stake)
            expectAlmostEqual(await pool.rewardPerToken(), toWei("18000"));
            expectAlmostEqual(
                await pool.earned(recipientAddress1),
                toWei("18000"),
            );
            expectAlmostEqual(
                await pool.earned(recipientAddress2),
                toWei("54000"),
            );

            // Distribute 72k tokens per week:
            await notifyRewardAmount(toWei("72000"));

            // Advance time 1 week:
            await increaseTimeToAndMine(started.add(duration.weeks(2)));

            // At the end of the second distributotion period
            // There are 1 + 3 + 5 = 9 tokens staked
            // Reward per token is 18k (first) + 72k / 9 = 18k + 8k = 26k
            //   recipient 1 has earned 18k (first) + 1 * 8k (second) = 26k
            //   recipient 2 has earned 54k (first) + 3 * 8k (second) = 78k
            //   recipient 3 has earned 0 (first) + 5 * 8k (second) = 40k
            expectAlmostEqual(await pool.rewardPerToken(), toWei("26000")); // 18k + 8k
            expectAlmostEqual(
                await pool.earned(recipientAddress1),
                toWei("26000"),
            );
            expectAlmostEqual(
                await pool.earned(recipientAddress2),
                toWei("78000"),
            );
            expectAlmostEqual(
                await pool.earned(recipientAddress3),
                toWei("40000"),
            );
        });

        it("One staker on 2 durations with gap", async () => {
            // Distribute 72k tokens per week:
            await notifyRewardAmount(toWei("72000"));

            // Stake 1x amount to recipient 1:
            await pool.connect(recipient1).stake(toWei("1"));

            // Advance time 1 week:
            await increaseTimeToAndMine(started.add(duration.weeks(2)));

            // After the first distribution period
            // There is 1 token staked
            // Reward per token is the total distribution = 72k
            // recipient 1 recieves the total amount of distributed tokens = 72k
            expectAlmostEqual(await pool.rewardPerToken(), toWei("72000"));
            expectAlmostEqual(
                await pool.earned(recipientAddress1),
                toWei("72000"),
            );

            // Distirbute 72k tokens per week:
            await notifyRewardAmount(toWei("72000"));

            // advance time 1 week:
            await increaseTimeToAndMine(started.add(duration.weeks(3)));

            // After the second distribution period
            // There is 1 token staked
            // Reward per token is 72k (first) + 72k (second) = 144k
            //   recepient 1 has earned 72k (first) + 72k (second) = 144k
            expectAlmostEqual(await pool.rewardPerToken(), toWei("144000"));
            expectAlmostEqual(
                await pool.earned(recipientAddress1),
                toWei("144000"),
            );
        });

        it("Transferring stake from one account to another", async () => {
            // Distirbute 70k tokens per week:
            await notifyRewardAmount(toWei("70000"));

            // Stake 1x tokens for recipient 1:
            await pool.connect(recipient1).stake(toWei("1"));

            // Recipient 1 should have 1 token, and should NOT have any rewards
            // Recipient 2 should have no tokens and no rewards:
            expect(await pool.balanceOf(recipientAddress1)).to.be.eq(
                toWei("1"),
            );
            expect(await pool.earned(recipientAddress1)).to.be.eq("0");
            expect(await pool.balanceOf(recipientAddress2)).to.be.eq("0");
            expect(await pool.earned(recipientAddress2)).to.be.eq("0");

            // Advance time 1 day:
            await increaseTimeToAndMine(started.add(duration.days("1")));

            // After 1 day, recipient 1 has earned 1/7 of the reward = 10k
            expectAlmostEqual(
                await pool.earned(recipientAddress1),
                toWei("10000"),
            );

            // In order to keep the reward calculation the same, mint the two staking
            // transactions in the same block:
            await setAutomine(false);

            // Withdraw 1x amount from recipient 1 and stake 1x to recipient 2.
            // This is emulates a transfer:
            await pool.connect(recipient1).withdraw(toWei("1"));
            await pool.connect(recipient2).stake(toWei("1"));
            await advanceBlock(); // <= transactions are confirmed in the same block

            // Normal block propagation resumes:
            await setAutomine(true);

            // Advance time 6 days:
            await increaseTimeToAndMine(started.add(duration.weeks("1")));

            // After the end of the distribution period
            // There is 1 token staked
            //   recipient 1 has staked 1 token for 1/7 of duration
            //   recipient 2 has staked 1 token for 6/7 of duration
            // Reward per token is the total distirbution = 70k
            //   recipient 1 has earned 1/7 * 70k = 10k
            //   recipient 2 has earned 6/7 * 70k = 60k
            expectAlmostEqual(await pool.rewardPerToken(), toWei("70000"));
            expectAlmostEqual(
                await pool.earned(recipientAddress1),
                toWei("10000"),
            );
            expectAlmostEqual(
                await pool.earned(recipientAddress2),
                toWei("60000"),
            );
        });

        // TODO: this test may be redundant!
        it("Notify Reward Amount from mocked distribution to 10,000", async () => {
            // Distirbute 10k SNX per week:
            await notifyRewardAmount(toWei("10000"));

            // No rewards before tokens are staked:
            expectAlmostEqual(await pool.rewardPerToken(), toWei("0"));
            expect(await pool.balanceOf(recipientAddress1)).to.be.eq("0");
            expect(await pool.balanceOf(recipientAddress2)).to.be.eq("0");
            expect(await pool.earned(recipientAddress1)).to.be.eq("0");
            expect(await pool.earned(recipientAddress2)).to.be.eq("0");

            // In order to keep the reward calculation the same, mint the two staking
            // transactions in the same block:
            await setAutomine(false);

            // Stake 1x to recipient 1 and 3x to recipient 2:
            await pool.connect(recipient1).stake(toWei("1"));
            await pool.connect(recipient2).stake(toWei("3"));
            await advanceBlock(); // <= transactions are confirmed in the same block

            // Resume normal block propagation:
            await setAutomine(true);

            // No reward before the first distribution period:
            expectAlmostEqual(await pool.rewardPerToken(), toWei("0"));
            expect(await pool.earned(recipientAddress1)).to.be.eq("0");
            expect(await pool.earned(recipientAddress2)).to.be.eq("0");

            // Advance time 1 week:
            await increaseTimeToAndMine(started.add(duration.weeks(1)));

            // After the first distribution period
            // There are 4 tokens staked
            // Reward per token should be 1/4 = 2.5k
            //   recipient 1 should have recived 1 * 2.5k = 2.5k
            //   recipient 2 has earned 3 * 2.5k = 7.5k
            expectAlmostEqual(await pool.rewardPerToken(), toWei("2500"));
            expectAlmostEqual(
                await pool.earned(recipientAddress1),
                toWei("2500"),
            );
            expectAlmostEqual(
                await pool.earned(recipientAddress2),
                toWei("7500"),
            );
        });
    });
});
