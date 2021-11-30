import { ethers } from "hardhat";
import { expect } from "chai";
import { describe, beforeEach, it } from "mocha";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractFactory } from "ethers";

import { BaseLPTokenMock } from "../../typechain-types/BaseLPTokenMock";

const { parseEther: toWei } = ethers.utils;

let tokenFactory: ContractFactory;
let token: BaseLPTokenMock;
let deployer: SignerWithAddress;
let staker: SignerWithAddress;
let other: SignerWithAddress;
let stakerAddress: string;
let otherAddress: string;

describe("BaseLPToken", () => {
    beforeEach(async () => {
        [deployer, staker, other] = await ethers.getSigners();
        stakerAddress = await staker.getAddress();
        otherAddress = await other.getAddress();

        tokenFactory = await ethers.getContractFactory("BaseLPTokenMock");
        token = (await tokenFactory
            .connect(deployer)
            .deploy()) as BaseLPTokenMock;
    });

    describe("when deployed", () => {
        it("should have totalSupply of 0", async () => {
            expect(await token.totalSupply()).to.be.eq("0");
        });

        it("should have balance of 0 for each account", async () => {
            expect(await token.balanceOf(stakerAddress)).to.be.eq("0");
            expect(await token.balanceOf(otherAddress)).to.be.eq("0");
        });
    });

    describe("when staking", () => {
        beforeEach(async () => {
            await token.stake(stakerAddress, toWei("100000"));
        });

        it("should increase totalSupply", async () => {
            expect(await token.totalSupply()).to.be.eq(toWei("100000"));
        });

        it("should increase balance of staked account", async () => {
            expect(await token.balanceOf(stakerAddress)).to.be.eq(
                toWei("100000"),
            );
            expect(await token.balanceOf(otherAddress)).to.be.eq(toWei("0"));
        });
    });

    describe("when withdrawing", () => {
        beforeEach("should decrease balance and total supply", async () => {
            await token.stake(stakerAddress, toWei("200000"));
            await token.withdraw(stakerAddress, toWei("100000"));
        });

        it("should revert if withdrawing more than staked", async () => {
            await expect(
                token.withdraw(otherAddress, toWei("1000")),
            ).to.be.revertedWith("");
        });

        it("should decrease totalSupply", async () => {
            expect(await token.totalSupply()).to.be.eq(toWei("100000"));
        });

        it("should decrease balance of the withdrawing contract", async () => {
            expect(await token.balanceOf(stakerAddress)).to.be.eq(
                toWei("100000"),
            );
        });
    });
});
