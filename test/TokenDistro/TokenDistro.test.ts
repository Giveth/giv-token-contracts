import { ethers } from "hardhat";
import { expect } from "chai";
import { describe, it, beforeEach } from "mocha";
import { ContractFactory } from "ethers";
import { GIV, TokenDistro } from "../../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

let tokenDistroFactory: ContractFactory,
    tokenFactory: ContractFactory,
    token: GIV,
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
    addrs: Array<SignerWithAddress>;

const amount = ethers.utils.parseEther("20000000");
const startToCliff = 180 * (3600 * 24);
const startToEnd = 730 * (3600 * 24);
const initialPercentage = 500;

describe("TokenDistro", () => {
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
        token = (await tokenFactory.deploy(multisigAddress)) as GIV;
        await token.deployed();
        await token.mint(multisigAddress, amount);

        tokenDistroFactory = await ethers.getContractFactory("TokenDistroMock");
    });

    it("should check the constructor", async () => {
        const startTime = (await ethers.provider.getBlock("latest")).timestamp;

        await expect(
            tokenDistroFactory.deploy(
                amount,
                startTime,
                startToEnd,
                startToCliff,
                initialPercentage,
                token.address,
                false,
            ),
        ).to.be.revertedWith(
            "TokenDistro::constructor: DURATION_LESS_THAN_CLIFF",
        );

        await expect(
            tokenDistroFactory.deploy(
                amount,
                startTime,
                startToCliff,
                startToEnd,
                initialPercentage + 10000,
                token.address,
                false,
            ),
        ).to.be.revertedWith(
            "TokenDistro::constructor: INITIALPERCENTAGE_GREATER_THAN_100",
        );
    });

    it("should check the assign conditions", async () => {
        const startTime = (await ethers.provider.getBlock("latest")).timestamp;

        const tokenDistro = (await tokenDistroFactory.deploy(
            amount,
            startTime,
            startToCliff,
            startToEnd,
            initialPercentage,
            token.address,
            false,
        )) as TokenDistro;

        await expect(
            tokenDistro.connect(recipient1).assign(recipientAddress1, amount),
        ).to.be.revertedWith("TokenDistro::assign: ONLY_ADMIN_ROLE");

        await expect(
            tokenDistro.connect(multisig).assign(recipientAddress1, amount),
        ).to.be.revertedWith("TokenDistro::assign: ONLY_TO_DISTRIBUTOR_ROLE");

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            multisig2Address,
        );

        // Try to assign more than possible
        await expect(
            tokenDistro
                .connect(multisig)
                .assign(multisig2Address, amount.add(1)),
        ).to.be.reverted;

        // Check total amount
        await expect(
            (
                await tokenDistro.balances(tokenDistro.address)
            ).allocatedTokens,
        ).to.be.equal(amount);

        // Allocate the total in two chunks
        await tokenDistro
            .connect(multisig)
            .assign(multisig2Address, amount.div(2));
        await tokenDistro
            .connect(multisig)
            .assign(multisig2Address, amount.div(2));

        // Try to assing more than possible
        await expect(tokenDistro.connect(multisig).assign(multisig2Address, 1))
            .to.be.reverted;

        // Check permissions
        await expect(
            await tokenDistro
                .connect(multisig)
                .hasRole(await tokenDistro.DISTRIBUTOR_ROLE(), multisigAddress),
        ).to.be.false;
    });

    it("should deploy the TokenDistro", async () => {
        const startTime = (await ethers.provider.getBlock("latest")).timestamp;
        const offset = 90 * (3600 * 24);

        const tokenDistro = await tokenDistroFactory.deploy(
            amount,
            startTime,
            startToCliff,
            startToEnd,
            initialPercentage,
            token.address,
            false,
        );

        const initialAmount = amount.mul(initialPercentage).div(10000);

        // startTime > t
        expect(
            await tokenDistro.globallyClaimableAt(startTime - offset),
        ).to.be.equal(0);
        // startTime = t
        expect(await tokenDistro.globallyClaimableAt(startTime)).to.be.equal(
            initialAmount,
        );
        // startTime < t < startToCliff
        expect(
            await tokenDistro.globallyClaimableAt(startTime + offset),
        ).to.be.equal(initialAmount);
        // t + 1 = startToCliff
        expect(
            await tokenDistro.globallyClaimableAt(startTime + startToCliff - 1),
        ).to.be.equal(initialAmount);
        // t = startToCliff
        expect(
            await tokenDistro.globallyClaimableAt(startTime + startToCliff),
        ).to.be.equal(
            amount
                .sub(initialAmount)
                .mul(startToCliff)
                .div(startToEnd)
                .add(initialAmount),
        );
        // t = (startToEnd - startToCliff) / 2
        expect(
            await tokenDistro.globallyClaimableAt(
                startTime + 365 * (3600 * 24),
            ),
        ).to.be.equal(amount.sub(initialAmount).div(2).add(initialAmount));
        // t = startToEnd
        expect(
            await tokenDistro.globallyClaimableAt(startTime + startToEnd),
        ).to.be.equal(amount);
        // t > startToEnd
        expect(
            await tokenDistro.globallyClaimableAt(
                startTime + startToEnd + offset,
            ),
        ).to.be.equal(amount);
    });

    it("should be able to transfer the balance - allocateMany", async () => {
        const startTime = (await ethers.provider.getBlock("latest")).timestamp;

        const tokenDistro = await tokenDistroFactory.deploy(
            amount,
            startTime,
            startToCliff,
            startToEnd,
            initialPercentage,
            token.address,
            false,
        );

        await token.transfer(tokenDistro.address, amount);

        const amountRecipient1 = amount.div(2);
        const amountRecipient2 = amountRecipient1.div(2);
        const amountRecipient3 = amountRecipient2.div(2);
        const amountRecipient4 = amountRecipient3.div(2);

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            multisigAddress,
        );
        await tokenDistro.connect(multisig).assign(multisigAddress, amount);

        await expect(
            tokenDistro
                .connect(multisig2)
                .allocateMany([recipientAddress1], [amount]),
        ).to.be.revertedWith(
            "TokenDistro::onlyDistributor: ONLY_DISTRIBUTOR_ROLE",
        );

        await expect(
            tokenDistro.allocateMany([multisigAddress], [amount]),
        ).to.be.revertedWith(
            "TokenDistro::allocate: DISTRIBUTOR_NOT_VALID_RECIPIENT",
        );

        await expect(
            tokenDistro.allocateMany(
                [recipientAddress1],
                [amountRecipient1, amountRecipient2],
            ),
        ).to.be.revertedWith(
            "TokenDistro::allocateMany: INPUT_LENGTH_NOT_MATCH",
        );

        await expect(
            tokenDistro.allocateMany(
                [
                    recipientAddress1,
                    recipientAddress2,
                    recipientAddress3,
                    recipientAddress4,
                ],
                [
                    amountRecipient1,
                    amountRecipient2,
                    amountRecipient3,
                    amountRecipient4,
                ],
            ),
        )
            .to.emit(tokenDistro, "Allocate")
            .withArgs(multisigAddress, recipientAddress1, amountRecipient1)
            .to.emit(tokenDistro, "Allocate")
            .withArgs(multisigAddress, recipientAddress2, amountRecipient2)
            .to.emit(tokenDistro, "Allocate")
            .withArgs(multisigAddress, recipientAddress3, amountRecipient3)
            .to.emit(tokenDistro, "Allocate")
            .withArgs(multisigAddress, recipientAddress4, amountRecipient4);

        expect(
            (await tokenDistro.balances(recipientAddress1)).allocatedTokens,
        ).to.be.equal(amountRecipient1);
        expect(
            (await tokenDistro.balances(recipientAddress2)).allocatedTokens,
        ).to.be.equal(amountRecipient2);
        expect(
            (await tokenDistro.balances(recipientAddress3)).allocatedTokens,
        ).to.be.equal(amountRecipient3);
        expect(
            (await tokenDistro.balances(recipientAddress4)).allocatedTokens,
        ).to.be.equal(amountRecipient4);
    });

    it("should be able to transfer the balance - sendGIVbacks", async () => {
        const startTime = (await ethers.provider.getBlock("latest")).timestamp;

        const tokenDistro = await tokenDistroFactory.deploy(
            amount,
            startTime,
            startToCliff,
            startToEnd,
            initialPercentage,
            token.address,
            false,
        );

        await token.transfer(tokenDistro.address, amount);

        const amountRecipient1 = amount.div(2);
        const amountRecipient2 = amountRecipient1.div(2);
        const amountRecipient3 = amountRecipient2.div(2);
        const amountRecipient4 = amountRecipient3.div(2);

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            multisigAddress,
        );
        await tokenDistro.connect(multisig).assign(multisigAddress, amount);

        await expect(
            tokenDistro
                .connect(multisig2)
                .sendGIVbacks([recipientAddress1], [amount]),
        ).to.be.revertedWith(
            "TokenDistro::onlyDistributor: ONLY_DISTRIBUTOR_ROLE",
        );

        await expect(
            tokenDistro.sendGIVbacks([multisigAddress], [amount]),
        ).to.be.revertedWith(
            "TokenDistro::allocate: DISTRIBUTOR_NOT_VALID_RECIPIENT",
        );

        await expect(
            tokenDistro.sendGIVbacks(
                [recipientAddress1],
                [amountRecipient1, amountRecipient2],
            ),
        ).to.be.revertedWith(
            "TokenDistro::allocateMany: INPUT_LENGTH_NOT_MATCH",
        );

        await expect(
            tokenDistro.sendGIVbacks(
                [
                    recipientAddress1,
                    recipientAddress2,
                    recipientAddress3,
                    recipientAddress4,
                ],
                [
                    amountRecipient1,
                    amountRecipient2,
                    amountRecipient3,
                    amountRecipient4,
                ],
            ),
        )
            .to.emit(tokenDistro, "Allocate")
            .withArgs(multisigAddress, recipientAddress1, amountRecipient1)
            .to.emit(tokenDistro, "Allocate")
            .withArgs(multisigAddress, recipientAddress2, amountRecipient2)
            .to.emit(tokenDistro, "Allocate")
            .withArgs(multisigAddress, recipientAddress3, amountRecipient3)
            .to.emit(tokenDistro, "Allocate")
            .withArgs(multisigAddress, recipientAddress4, amountRecipient4)
            .to.emit(tokenDistro, "GivBackPaid")
            .withArgs(multisigAddress);
        expect(
            (await tokenDistro.balances(recipientAddress1)).allocatedTokens,
        ).to.be.equal(amountRecipient1);
        expect(
            (await tokenDistro.balances(recipientAddress2)).allocatedTokens,
        ).to.be.equal(amountRecipient2);
        expect(
            (await tokenDistro.balances(recipientAddress3)).allocatedTokens,
        ).to.be.equal(amountRecipient3);
        expect(
            (await tokenDistro.balances(recipientAddress4)).allocatedTokens,
        ).to.be.equal(amountRecipient4);
    });

    it("should be able to transfer the balance", async () => {
        const startTime = (await ethers.provider.getBlock("latest")).timestamp;

        const tokenDistro = await tokenDistroFactory.deploy(
            amount,
            startTime,
            startToCliff,
            startToEnd,
            initialPercentage,
            token.address,
            false,
        );

        await token.transfer(tokenDistro.address, amount);

        const amountRecipient1 = amount.div(2);
        const amountRecipient2 = amountRecipient1.div(2);
        const amountRecipient3 = amountRecipient2.div(2);
        const amountRecipient4 = amountRecipient3.div(2);

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            multisigAddress,
        );
        await tokenDistro.connect(multisig).assign(multisigAddress, amount);

        await expect(
            tokenDistro
                .connect(multisig2)
                .allocate(recipientAddress1, amount, true),
        ).to.be.revertedWith(
            "TokenDistro::onlyDistributor: ONLY_DISTRIBUTOR_ROLE",
        );

        await expect(
            tokenDistro.allocate(multisigAddress, amount, true),
        ).to.be.revertedWith(
            "TokenDistro::allocate: DISTRIBUTOR_NOT_VALID_RECIPIENT",
        );

        await expect(
            tokenDistro.allocate(recipientAddress1, amountRecipient1, true),
        )
            .to.emit(tokenDistro, "Allocate")
            .withArgs(multisigAddress, recipientAddress1, amountRecipient1);

        await expect(
            tokenDistro.allocate(recipientAddress2, amountRecipient2, true),
        )
            .to.emit(tokenDistro, "Allocate")
            .withArgs(multisigAddress, recipientAddress2, amountRecipient2);

        await expect(
            tokenDistro.allocate(recipientAddress3, amountRecipient3, true),
        )
            .to.emit(tokenDistro, "Allocate")
            .withArgs(multisigAddress, recipientAddress3, amountRecipient3);
        await expect(
            tokenDistro.allocate(recipientAddress4, amountRecipient4, true),
        )
            .to.emit(tokenDistro, "Allocate")
            .withArgs(multisigAddress, recipientAddress4, amountRecipient4);

        expect(
            (await tokenDistro.balances(recipientAddress1)).allocatedTokens,
        ).to.be.equal(amountRecipient1);
        expect(
            (await tokenDistro.balances(recipientAddress2)).allocatedTokens,
        ).to.be.equal(amountRecipient2);
        expect(
            (await tokenDistro.balances(recipientAddress3)).allocatedTokens,
        ).to.be.equal(amountRecipient3);
        expect(
            (await tokenDistro.balances(recipientAddress4)).allocatedTokens,
        ).to.be.equal(amountRecipient4);
    });

    it("should be able to get the correct claimableAt", async () => {
        const offset = 90 * (3600 * 24);
        const startTime =
            (await ethers.provider.getBlock("latest")).timestamp + offset;
        const _startToCliff = 100 * (3600 * 24);
        const tokenDistro = await tokenDistroFactory.deploy(
            amount,
            startTime,
            _startToCliff,
            startToEnd,
            initialPercentage,
            token.address,
            false,
        );
        await tokenDistro.deployed();
        const amountRecipient1 = amount.div(2);
        const amountRecipient2 = amountRecipient1.div(2);
        const amountRecipient3 = amountRecipient2.div(2);
        const amountRecipient4 = amountRecipient3.div(2);

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            multisigAddress,
        );
        await tokenDistro.connect(multisig).assign(multisigAddress, amount);

        const initialAmount = amount.mul(initialPercentage).div(10000);
        const initialAmountRecipient = initialAmount
            .mul(amountRecipient1)
            .div(amount);

        await token.mint(tokenDistro.address, amount);
        tokenDistro.allocate(recipientAddress1, amountRecipient1, true);
        tokenDistro.allocate(recipientAddress2, amountRecipient2, true);
        tokenDistro.allocate(recipientAddress3, amountRecipient3, true);
        tokenDistro.allocate(recipientAddress4, amountRecipient4, true);
        await expect(
            tokenDistro.claimableAt(
                multisigAddress,
                (
                    await ethers.provider.getBlock("latest")
                ).timestamp,
            ),
        ).to.be.revertedWith(
            "TokenDistro::claimableAt: DISTRIBUTOR_ROLE_CANNOT_CLAIM",
        );
        await expect(
            tokenDistro.claimableAt(recipientAddress1, startTime - offset),
        ).to.be.revertedWith(
            "TokenDistro::claimableAt: NOT_VALID_PAST_TIMESTAMP",
        );

        // startTime > t
        expect(
            await tokenDistro.claimableAt(
                recipientAddress1,
                startTime - offset / 2,
            ),
        ).to.be.equal(0);
        // startTime = t
        expect(
            await tokenDistro.claimableAt(recipientAddress1, startTime),
        ).to.be.equal(initialAmountRecipient);
        // startTime < t < startToCliff
        expect(
            await tokenDistro.claimableAt(
                recipientAddress1,
                startTime + offset,
            ),
        ).to.be.equal(initialAmountRecipient);
        // t + 1 = startToCliff
        expect(
            await tokenDistro.claimableAt(
                recipientAddress1,
                startTime + _startToCliff - 1,
            ),
        ).to.be.equal(initialAmountRecipient);
        // t = startToCliff
        const totalTokensUnlockedAt1 = await tokenDistro.globallyClaimableAt(
            startTime + _startToCliff,
        );
        expect(
            await tokenDistro.claimableAt(
                recipientAddress1,
                startTime + _startToCliff,
            ),
        ).to.be.equal(totalTokensUnlockedAt1.mul(amountRecipient1).div(amount));
        // t = (startToEnd - startToCliff) / 2
        const totalTokensUnlockedAt2 = await tokenDistro.globallyClaimableAt(
            startTime + 365 * (3600 * 24),
        );
        expect(
            await tokenDistro.claimableAt(
                recipientAddress1,
                startTime + 365 * (3600 * 24),
            ),
        ).to.be.equal(totalTokensUnlockedAt2.mul(amountRecipient1).div(amount));
        // t = startToEnd
        expect(
            await tokenDistro.claimableAt(
                recipientAddress1,
                startTime + startToEnd,
            ),
        ).to.be.equal(amount.mul(amountRecipient1).div(amount));
        // t > startToEnd
        expect(
            await tokenDistro.claimableAt(
                recipientAddress1,
                startTime + startToEnd + offset,
            ),
        ).to.be.equal(amount.mul(amountRecipient1).div(amount));
    });

    it("should be able to withdraw", async () => {
        const now = (await ethers.provider.getBlock("latest")).timestamp;
        const offset = 365 * (3600 * 24);
        const startTime = now - offset;

        const tokenDistro = await tokenDistroFactory.deploy(
            amount,
            startTime,
            startToCliff,
            startToEnd,
            initialPercentage,
            token.address,
            false,
        );

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            multisigAddress,
        );
        await tokenDistro.connect(multisig).assign(multisigAddress, amount);

        await token.mint(tokenDistro.address, amount);
        const amountRecipient1 = amount.div(2);
        const amountRecipient2 = amountRecipient1.div(3);
        const amountRecipient3 = amountRecipient2.div(4);
        const amountRecipient4 = amountRecipient3.div(5);

        await tokenDistro.allocate(recipientAddress1, amountRecipient1, true);
        await tokenDistro.allocate(recipientAddress2, amountRecipient2, true);
        await tokenDistro.allocate(recipientAddress3, amountRecipient3, true);
        await tokenDistro.allocate(recipientAddress4, amountRecipient4, true);

        const nowTimestamp =
            (await ethers.provider.getBlock("latest")).timestamp + 1;

        await tokenDistro.setTimestamp(nowTimestamp);
        await expect(await tokenDistro.getTimestamp()).to.be.equal(
            nowTimestamp,
        );

        const withdrawableTokensAtRecipient1 = await tokenDistro.claimableAt(
            recipientAddress1,
            nowTimestamp,
        );

        await expect(tokenDistro.connect(recipient1).claim())
            .to.emit(tokenDistro, "Claim")
            .withArgs(recipientAddress1, withdrawableTokensAtRecipient1);

        const withdrawableTokensAtRecipient2 = await tokenDistro.claimableAt(
            recipientAddress2,
            nowTimestamp,
        );
        expect(
            await tokenDistro.claimableAt(recipientAddress2, nowTimestamp),
        ).to.be.equal(await tokenDistro.claimableNow(recipientAddress2));
        await expect(tokenDistro.connect(recipient2).claim())
            .to.emit(tokenDistro, "Claim")
            .withArgs(recipientAddress2, withdrawableTokensAtRecipient2);

        const withdrawableTokensAtRecipient3 = await tokenDistro.claimableAt(
            recipientAddress3,
            nowTimestamp,
        );
        expect(
            await tokenDistro.claimableAt(recipientAddress3, nowTimestamp),
        ).to.be.equal(await tokenDistro.claimableNow(recipientAddress3));
        await expect(tokenDistro.connect(recipient3).claim())
            .to.emit(tokenDistro, "Claim")
            .withArgs(recipientAddress3, withdrawableTokensAtRecipient3);

        const withdrawableTokensAtRecipient4 = await tokenDistro.claimableAt(
            recipientAddress4,
            nowTimestamp,
        );
        expect(
            await tokenDistro.claimableAt(recipientAddress4, nowTimestamp),
        ).to.be.equal(await tokenDistro.claimableNow(recipientAddress4));
        await expect(tokenDistro.connect(recipient4).claim())
            .to.emit(tokenDistro, "Claim")
            .withArgs(recipientAddress4, withdrawableTokensAtRecipient4);

        await tokenDistro.setTimestamp(startTime + startToEnd + offset);

        await tokenDistro.connect(recipient1).claim();
        const amountGrantedRecipient1 = (
            await tokenDistro.balances(recipientAddress1)
        ).allocatedTokens;
        expect(await token.balanceOf(recipientAddress1)).to.be.equal(
            amountGrantedRecipient1,
        );
        await expect(
            tokenDistro.connect(recipient1).claim(),
        ).to.be.revertedWith("TokenDistro::claim: NOT_ENOUGH_TOKENS_TO_CLAIM");
    });

    it("should be able to change the address", async () => {
        const now = (await ethers.provider.getBlock("latest")).timestamp;
        const offset = 365 * (3600 * 24);
        const startTime = now - offset;

        const tokenDistro = await tokenDistroFactory.deploy(
            amount,
            startTime,
            startToCliff,
            startToEnd,
            initialPercentage,
            token.address,
            false,
        );
        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            multisigAddress,
        );
        await tokenDistro.connect(multisig).assign(multisigAddress, amount);
        await token.mint(tokenDistro.address, amount);

        const amountRecipient1 = amount.div(2);
        await tokenDistro.allocate(recipientAddress1, amountRecipient1, true);
        const amountRecipient3 = amount.div(2);
        await tokenDistro.allocate(recipientAddress3, amountRecipient3, true);

        await tokenDistro.connect(recipient1).claim();

        const withdrawn = (await tokenDistro.balances(recipientAddress1))
            .claimed;
        const totalVested = (await tokenDistro.balances(recipientAddress1))
            .allocatedTokens;

        await expect(
            tokenDistro.connect(recipient1).changeAddress(recipientAddress2),
        )
            .to.emit(tokenDistro, "ChangeAddress")
            .withArgs(recipientAddress1, recipientAddress2);

        expect(
            (await tokenDistro.balances(recipientAddress1)).claimed,
        ).to.be.equal(0);
        expect(
            (await tokenDistro.balances(recipientAddress1)).allocatedTokens,
        ).to.be.equal(0);

        expect(
            (await tokenDistro.balances(recipientAddress2)).claimed,
        ).to.be.equal(withdrawn);
        expect(
            (await tokenDistro.balances(recipientAddress2)).allocatedTokens,
        ).to.be.equal(totalVested);
    });

    it("shouldn't be able to change the address if it's the distributor", async () => {
        const now = (await ethers.provider.getBlock("latest")).timestamp;
        const offset = 365 * (3600 * 24);
        const startTime = now - offset;

        const tokenDistro = await tokenDistroFactory.deploy(
            amount,
            startTime,
            startToCliff,
            startToEnd,
            initialPercentage,
            token.address,
            false,
        );

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            multisigAddress,
        );
        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            multisig2Address,
        );

        await tokenDistro.connect(multisig).assign(multisigAddress, amount);
        await token.mint(tokenDistro.address, amount);

        const amountRecipient1 = amount.div(2);
        const amountRecipient2 = amountRecipient1.div(2);
        const amountRecipient3 = amountRecipient2.div(2);

        await tokenDistro.allocate(recipientAddress1, amountRecipient1, true);
        await tokenDistro.allocate(recipientAddress3, amountRecipient3, true);

        await tokenDistro.connect(recipient1).claim();

        await expect(
            tokenDistro.connect(recipient1).changeAddress(recipientAddress3),
        ).to.be.revertedWith(
            "TokenDistro::changeAddress: ADDRESS_ALREADY_IN_USE",
        );
        await expect(
            tokenDistro.changeAddress(recipientAddress1),
        ).to.be.revertedWith(
            "TokenDistro::changeAddress: ADDRESS_ALREADY_IN_USE",
        );
        await expect(
            tokenDistro.changeAddress(recipientAddress2),
        ).to.be.revertedWith(
            "TokenDistro::changeAddress: DISTRIBUTOR_ROLE_NOT_A_VALID_ADDRESS",
        );
        await expect(
            tokenDistro.connect(recipient4).changeAddress(multisig2Address),
        ).to.be.revertedWith(
            "TokenDistro::changeAddress: DISTRIBUTOR_ROLE_NOT_A_VALID_ADDRESS",
        );
    });
    it("should be able to cancel an allocation", async () => {
        const now = (await ethers.provider.getBlock("latest")).timestamp;
        const offset = 365 * (3600 * 24);
        const startTime = now - offset;

        const tokenDistro = await tokenDistroFactory.deploy(
            amount,
            startTime,
            startToCliff,
            startToEnd,
            initialPercentage,
            token.address,
            true,
        );

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            multisigAddress,
        );
        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            multisig2Address,
        );

        await tokenDistro.connect(multisig).assign(multisigAddress, amount);
        await token.mint(tokenDistro.address, amount);

        const amountRecipient1 = amount.div(2);
        await tokenDistro.allocate(recipientAddress1, amountRecipient1, true);
        const amountRecipient3 = amount.div(2);
        await tokenDistro.allocate(recipientAddress3, amountRecipient3, true);

        await tokenDistro.connect(recipient1).claim();

        const withdrawn = (await tokenDistro.balances(recipientAddress1))
            .claimed;
        const totalVested = (await tokenDistro.balances(recipientAddress1))
            .allocatedTokens;

        await expect(
            tokenDistro
                .connect(recipient1)
                .cancelAllocation(recipientAddress1, recipientAddress2),
        ).to.be.revertedWith("TokenDistro::cancelAllocation: ONLY_ADMIN_ROLE");
        await expect(
            tokenDistro.cancelAllocation(recipientAddress1, recipientAddress3),
        ).to.be.revertedWith(
            "TokenDistro::cancelAllocation: ADDRESS_ALREADY_IN_USE",
        );
        await expect(
            tokenDistro.cancelAllocation(recipientAddress1, multisig2Address),
        ).to.be.revertedWith(
            "TokenDistro::cancelAllocation: DISTRIBUTOR_ROLE_NOT_A_VALID_ADDRESS",
        );

        await expect(
            tokenDistro.cancelAllocation(recipientAddress1, recipientAddress2),
        )
            .to.emit(tokenDistro, "ChangeAddress")
            .withArgs(recipientAddress1, recipientAddress2);

        await expect(
            tokenDistro.cancelAllocation(recipientAddress4, recipientAddress1),
        )
            .to.emit(tokenDistro, "ChangeAddress")
            .withArgs(recipientAddress4, recipientAddress1);
    });

    it("should revert if it's not cancellabe", async () => {
        const now = (await ethers.provider.getBlock("latest")).timestamp;
        const offset = 365 * (3600 * 24);
        const startTime = now - offset;

        const tokenDistro = await tokenDistroFactory.deploy(
            amount,
            startTime,
            startToCliff,
            startToEnd,
            initialPercentage,
            token.address,
            false,
        );

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            multisigAddress,
        );
        await tokenDistro.connect(multisig).assign(multisigAddress, amount);
        await token.mint(tokenDistro.address, amount);

        const amountRecipient1 = amount.div(2);
        await tokenDistro.allocate(recipientAddress1, amountRecipient1, true);
        const amountRecipient3 = amount.div(2);
        await tokenDistro.allocate(recipientAddress3, amountRecipient3, true);

        await tokenDistro.connect(recipient1).claim();

        await expect(
            tokenDistro.cancelAllocation(recipientAddress1, recipientAddress2),
        ).to.be.revertedWith("TokenDistro::cancelAllocation: NOT_CANCELABLE");
    });
});
