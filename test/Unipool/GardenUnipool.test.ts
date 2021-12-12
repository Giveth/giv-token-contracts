import { expect } from "chai";
import { ethers } from "hardhat";
import { describe, beforeEach, it } from "mocha";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { GIV } from "../../typechain-types/GIV";
import { TokenDistroMock } from "../../typechain-types/TokenDistroMock";
import { GardenUnipoolTokenDistributorMock } from "../../typechain-types/GardenUnipoolTokenDistributorMock";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import {
    duration,
    increaseTimeToAndMine,
    latestTimestamp,
} from "../utils/time";
import { advanceBlock, setAutomine } from "../utils/block";

const { days, years } = duration;
const { parseEther: toWei } = ethers.utils;
const { AddressZero, WeiPerEther } = ethers.constants;

let gardenUnipool: GardenUnipoolTokenDistributorMock;
let tokenDistro: TokenDistroMock;
let givToken: GIV;

let multisig: SignerWithAddress,
    multisig2: SignerWithAddress,
    multisig3: SignerWithAddress,
    recipient1: SignerWithAddress,
    recipient2: SignerWithAddress,
    recipient3: SignerWithAddress,
    recipient4: SignerWithAddress;

let multisigAddress: string,
    recipientAddress1: string,
    recipientAddress2: string,
    recipientAddress3: string,
    recipientAddress4: string,
    addrs: SignerWithAddress[];

const testAmount = toWei("20000000");
const rewardAmount = testAmount.div(2);

let startTime: BigNumber;
let lmDuration: BigNumber;

function expectAlmostEqual(
    expectedOrig: BigNumberish,
    actualOrig: BigNumberish,
) {
    const expected = BigNumber.from(expectedOrig).div(WeiPerEther);
    const actual = BigNumber.from(actualOrig).div(WeiPerEther);

    expect(actual).to.be.closeTo(expected, 2);
}

async function increaseTimeToEndOfPeriod(num: number) {
    await increaseTimeToAndMine(startTime.add(lmDuration).mul(num));
}

async function increaseTimeAfterStart(amount: BigNumberish) {
    await tokenDistro.setTimestamp(startTime.add(amount));
    await gardenUnipool.setTimestamp(startTime.add(amount));
}

async function checkEarnedAndClaimableStream(
    account: string,
    expected: BigNumberish,
) {
    const earned = await gardenUnipool.earned(account);
    const claimable = await tokenDistro.claimableNow(account);
    const actual = earned.add(claimable);

    expectAlmostEqual(expected, actual);
}

async function notifyRewardAmount(amount: BigNumberish) {
    await gardenUnipool.notifyRewardAmount(BigNumber.from(amount));
}

