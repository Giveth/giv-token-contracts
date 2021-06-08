let TokenDistroFactory,
  tokenFactory,
  token,
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
  recipientAddress4;
const { expect } = require("chai");
const hre = require("hardhat");
const ethers = hre.ethers;

const amount = ethers.utils.parseEther("20000000");
const startToCliff = 180 * (3600 * 24);
const startToEnd = 730 * (3600 * 24);
const initialPercentage = 500;

describe("TokenDistro", function() {
  before(async function() {
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

    tokenFactory = await ethers.getContractFactory("Token");
    token = await tokenFactory.deploy(multisigAddress, "Test Token", "TTT", 18);
    await token.deployed();
    await token.mint(multisigAddress, amount);

    TokenDistroFactory = await ethers.getContractFactory("TokenDistroMock");

  });

  it("should check the constructor", async () => {
    const startTime = (await ethers.provider.getBlock()).timestamp;

    await expect(TokenDistroFactory.deploy(
      amount,
      startTime,
      startToEnd,
      startToCliff,
      initialPercentage,
      token.address
    )).to.be.revertedWith("TokenDistro::constructor: DURATION_LESS_THAN_CLIFF");

    await expect(TokenDistroFactory.deploy(
      amount,
      startTime,
      startToCliff,
      startToEnd,
      initialPercentage + 10000,
      token.address
    )).to.be.revertedWith("TokenDistro::constructor: INITIALPERCENTAGE_GREATER_THAN_100");
    
  })

  it("should check the assign conditions", async () => {
    const startTime = (await ethers.provider.getBlock()).timestamp;

    TokenDistro = await TokenDistroFactory.deploy(
      amount,
      startTime,
      startToCliff,
      startToEnd,
      initialPercentage,
      token.address
   );

    await expect(TokenDistro.connect(recipient1).assign(recipientAddress1, amount))
      .to.be.revertedWith("TokenDistro::assign: ONLY_ADMIN_ROLE");

    await expect(TokenDistro.connect(multisig).assign(recipientAddress1, amount))
      .to.be.revertedWith("TokenDistro::assign: ONLY_TO_DISTRIBUTOR_ROLE");

    await TokenDistro.grantRole(await TokenDistro.DISTRIBUTOR_ROLE(), multisig2Address)

    // Try to assign more than possible
    await expect(TokenDistro.connect(multisig).assign(multisig2Address, amount.add(1)))
      .to.be.reverted;

    // Check total amount
    await expect((await TokenDistro.balances(TokenDistro.address)).allocatedTokens).to.be.equal(amount)

    // Allocate the total in two chunks
    await TokenDistro.connect(multisig).assign(multisig2Address, amount.div(2))
    await TokenDistro.connect(multisig).assign(multisig2Address, amount.div(2))

    // Try to assing more than possible
    await expect(TokenDistro.connect(multisig).assign(multisig2Address, 1))
      .to.be.reverted;

    // Check permissions
    await expect(await TokenDistro.connect(multisig).hasRole(await TokenDistro.DISTRIBUTOR_ROLE(), multisigAddress))
      .to.be.false;
    await expect(await TokenDistro.connect(multisig).getRoleMemberCount(await TokenDistro.DEFAULT_ADMIN_ROLE()))
      .to.be.equal(0);

  })


  it("should deploy the TokenDistro", async () => {
    const startTime = (await ethers.provider.getBlock()).timestamp;
    const offset = 90 * (3600 * 24);

    TokenDistro = await TokenDistroFactory.deploy(
      amount,
      startTime,
      startToCliff,
      startToEnd,
      initialPercentage,
      token.address
    );

    let initialAmount = amount.mul(initialPercentage).div(10000);

    // startTime > t
    expect(
      await TokenDistro.globallyClaimableAt(startTime - offset)
    ).to.be.equal(0);
    // startTime = t
    expect(await TokenDistro.globallyClaimableAt(startTime)).to.be.equal(
      initialAmount
    );
    // startTime < t < startToCliff
    expect(
      await TokenDistro.globallyClaimableAt(startTime + offset)
    ).to.be.equal(initialAmount);
    // t + 1 = startToCliff
    expect(
      await TokenDistro.globallyClaimableAt(startTime + startToCliff - 1)
    ).to.be.equal(initialAmount);
    // t = startToCliff
    expect(
      await TokenDistro.globallyClaimableAt(startTime + startToCliff)
    ).to.be.equal(
      amount
        .sub(initialAmount)
        .mul(startToCliff)
        .div(startToEnd)
        .add(initialAmount)
    );
    // t = (startToEnd - startToCliff) / 2
    expect(
      await TokenDistro.globallyClaimableAt(startTime + 365 * (3600 * 24))
    ).to.be.equal(amount.sub(initialAmount).div(2).add(initialAmount));
    // t = startToEnd
    expect(
      await TokenDistro.globallyClaimableAt(startTime + startToEnd)
    ).to.be.equal(amount);
    // t > startToEnd
    expect(
      await TokenDistro.globallyClaimableAt(startTime + startToEnd + offset)
    ).to.be.equal(amount);
  });

  it("should check the isInitialized modifier", async () => {
    const startTime = (await ethers.provider.getBlock()).timestamp;

    let TokenDistro = await TokenDistroFactory.deploy(
      amount,
      startTime,
      startToCliff,
      startToEnd,
      initialPercentage,
      token.address
    );
    let amountRecipient1 = amount.div(2);
    let amountRecipient2 = amountRecipient1.div(2);
    let amountRecipient3 = amountRecipient2.div(2);
    let amountRecipient4 = amountRecipient3.div(2);

    await TokenDistro.grantRole(await TokenDistro.DISTRIBUTOR_ROLE(), multisigAddress)
    await TokenDistro.connect(multisig).assign(multisigAddress, amount.div(2))

    await expect(TokenDistro.connect(multisig2).allocate(recipientAddress1, amount))
      .to.be.revertedWith("TokenDistro::isInitialized: DEFAULT_ADMIN_ROLE_EXISTS");

    await TokenDistro.connect(multisig).renounceRole(await TokenDistro.DEFAULT_ADMIN_ROLE(), multisigAddress);

    await expect(TokenDistro.connect(multisig2).allocate(recipientAddress1, amount))
      .to.be.revertedWith("TokenDistro::isInitialized: TOKENS_PENDING_ALLOCATION");
  })

  it("should be able to transfer the balance", async () => {
    const startTime = (await ethers.provider.getBlock()).timestamp;

    let TokenDistro = await TokenDistroFactory.deploy(
      amount,
      startTime,
      startToCliff,
      startToEnd,
      initialPercentage,
      token.address
    );
    let amountRecipient1 = amount.div(2);
    let amountRecipient2 = amountRecipient1.div(2);
    let amountRecipient3 = amountRecipient2.div(2);
    let amountRecipient4 = amountRecipient3.div(2);

    await TokenDistro.grantRole(await TokenDistro.DISTRIBUTOR_ROLE(), multisigAddress)
    await TokenDistro.connect(multisig).assign(multisigAddress, amount)

    await expect(TokenDistro.connect(multisig2).allocate(recipientAddress1, amount))
      .to.be.revertedWith("TokenDistro::allocate: ONLY_DISTRIBUTOR_ROLE");

    await expect(TokenDistro.connect(multisig).allocate(multisigAddress, amount))
      .to.be.revertedWith("TokenDistro::allocate: DISTRIBUTOR_NOT_VALID_RECIPIENT");

    await expect(TokenDistro.allocate(recipientAddress1, amountRecipient1))
      .to.emit(TokenDistro, "Allocate")
      .withArgs(multisigAddress, recipientAddress1, amountRecipient1);
    await expect(TokenDistro.allocate(recipientAddress2, amountRecipient2))
      .to.emit(TokenDistro, "Allocate")
      .withArgs(multisigAddress, recipientAddress2, amountRecipient2);
    await expect(TokenDistro.allocate(recipientAddress3, amountRecipient3))
      .to.emit(TokenDistro, "Allocate")
      .withArgs(multisigAddress, recipientAddress3, amountRecipient3);
    await expect(TokenDistro.allocate(recipientAddress4, amountRecipient4))
      .to.emit(TokenDistro, "Allocate")
      .withArgs(multisigAddress, recipientAddress4, amountRecipient4);

    expect((await TokenDistro.balances(recipientAddress1)).allocatedTokens).to.be.equal(
      amountRecipient1
    );
    expect((await TokenDistro.balances(recipientAddress2)).allocatedTokens).to.be.equal(

      amountRecipient2
    );
    expect((await TokenDistro.balances(recipientAddress3)).allocatedTokens).to.be.equal(
      amountRecipient3
    );
    expect((await TokenDistro.balances(recipientAddress4)).allocatedTokens).to.be.equal(
      amountRecipient4
    );
  });

  it("should be able to get the correct claimableAt", async () => {
    const startTime = (await ethers.provider.getBlock()).timestamp;
    const offset = 90 * (3600 * 24);

    let TokenDistro = await TokenDistroFactory.deploy(
      amount,
      startTime,
      startToCliff,
      startToEnd,
      initialPercentage,
      token.address
    );

    let amountRecipient1 = amount.div(2);
    let amountRecipient2 = amountRecipient1.div(2);
    let amountRecipient3 = amountRecipient2.div(2);
    let amountRecipient4 = amountRecipient3.div(2);

    await TokenDistro.grantRole(await TokenDistro.DISTRIBUTOR_ROLE(), multisigAddress)
    await TokenDistro.connect(multisig).assign(multisigAddress, amount)

    TokenDistro.allocate(recipientAddress1, amountRecipient1);
    TokenDistro.allocate(recipientAddress2, amountRecipient2);
    TokenDistro.allocate(recipientAddress3, amountRecipient3);
    TokenDistro.allocate(recipientAddress4, amountRecipient4);

    let initialAmount = amount.mul(initialPercentage).div(10000);
    let initialAmountRecipient = initialAmount
      .mul(amountRecipient1)
      .div(amount);

    await expect(TokenDistro.claimableAt(multisigAddress, startTime))
      .to.be.revertedWith("TokenDistro::claimableAt: DISTRIBUTOR_ROLE_CANNOT_CLAIM");

    // startTime > t
    expect(
      await TokenDistro.claimableAt(
        recipientAddress1,
        startTime - offset
      )
    ).to.be.equal(0);
    // startTime = t
    expect(
      await TokenDistro.claimableAt(recipientAddress1, startTime)
    ).to.be.equal(initialAmountRecipient);
    // startTime < t < startToCliff
    expect(
      await TokenDistro.claimableAt(
        recipientAddress1,
        startTime + offset
      )
    ).to.be.equal(initialAmountRecipient);
    // t + 1 = startToCliff
    expect(
      await TokenDistro.claimableAt(
        recipientAddress1,
        startTime + startToCliff - 1
      )
    ).to.be.equal(initialAmountRecipient);
    // t = startToCliff
    let totalTokensUnlockedAt1 = await TokenDistro.globallyClaimableAt(
      startTime + startToCliff
    );
    expect(
      await TokenDistro.claimableAt(
        recipientAddress1,
        startTime + startToCliff
      )
    ).to.be.equal(totalTokensUnlockedAt1.mul(amountRecipient1).div(amount));
    // t = (startToEnd - startToCliff) / 2
    let totalTokensUnlockedAt2 = await TokenDistro.globallyClaimableAt(
      startTime + 365 * (3600 * 24)
    );
    expect(
      await TokenDistro.claimableAt(
        recipientAddress1,
        startTime + 365 * (3600 * 24)
      )
    ).to.be.equal(totalTokensUnlockedAt2.mul(amountRecipient1).div(amount));
    // t = startToEnd
    expect(
      await TokenDistro.claimableAt(
        recipientAddress1,
        startTime + startToEnd
      )
    ).to.be.equal(amount.mul(amountRecipient1).div(amount));
    // t > startToEnd
    expect(
      await TokenDistro.claimableAt(
        recipientAddress1,
        startTime + startToEnd + offset
      )
    ).to.be.equal(amount.mul(amountRecipient1).div(amount));
  });

  it("should be able to withdraw", async () => {
    const now = (await ethers.provider.getBlock()).timestamp;
    const offset = 365 * (3600 * 24);
    const startTime = now - offset;

    let TokenDistro = await TokenDistroFactory.deploy(
      amount,
      startTime,
      startToCliff,
      startToEnd,
      initialPercentage,
      token.address
    );

    await TokenDistro.grantRole(await TokenDistro.DISTRIBUTOR_ROLE(), multisigAddress)
    await TokenDistro.connect(multisig).assign(multisigAddress, amount)

    await token.transfer(TokenDistro.address, amount);

    let amountRecipient1 = amount.div(2);
    let amountRecipient2 = amountRecipient1.div(2);
    let amountRecipient3 = amountRecipient2.div(2);
    let amountRecipient4 = amountRecipient3.div(2);

    TokenDistro.allocate(recipientAddress1, amountRecipient1);
    TokenDistro.allocate(recipientAddress2, amountRecipient2);
    TokenDistro.allocate(recipientAddress3, amountRecipient3);
    TokenDistro.allocate(recipientAddress4, amountRecipient4);

    let nowTimestamp = now;
    await TokenDistro.setTimestamp(nowTimestamp);
    await expect(await TokenDistro.getTimestamp()).to.be.equal(now);

    let withdrawableTokensAtRecipient1 = await TokenDistro.claimableAt(
      recipientAddress1,
      nowTimestamp
    );

    await expect(TokenDistro.connect(recipient1).claim())
      .to.emit(TokenDistro, "Claim")
      .withArgs(recipientAddress1, withdrawableTokensAtRecipient1);

    let withdrawableTokensAtRecipient2 = await TokenDistro.claimableAt(
      recipientAddress2,
      nowTimestamp
    );
    expect(await TokenDistro.claimableAt(
      recipientAddress2,
      nowTimestamp
    )).to.be.equal(await TokenDistro.claimableNow(
      recipientAddress2
    ));

    await expect(TokenDistro.connect(recipient2).claim())
      .to.emit(TokenDistro, "Claim")
      .withArgs(recipientAddress2, withdrawableTokensAtRecipient2);

    let withdrawableTokensAtRecipient3 = await TokenDistro.claimableAt(
      recipientAddress3,
      nowTimestamp
    );
    await expect(TokenDistro.connect(recipient3).claim())
      .to.emit(TokenDistro, "Claim")
      .withArgs(recipientAddress3, withdrawableTokensAtRecipient3);

    let withdrawableTokensAtRecipient4 = await TokenDistro.claimableAt(
      recipientAddress4,
      nowTimestamp
    );
    await expect(TokenDistro.connect(recipient4).claim())
      .to.emit(TokenDistro, "Claim")
      .withArgs(recipientAddress4, withdrawableTokensAtRecipient4);

    await TokenDistro.setTimestamp(startTime + startToEnd + offset)

    await TokenDistro.connect(recipient1).claim()

    let amountGrantedRecipient1 = (await TokenDistro.balances(recipientAddress1)).allocatedTokens
    expect(await token.balanceOf(recipientAddress1)).to.be.equal(amountGrantedRecipient1)
    await expect(TokenDistro.connect(recipient1).claim())
      .to.be.revertedWith("TokenDistro::claim: NOT_ENOUGTH_TOKENS_TO_CLAIM")

  });

  it("should be able to change the address", async () => {
    const now = (await ethers.provider.getBlock()).timestamp;
    const offset = 365 * (3600 * 24);
    const startTime = now - offset;

    let TokenDistro = await TokenDistroFactory.deploy(
      amount,
      startTime,
      startToCliff,
      startToEnd,
      initialPercentage,
      token.address
    );
    await TokenDistro.grantRole(await TokenDistro.DISTRIBUTOR_ROLE(), multisigAddress)
    await TokenDistro.connect(multisig).assign(multisigAddress, amount)
    await token.mint(TokenDistro.address, amount);

    let amountRecipient1 = amount.div(2);
    await TokenDistro.allocate(recipientAddress1, amountRecipient1);
    let amountRecipient3 = amount.div(2);
    await TokenDistro.allocate(recipientAddress3, amountRecipient3);

    await TokenDistro.connect(recipient1).claim();

    let withdrawn = (await TokenDistro.balances(recipientAddress1)).claimed;
    let totalVested = (await TokenDistro.balances(recipientAddress1)).allocatedTokens;

    await expect(TokenDistro.connect(recipient1).changeAddress(recipientAddress2))
      .to.emit(TokenDistro, "ChangeAddress").withArgs(recipientAddress1, recipientAddress2);

    expect((await TokenDistro.balances(recipientAddress1)).claimed).to.be.equal(0);
    expect((await TokenDistro.balances(recipientAddress1)).allocatedTokens).to.be.equal(0);

    expect((await TokenDistro.balances(recipientAddress2)).claimed).to.be.equal(withdrawn);
    expect((await TokenDistro.balances(recipientAddress2)).allocatedTokens).to.be.equal(totalVested);

  })

  it("shouldn't be able to change the address if it's the distributor", async () => {
    const now = (await ethers.provider.getBlock()).timestamp;
    const offset = 365 * (3600 * 24);
    const startTime = now - offset;

    let TokenDistro = await TokenDistroFactory.deploy(
      amount,
      startTime,
      startToCliff,
      startToEnd,
      initialPercentage,
      token.address
    );

    await TokenDistro.grantRole(await TokenDistro.DISTRIBUTOR_ROLE(), multisigAddress)
    await TokenDistro.grantRole(await TokenDistro.DISTRIBUTOR_ROLE(), multisig2Address)

    await TokenDistro.connect(multisig).assign(multisigAddress, amount)
    await token.mint(TokenDistro.address, amount);

    let amountRecipient1 = amount.div(2);
    let amountRecipient2 = amountRecipient1.div(2);
    let amountRecipient3 = amountRecipient2.div(2);

    await TokenDistro.allocate(recipientAddress1, amountRecipient1);
    await TokenDistro.allocate(recipientAddress3, amountRecipient3);

    await TokenDistro.connect(recipient1).claim();

    await expect(TokenDistro.connect(recipient1).changeAddress(recipientAddress3)).to.be.revertedWith("TokenDistro::changeAddress: ADDRESS_ALREADY_IN_USE");
    await expect(TokenDistro.changeAddress(recipientAddress1)).to.be.revertedWith("TokenDistro::changeAddress: ADDRESS_ALREADY_IN_USE");
    await expect(TokenDistro.changeAddress(recipientAddress2)).to.be.revertedWith("TokenDistro::changeAddress: DISTRIBUTOR_ROLE_NOT_A_VALID_ADDRESS");
    await expect(TokenDistro.connect(recipient4).changeAddress(multisig2Address)).to.be.revertedWith("TokenDistro::changeAddress: DISTRIBUTOR_ROLE_NOT_A_VALID_ADDRESS");

  })
});
