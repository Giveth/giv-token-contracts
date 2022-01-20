import { expect } from "chai";
import { ethers } from "hardhat";
import { BytesLike } from "ethers";
import { describe, beforeEach, it } from "mocha";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { GIV } from "../../typechain-types/GIV";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { GIVBacksRelayer, TokenDistroMock } from "../../typechain-types";
import { duration, latestTimestamp } from "../utils/time";

import { Batch, testBatches } from "./batches";

const { days, years } = duration;
const { AddressZero } = ethers.constants;
const { hexlify, parseEther: toWei, solidityKeccak256 } = ethers.utils;

let givToken: GIV;
let tokenDistro: TokenDistroMock;
let relayer: GIVBacksRelayer;

let multisig: SignerWithAddress;
let batcher: SignerWithAddress;

let multisigAddress: string;
let batcherAddress: string;

let accs: SignerWithAddress[];

describe("GIVBacksRelayer", () => {
    function roleOf(name: string): BytesLike {
        return solidityKeccak256(["string"], [name]);
    }

    function hashBatchEthers(batch: Batch): string {
        return hexlify(
            solidityKeccak256(
                ["uint256", "address[]", "uint256[]"],
                [batch.nonce, batch.recipients, batch.amounts],
            ),
        );
    }

    async function hashBatchRelayer(batch: Batch): Promise<string> {
        return relayer.hashBatch(batch.nonce, batch.recipients, batch.amounts);
    }

    const BATCHER_ROLE = roleOf("BATCHER_ROLE");
    const testAmount = toWei("20000000");

    const hashedTestBatches: string[] = testBatches.map(hashBatchEthers);

    beforeEach(async () => {
        // Populate test accounts:
        [multisig, batcher, ...accs] = await ethers.getSigners();
        multisigAddress = await multisig.getAddress();
        batcherAddress = await batcher.getAddress();

        // Deploy GIV token and mint some tokens:
        const tokenFactory = await ethers.getContractFactory("GIV");
        givToken = (await tokenFactory.deploy(multisigAddress)) as GIV;
        await givToken.deployed();
        await givToken.mint(multisigAddress, testAmount);

        // Deploy TokenDistro mock and transfer all GIV to it:
        // NOTE: we use production parameters, but it should not have any effect
        // on the results of the tests.
        const tokenDistroFactory = await ethers.getContractFactory(
            "TokenDistroMock",
        );
        tokenDistro = (await tokenDistroFactory.deploy(
            testAmount,
            (await latestTimestamp()).add(days("90")), // startTime
            days("180"), // startToCliff
            years("5"), // duration
            BigNumber.from("500"), // initialPercentage
            givToken.address, // reward token
            false, // cancellable
        )) as TokenDistroMock;
        await givToken.transfer(tokenDistro.address, testAmount);

        // Deploy the relayer contract:
        const relayerFactory = await ethers.getContractFactory(
            "GIVBacksRelayer",
        );
        relayer = (await relayerFactory.deploy()) as GIVBacksRelayer;
    });

    describe("when deploying", () => {
        it("should revert if initializing with token distro address zero", async () => {
            await expect(
                relayer.intialize(AddressZero, batcherAddress),
            ).to.be.revertedWith(
                "GIVBacksRelayer::initialize: NO_TOKENDISTRO_ZERO_ADDRESS",
            );
        });
        it("should revert if initializing with initial batcher address zero", async () => {
            await expect(
                relayer.intialize(tokenDistro.address, AddressZero),
            ).to.be.revertedWith(
                "GIVBacksRelayer::initialize: NO_BATCHER_ZERO_ADDRESS",
            );
        });
    });

    describe("after deployment", () => {
        beforeEach(async () => {
            relayer.intialize(tokenDistro.address, batcherAddress);
        });

        describe("should set the correct parameters", () => {
            it("the token distro contract address", async () => {
                expect(await relayer.tokenDistroContract()).to.be.eq(
                    tokenDistro.address,
                );
            });
            it("the batcher role", async () => {
                expect(relayer.hasRole(BATCHER_ROLE, batcherAddress));
            });
        });

        describe("when testing `hashBatch'", () => {
            it("should return the correct hash", async () => {
                const b = testBatches[0];
                expect(await hashBatchRelayer(b)).to.be.eq(hashBatchEthers(b));
            });
        });

        describe("when testing `createBatches`", () => {
            it("should revert if not called by a batcher", async () => {
                const b = hashedTestBatches[0];
                await expect(relayer.createBatches([b])).to.be.revertedWith(
                    "GIVBacksRelayer::onlyBatcher: MUST_BATCHER",
                );
            });
            it("should emit a `CreatedBatches` event", async () => {
                const b = hashedTestBatches[0];
                expect(await relayer.connect(batcher).createBatches([b]))
                    .to.emit(relayer, "CreatedBatches")
                    .withArgs(batcherAddress);
            });
            it("should set the created batches as pending", async () => {
                const pending1 = hashedTestBatches[0];
                const pending2 = hashedTestBatches[1];
                const notPending = hashedTestBatches[2];

                await relayer
                    .connect(batcher)
                    .createBatches([pending1, pending2]);

                expect(await relayer.isPending(pending1)).to.be.eq(true);
                expect(await relayer.isPending(pending2)).to.be.eq(true);
                expect(await relayer.isPending(notPending)).to.be.eq(false);
            });
        });

        describe("when testing `executeBatch`", () => {
            it("should revert if the batch is not pending", async () => {
                expect(
                    relayer.executeBatch(
                        testBatches[0].nonce,
                        testBatches[0].recipients,
                        testBatches[0].amounts,
                    ),
                ).to.be.revertedWith(
                    "GIVBacksRelayer::executeBatch: NOT_PENDING",
                );
            });

            it("should revert if relayer does not have the distributor role", async () => {
                const b = testBatches[0];
                const hb = hashedTestBatches[0];
                await relayer.connect(batcher).createBatches([hb]);
                await expect(
                    relayer.executeBatch(b.nonce, b.recipients, b.amounts),
                ).to.be.revertedWith(
                    "TokenDistro::onlyDistributor: ONLY_DISTRIBUTOR_ROLE",
                );
            });
        });
    });
});
