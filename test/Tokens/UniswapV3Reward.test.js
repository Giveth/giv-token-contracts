let TokenDistroFactory,
  givTokenFactory,
  tokenDistro,
  givToken,
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

describe("TokenDistro", function() {
  beforeEach(async function() {
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

    givTokenFactory = await ethers.getContractFactory("GIV");
    givToken = await givTokenFactory.deploy(multisigAddress);
    await givToken.deployed();
    await givToken.mint(multisigAddress, amount);

    TokenDistroFactory = await ethers.getContractFactory("TokenDistroMock");

    const offset = 90 * (3600 * 24);
    const startTime = (await ethers.provider.getBlock()).timestamp + offset;

    const TokenDistro = await TokenDistroFactory.deploy(
      amount,
      startTime,
      startToCliff,
      startToEnd,
      initialPercentage,
      givToken.address,
      false,
    );

    await givToken.transfer(TokenDistro.address, amount);
  });

  it("Empty", async function() {});
});
