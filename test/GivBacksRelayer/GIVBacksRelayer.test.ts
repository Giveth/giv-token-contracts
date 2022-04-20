import { expect } from "chai";
import { ethers } from "hardhat";
import { BytesLike, ContractTransaction } from "ethers";
import { describe, beforeEach, it } from "mocha";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { GIV } from "../../typechain-types/GIV";
import { BigNumber } from "@ethersproject/bignumber";
import { GIVBacksRelayer, TokenDistroMock } from "../../typechain-types";
import { duration, latestTimestamp } from "../utils/time";

import { Batch, testBatches } from "./batches";

const { days, years } = duration;
const { AddressZero } = ethers.constants;
const { hexlify, toUtf8Bytes, parseEther: toWei, solidityKeccak256 } = ethers.utils;

const ipfsExample = hexlify(
    toUtf8Bytes("QmbLS2yKJJGQcwccN8o6x4pMAU1URP6inotvePT6gsvcQ4"),
);

let givToken: GIV;
let tokenDistro: TokenDistroMock;
let relayer: GIVBacksRelayer;

let deployer: SignerWithAddress;
let batcher: SignerWithAddress;
let other: SignerWithAddress;

let deployerAddress: string;
let batcherAddress: string;
let otherAddress: string;

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

    const testAmount = toWei("20000000");

    const BATCHER_ROLE = roleOf("BATCHER_ROLE");
    const DISTRIBUTOR_ROLE = roleOf("DISTRIBUTOR_ROLE");

    const hashedTestBatches: string[] = testBatches.map(hashBatchEthers);

    beforeEach(async () => {
        // Populate test accounts:
        [deployer, batcher, other] = await ethers.getSigners();
        deployerAddress = await deployer.getAddress();
        batcherAddress = await batcher.getAddress();
        otherAddress = await other.getAddress();

        // Deploy GIV token and mint some tokens:
        const tokenFactory = await ethers.getContractFactory("GIV");
        givToken = (await tokenFactory.deploy(deployerAddress)) as GIV;
        await givToken.deployed();
        await givToken.mint(deployerAddress, testAmount);

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
                relayer.initialize(AddressZero, batcherAddress),
            ).to.be.revertedWith(
                "GIVBacksRelayer::initialize: NO_TOKENDISTRO_ZERO_ADDRESS",
            );
        });
        it("should revert if initializing with initial batcher address zero", async () => {
            await expect(
                relayer.initialize(tokenDistro.address, AddressZero),
            ).to.be.revertedWith(
                "GIVBacksRelayer::initialize: NO_BATCHER_ZERO_ADDRESS",
            );
        });
    });

    describe("after deployment", () => {
        beforeEach(async () => {
            relayer.initialize(tokenDistro.address, batcherAddress);
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

        describe("when testing `addBatch`", () => {
            const b = hashedTestBatches[0];

            it("should revert if not called by a batcher", async () => {
                await expect(
                    relayer.addBatch(b, ipfsExample),
                ).to.be.revertedWith(
                    "GIVBacksRelayer::onlyBatcher: MUST_BATCHER",
                );
            });

            it("should emit an `AddedBatch` event", async () => {
                expect(await relayer.connect(batcher).addBatch(b, ipfsExample))
                    .to.emit(relayer, "AddedBatch")
                    .withArgs(batcherAddress, "0", b, ipfsExample);
            });

            it("should add a batch, set it as pending and increment the nonce", async () => {
                await relayer.connect(batcher).addBatch(b, ipfsExample);
                expect(await relayer.nonce()).to.be.eq("1");
                expect(await relayer.isPending(b)).to.be.eq(true);
            });
        });

        describe("when testing `addBatches`", () => {
            const b1 = hashedTestBatches[0];
            const b2 = hashedTestBatches[1];
            const b3 = hashedTestBatches[2];

            it("should revert if not called by a batcher", async () => {
                await expect(
                    relayer.addBatches([b1, b2, b3], ipfsExample),
                ).to.be.revertedWith(
                    "GIVBacksRelayer::onlyBatcher: MUST_BATCHER",
                );
            });

            it("should emit a `AddedBatches` event", async () => {
                expect(
                    await relayer
                        .connect(batcher)
                        .addBatches([b1, b2, b3], ipfsExample),
                )
                    .to.emit(relayer, "AddedBatch")
                    .withArgs(batcherAddress, "0", b1, ipfsExample)
                    .to.emit(relayer, "AddedBatch")
                    .withArgs(batcherAddress, "1", b2, ipfsExample)
                    .to.emit(relayer, "AddedBatch")
                    .withArgs(batcherAddress, "2", b3, ipfsExample);
            });

            it("should set the added batches as pending", async () => {
                await relayer
                    .connect(batcher)
                    .addBatches([b1, b2], ipfsExample);

                expect(await relayer.isPending(b1)).to.be.eq(true);
                expect(await relayer.isPending(b2)).to.be.eq(true);
                expect(await relayer.isPending(b3)).to.be.eq(false);
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
                await relayer.connect(batcher).addBatches([hb], ipfsExample);
                await expect(
                    relayer.executeBatch(b.nonce, b.recipients, b.amounts),
                ).to.be.revertedWith(
                    "TokenDistro::onlyDistributor: ONLY_DISTRIBUTOR_ROLE",
                );
            });

            it("should allow anyone to execute a pending batch", async () => {
                function expectEmitAllocate(
                    tx: ContractTransaction,
                    batch: Batch,
                ) {
                    for (let i = 0; i < batch.recipients.length; i++) {
                        const rec = batch.recipients[i];
                        const amt = batch.amounts[i];

                        expect(tx)
                            .to.emit(tokenDistro, "Allocate")
                            .withArgs(relayer.address, rec, amt);
                    }
                }

                const b1 = testBatches[0];
                const hb1 = hashBatchEthers(b1);
                const b2 = testBatches[1];
                const hb2 = hashBatchEthers(b2);

                // Assign DISTRIBUTOR_ROLE to relayer, assign some tokens:
                await tokenDistro.grantRole(DISTRIBUTOR_ROLE, relayer.address);
                await tokenDistro.assign(relayer.address, testAmount);

                await relayer
                    .connect(batcher)
                    .addBatches([hb1, hb2], ipfsExample);
                expect(await relayer.nonce()).to.be.eq("2");

                const ex1 = await relayer
                    .connect(other)
                    .executeBatch(b1.nonce, b1.recipients, b1.amounts);
                const ex2 = await relayer
                    .connect(other)
                    .executeBatch(b2.nonce, b2.recipients, b2.amounts);

                // Expect to emit `Executed` from relayer with caller address:
                expect(ex1)
                    .to.emit(relayer, "Executed")
                    .withArgs(otherAddress, hb1);

                // Expect to emit `GivBacksPaid` with relayer as sender:
                expect(ex2)
                    .to.emit(tokenDistro, "GivBackPaid")
                    .withArgs(relayer.address);

                // Expect to emit `Allocate` from relayer for each recipient:
                expectEmitAllocate(ex1, b1);
                expectEmitAllocate(ex2, b2);
            });
        });
    });
});
