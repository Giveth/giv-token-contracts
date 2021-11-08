let TokenDistroFactory,
    tokenDistro,
    GivTokenFactory,
    givToken,
    GurTokenFactory,
    multisig,
    multisig2,
    multisig3,
    recipient1,
    recipient2,
    recipient3,
    recipient4;
let multisigAddress,
    multisig2Address,
    multisig3Address,
    recipientAddress1,
    recipientAddress2,
    recipientAddress3,
    recipientAddress4,
    addrs;
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

const amount = ethers.utils.parseEther("80000000");
const startToCliff = 180 * (3600 * 24);
const startToEnd = 730 * (3600 * 24);
const initialPercentage = 500;

let uStaker;
let uStakerAddress;

describe("UniswapV3RewardToken", () => {
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
        ] = await hre.ethers.getSigners();

        multisigAddress = await multisig.getAddress();
        multisig2Address = await multisig2.getAddress();
        multisig3Address = await multisig3.getAddress();
        recipientAddress1 = await recipient1.getAddress();
        recipientAddress2 = await recipient2.getAddress();
        recipientAddress3 = await recipient3.getAddress();
        recipientAddress4 = await recipient4.getAddress();

        uStaker = multisig2;
        uStakerAddress = multisig2Address;

        GivTokenFactory = await ethers.getContractFactory("GIV");
        givToken = await GivTokenFactory.deploy(multisigAddress);
        await givToken.deployed();
        await givToken.mint(multisigAddress, amount);

        TokenDistroFactory = await ethers.getContractFactory("TokenDistroMock");

        const offset = 90 * (3600 * 24);
        const startTime = (await ethers.provider.getBlock()).timestamp + offset;

        tokenDistro = await TokenDistroFactory.deploy(
            amount,
            startTime,
            startToCliff,
            startToEnd,
            initialPercentage,
            givToken.address,
            false,
        );

        await givToken.transfer(tokenDistro.address, amount);
        GurTokenFactory = await ethers.getContractFactory(
            "UniswapV3RewardTokenMock",
        );
    });

    it("should allow trasnferFrom only by staker to itself", async () => {
        const gurToken = await GurTokenFactory.deploy(
            tokenDistro.address,
            uStakerAddress,
        );

        await expect(
            gurToken.transferFrom(multisigAddress, uStakerAddress, amount),
        ).to.be.revertedWith("GivethUniswapV3Reward:ONLY_STAKER");

        await expect(
            gurToken
                .connect(recipient1)
                .transferFrom(recipientAddress1, uStakerAddress, amount),
        ).to.be.revertedWith("GivethUniswapV3Reward:ONLY_STAKER");

        await expect(
            gurToken
                .connect(uStaker)
                .transferFrom(recipientAddress1, multisigAddress, amount),
        ).to.be.revertedWith("GivethUniswapV3Reward:ONLY_TO_STAKER");

        await expect(
            gurToken
                .connect(uStaker)
                .transferFrom(recipientAddress1, multisigAddress, amount),
        ).to.be.revertedWith("GivethUniswapV3Reward:ONLY_TO_STAKER");

        await expect(await gurToken.balanceOf(uStakerAddress)).to.be.equal(0);
        await expect(await gurToken.balanceOf(recipientAddress1)).to.be.equal(
            0,
        );
        await expect(await gurToken.totalSupply()).to.be.equal(0);

        await expect(
            gurToken
                .connect(uStaker)
                .transferFrom(recipientAddress1, uStakerAddress, amount),
        )
            .to.emit(gurToken, "Transfer")
            .withArgs(ethers.constants.AddressZero, uStakerAddress, amount);

        await expect(await gurToken.balanceOf(uStakerAddress)).to.be.equal(
            amount,
        );
        await expect(await gurToken.totalSupply()).to.be.equal(amount);
    });

    it("should allow only staker to transfer token directly", async () => {
        const gurToken = await GurTokenFactory.deploy(
            tokenDistro.address,
            uStakerAddress,
        );
        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            gurToken.address,
        );
        await tokenDistro.assign(gurToken.address, amount);

        await gurToken
            .connect(uStaker)
            .transferFrom(recipientAddress1, uStakerAddress, amount);

        const transferAmount = amount.div(10);
        await expect(
            gurToken.transfer(uStakerAddress, transferAmount),
        ).to.be.revertedWith("GivethUniswapV3Reward:NOT_VALID_TRANSFER");

        await expect(
            gurToken.connect(uStaker).transfer(uStakerAddress, transferAmount),
        ).to.be.revertedWith("GivethUniswapV3Reward:NOT_VALID_TRANSFER");

        await expect(
            gurToken
                .connect(uStaker)
                .transfer(recipientAddress1, transferAmount),
        )
            .to.emit(gurToken, "RewardPaid")
            .withArgs(recipientAddress1, transferAmount);

        await expect(await gurToken.balanceOf(uStakerAddress)).to.be.equal(
            amount.sub(transferAmount),
        );
        await expect(await gurToken.totalSupply()).to.be.equal(
            amount.sub(transferAmount),
        );

        await expect(await gurToken.balanceOf(recipientAddress1)).to.be.equal(
            0,
        );
        await expect(
            gurToken
                .connect(recipient1)
                .transfer(uStakerAddress, transferAmount),
        ).to.be.revertedWith("GivethUniswapV3Reward:NOT_VALID_TRANSFER");
        await expect(
            gurToken
                .connect(recipient1)
                .transfer(recipientAddress2, transferAmount),
        ).to.be.revertedWith("GivethUniswapV3Reward:NOT_VALID_TRANSFER");
    });

    // Copied from TokenDistro.test.js and refactored to use Transfer instead
    // of Allocate
    it("should Staker be able to transfer the balance", async () => {
        const gurToken = await GurTokenFactory.deploy(
            tokenDistro.address,
            uStakerAddress,
        );
        await gurToken
            .connect(uStaker)
            .transferFrom(multisigAddress, uStakerAddress, amount);

        const amountRecipient1 = amount.div(2);
        const amountRecipient2 = amountRecipient1.div(2);
        const amountRecipient3 = amountRecipient2.div(2);
        const amountRecipient4 = amountRecipient3.div(2);

        await expect(
            gurToken
                .connect(uStaker)
                .transfer(recipientAddress1, amountRecipient1),
        ).to.be.revertedWith(
            "TokenDistro::onlyDistributor: ONLY_DISTRIBUTOR_ROLE",
        );

        const gurTokenAddress = gurToken.address;

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            gurTokenAddress,
        );
        await tokenDistro.assign(gurTokenAddress, amount);

        async function testTransfer(recipientAddress, amountRecipient) {
            await expect(
                gurToken
                    .connect(uStaker)
                    .transfer(recipientAddress, amountRecipient),
            )
                .to.emit(tokenDistro, "Allocate")
                .withArgs(gurTokenAddress, recipientAddress, amountRecipient)
                .to.emit(gurToken, "RewardPaid")
                .withArgs(recipientAddress, amountRecipient);

            expect(
                (await tokenDistro.balances(recipientAddress)).allocatedTokens,
            ).to.be.equal(amountRecipient);
        }

        await testTransfer(recipientAddress1, amountRecipient1);
        await testTransfer(recipientAddress2, amountRecipient2);
        await testTransfer(recipientAddress3, amountRecipient3);
        await testTransfer(recipientAddress4, amountRecipient4);
    });

    it("should not transfer more than token distro assigned value", async () => {
        const gurToken = await GurTokenFactory.deploy(
            tokenDistro.address,
            uStakerAddress,
        );
        await gurToken
            .connect(uStaker)
            .transferFrom(multisigAddress, uStakerAddress, amount);

        const gurTokenAddress = gurToken.address;

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            gurTokenAddress,
        );
        await tokenDistro.assign(gurTokenAddress, amount.div(2));

        await expect(
            gurToken.connect(uStaker).transfer(recipientAddress1, amount),
        ).to.be.reverted;
    });

    it("should not transfer more than minted value", async () => {
        const gurToken = await GurTokenFactory.deploy(
            tokenDistro.address,
            uStakerAddress,
        );

        const transferAmount = amount.div(2);
        gurToken
            .connect(uStaker)
            .transferFrom(multisigAddress, uStakerAddress, transferAmount);

        const gurTokenAddress = gurToken.address;

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            gurTokenAddress,
        );
        await tokenDistro.assign(gurTokenAddress, amount);

        await expect(
            gurToken.connect(uStaker).transfer(recipientAddress1, amount),
        ).to.be.reverted;
    });
});
