import { ethers } from "hardhat";
import { expect } from "chai";
import { describe, beforeEach, it } from "mocha";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractFactory } from "ethers";
import { TokenDistro } from "../../typechain-types/TokenDistro";
import { GIV } from "../../typechain-types/GIV";
import { UniswapV3RewardToken } from "../../typechain-types/UniswapV3RewardToken";
import {
    IncentiveKeyStruct,
    UniswapV3StakerMock,
} from "../../typechain-types/UniswapV3StakerMock";

const { AddressZero } = ethers.constants;

let tokenDistroFactory: ContractFactory,
    tokenDistro: TokenDistro,
    givTokenFactory: ContractFactory,
    givToken: GIV,
    gurTokenFactory: ContractFactory,
    uniV3StakerFactory: ContractFactory,
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

const amount = ethers.utils.parseEther("80000000");
const startToCliff = 180 * (3600 * 24);
const startToEnd = 730 * (3600 * 24);
const initialPercentage = 500;

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
        ] = await ethers.getSigners();

        multisigAddress = await multisig.getAddress();
        multisig2Address = await multisig2.getAddress();
        multisig3Address = await multisig3.getAddress();
        recipientAddress1 = await recipient1.getAddress();
        recipientAddress2 = await recipient2.getAddress();
        recipientAddress3 = await recipient3.getAddress();
        recipientAddress4 = await recipient4.getAddress();

        givTokenFactory = await ethers.getContractFactory("GIV");
        givToken = (await givTokenFactory.deploy(multisigAddress)) as GIV;
        await givToken.deployed();
        await givToken.mint(multisigAddress, amount);

        tokenDistroFactory = await ethers.getContractFactory("TokenDistroMock");

        const offset = 90 * (3600 * 24);
        const startTime =
            (await ethers.provider.getBlock("latest")).timestamp + offset;

        tokenDistro = (await tokenDistroFactory.deploy(
            amount,
            startTime,
            startToCliff,
            startToEnd,
            initialPercentage,
            givToken.address,
            false,
        )) as TokenDistro;

        await givToken.transfer(tokenDistro.address, amount);
        gurTokenFactory = await ethers.getContractFactory(
            "UniswapV3RewardTokenMock",
        );

        uniV3StakerFactory = await ethers.getContractFactory(
            "UniswapV3StakerMock",
        );
    });

    it("should allow transferFrom only by staker to itself and tx origin is owner", async () => {
        const uniV3StakerContract =
            (await uniV3StakerFactory.deploy()) as UniswapV3StakerMock;
        const uniV3StakerAddress = uniV3StakerContract.address;

        const gurToken = (await gurTokenFactory.deploy(
            tokenDistro.address,
            uniV3StakerAddress,
        )) as UniswapV3RewardToken;

        const incentiveKey: IncentiveKeyStruct = {
            rewardToken: gurToken.address,
            pool: recipientAddress4, // does not matter because it's mock
            startTime: 0, // does not matter because it's mock
            endTime: 0, // does not matter because it's mock
            refundee: recipientAddress4, // does not matter because it's mock
        };

        // check that only multisig can be the caller to the staker
        await expect(
            uniV3StakerContract
                .connect(multisig2)
                .createIncentive(incentiveKey, amount),
        ).to.be.revertedWith(
            "GivethUniswapV3Reward:transferFrom:ONLY_OWNER_CAN_ADD_INCENTIVES",
        );

        // check msg.sender of the reward token must be the stake contracts
        await expect(
            gurToken.transferFrom(multisigAddress, uniV3StakerAddress, amount),
        ).to.be.revertedWith("GivethUniswapV3Reward:transferFrom:ONLY_STAKER");

        await expect(await gurToken.balanceOf(uniV3StakerAddress)).to.be.equal(
            0,
        );
        await expect(await gurToken.balanceOf(recipientAddress1)).to.be.equal(
            0,
        );
        await expect(await gurToken.totalSupply()).to.be.equal(0);

        await expect(uniV3StakerContract.createIncentive(incentiveKey, amount))
            .to.emit(gurToken, "Transfer")
            .withArgs(ethers.constants.AddressZero, uniV3StakerAddress, amount);

        await expect(await gurToken.balanceOf(uniV3StakerAddress)).to.be.equal(
            amount,
        );
        await expect(await gurToken.totalSupply()).to.be.equal(amount);
    });

    it("should allow only staker to transfer token directly", async () => {
        const uniV3StakerContract =
            (await uniV3StakerFactory.deploy()) as UniswapV3StakerMock;
        const uniV3StakerAddress = uniV3StakerContract.address;

        const gurToken = (await gurTokenFactory.deploy(
            tokenDistro.address,
            uniV3StakerAddress,
        )) as UniswapV3RewardToken;

        const incentiveKey: IncentiveKeyStruct = {
            rewardToken: gurToken.address,
            pool: recipientAddress4, // does not matter because it's mock
            startTime: 0, // does not matter because it's mock
            endTime: 0, // does not matter because it's mock
            refundee: recipientAddress4, // does not matter because it's mock
        };

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            gurToken.address,
        );
        await tokenDistro.assign(gurToken.address, amount);

        await uniV3StakerContract.createIncentive(incentiveKey, amount);

        const transferAmount = amount.div(10);
        await expect(
            gurToken.transfer(uniV3StakerAddress, transferAmount),
        ).to.be.revertedWith("GivethUniswapV3Reward:transfer:ONLY_STAKER");

        await expect(
            uniV3StakerContract.claimRewardMock(
                gurToken.address,
                transferAmount,
            ),
        )
            .to.emit(gurToken, "RewardPaid")
            .withArgs(multisigAddress, transferAmount);

        await expect(await gurToken.balanceOf(uniV3StakerAddress)).to.be.equal(
            amount.sub(transferAmount),
        );
        await expect(await gurToken.totalSupply()).to.be.equal(
            amount.sub(transferAmount),
        );

        await expect(await gurToken.balanceOf(recipientAddress1)).to.be.equal(
            0,
        );

        await expect(
            uniV3StakerContract
                .connect(multisig2)
                .claimRewardMock(gurToken.address, transferAmount),
        )
            .to.emit(gurToken, "RewardPaid")
            .withArgs(multisig2Address, transferAmount);
    });

    // Copied from TokenDistro.test.js and refactored to use Transfer instead
    // of Allocate
    it("should allow Staker transfer the balance", async () => {
        const uniV3StakerContract =
            (await uniV3StakerFactory.deploy()) as UniswapV3StakerMock;
        const uniV3StakerAddress = uniV3StakerContract.address;

        const gurToken = (await gurTokenFactory.deploy(
            tokenDistro.address,
            uniV3StakerAddress,
        )) as UniswapV3RewardToken;

        const incentiveKey: IncentiveKeyStruct = {
            rewardToken: gurToken.address,
            pool: recipientAddress4, // does not matter because it's mock
            startTime: 0, // does not matter because it's mock
            endTime: 0, // does not matter because it's mock
            refundee: recipientAddress4, // does not matter because it's mock
        };

        await uniV3StakerContract.createIncentive(incentiveKey, amount);

        const amountRecipient1 = amount.div(2);
        const amountRecipient2 = amountRecipient1.div(2);
        const amountRecipient3 = amountRecipient2.div(2);
        const amountRecipient4 = amountRecipient3.div(2);

        await expect(
            uniV3StakerContract
                .connect(recipient1)
                .claimRewardMock(gurToken.address, amountRecipient1),
        ).to.be.revertedWith(
            "TokenDistro::onlyDistributor: ONLY_DISTRIBUTOR_ROLE",
        );

        const gurTokenAddress = gurToken.address;

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            gurTokenAddress,
        );
        await tokenDistro.assign(gurTokenAddress, amount);

        async function testTransfer(recipientSigner, amountRecipient) {
            const { address: recipientAddress } = recipientSigner;
            await expect(
                uniV3StakerContract
                    .connect(recipientSigner)
                    .claimRewardMock(gurToken.address, amountRecipient),
            )
                .to.emit(tokenDistro, "Allocate")
                .withArgs(gurTokenAddress, recipientAddress, amountRecipient)
                .to.emit(gurToken, "RewardPaid")
                .withArgs(recipientAddress, amountRecipient);

            expect(
                (await tokenDistro.balances(recipientAddress)).allocatedTokens,
            ).to.be.equal(amountRecipient);
        }

        await testTransfer(recipient1, amountRecipient1);
        await testTransfer(recipient2, amountRecipient2);
        await testTransfer(recipient3, amountRecipient3);
        await testTransfer(recipient4, amountRecipient4);
    });

    it("should not transfer more than token distro assigned value", async () => {
        const uniV3StakerContract =
            (await uniV3StakerFactory.deploy()) as UniswapV3StakerMock;
        const uniV3StakerAddress = uniV3StakerContract.address;

        const gurToken = (await gurTokenFactory.deploy(
            tokenDistro.address,
            uniV3StakerAddress,
        )) as UniswapV3RewardToken;

        const incentiveKey: IncentiveKeyStruct = {
            rewardToken: gurToken.address,
            pool: recipientAddress4, // does not matter because it's mock
            startTime: 0, // does not matter because it's mock
            endTime: 0, // does not matter because it's mock
            refundee: recipientAddress4, // does not matter because it's mock
        };

        await uniV3StakerContract.createIncentive(incentiveKey, amount);

        const gurTokenAddress = gurToken.address;

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            gurTokenAddress,
        );
        await tokenDistro.assign(gurTokenAddress, amount.div(2));

        await expect(
            uniV3StakerContract
                .connect(recipient1)
                .claimRewardMock(gurToken.address, amount),
        ).to.be.reverted;
    });

    it("should not transfer more than minted value", async () => {
        const uniV3StakerContract =
            (await uniV3StakerFactory.deploy()) as UniswapV3StakerMock;
        const uniV3StakerAddress = uniV3StakerContract.address;

        const gurToken = (await gurTokenFactory.deploy(
            tokenDistro.address,
            uniV3StakerAddress,
        )) as UniswapV3RewardToken;

        const incentiveKey: IncentiveKeyStruct = {
            rewardToken: gurToken.address,
            pool: recipientAddress4, // does not matter because it's mock
            startTime: 0, // does not matter because it's mock
            endTime: 0, // does not matter because it's mock
            refundee: recipientAddress4, // does not matter because it's mock
        };

        const transferAmount = amount.div(2);
        await uniV3StakerContract.createIncentive(incentiveKey, transferAmount);

        const gurTokenAddress = gurToken.address;

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            gurTokenAddress,
        );
        await tokenDistro.assign(gurTokenAddress, amount);

        await expect(
            uniV3StakerContract
                .connect(recipient1)
                .claimRewardMock(gurToken.address, amount),
        ).to.be.reverted;
    });

    it("should allow owner to disable rewards", async () => {
        const gurToken = (await gurTokenFactory.deploy(
            tokenDistro.address,
            AddressZero,
        )) as UniswapV3RewardToken;

        expect(await gurToken.disabled()).to.be.eq(false);

        await expect(gurToken.connect(recipient1).disable()).to.be.revertedWith(
            "Ownable: caller is not the owner",
        );

        await expect(gurToken.connect(recipient1).enable()).to.be.revertedWith(
            "Ownable: caller is not the owner",
        );

        await expect(gurToken.disable())
            .to.emit(gurToken, "Disabled")
            .withArgs(multisigAddress);

        expect(await gurToken.disabled()).to.be.eq(true);

        await expect(gurToken.enable())
            .to.emit(gurToken, "Enabled")
            .withArgs(multisigAddress);

        expect(await gurToken.disabled()).to.be.eq(false);
    });

    it("should not pay rewards after the token is disabled", async () => {
        const uniV3StakerContract =
            (await uniV3StakerFactory.deploy()) as UniswapV3StakerMock;
        const uniV3StakerAddress = uniV3StakerContract.address;

        const gurToken = (await gurTokenFactory.deploy(
            tokenDistro.address,
            uniV3StakerAddress,
        )) as UniswapV3RewardToken;

        const incentiveKey: IncentiveKeyStruct = {
            rewardToken: gurToken.address,
            pool: recipientAddress4, // does not matter because it's mock
            startTime: 0, // does not matter because it's mock
            endTime: 0, // does not matter because it's mock
            refundee: recipientAddress4, // does not matter because it's mock
        };

        await uniV3StakerContract.createIncentive(incentiveKey, amount);

        const amountRecipient1 = amount.div(2);
        const amountRecipient2 = amountRecipient1.div(2);

        const gurTokenAddress = gurToken.address;

        await tokenDistro.grantRole(
            await tokenDistro.DISTRIBUTOR_ROLE(),
            gurTokenAddress,
        );
        await tokenDistro.assign(gurTokenAddress, amount);

        await expect(
            uniV3StakerContract
                .connect(recipient1)
                .claimRewardMock(gurToken.address, amountRecipient1),
        )
            .to.emit(tokenDistro, "Allocate")
            .withArgs(gurTokenAddress, recipient1.address, amountRecipient1)
            .to.emit(gurToken, "RewardPaid")
            .withArgs(recipient1.address, amountRecipient1);

        expect(
            (await tokenDistro.balances(recipient1.address)).allocatedTokens,
        ).to.be.equal(amountRecipient1);

        // Disable contract
        await gurToken.disable();

        await expect(
            uniV3StakerContract
                .connect(recipient2)
                .claimRewardMock(gurToken.address, amountRecipient2),
        )
            .to.emit(gurToken, "InvalidRewardPaid")
            .withArgs(recipient2.address, amountRecipient2);

        expect(
            (await tokenDistro.balances(recipient2.address)).allocatedTokens,
        ).to.be.equal(0);
    });
});
