import { expect } from "chai";
import { ethers } from "hardhat";
import { describe, beforeEach, it } from "mocha";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractFactory, constants } from "ethers";
import { GIV } from "../../typechain-types/GIV";
import { TokenDistroMock } from "../../typechain-types/TokenDistroMock";
import { UnipoolTokenDistributorMock } from "../../typechain-types/UnipoolTokenDistributorMock";

import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { UniMock } from "../../typechain-types";
import {
    duration,
    increaseTimeToAndMine,
    latestTimestamp,
    increaseTime,
} from "../utils/time";
import setAutomine from "../utils/mining";
import { advanceBlock } from "../utils/block";

let tokenDistroFactory: ContractFactory,
    unipoolFactory: ContractFactory,
    tokenFactory: ContractFactory,
    unipool: UnipoolTokenDistributorMock,
    tokenDistro: TokenDistroMock,
    givToken: GIV,
    multisig: SignerWithAddress,
    multisig2: SignerWithAddress,
    multisig3: SignerWithAddress,
    recipient1: SignerWithAddress,
    recipient2: SignerWithAddress,
    recipient3: SignerWithAddress,
    recipient4: SignerWithAddress;
let multisigAddress: string,
    multisig2Address: string,
    multisig3Address: string,
    recipientAddress1: string,
    recipientAddress2: string,
    recipientAddress3: string,
    recipientAddress4: string,
    addrs: SignerWithAddress[];

const amount = ethers.utils.parseEther("20000000");

const offset = 90 * (3600 * 24);
let startTime;
// let lmDuration;
const rewardAmount = amount.div(2);

const startToCliff = 180 * (3600 * 24);
const startToEnd = 730 * (3600 * 24);
const initialPercentage = 500;

const { WeiPerEther, MaxUint256 } = constants;
const { parseEther: toWei } = ethers.utils;

