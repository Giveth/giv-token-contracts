import { LoadFixtureFunction } from "../types";
import { describe, beforeEach, before, it } from "mocha";
import {
    uniswapFixture,
    mintPosition,
    UniswapFixtureType,
} from "../shared/fixtures";
import {
    getMaxTick,
    getMinTick,
    FeeAmount,
    TICK_SPACINGS,
    blockTimestamp,
    BN,
    BNe18,
    snapshotGasCost,
    ActorFixture,
    makeTimestamps,
    maxGas,
    defaultTicksArray,
    expect,
} from "../shared";
import { createFixtureLoader, provider } from "../shared/provider";
import {
    HelperCommands,
    ERC20Helper,
    incentiveResultToStakeAdapter,
} from "../helpers";
import { createTimeMachine } from "../shared/time";
import { HelperTypes } from "../helpers/types";

let loadFixture: LoadFixtureFunction;

describe("unit/Multicall", () => {
    const actors = new ActorFixture(provider.getWallets(), provider);
    const incentiveCreator = actors.incentiveCreator();
    const lpUser0 = actors.lpUser0();
    const amountDesired = BNe18(10);
    const totalReward = BNe18(100);
    const erc20Helper = new ERC20Helper();
    const Time = createTimeMachine(provider);
    let helpers: HelperCommands;
    let context: UniswapFixtureType;
    const multicaller = actors.traderUser2();

    before("loader", async () => {
        loadFixture = createFixtureLoader(provider.getWallets(), provider);
    });

    beforeEach("create fixture loader", async () => {
        context = await loadFixture(uniswapFixture);
        helpers = HelperCommands.fromTestContext(context, actors, provider);
    });

    it("is implemented", async () => {
        const currentTime = await blockTimestamp();

        await erc20Helper.ensureBalancesAndApprovals(
            multicaller,
            [context.token0, context.token1],
            amountDesired,
            context.nft.address,
        );
        await mintPosition(context.nft.connect(multicaller), {
            token0: context.token0.address,
            token1: context.token1.address,
            fee: FeeAmount.MEDIUM,
            tickLower: getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
            tickUpper: getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]),
            recipient: multicaller.address,
            amount0Desired: amountDesired,
            amount1Desired: amountDesired,
            amount0Min: 0,
            amount1Min: 0,
            deadline: currentTime + 10_000,
        });

        // It's not required for UniswapV3RewardToken
        // await erc20Helper.ensureBalancesAndApprovals(
        //     multicaller,
        //     context.rewardToken,
        //     totalReward,
        //     context.staker.address,
        // );

        await context.rewardToken
            .connect(incentiveCreator)
            .transferOwnership(multicaller.address);

        const createIncentiveTx = context.staker.interface.encodeFunctionData(
            "createIncentive",
            [
                {
                    pool: context.pool01,
                    rewardToken: context.rewardToken.address,
                    refundee: incentiveCreator.address,
                    ...makeTimestamps(currentTime + 100),
                },
                totalReward,
            ],
        );
        await context.staker
            .connect(multicaller)
            .multicall([createIncentiveTx], maxGas);

        // expect((await context.staker.deposits(tokenId)).owner).to.eq(
        //   multicaller.address
        // )
    });
});
