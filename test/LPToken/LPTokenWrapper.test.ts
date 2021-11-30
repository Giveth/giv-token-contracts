import { ethers } from "hardhat";
import { expect } from "chai";
import { describe, beforeEach, it } from "mocha";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { UniMock, LPTokenWrapperMock } from "../../typechain-types";

const { parseEther: toWei } = ethers.utils;
const { MaxUint256 } = ethers.constants;

let lp: LPTokenWrapperMock;
let uni: UniMock;
let deployer: SignerWithAddress;
let staker: SignerWithAddress;
let receiver: SignerWithAddress;
let other: SignerWithAddress;
let stakerAddress: string;
let receiverAddress: string;
let otherAddress: string;

describe("LPTokenWrapper", async () => {
    beforeEach(async () => {
        [deployer, staker, receiver, other] = await ethers.getSigners();
        stakerAddress = await staker.getAddress();
        receiverAddress = await receiver.getAddress();
        otherAddress = await other.getAddress();

        const uniFactory = await ethers.getContractFactory("UniMock");
        uni = (await uniFactory.connect(deployer).deploy()) as UniMock;

        const lpFactory = await ethers.getContractFactory("LPTokenWrapperMock");
        lp = (await lpFactory
            .connect(deployer)
            .deploy(uni.address)) as LPTokenWrapperMock;

        await uni.mint(stakerAddress, toWei("1000000"));
    });

    describe("when staking", () => {
        it("should revert if no token balance", async () => {
            await expect(
                lp.connect(other).stake(toWei("1000")),
            ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
        });

        it("should revert if not approved", async () => {
            await expect(
                lp.connect(staker).stake(toWei("1000")),
            ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
        });

        it("should stake if approved", async () => {
            await uni.connect(staker).approve(lp.address, MaxUint256);
            await lp.connect(staker).stake(toWei("1000"));

            expect(await lp.balanceOf(stakerAddress)).to.be.eq(toWei("1000"));
            expect(await lp.totalSupply()).to.be.eq(toWei("1000"));

            expect(await uni.balanceOf(lp.address)).to.be.eq(toWei("1000"));
        });
    });

    describe("when withdrawing", () => {
        beforeEach(async () => {
            await uni.mint(receiverAddress, toWei("1000"));
            await uni.connect(receiver).approve(lp.address, MaxUint256);

            await lp.connect(receiver).stake(toWei("1000"));
        });

        it("withdraw staked tokens from account", async () => {
            await lp.connect(receiver).withdraw(toWei("500"));

            expect(await lp.balanceOf(receiverAddress)).to.be.eq(toWei("500"));
            expect(await lp.totalSupply()).to.be.eq(toWei("500"));

            expect(await uni.balanceOf(receiverAddress)).to.be.eq(toWei("500"));
        });
    });
});