let Uni: UniMock;

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
        multisig2Address = await multisig2.getAddress();
        multisig3Address = await multisig3.getAddress();
        recipientAddress1 = await recipient1.getAddress();
        recipientAddress2 = await recipient2.getAddress();
        recipientAddress3 = await recipient3.getAddress();
        recipientAddress4 = await recipient4.getAddress();

        tokenFactory = await ethers.getContractFactory("GIV");
        givToken = (await tokenFactory.deploy(multisigAddress)) as GIV;
        await givToken.deployed();
        await givToken.mint(multisigAddress, amount);

        tokenDistroFactory = await ethers.getContractFactory("TokenDistroMock");
        unipoolFactory = await ethers.getContractFactory(
            "UnipoolTokenDistributorMock",
        );

        startTime =
            (await ethers.provider.getBlock("latest")).timestamp + offset;
        // lmDuration = startToCliff * 4;
        tokenDistro = (await tokenDistroFactory.deploy(
            amount,
            startTime,
            startToCliff,
            startToEnd,
            initialPercentage,
            givToken.address,
            false,
        )) as TokenDistroMock;

        await givToken.transfer(tokenDistro.address, amount);

        const uniFactory = await ethers.getContractFactory("UniMock");
        Uni = (await uniFactory.deploy()) as UniMock;

        unipool = (await unipoolFactory.deploy(
            tokenDistro.address,
            Uni.address,
            duration.weeks(1),
        )) as UnipoolTokenDistributorMock;
        await unipool.setRewardDistribution(multisig2Address);

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            unipool.address,
        );
        await tokenDistro.assign(unipool.address, rewardAmount);
        expect(
            (await tokenDistro.balances(unipool.address)).allocatedTokens,
        ).to.be.equal(rewardAmount);

        await Uni.mint(recipientAddress1, toWei("1000"));
        await Uni.mint(recipientAddress2, toWei("1000"));
        await Uni.mint(recipientAddress3, toWei("1000"));
        await Uni.mint(recipientAddress4, toWei("1000"));

        await Uni.connect(recipient1).approve(unipool.address, MaxUint256);
        await Uni.connect(recipient2).approve(unipool.address, MaxUint256);
        await Uni.connect(recipient3).approve(unipool.address, MaxUint256);
        await Uni.connect(recipient4).approve(unipool.address, MaxUint256);

        started = (await latestTimestamp()).add(BigNumber.from("10"));
        await increaseTimeToAndMine(started);
    });

    it("Two stakers with the same stakes wait 1 w", async () => {
        // 72000 SNX per week for 3 weeks
        await unipool.connect(multisig2).notifyRewardAmount(toWei("72000"));

        expectAlmostEqual(await unipool.rewardPerToken(), "0");
        expect(await unipool.earned(recipientAddress1)).to.be.eq("0");
        expect(await unipool.earned(recipientAddress2)).to.be.eq("0");

        // In order to keep the reward calculation the same, mint the two staking
        // transactions in the same block
        await setAutomine(false);
        await unipool.connect(recipient1).stake(toWei("1"));
        await unipool.connect(recipient2).stake(toWei("1"));
        await advanceBlock();
        await setAutomine(true);

        expectAlmostEqual(await unipool.rewardPerToken(), "0");
        expect(await unipool.earned(recipientAddress1)).to.be.eq("0");
        expect(await unipool.earned(recipientAddress2)).to.be.eq("0");

        await increaseTimeToAndMine(started.add(duration.weeks(1)));

        expectAlmostEqual(await unipool.rewardPerToken(), toWei("36000"));

        const recipientEarned1 = await unipool.earned(recipientAddress1);
        const recipientEarned2 = await unipool.earned(recipientAddress2);

        expectAlmostEqual(recipientEarned1, toWei("36000"));
        expectAlmostEqual(recipientEarned2, toWei("36000"));

        await unipool.setTimestamp(await latestTimestamp());

        await expect(unipool.connect(recipient1).getReward())
            .to.emit(tokenDistro, "Allocate")
            .withArgs(unipool.address, recipientAddress1, recipientEarned1);

        await expect(unipool.connect(recipient2).getReward())
            .to.emit(tokenDistro, "Allocate")
            .withArgs(unipool.address, recipientAddress2, recipientEarned2);
    });

    it("Two stakers with the different (1:3) stakes wait 1 w", async () => {
        // 72000 SNX per week
        await unipool.connect(multisig2).notifyRewardAmount(toWei("72000"));

        expectAlmostEqual(await unipool.rewardPerToken(), "0");
        expect(await unipool.balanceOf(recipientAddress1)).to.be.eq("0");
        expect(await unipool.balanceOf(recipientAddress2)).to.be.eq("0");
        expect(await unipool.earned(recipientAddress1)).to.be.eq("0");
        expect(await unipool.earned(recipientAddress2)).to.be.eq("0");

        // In order to keep the reward calculation the same, mint the two staking
        // transactions in the same block
        await setAutomine(false);
        await unipool.connect(recipient1).stake(toWei("1"));
        await unipool.connect(recipient2).stake(toWei("3"));
        await advanceBlock();
        await setAutomine(true);

        expectAlmostEqual(await unipool.rewardPerToken(), "0");
        expect(await unipool.earned(recipientAddress1)).to.be.eq("0");
        expect(await unipool.earned(recipientAddress2)).to.be.eq("0");

        await increaseTimeToAndMine(started.add(duration.weeks(1)));

        expectAlmostEqual(await unipool.rewardPerToken(), toWei("18000"));
        expectAlmostEqual(
            await unipool.earned(recipientAddress1),
            toWei("18000"),
        );
        expectAlmostEqual(
            await unipool.earned(recipientAddress2),
            toWei("54000"),
        );
    });

    it("Two stakers with the different (1:3) stakes wait 2 weeks", async () => {
        //
        // 1x: +----------------+ = 72k for 1w + 18k for 2w
        // 3x:         +--------+ =  0k for 1w + 54k for 2w
        //

        // 72000 SNX per week
        await unipool.connect(multisig2).notifyRewardAmount(toWei("72000"));

        await unipool.connect(recipient1).stake(toWei("1"));

        await increaseTimeToAndMine(started.add(duration.weeks(1)));

        await unipool.connect(recipient2).stake(toWei("3"));

        expectAlmostEqual(await unipool.rewardPerToken(), toWei("72000"));
        expectAlmostEqual(
            await unipool.earned(recipientAddress1),
            toWei("72000"),
        );
        expectAlmostEqual(await unipool.earned(recipientAddress2), toWei("0"));

        // Forward to week 2 and notifyReward
        await increaseTimeToAndMine(started.add(duration.weeks(2)));
        await unipool.connect(multisig2).notifyRewardAmount(toWei("72000"));

        // Forward to week 3 and notifyReward
        await increaseTimeToAndMine(started.add(duration.weeks(3)));
        await unipool.connect(multisig2).notifyRewardAmount(toWei("72000"));

        expectAlmostEqual(await unipool.rewardPerToken(), toWei("90000"));
        expectAlmostEqual(
            await unipool.earned(recipientAddress1),
            toWei("90000"),
        );
        expectAlmostEqual(
            await unipool.earned(recipientAddress2),
            toWei("54000"),
        );
    });

    it("Three stakers with the different (1:3:5) stakes wait 3 weeks", async () => {
        //
        // 1x: +----------------+--------+ = 18k for 1w +  8k for 2w + 12k for 3w
        // 3x: +----------------+          = 54k for 1w + 24k for 2w +  0k for 3w
        // 5x:         +-----------------+ =  0k for 1w + 40k for 2w + 60k for 3w
        //

        // 72000 SNX per week for 3 weeks
        await unipool.connect(multisig2).notifyRewardAmount(toWei("72000"));

        await setAutomine(false);
        await unipool.connect(recipient1).stake(toWei("1"));
        await unipool.connect(recipient2).stake(toWei("3"));
        await advanceBlock();
        await setAutomine(true);

        await increaseTimeToAndMine(started.add(duration.weeks(1)));

        await unipool.connect(recipient3).stake(toWei("5"));

        expectAlmostEqual(await unipool.rewardPerToken(), toWei("18000"));
        expectAlmostEqual(
            await unipool.earned(recipientAddress1),
            toWei("18000"),
        );
        expectAlmostEqual(
            await unipool.earned(recipientAddress2),
            toWei("54000"),
        );

        await unipool.connect(multisig2).notifyRewardAmount(toWei("72000"));
        await increaseTimeToAndMine(started.add(duration.weeks(2)));

        expectAlmostEqual(await unipool.rewardPerToken(), toWei("26000")); // 18k + 8k
        expectAlmostEqual(
            await unipool.earned(recipientAddress1),
            toWei("26000"),
        );
        expectAlmostEqual(
            await unipool.earned(recipientAddress2),
            toWei("78000"),
        );
        expectAlmostEqual(
            await unipool.earned(recipientAddress3),
            toWei("40000"),
        );

        await unipool.connect(recipient2).exit();

        await unipool.connect(multisig2).notifyRewardAmount(toWei("72000"));
        await increaseTimeToAndMine(started.add(duration.weeks(3)));

        expectAlmostEqual(await unipool.rewardPerToken(), toWei("38000")); // 18k + 8k + 12k
        expectAlmostEqual(
            await unipool.earned(recipientAddress1),
            toWei("38000"),
        );
        expectAlmostEqual(await unipool.earned(recipientAddress2), toWei("0"));
        expectAlmostEqual(
            await unipool.earned(recipientAddress3),
            toWei("100000"),
        );
    });

    it("One staker on 2 durations with gap", async () => {
        // 72000 SNX per week for 1 week
        await unipool.connect(multisig2).notifyRewardAmount(toWei("72000"));

        await unipool.connect(recipient1).stake(toWei("1"));

        await increaseTimeToAndMine(started.add(duration.weeks(2)));

        expectAlmostEqual(await unipool.rewardPerToken(), toWei("72000"));
        expectAlmostEqual(
            await unipool.earned(recipientAddress1),
            toWei("72000"),
        );

        // 72000 SNX per week for 1 week
        await unipool.connect(multisig2).notifyRewardAmount(toWei("72000"));

        await await increaseTimeToAndMine(started.add(duration.weeks(3)));

        expectAlmostEqual(await unipool.rewardPerToken(), toWei("144000"));
        expectAlmostEqual(
            await unipool.earned(recipientAddress1),
            toWei("144000"),
        );
    });

    it("Notify Reward Amount from mocked distribution to 10,000", async () => {
        // 10000 SNX per week for 1 week
        await unipool.connect(multisig2).notifyRewardAmount(toWei("10000"));

        expectAlmostEqual(await unipool.rewardPerToken(), toWei("0"));
        expect(await unipool.balanceOf(recipientAddress1)).to.be.eq("0");
        expect(await unipool.balanceOf(recipientAddress2)).to.be.eq("0");
        expect(await unipool.earned(recipientAddress1)).to.be.eq("0");
        expect(await unipool.earned(recipientAddress2)).to.be.eq("0");

        await setAutomine(false);
        await unipool.connect(recipient1).stake(toWei("1"));
        await unipool.connect(recipient2).stake(toWei("3"));
        await advanceBlock();
        await setAutomine(true);

        expectAlmostEqual(await unipool.rewardPerToken(), toWei("0"));
        expect(await unipool.earned(recipientAddress1)).to.be.eq("0");
        expect(await unipool.earned(recipientAddress2)).to.be.eq("0");

        await increaseTimeToAndMine(started.add(duration.weeks(1)));

        expectAlmostEqual(await unipool.rewardPerToken(), toWei("2500"));
        expectAlmostEqual(
            await unipool.earned(recipientAddress1),
            toWei("2500"),
        );
        expectAlmostEqual(
            await unipool.earned(recipientAddress2),
            toWei("7500"),
        );
    });
});
