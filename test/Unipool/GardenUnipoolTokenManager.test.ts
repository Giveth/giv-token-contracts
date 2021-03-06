import { expect } from "chai";
import { ethers } from "hardhat";
import { describe, beforeEach, it } from "mocha";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractFactory } from "ethers";
import { GIV } from "../../typechain-types/GIV";
import { TokenDistroMock } from "../../typechain-types/TokenDistroMock";
import { GardenUnipoolTokenDistributorMock } from "../../typechain-types/GardenUnipoolTokenDistributorMock";
import { HookedTokenManagerMock } from "../../typechain-types/HookedTokenManagerMock";

let tokenDistroFactory: ContractFactory,
    gardenUnipoolFactory: ContractFactory,
    tokenFactory: ContractFactory,
    hookedTokenManagerFactory: ContractFactory,
    gardenUnipool: GardenUnipoolTokenDistributorMock,
    tokenDistro: TokenDistroMock,
    givToken: GIV,
    hookedTokenManager: HookedTokenManagerMock,
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
let lmDuration;
const rewardAmount = amount.div(2);

const startToCliff = 180 * (3600 * 24);
const startToEnd = 730 * (3600 * 24);
const initialPercentage = 500;

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
        gardenUnipoolFactory = await ethers.getContractFactory(
            "GardenUnipoolTokenDistributorMock",
        );

        hookedTokenManagerFactory = await ethers.getContractFactory(
            "HookedTokenManagerMock",
        );

        startTime =
            (await ethers.provider.getBlock("latest")).timestamp + offset;
        lmDuration = startToCliff * 4;
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

        // deploy hookedTokenManager
        hookedTokenManager = (await hookedTokenManagerFactory.deploy(
            givToken.address,
        )) as HookedTokenManagerMock;

        // deploy and initialize gaden unipool
        gardenUnipool =
            (await gardenUnipoolFactory.deploy()) as GardenUnipoolTokenDistributorMock;

        await gardenUnipool.initialize(
            tokenDistro.address,
            lmDuration,
            hookedTokenManager.address,
        );

        // check that the token manager is set
        expect(await gardenUnipool.getTokenManager()).to.be.equal(
            hookedTokenManager.address,
        );

        await expect(
            gardenUnipool.onRegisterAsHook(
                gardenUnipool.address,
                givToken.address,
            ),
        ).to.be.revertedWith("Hooks must be called from Token Manager");

        // register hook in token manager
        await hookedTokenManager.registerHook(gardenUnipool.address);

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
    it("should be able to transfer the balance", async () => {
        const stakeAmountRecipient1 = amount.div(4);
        const stakeAmountRecipient2 = stakeAmountRecipient1.div(2);
        const stakeAmountRecipient3 = stakeAmountRecipient2.div(2);
        const stakeAmountRecipient4 = stakeAmountRecipient3.div(2);

        const totalStakeAmount = stakeAmountRecipient1
            .add(stakeAmountRecipient2)
            .add(stakeAmountRecipient3)
            .add(stakeAmountRecipient4);

        const doStake = async (_accountAddress, _amount) => {
            await expect(
                hookedTokenManager.onTransfer(
                    ethers.constants.AddressZero,
                    _accountAddress,
                    _amount,
                ),
            )
                .to.emit(gardenUnipool, "Staked")
                .withArgs(_accountAddress, _amount);
        };
        await doStake(recipientAddress1, stakeAmountRecipient1);
        await doStake(recipientAddress2, stakeAmountRecipient2);
        await doStake(recipientAddress3, stakeAmountRecipient3);
        await doStake(recipientAddress4, stakeAmountRecipient4);

        expect(await gardenUnipool.totalSupply()).to.be.equal(totalStakeAmount);

        await tokenDistro.setTimestamp(startTime);
        await gardenUnipool.setTimestamp(startTime);

        await expect(gardenUnipool.notifyRewardAmount(rewardAmount))
            .to.emit(gardenUnipool, "RewardAdded")
            .withArgs(rewardAmount);

        expect(await gardenUnipool.periodFinish()).to.be.equal(
            startTime + lmDuration,
        );

        expect(await gardenUnipool.earned(recipientAddress1)).to.be.equal(0);
        expect(await gardenUnipool.earned(recipientAddress2)).to.be.equal(0);
        expect(await gardenUnipool.earned(recipientAddress3)).to.be.equal(0);
        expect(await gardenUnipool.earned(recipientAddress4)).to.be.equal(0);

        const stepDuration = lmDuration / 8;

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
            // do the division, the two fraction may add up to more than 1 and result in tiny difference
            expect(transferredAmount).to.be.closeTo(
                releasedAmount,
                1,
                "The transferred amount doesn't match the expected released amount",
            );
        };

        const doStep = async (_step, _accounts) => {
            await tokenDistro.setTimestamp(startTime + _step * stepDuration);
            await gardenUnipool.setTimestamp(startTime + _step * stepDuration);
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

        // It should be used almost all of its allocation, just a tiny amount can remain for
        // division inaccuracy reason
        expect(
            (await tokenDistro.balances(gardenUnipool.address)).allocatedTokens,
        ).to.be.lt(ethers.utils.parseEther("0.000000001"));
    });
});