describe("GardenUnipoolTokenDistributor", () => {
    beforeEach(async () => {
        [
            multisig,
            multisig2,
            multisig3,
            recipient1,
            recipient2,
            recipient3,
            recipient4,
            ...addrs
        ] = await ethers.getSigners();

        multisigAddress = await multisig.getAddress();
        recipientAddress1 = await recipient1.getAddress();
        recipientAddress2 = await recipient2.getAddress();
        recipientAddress3 = await recipient3.getAddress();
        recipientAddress4 = await recipient4.getAddress();

        const tokenFactory = await ethers.getContractFactory("GIV");
        givToken = (await tokenFactory.deploy(multisigAddress)) as GIV;
        await givToken.deployed();
        await givToken.mint(multisigAddress, testAmount);

        const tokenDistroFactory = await ethers.getContractFactory(
            "TokenDistroMock",
        );
        const gardenUnipoolFactory = await ethers.getContractFactory(
            "GardenUnipoolTokenDistributorMock",
        );

        startTime = (await latestTimestamp()).add(days("90"));
        lmDuration = years("5");

        tokenDistro = (await tokenDistroFactory.deploy(
            testAmount,
            startTime,
            days("180"), // startToCliff
            lmDuration, // duration
            BigNumber.from("500"), // initialPercentage
            givToken.address,
            false,
        )) as TokenDistroMock;

        await givToken.transfer(tokenDistro.address, testAmount);

        gardenUnipool =
            (await gardenUnipoolFactory.deploy()) as GardenUnipoolTokenDistributorMock;

        await gardenUnipool.initialize(
            tokenDistro.address,
            lmDuration,
            AddressZero, // <= Token Manager address can be set to zero in this test.
        );

        await gardenUnipool.setRewardDistribution(multisigAddress);

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            gardenUnipool.address,
        );
        await tokenDistro.assign(gardenUnipool.address, rewardAmount);
        expect(
            (await tokenDistro.balances(gardenUnipool.address)).allocatedTokens,
        ).to.be.equal(rewardAmount);
    });

    describe("base Unipool tests", () => {
        it("Two stakers with the same stake wait for 1 period", async () => {
            // Mint 72k tokens over the reward period:
            await notifyRewardAmount(toWei("72000"));

            // Before staking rewards are 0:
            expect(await gardenUnipool.rewardPerToken()).to.be.eq("0");
            await checkEarnedAndClaimableStream(recipientAddress1, "0");
            await checkEarnedAndClaimableStream(recipientAddress2, "0");

            // In order to ensure the reward calculation is the same for all stakers
            // we mint all staking transactions in the same block:
            await setAutomine(false);

            // Stake 1x amount to recipient 1 and 2:
            await gardenUnipool._stake(recipientAddress1, toWei("1"));
            await gardenUnipool._stake(recipientAddress2, toWei("1"));
            await advanceBlock(); // <= transactions are confirmed in the same block

            // Normal block propagation resumes:
            await setAutomine(true);

            // No rewards before the first distirbution period:
            expect(await gardenUnipool.rewardPerToken()).to.be.eq("0");
            expect(await gardenUnipool.earned(recipientAddress1)).to.be.eq("0");
            expect(await gardenUnipool.earned(recipientAddress2)).to.be.eq("0");

            // Go to end of period 1:
            await increaseTimeToEndOfPeriod(1);

            // After the distribution period
            // There are a total of 2 tokens staked
            // Reward per token should be 1/2 of distirbution = 36k
            //   recipient 1 has earned 1 * 36k = 36k
            //   recipient 2 has earned 1 * 36k = 36k
            expectAlmostEqual(
                await gardenUnipool.rewardPerToken(),
                toWei("36000"),
            );
            await checkEarnedAndClaimableStream(
                recipientAddress1,
                toWei("36000"),
            );
            await checkEarnedAndClaimableStream(
                recipientAddress2,
                toWei("36000"),
            );
        });

        it("Two stakers with different stakes (1:3) wait for 1 period", async () => {
            // Distribute a total of 72k tokens:
            await notifyRewardAmount(toWei("72000"));

            // Before staking, rewards and balances are 0:
            expect(await gardenUnipool.rewardPerToken()).to.be.eq("0");
            expect(await gardenUnipool.balanceOf(recipientAddress1)).to.be.eq(
                "0",
            );
            expect(await gardenUnipool.balanceOf(recipientAddress2)).to.be.eq(
                "0",
            );
            await checkEarnedAndClaimableStream(recipientAddress1, "0");
            await checkEarnedAndClaimableStream(recipientAddress2, "0");

            // In order to ensure the reward calculation is the same for all stakers
            // we mint all staking transactions in the same block:
            await setAutomine(false);

            // Stake 1x amount to the first and 3x amount to the second recipient:
            await gardenUnipool._stake(recipientAddress1, toWei("1"));
            await gardenUnipool._stake(recipientAddress2, toWei("3"));
            await advanceBlock(); // <= transactions are confirmed in the same block

            // Normal block propagation resumes:
            await setAutomine(true);

            // No rewards before the distribution period:
            expectAlmostEqual(await gardenUnipool.rewardPerToken(), "0");
            await checkEarnedAndClaimableStream(recipientAddress1, "0");
            await checkEarnedAndClaimableStream(recipientAddress2, "0");

            // Go to end of period 1:
            await increaseTimeToEndOfPeriod(1);

            // After the distribution period
            // There are a total of 4 tokens staked
            // Reward per token should be 1/4 of distirbution = 18k
            //   recipient 1 has earned 1 * 18k = 18k
            //   recipient 2 has earned 3 * 18k = 54k
            expectAlmostEqual(
                await gardenUnipool.rewardPerToken(),
                toWei("18000"),
            );
            await checkEarnedAndClaimableStream(
                recipientAddress1,
                toWei("18000"),
            );
            await checkEarnedAndClaimableStream(
                recipientAddress2,
                toWei("54000"),
            );
        });

        it("Two stakers with different (1:3) stakes wait for 2 periods", async () => {
            //
            // 1x: +----------------+ = 72k for 1 duration + 18k for 2 periods
            // 3x:         +--------+ =  0k for 1 duration + 54k for 2 periods
            //
            // Distribute a total of 72k tokens in the next period:
            await notifyRewardAmount(toWei("72000"));

            // Stake 1x amount to the first recipient:
            await gardenUnipool._stake(recipientAddress1, toWei("1"));

            // Go to end of period 1:
            await increaseTimeToEndOfPeriod(1);

            // Stake 3x amount to the second recipient:
            await gardenUnipool._stake(recipientAddress2, toWei("3"));

            // After the first distribution period
            // Reward per token should be 100% of distribution = 72k
            // There were 4 tokens staked
            //   recipient 1 should recieve 100% of the reward = 72k
            expectAlmostEqual(
                await gardenUnipool.rewardPerToken(),
                toWei("72000"),
            );
            await checkEarnedAndClaimableStream(
                recipientAddress1,
                toWei("72000"),
            );
            await checkEarnedAndClaimableStream(recipientAddress2, "0");

            // Distribute a total of 72k tokens in the next period:
            await notifyRewardAmount(toWei("72000"));

            // Go to end of period 2:
            await increaseTimeToEndOfPeriod(2);

            // After the second distribution period
            // There were 4 tokens staked
            // Reward per token is 72k (first) + 18k (second) = 90k
            //   recipient 1 should have earned 72k (first) + 18k (second) = 90k
            //   recipient 2 should have earned 0 (first) + 2 * 18k = 54k
            expectAlmostEqual(
                await gardenUnipool.rewardPerToken(),
                toWei("90000"),
            );
            await checkEarnedAndClaimableStream(
                recipientAddress1,
                toWei("90000"),
            );
            await checkEarnedAndClaimableStream(
                recipientAddress2,
                toWei("54000"),
            );
        });

        it("Three stakers with the different (1:3:5) stakes wait for 3 periods", async () => {
            //
            // 1x: +----------------+--------+ = 18k for 1w +  8k for 2w + 12k for 3w
            // 3x: +----------------+          = 54k for 1w + 24k for 2w +  0k for 3w
            // 5x:         +-----------------+ =  0k for 1w + 40k for 2w + 60k for 3w
            //
            // Distribute 72k tokens per week:
            await notifyRewardAmount(toWei("72000"));

            // In order to keep the reward calculation the same, mint the two staking
            // transactions in the same block:
            await setAutomine(false);

            // Mint 1x to the first and 3x to the second recipient:
            await gardenUnipool._stake(recipientAddress1, toWei("1"));
            await gardenUnipool._stake(recipientAddress2, toWei("3"));
            await advanceBlock(); // <= transactions are confirmed in the same block

            // Normal block propagation resumes:
            await setAutomine(true);

            // Go to end of period 1:
            await increaseTimeToEndOfPeriod(1);

            // Mint 5x to recipient 3:
            await gardenUnipool._stake(recipientAddress3, toWei("5"));

            // At the end of the first distribution period
            // There were 4 tokens staked
            // Reward per token is should be 1/4 of total
            //   recipient 1 receives 1/4 of the distribution = 18k
            //   recipient 2 receives 3/4 of the distribution = 54k
            //   recipient 3 recieves 0 (did not stake)
            expectAlmostEqual(
                await gardenUnipool.rewardPerToken(),
                toWei("18000"),
            );
            await checkEarnedAndClaimableStream(
                recipientAddress1,
                toWei("18000"),
            );
            await checkEarnedAndClaimableStream(
                recipientAddress2,
                toWei("54000"),
            );
            await checkEarnedAndClaimableStream(recipientAddress3, "0");

            // Distribute 72k tokens per week:
            await notifyRewardAmount(toWei("72000"));

            // Advance time 1 period:
            await increaseTimeToEndOfPeriod(2);

            // At the end of the second distributotion period
            // There are 1 + 3 + 5 = 9 tokens staked
            // Reward per token is 18k (first) + 72k / 9 = 18k + 8k = 26k
            //   recipient 1 has earned 18k (first) + 1 * 8k (second) = 26k
            //   recipient 2 has earned 54k (first) + 3 * 8k (second) = 78k
            //   recipient 3 has earned 0 (first) + 5 * 8k (second) = 40k
            expectAlmostEqual(
                await gardenUnipool.rewardPerToken(),
                toWei("26000"),
            ); // 18k + 8k
            await checkEarnedAndClaimableStream(
                recipientAddress1,
                toWei("26000"),
            );
            await checkEarnedAndClaimableStream(
                recipientAddress2,
                toWei("78000"),
            );
            await checkEarnedAndClaimableStream(
                recipientAddress3,
                toWei("40000"),
            );
        });

        it("One staker on 2 durations with gap", async () => {
            // Distribute 72k tokens per period:
            await notifyRewardAmount(toWei("72000"));

            // Stake 1x amount to recipient 1:
            await gardenUnipool._stake(recipientAddress1, toWei("1"));

            // Go to the end of period 2:
            await increaseTimeToEndOfPeriod(2);

            // After the first distribution period
            // There is 1 token staked
            // Reward per token is the total distribution = 72k
            // recipient 1 recieves the total amount of distributed tokens = 72k
            expectAlmostEqual(
                await gardenUnipool.rewardPerToken(),
                toWei("72000"),
            );
            await checkEarnedAndClaimableStream(
                recipientAddress1,
                toWei("72000"),
            );

            // Distirbute 72k tokens per week:
            await notifyRewardAmount(toWei("72000"));

            // Go to the end of period 3:
            await increaseTimeToEndOfPeriod(3);

            // After the second distribution period
            // There is 1 token staked
            // Reward per token is 72k (first) + 72k (second) = 144k
            //   recepient 1 has earned 72k (first) + 72k (second) = 144k
            expectAlmostEqual(
                await gardenUnipool.rewardPerToken(),
                toWei("144000"),
            );
            await checkEarnedAndClaimableStream(
                recipientAddress1,
                toWei("144000"),
            );
        });
    });

    describe("when calling getReward", () => {
        beforeEach(async () => {
            await increaseTimeAfterStart(0);
            await notifyRewardAmount(toWei("72000"));
            await gardenUnipool._stake(recipientAddress1, toWei("1"));

            await increaseTimeAfterStart(lmDuration);
        });

        it("should emit RewardPaid when the reward is > 0", async () => {
            const claimableStreamAmount = await gardenUnipool.claimableStream(
                recipientAddress1,
            );
            await expect(gardenUnipool.connect(recipient1).getReward())
                .to.emit(gardenUnipool, "RewardPaid")
                .withArgs(recipientAddress1, claimableStreamAmount);
        });

        it("should emit Allocate from TokenDistro when the reward is > 0", async () => {
            const claimableStreamAmount = await gardenUnipool.claimableStream(
                recipientAddress1,
            );
            await expect(gardenUnipool.connect(recipient1).getReward())
                .to.emit(tokenDistro, "Allocate")
                .withArgs(
                    gardenUnipool.address,
                    recipientAddress1,
                    claimableStreamAmount,
                );
        });
    });

    it("should be able to transfer the balance", async () => {
        // Divide the stake:
        //  - recipient 1 gets 1/4
        //  - recipients 2-4 get 1/8
        const stakeAmountRecipient1 = testAmount.div(4);
        const stakeAmountRecipient2 = stakeAmountRecipient1.div(2);
        const stakeAmountRecipient3 = stakeAmountRecipient2.div(2);
        const stakeAmountRecipient4 = stakeAmountRecipient3.div(2);

        const totalStakeAmount = stakeAmountRecipient1
            .add(stakeAmountRecipient2)
            .add(stakeAmountRecipient3)
            .add(stakeAmountRecipient4);

        // Stake for each recipient:
        const doStake = async (_accountAddress, _amount) => {
            await expect(gardenUnipool._stake(_accountAddress, _amount))
                .to.emit(gardenUnipool, "Staked")
                .withArgs(_accountAddress, _amount);
        };
        await doStake(recipientAddress1, stakeAmountRecipient1);
        await doStake(recipientAddress2, stakeAmountRecipient2);
        await doStake(recipientAddress3, stakeAmountRecipient3);
        await doStake(recipientAddress4, stakeAmountRecipient4);

        // Total staked amount should match:
        expect(await gardenUnipool.totalSupply()).to.be.equal(totalStakeAmount);

        // Go to the start of the period:
        await increaseTimeAfterStart(0);

        // Set the reward:
        await expect(gardenUnipool.notifyRewardAmount(rewardAmount))
            .to.emit(gardenUnipool, "RewardAdded")
            .withArgs(rewardAmount);

        // Period finish should be at the end of duration:
        expect(await gardenUnipool.periodFinish()).to.be.equal(
            startTime.add(lmDuration),
        );

        // No rewards at the start:
        expect(await gardenUnipool.earned(recipientAddress1)).to.be.equal(0);
        expect(await gardenUnipool.earned(recipientAddress2)).to.be.equal(0);
        expect(await gardenUnipool.earned(recipientAddress3)).to.be.equal(0);
        expect(await gardenUnipool.earned(recipientAddress4)).to.be.equal(0);

        // We move time by 1/8th of the period duration.
        // On every step we check if each user has claimed the appropriate amount of tokens:

        const stepDuration = lmDuration.div(8);

        const checkUserEarnValues = async (_account) => {
            const _accountAddress = await _account.getAddress();
            const claimableStreamAmount = await gardenUnipool.claimableStream(
                _accountAddress,
            );
            const earnedAmount = await gardenUnipool.earned(_accountAddress);
            // Ready claimable amount on tokenDistro before getting reward from Garden Unipool
            const tokenDistroReadyClaimableAmount =
                await tokenDistro.claimableNow(_accountAddress);

            const releasedAmount = earnedAmount.add(
                tokenDistroReadyClaimableAmount,
            );
            const userBalanceBefore = await givToken.balanceOf(_accountAddress);

            await expect(gardenUnipool.connect(_account).getReward())
                .to.emit(gardenUnipool, "RewardPaid")
                .withArgs(_accountAddress, claimableStreamAmount)
                .to.emit(tokenDistro, "Allocate")
                .withArgs(
                    gardenUnipool.address,
                    _accountAddress,
                    claimableStreamAmount,
                );

            const userBalanceAfter = await givToken.balanceOf(_accountAddress);
            const transferredAmount = userBalanceAfter.sub(userBalanceBefore);

            // Since token distro adds two numbers (claimable inside itself and earned amount) and then
            // performs division, the two fraction may add up to more than 1 and result in minor difference:
            expect(transferredAmount).to.be.closeTo(
                releasedAmount,
                1,
                "The transferred amount doesn't match the expected released amount",
            );
        };

        const doStep = async (_step, _accounts) => {
            await increaseTimeAfterStart(stepDuration.mul(_step));
            for (let i = 0; i < _accounts.length; i++) {
                // eslint-disable-next-line no-await-in-loop
                await checkUserEarnValues(_accounts[i]);
            }
        };

        await doStep(1, [recipient1]);
        await doStep(2, [recipient1, recipient2]);
        await doStep(3, [recipient2, recipient3]);
        await doStep(8, [recipient1, recipient2, recipient3, recipient4]);

        await gardenUnipool.connect(recipient1).getReward();
        await gardenUnipool.connect(recipient2).getReward();
        await gardenUnipool.connect(recipient3).getReward();
        await gardenUnipool.connect(recipient4).getReward();

        // Due to division rounding error, a small amount can remain in the garden
        // unipool contract:
        expect(
            (await tokenDistro.balances(gardenUnipool.address)).allocatedTokens,
        ).to.be.lt(ethers.utils.parseEther("0.000000001"));
    });
});
