import { ethers } from "hardhat";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";
import { constants } from "ethers";
import { UniMock, SnxMock, UnipoolMock } from "../../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { duration, increaseTimeTo, latestTimestamp } from "../utils/time";
import setAutomine from "../utils/mining";
import { advanceBlock } from "../utils/block";

const { WeiPerEther, MaxUint256 } = constants;
const { parseEther: toWei } = ethers.utils;

let Uni: UniMock;
let Snx: SnxMock;
let Unipool: UnipoolMock;
let deployer, wallet1, wallet2, wallet3, wallet4: SignerWithAddress;
let wallet1Address, wallet2Address, wallet3Address, wallet4Address: string;
let addrs: SignerWithAddress[];

let started = BigNumber.from(0);

function expectAlmostEqual(
    expectedOrig: BigNumberish,
    actualOrig: BigNumberish,
) {
    const expected = BigNumber.from(expectedOrig).div(WeiPerEther);
    const actual = BigNumber.from(actualOrig).div(WeiPerEther);

    expect(actual).to.be.closeTo(expected, 2);
}

describe("Unipool Legacy", () => {
    beforeEach(async () => {
        [deployer, wallet1, wallet2, wallet3, wallet4, ...addrs] =
            await ethers.getSigners();

        wallet1Address = await wallet1.getAddress();
        wallet2Address = await wallet2.getAddress();
        wallet3Address = await wallet3.getAddress();
        wallet4Address = await wallet4.getAddress();

        const uniFactory = await ethers.getContractFactory("UniMock");
        Uni = (await uniFactory.deploy()) as UniMock;

        const snxFactory = await ethers.getContractFactory("SnxMock");
        Snx = (await snxFactory.deploy()) as SnxMock;

        const unipoolFactory = await ethers.getContractFactory("UnipoolMock");
        Unipool = (await unipoolFactory.deploy(
            Uni.address,
            Snx.address,
            duration.weeks(1),
        )) as UnipoolMock;

        await Unipool.setRewardDistribution(wallet1Address);

        await Snx.mint(Unipool.address, toWei("1000000"));
        await Uni.mint(wallet1Address, toWei("1000"));
        await Uni.mint(wallet2Address, toWei("1000"));
        await Uni.mint(wallet3Address, toWei("1000"));
        await Uni.mint(wallet4Address, toWei("1000"));

        await Uni.connect(wallet1).approve(Unipool.address, MaxUint256);
        await Uni.connect(wallet2).approve(Unipool.address, MaxUint256);
        await Uni.connect(wallet3).approve(Unipool.address, MaxUint256);
        await Uni.connect(wallet4).approve(Unipool.address, MaxUint256);

        started = (await latestTimestamp()).add(BigNumber.from("10"));
        await increaseTimeTo(started);
    });

    it("Two stakers with the same stakes wait 1 w", async () => {
        // 72000 SNX per week for 3 weeks
        await Unipool.connect(wallet1).notifyRewardAmount(toWei("72000"));

        expectAlmostEqual(await Unipool.rewardPerToken(), "0");
        expect(await Unipool.earned(wallet1Address)).to.be.eq("0");
        expect(await Unipool.earned(wallet2Address)).to.be.eq("0");

        // In order to keep the reward calculation the same, mint the two staking
        // transactions in the same block
        await setAutomine(false);
        await Unipool.connect(wallet1).stake(toWei("1"));
        await Unipool.connect(wallet2).stake(toWei("1"));
        await advanceBlock();
        await setAutomine(true);

        expectAlmostEqual(await Unipool.rewardPerToken(), "0");
        expect(await Unipool.earned(wallet1Address)).to.be.eq("0");
        expect(await Unipool.earned(wallet2Address)).to.be.eq("0");

        await increaseTimeTo(started.add(duration.weeks(1)));

        expectAlmostEqual(await Unipool.rewardPerToken(), toWei("36000"));
        expectAlmostEqual(await Unipool.earned(wallet1Address), toWei("36000"));
        expectAlmostEqual(await Unipool.earned(wallet2Address), toWei("36000"));
    });

    it("Two stakers with the different (1:3) stakes wait 1 w", async () => {
        // 72000 SNX per week
        await Unipool.connect(wallet1).notifyRewardAmount(toWei("72000"));

        expectAlmostEqual(await Unipool.rewardPerToken(), "0");
        expect(await Unipool.balanceOf(wallet1Address)).to.be.eq("0");
        expect(await Unipool.balanceOf(wallet2Address)).to.be.eq("0");
        expect(await Unipool.earned(wallet1Address)).to.be.eq("0");
        expect(await Unipool.earned(wallet2Address)).to.be.eq("0");

        // In order to keep the reward calculation the same, mint the two staking
        // transactions in the same block
        await setAutomine(false);
        await Unipool.connect(wallet1).stake(toWei("1"));
        await Unipool.connect(wallet2).stake(toWei("3"));
        await advanceBlock();
        await setAutomine(true);

        expectAlmostEqual(await Unipool.rewardPerToken(), "0");
        expect(await Unipool.earned(wallet1Address)).to.be.eq("0");
        expect(await Unipool.earned(wallet2Address)).to.be.eq("0");

        await increaseTimeTo(started.add(duration.weeks(1)));

        expectAlmostEqual(await Unipool.rewardPerToken(), toWei("18000"));
        expectAlmostEqual(await Unipool.earned(wallet1Address), toWei("18000"));
        expectAlmostEqual(await Unipool.earned(wallet2Address), toWei("54000"));
    });

    it("Two stakers with the different (1:3) stakes wait 2 weeks", async () => {
        //
        // 1x: +----------------+ = 72k for 1w + 18k for 2w
        // 3x:         +--------+ =  0k for 1w + 54k for 2w
        //

        // 72000 SNX per week
        await Unipool.connect(wallet1).notifyRewardAmount(toWei("72000"));

        await Unipool.connect(wallet1).stake(toWei("1"));

        await increaseTimeTo(started.add(duration.weeks(1)));

        await Unipool.connect(wallet2).stake(toWei("3"));

        expectAlmostEqual(await Unipool.rewardPerToken(), toWei("72000"));
        expectAlmostEqual(await Unipool.earned(wallet1Address), toWei("72000"));
        expectAlmostEqual(await Unipool.earned(wallet2Address), toWei("0"));

        // Forward to week 2 and notifyReward
        await increaseTimeTo(started.add(duration.weeks(2)));
        await Unipool.connect(wallet1).notifyRewardAmount(toWei("72000"));

        // Forward to week 3 and notifyReward
        await increaseTimeTo(started.add(duration.weeks(3)));
        await Unipool.connect(wallet1).notifyRewardAmount(toWei("72000"));

        expectAlmostEqual(await Unipool.rewardPerToken(), toWei("90000"));
        expectAlmostEqual(await Unipool.earned(wallet1Address), toWei("90000"));
        expectAlmostEqual(await Unipool.earned(wallet2Address), toWei("54000"));
    });

    it("Three stakers with the different (1:3:5) stakes wait 3 weeks", async () => {
        //
        // 1x: +----------------+--------+ = 18k for 1w +  8k for 2w + 12k for 3w
        // 3x: +----------------+          = 54k for 1w + 24k for 2w +  0k for 3w
        // 5x:         +-----------------+ =  0k for 1w + 40k for 2w + 60k for 3w
        //

        // 72000 SNX per week for 3 weeks
        await Unipool.connect(wallet1).notifyRewardAmount(toWei("72000"));

        await setAutomine(false);
        await Unipool.connect(wallet1).stake(toWei("1"));
        await Unipool.connect(wallet2).stake(toWei("3"));
        await advanceBlock();
        await setAutomine(true);

        await increaseTimeTo(started.add(duration.weeks(1)));

        await Unipool.connect(wallet3).stake(toWei("5"));

        expectAlmostEqual(await Unipool.rewardPerToken(), toWei("18000"));
        expectAlmostEqual(await Unipool.earned(wallet1Address), toWei("18000"));
        expectAlmostEqual(await Unipool.earned(wallet2Address), toWei("54000"));

        await Unipool.connect(wallet1).notifyRewardAmount(toWei("72000"));
        await increaseTimeTo(started.add(duration.weeks(2)));

        expectAlmostEqual(await Unipool.rewardPerToken(), toWei("26000")); // 18k + 8k
        expectAlmostEqual(await Unipool.earned(wallet1Address), toWei("26000"));
        expectAlmostEqual(await Unipool.earned(wallet2Address), toWei("78000"));
        expectAlmostEqual(await Unipool.earned(wallet3Address), toWei("40000"));

        await Unipool.connect(wallet2).exit();

        await Unipool.connect(wallet1).notifyRewardAmount(toWei("72000"));
        await increaseTimeTo(started.add(duration.weeks(3)));

        expectAlmostEqual(await Unipool.rewardPerToken(), toWei("38000")); // 18k + 8k + 12k
        expectAlmostEqual(await Unipool.earned(wallet1Address), toWei("38000"));
        expectAlmostEqual(await Unipool.earned(wallet2Address), toWei("0"));
        expectAlmostEqual(
            await Unipool.earned(wallet3Address),
            toWei("100000"),
        );
    });

    it("One staker on 2 durations with gap", async () => {
        // 72000 SNX per week for 1 week
        await Unipool.connect(wallet1).notifyRewardAmount(toWei("72000"));

        await Unipool.connect(wallet1).stake(toWei("1"));

        await increaseTimeTo(started.add(duration.weeks(2)));

        expectAlmostEqual(await Unipool.rewardPerToken(), toWei("72000"));
        expectAlmostEqual(await Unipool.earned(wallet1Address), toWei("72000"));

        // 72000 SNX per week for 1 week
        await Unipool.connect(wallet1).notifyRewardAmount(toWei("72000"));

        await await increaseTimeTo(started.add(duration.weeks(3)));

        expectAlmostEqual(await Unipool.rewardPerToken(), toWei("144000"));
        expectAlmostEqual(
            await Unipool.earned(wallet1Address),
            toWei("144000"),
        );
    });

    it("Notify Reward Amount from mocked distribution to 10,000", async () => {
        // 10000 SNX per week for 1 week
        await Unipool.connect(wallet1).notifyRewardAmount(toWei("10000"));

        expectAlmostEqual(await Unipool.rewardPerToken(), toWei("0"));
        expect(await Unipool.balanceOf(wallet1Address)).to.be.eq("0");
        expect(await Unipool.balanceOf(wallet2Address)).to.be.eq("0");
        expect(await Unipool.earned(wallet1Address)).to.be.eq("0");
        expect(await Unipool.earned(wallet2Address)).to.be.eq("0");

        await setAutomine(false);
        await Unipool.connect(wallet1).stake(toWei("1"));
        await Unipool.connect(wallet2).stake(toWei("3"));
        await advanceBlock();
        await setAutomine(true);

        expectAlmostEqual(await Unipool.rewardPerToken(), toWei("0"));
        expect(await Unipool.earned(wallet1Address)).to.be.eq("0");
        expect(await Unipool.earned(wallet2Address)).to.be.eq("0");

        await increaseTimeTo(started.add(duration.weeks(1)));

        expectAlmostEqual(await Unipool.rewardPerToken(), toWei("2500"));
        expectAlmostEqual(await Unipool.earned(wallet1Address), toWei("2500"));
        expectAlmostEqual(await Unipool.earned(wallet2Address), toWei("7500"));
    });
});
