// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "../TokenDistro/TokenDistro.sol";
import "../Distributors/UnipoolTokenDistributor.sol";

contract LiquidityMiningDeployer is Ownable {
    TokenDistro public tokenDistro;

    event NewPool(
        UnipoolTokenDistributor _address,
        IERC20 _token,
        uint256 poolTokens
    );

    constructor(
        uint256 _totalTokens,
        uint256 _startToCliff,
        uint256 _duration,
        uint256 _initialPercentage,
        IERC20Upgradeable _token
    ) {
        tokenDistro = new TokenDistro();
        tokenDistro.initialize(
            _totalTokens,
            block.timestamp,
            _startToCliff,
            _duration,
            _initialPercentage,
            _token
        );
    }
    /**
     * Function to get the unlocked tokens for a specific address. It uses the current timestamp
     * @param _poolTokens _poolTokens
     * @param _token _token
     * @param _duration_pool _duration_pool
     */
    function initializePool(
        uint256 _poolTokens,
        IERC20 _token,
        uint256 _duration_pool
    ) external onlyOwner {
        // We create three a pool
        UnipoolTokenDistributor pool =
            new UnipoolTokenDistributor(tokenDistro, _token, _duration_pool);

        // We grant permisions to the pools
        tokenDistro.grantRole(tokenDistro.DISTRIBUTOR_ROLE(), address(pool));

        // We assing the token distribution
        tokenDistro.assign(address(pool), _poolTokens);

        pool.setRewardDistribution(address(this));
        pool.notifyRewardAmount(_poolTokens);

        NewPool(pool, _token, _poolTokens);
    }
}
