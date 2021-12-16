import { ethers } from "hardhat";
import { expect } from "chai";
import { describe, beforeEach, it } from "mocha";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ContractFactory } from "ethers";
import { GIV } from "../../typechain-types/GIV";
import { PermitMock } from "../../typechain-types/PermitMock";

const { createPermitSignature } = require("./helpers/erc2612");

const ABIbid = [
    "function permit(address,address,uint256,uint256,uint8,bytes32,bytes32)",
];
const iface = new ethers.utils.Interface(ABIbid);

let givToken: GIV,
    givTokenFactory: ContractFactory,
    permitMockContract: PermitMock,
    permitMockFactory: ContractFactory,
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
const initialAmount = ethers.utils.parseEther("80000000");

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
        await givToken.mint(multisigAddress, initialAmount);

        permitMockFactory = await ethers.getContractFactory("PermitMock");
        permitMockContract = (await permitMockFactory.deploy()) as PermitMock;
    });

    it("should check permit works as expected", async () => {
        const deadline = ethers.constants.MaxUint256;
        const amountPermit = ethers.utils.parseEther("1");
        const nonce = await givToken.nonces(multisigAddress);

        const owner = multisig;
        const spender = multisig2;

        // create permit function approven amountPermit tokens of multisig, to multisig2
        const { v, r, s } = await createPermitSignature(
            givToken,
            owner,
            spender.address,
            amountPermit,
            nonce,
            deadline,
        );

        // test invalid signatures
        await expect(
            givToken
                .connect(multisig)
                .permit(
                    owner.address,
                    spender.address,
                    amountPermit,
                    deadline,
                    v,
                    r,
                    r,
                ),
        ).to.be.revertedWith("GIV:INVALID_SIGNATURE");

        // use permit function
        await expect(
            givToken
                .connect(multisig)
                .permit(
                    owner.address,
                    spender.address,
                    amountPermit,
                    deadline,
                    v,
                    r,
                    s,
                ),
        )
            .to.emit(givToken, "Approval")
            .withArgs(owner.address, spender.address, amountPermit);

        // test reused signature
        await expect(
            givToken
                .connect(multisig)
                .permit(
                    owner.address,
                    spender.address,
                    amountPermit,
                    deadline,
                    v,
                    r,
                    s,
                ),
        ).to.be.revertedWith("GIV:INVALID_SIGNATURE");
    });

    it("should check permit works as expected", async () => {
        const deadline = ethers.constants.MaxUint256;
        const amountPermit = ethers.utils.parseEther("1");
        const nonce = await givToken.nonces(multisigAddress);

        const owner = multisig;
        const spenderAddress = permitMockContract.address;

        // create permit function approven amountPermit tokens of multisig, to multisig2
        const { v, r, s } = await createPermitSignature(
            givToken,
            owner,
            spenderAddress,
            amountPermit,
            nonce,
            deadline,
        );

        const dataPermit = iface.encodeFunctionData("permit", [
            owner.address,
            spenderAddress,
            amountPermit,
            deadline,
            v,
            r,
            s,
        ]);

        // use permit function
        await expect(
            permitMockContract
                .connect(multisig)
                .permit(givToken.address, amountPermit, dataPermit),
        )
            .to.emit(givToken, "Approval")
            .withArgs(owner.address, spenderAddress, amountPermit);
    });
});
