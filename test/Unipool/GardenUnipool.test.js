let TokenDistroFactory,
    GardenUnipoolFactory,
    TokenFactory,
    Token,
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
        ] = await hre.ethers.getSigners();

        multisigAddress = await multisig.getAddress();
        multisig2Address = await multisig2.getAddress();
        multisig3Address = await multisig3.getAddress();
        recipientAddress1 = await recipient1.getAddress();
        recipientAddress2 = await recipient2.getAddress();
        recipientAddress3 = await recipient3.getAddress();
        recipientAddress4 = await recipient4.getAddress();

        TokenFactory = await ethers.getContractFactory("GIV");
        Token = await TokenFactory.deploy(multisigAddress);
        await Token.deployed();
        await Token.mint(multisigAddress, amount);

        TokenDistroFactory = await ethers.getContractFactory("TokenDistroMock");
        GardenUnipoolFactory = await ethers.getContractFactory(
            "GardenUnipoolTokenDistributorMock",
        );
    });
    it("should be able to transfer the balance", async () => {
        const offset = 90 * (3600 * 24);
        const startTime = (await ethers.provider.getBlock()).timestamp + offset;
        const lmDuration = startToCliff * 4;
        const rewardAmount = amount.div(2);

        const TokenDistro = await TokenDistroFactory.deploy(
            amount,
            startTime,
            startToCliff,
            startToEnd,
            initialPercentage,
            Token.address,
            false,
        );

        await Token.transfer(TokenDistro.address, amount);

        const GardenUnipool = await GardenUnipoolFactory.deploy(
            TokenDistro.address,
            Token.address,
            lmDuration,
        );
        await GardenUnipool.setRewardDistribution(multisigAddress);

        await TokenDistro.grantRole(
            await TokenDistro.DISTRIBUTOR_ROLE(),
            GardenUnipool.address,
        );
        await TokenDistro.assign(GardenUnipool.address, rewardAmount);
        expect(
            (await TokenDistro.balances(GardenUnipool.address)).allocatedTokens,
        ).to.be.equal(rewardAmount);

        const stakeAmountRecipient1 = amount.div(4);
        const stakeAmountRecipient2 = stakeAmountRecipient1.div(2);
        const stakeAmountRecipient3 = stakeAmountRecipient2.div(2);
        const stakeAmountRecipient4 = stakeAmountRecipient3.div(2);

        const totalStakeAmount = stakeAmountRecipient1
            .add(stakeAmountRecipient2)
            .add(stakeAmountRecipient3)
            .add(stakeAmountRecipient4);

        const doStake = async (_accountAddress, _amount) => {
            await expect(GardenUnipool._stake(_accountAddress, _amount))
                .to.emit(GardenUnipool, "Staked")
                .withArgs(_accountAddress, _amount);
        };
        await doStake(recipientAddress1, stakeAmountRecipient1);
        await doStake(recipientAddress2, stakeAmountRecipient2);
        await doStake(recipientAddress3, stakeAmountRecipient3);
        await doStake(recipientAddress4, stakeAmountRecipient4);

        expect(await GardenUnipool.totalSupply()).to.be.equal(totalStakeAmount);

        await TokenDistro.setTimestamp(startTime);
        await GardenUnipool.setTimestamp(startTime);

        await expect(GardenUnipool.notifyRewardAmount(rewardAmount))
            .to.emit(GardenUnipool, "RewardAdded")
            .withArgs(rewardAmount);

        expect(await GardenUnipool.periodFinish()).to.be.equal(
            startTime + lmDuration,
        );

        expect(await GardenUnipool.earned(recipientAddress1)).to.be.equal(0);
        expect(await GardenUnipool.earned(recipientAddress2)).to.be.equal(0);
        expect(await GardenUnipool.earned(recipientAddress3)).to.be.equal(0);
        expect(await GardenUnipool.earned(recipientAddress4)).to.be.equal(0);

        const stepDuration = lmDuration / 8;

        const checkUserEarnValues = async (_account) => {
            const _accountAddress = await _account.getAddress();
            const _earnedAmount = await GardenUnipool._earned(_accountAddress);
            const earnedAmount = await GardenUnipool.earned(_accountAddress);
            const tokenDistroClaimableAmount = await TokenDistro.claimableNow(
                _accountAddress,
            );
            const releasedAmount = earnedAmount.add(tokenDistroClaimableAmount);

            await expect(GardenUnipool.connect(_account).getReward())
                .to.emit(GardenUnipool, "RewardPaid")
                .withArgs(_accountAddress, _earnedAmount)
                .to.emit(TokenDistro, "Allocate")
                .withArgs(GardenUnipool.address, _accountAddress, _earnedAmount)
                .to.emit(TokenDistro, "Claim")
                .withArgs(_accountAddress, releasedAmount)
                .to.emit(Token, "Transfer")
                .withArgs(TokenDistro.address, _accountAddress, releasedAmount);
        };

        const doStep = async (_step, _accounts) => {
            await TokenDistro.setTimestamp(startTime + _step * stepDuration);
            await GardenUnipool.setTimestamp(startTime + _step * stepDuration);
            for (let i = 0; i < _accounts.length; i++) {
                // eslint-disable-next-line no-await-in-loop
                await checkUserEarnValues(_accounts[i]);
            }
        };

        await doStep(1, [recipient1]);
        await doStep(2, [recipient1, recipient2]);
        await doStep(3, [recipient2, recipient3]);
        await doStep(8, [recipient4]);

        await GardenUnipool.connect(recipient1).getReward();
        await GardenUnipool.connect(recipient2).getReward();
        await GardenUnipool.connect(recipient3).getReward();
        await GardenUnipool.connect(recipient4).getReward();

        // It should be used almost all of its allocation, just a tiny amount can remain for
        // division inaccuracy reason
        expect(
            (await TokenDistro.balances(GardenUnipool.address)).allocatedTokens,
        ).to.be.lt(ethers.utils.parseEther("0.000000001"));
    });
});
