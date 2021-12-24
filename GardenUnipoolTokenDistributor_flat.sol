
// File: contracts/Interfaces/IDistro.sol



pragma solidity =0.8.6;

interface IDistro {
    /**
     * @dev Emitted when someone makes a claim of tokens
     */
    event Claim(address indexed grantee, uint256 amount);
    /**
     * @dev Emitted when the DISTRIBUTOR allocate an amount to a grantee
     */
    event Allocate(
        address indexed distributor,
        address indexed grantee,
        uint256 amount
    );
    /**
     * @dev Emitted when the DEFAULT_ADMIN assign an amount to a DISTRIBUTOR
     */
    event Assign(
        address indexed admin,
        address indexed distributor,
        uint256 amount
    );
    /**
     * @dev Emitted when someone change their reception address
     */
    event ChangeAddress(address indexed oldAddress, address indexed newAddress);

    /**
     * @dev Emitted when a new startTime is set
     */
    event StartTimeChanged(uint256 newStartTime, uint256 newCliffTime);

    /**
     * @dev Returns the total amount of tokens will be streamed
     */
    function totalTokens() external view returns (uint256);

    /**
     * Function that allows the DEFAULT_ADMIN_ROLE to assign set a new startTime if it hasn't started yet
     * @param newStartTime new startTime
     *
     * Emits a {StartTimeChanged} event.
     *
     */
    function setStartTime(uint256 newStartTime) external;

    /**
     * Function that allows the DEFAULT_ADMIN_ROLE to assign tokens to an address who later can distribute them.
     * @dev It is required that the DISTRIBUTOR_ROLE is already held by the address to which an amount will be assigned
     * @param distributor the address, generally a smart contract, that will determine who gets how many tokens
     * @param amount Total amount of tokens to assign to that address for distributing
     */
    function assign(address distributor, uint256 amount) external;

    /**
     * Function to claim tokens for a specific address. It uses the current timestamp
     */
    function claim() external;

    /**
     * Function that allows to the distributor address to allocate some amount of tokens to a specific recipient
     * @dev Needs to be initialized: Nobody has the DEFAULT_ADMIN_ROLE and all available tokens have been assigned
     * @param recipient of token allocation
     * @param amount allocated amount
     * @param claim whether claim after allocate
     */
    function allocate(
        address recipient,
        uint256 amount,
        bool claim
    ) external;

    /**
     * Function that allows to the distributor address to allocate some amounts of tokens to specific recipients
     * @dev Needs to be initialized: Nobody has the DEFAULT_ADMIN_ROLE and all available tokens have been assigned
     * @param recipients of token allocation
     * @param amounts allocated amount
     */
    function allocateMany(address[] memory recipients, uint256[] memory amounts)
        external;

    function sendGIVbacks(address[] memory recipients, uint256[] memory amounts)
        external;

    /**
     * Function that allows a recipient to change its address
     * @dev The change can only be made to an address that has not previously received an allocation &
     * the distributor cannot change its address
     */
    function changeAddress(address newAddress) external;

    /**
     * Function to get the current timestamp from the block
     */
    function getTimestamp() external view returns (uint256);

    /**
     * Function to get the total unlocked tokes at some moment
     */
    function globallyClaimableAt(uint256 timestamp)
        external
        view
        returns (uint256);

    /**
     * Function to get the unlocked tokes at some moment for a specific address
     */
    function claimableAt(address recipient, uint256 timestamp)
        external
        view
        returns (uint256);

    /**
     * Function to get the unlocked tokens for a specific address. It uses the current timestamp
     */
    function claimableNow(address recipient) external view returns (uint256);

    function cancelAllocation(address prevRecipient, address newRecipient)
        external;
}

// File: openzeppelin-contracts-upgradable-v4/utils/math/SafeMathUpgradeable.sol



pragma solidity ^0.8.0;

// CAUTION
// This version of SafeMath should only be used with Solidity 0.8 or later,
// because it relies on the compiler's built in overflow checks.

/**
 * @dev Wrappers over Solidity's arithmetic operations.
 *
 * NOTE: `SafeMath` is no longer needed starting with Solidity 0.8. The compiler
 * now has built in overflow checking.
 */
library SafeMathUpgradeable {
    /**
     * @dev Returns the addition of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryAdd(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            uint256 c = a + b;
            if (c < a) return (false, 0);
            return (true, c);
        }
    }

    /**
     * @dev Returns the substraction of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function trySub(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b > a) return (false, 0);
            return (true, a - b);
        }
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, with an overflow flag.
     *
     * _Available since v3.4._
     */
    function tryMul(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
            // benefit is lost if 'b' is also tested.
            // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
            if (a == 0) return (true, 0);
            uint256 c = a * b;
            if (c / a != b) return (false, 0);
            return (true, c);
        }
    }

    /**
     * @dev Returns the division of two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryDiv(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a / b);
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers, with a division by zero flag.
     *
     * _Available since v3.4._
     */
    function tryMod(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a % b);
        }
    }

    /**
     * @dev Returns the addition of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `+` operator.
     *
     * Requirements:
     *
     * - Addition cannot overflow.
     */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        return a + b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting on
     * overflow (when the result is negative).
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return a - b;
    }

    /**
     * @dev Returns the multiplication of two unsigned integers, reverting on
     * overflow.
     *
     * Counterpart to Solidity's `*` operator.
     *
     * Requirements:
     *
     * - Multiplication cannot overflow.
     */
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        return a * b;
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator.
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return a / b;
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting when dividing by zero.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return a % b;
    }

    /**
     * @dev Returns the subtraction of two unsigned integers, reverting with custom message on
     * overflow (when the result is negative).
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {trySub}.
     *
     * Counterpart to Solidity's `-` operator.
     *
     * Requirements:
     *
     * - Subtraction cannot overflow.
     */
    function sub(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b <= a, errorMessage);
            return a - b;
        }
    }

    /**
     * @dev Returns the integer division of two unsigned integers, reverting with custom message on
     * division by zero. The result is rounded towards zero.
     *
     * Counterpart to Solidity's `/` operator. Note: this function uses a
     * `revert` opcode (which leaves remaining gas untouched) while Solidity
     * uses an invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function div(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a / b;
        }
    }

    /**
     * @dev Returns the remainder of dividing two unsigned integers. (unsigned integer modulo),
     * reverting with custom message when dividing by zero.
     *
     * CAUTION: This function is deprecated because it requires allocating memory for the error
     * message unnecessarily. For custom revert reasons use {tryMod}.
     *
     * Counterpart to Solidity's `%` operator. This function uses a `revert`
     * opcode (which leaves remaining gas untouched) while Solidity uses an
     * invalid opcode to revert (consuming all remaining gas).
     *
     * Requirements:
     *
     * - The divisor cannot be zero.
     */
    function mod(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a % b;
        }
    }
}

// File: openzeppelin-contracts-upgradable-v4/utils/math/MathUpgradeable.sol



pragma solidity ^0.8.0;

/**
 * @dev Standard math utilities missing in the Solidity language.
 */
library MathUpgradeable {
    /**
     * @dev Returns the largest of two numbers.
     */
    function max(uint256 a, uint256 b) internal pure returns (uint256) {
        return a >= b ? a : b;
    }

    /**
     * @dev Returns the smallest of two numbers.
     */
    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    /**
     * @dev Returns the average of two numbers. The result is rounded towards
     * zero.
     */
    function average(uint256 a, uint256 b) internal pure returns (uint256) {
        // (a + b) / 2 can overflow.
        return (a & b) + (a ^ b) / 2;
    }

    /**
     * @dev Returns the ceiling of the division of two numbers.
     *
     * This differs from standard division with `/` in that it rounds up instead
     * of rounding down.
     */
    function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        // (a + b - 1) / b can overflow on addition, so we distribute.
        return a / b + (a % b == 0 ? 0 : 1);
    }
}

// File: openzeppelin-contracts-upgradable-v4/proxy/utils/Initializable.sol



pragma solidity ^0.8.0;

/**
 * @dev This is a base contract to aid in writing upgradeable contracts, or any kind of contract that will be deployed
 * behind a proxy. Since a proxied contract can't have a constructor, it's common to move constructor logic to an
 * external initializer function, usually called `initialize`. It then becomes necessary to protect this initializer
 * function so it can only be called once. The {initializer} modifier provided by this contract will have this effect.
 *
 * TIP: To avoid leaving the proxy in an uninitialized state, the initializer function should be called as early as
 * possible by providing the encoded function call as the `_data` argument to {ERC1967Proxy-constructor}.
 *
 * CAUTION: When used with inheritance, manual care must be taken to not invoke a parent initializer twice, or to ensure
 * that all initializers are idempotent. This is not verified automatically as constructors are by Solidity.
 */
abstract contract Initializable {
    /**
     * @dev Indicates that the contract has been initialized.
     */
    bool private _initialized;

    /**
     * @dev Indicates that the contract is in the process of being initialized.
     */
    bool private _initializing;

    /**
     * @dev Modifier to protect an initializer function from being invoked twice.
     */
    modifier initializer() {
        require(_initializing || !_initialized, "Initializable: contract is already initialized");

        bool isTopLevelCall = !_initializing;
        if (isTopLevelCall) {
            _initializing = true;
            _initialized = true;
        }

        _;

        if (isTopLevelCall) {
            _initializing = false;
        }
    }
}

// File: contracts/Distributors/TokenManagerHook.sol

pragma solidity ^0.8.6;

// Based on: https://github.com/1Hive/token-manager-app/blob/master/contracts/TokenManagerHook.sol
/*
 * changelog:
 *      * Add Initialize function
 *      * Token manager is set in the initialization function
 *      * `onRegisterAsHook` now has the `onlyTokenManager` modifier and do not update the token manager
 */

library UnstructuredStorage {
    function getStorageBool(bytes32 position)
        internal
        view
        returns (bool data)
    {
        assembly {
            data := sload(position)
        }
    }

    function getStorageAddress(bytes32 position)
        internal
        view
        returns (address data)
    {
        assembly {
            data := sload(position)
        }
    }

    function getStorageBytes32(bytes32 position)
        internal
        view
        returns (bytes32 data)
    {
        assembly {
            data := sload(position)
        }
    }

    function getStorageUint256(bytes32 position)
        internal
        view
        returns (uint256 data)
    {
        assembly {
            data := sload(position)
        }
    }

    function setStorageBool(bytes32 position, bool data) internal {
        assembly {
            sstore(position, data)
        }
    }

    function setStorageAddress(bytes32 position, address data) internal {
        assembly {
            sstore(position, data)
        }
    }

    function setStorageBytes32(bytes32 position, bytes32 data) internal {
        assembly {
            sstore(position, data)
        }
    }

    function setStorageUint256(bytes32 position, uint256 data) internal {
        assembly {
            sstore(position, data)
        }
    }
}

contract ReentrancyGuard {
    using UnstructuredStorage for bytes32;

    /* Hardcoded constants to save gas
    bytes32 internal constant REENTRANCY_MUTEX_POSITION = keccak256("aragonOS.reentrancyGuard.mutex");
    */
    bytes32 private constant REENTRANCY_MUTEX_POSITION =
        0xe855346402235fdd185c890e68d2c4ecad599b88587635ee285bce2fda58dacb;

    string private constant ERROR_REENTRANT = "REENTRANCY_REENTRANT_CALL";

    modifier nonReentrant() {
        // Ensure mutex is unlocked
        require(!REENTRANCY_MUTEX_POSITION.getStorageBool(), ERROR_REENTRANT);

        // Lock mutex before function call
        REENTRANCY_MUTEX_POSITION.setStorageBool(true);

        // Perform function call
        _;

        // Unlock mutex after function call
        REENTRANCY_MUTEX_POSITION.setStorageBool(false);
    }
}


/**
 * @dev When creating a subcontract, we recommend overriding the _internal_ functions that you want to hook.
 */
contract TokenManagerHook is ReentrancyGuard, Initializable {
    using UnstructuredStorage for bytes32;

    /* Hardcoded constants to save gas
    bytes32 public constant TOKEN_MANAGER_POSITION = keccak256("hookedTokenManager.tokenManagerHook.tokenManager");
    */
    bytes32 private constant TOKEN_MANAGER_POSITION =
        0x5c513b2347f66d33af9d68f4a0ed7fbb73ce364889b2af7f3ee5764440da6a8a;

    modifier onlyTokenManager() {
        require(
            getTokenManager() == msg.sender,
            "Hooks must be called from Token Manager"
        );
        _;
    }

    /**
     * @dev Usually this contract is deploy by a factory, and in the same transaction, `onRegisterAsHook` is called.
     * Since in this case, the `onRegisterAsHook` will be called after the deployment, to avoid unwanted calls to `onRegisterAsHook`,
     * token manager address is set in the initialization.
     * @param tokenManager Token manager address
     */
    function __TokenManagerHook_initialize(address tokenManager)
        public
        initializer
    {
        TOKEN_MANAGER_POSITION.setStorageAddress(tokenManager);
    }

    function getTokenManager() public view returns (address) {
        return TOKEN_MANAGER_POSITION.getStorageAddress();
    }

    /*
     * @dev Called when this contract has been included as a Token Manager hook, must be called in the transaction
     *   this contract is created or it risks some other address registering itself as the Token Manager
     * @param _hookId The position in which the hook is going to be called
     * @param _token The token controlled by the Token Manager
     */
    function onRegisterAsHook(uint256 _hookId, address _token)
        external
        nonReentrant
        onlyTokenManager
    {
        _onRegisterAsHook(msg.sender, _hookId, _token);
    }

    /*
     * @dev Called when this hook is being removed from the Token Manager
     * @param _hookId The position in which the hook is going to be called
     * @param _token The token controlled by the Token Manager
     */
    function onRevokeAsHook(uint256 _hookId, address _token)
        external
        onlyTokenManager
        nonReentrant
    {
        _onRevokeAsHook(msg.sender, _hookId, _token);
    }

    /*
     * @dev Notifies the hook about a token transfer allowing the hook to react if desired. It should return
     * true if left unimplemented, otherwise it will prevent some functions in the TokenManager from
     * executing successfully.
     * @param _from The origin of the transfer
     * @param _to The destination of the transfer
     * @param _amount The amount of the transfer
     */
    function onTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) external onlyTokenManager nonReentrant returns (bool) {
        return _onTransfer(_from, _to, _amount);
    }

    /*
     * @dev Notifies the hook about an approval allowing the hook to react if desired. It should return
     * true if left unimplemented, otherwise it will prevent some functions in the TokenManager from
     * executing successfully.
     * @param _holder The account that is allowing to spend
     * @param _spender The account that is allowed to spend
     * @param _amount The amount being allowed
     */
    function onApprove(
        address _holder,
        address _spender,
        uint256 _amount
    ) external onlyTokenManager nonReentrant returns (bool) {
        return _onApprove(_holder, _spender, _amount);
    }

    // Function to override if necessary:

    function _onRegisterAsHook(
        address _tokenManager,
        uint256 _hookId,
        address _token
    ) internal virtual {
        return;
    }

    function _onRevokeAsHook(
        address _tokenManager,
        uint256 _hookId,
        address _token
    ) internal virtual {
        return;
    }

    function _onTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal virtual returns (bool) {
        return true;
    }

    function _onApprove(
        address _holder,
        address _spender,
        uint256 _amount
    ) internal virtual returns (bool) {
        return true;
    }
}

// File: openzeppelin-contracts-upgradable-v4/utils/ContextUpgradeable.sol



pragma solidity ^0.8.0;


/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract ContextUpgradeable is Initializable {
    function __Context_init() internal initializer {
        __Context_init_unchained();
    }

    function __Context_init_unchained() internal initializer {
    }
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
    uint256[50] private __gap;
}

// File: openzeppelin-contracts-upgradable-v4/access/OwnableUpgradeable.sol



pragma solidity ^0.8.0;



/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract OwnableUpgradeable is Initializable, ContextUpgradeable {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    function __Ownable_init() internal initializer {
        __Context_init_unchained();
        __Ownable_init_unchained();
    }

    function __Ownable_init_unchained() internal initializer {
        _setOwner(_msgSender());
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _setOwner(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _setOwner(newOwner);
    }

    function _setOwner(address newOwner) private {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
    uint256[49] private __gap;
}

// File: contracts/Distributors/GardenUnipoolTokenDistributor.sol

/**
 * Contract has the most of the functionalities of UnipoolTokenDistributor contract, but is updated
 * to be compatible with token-manager-app of 1Hive.
 * 1. Stake/Withdraw methods are updated to internal type.
 * 2. Methods related to permit are removed.
 * 3. Stake/Withdraw are update based on 1Hive unipool (https://github.com/1Hive/unipool/blob/master/contracts/Unipool.sol).
 * This PR was the guide: https://github.com/1Hive/unipool/pull/7/files
 */


pragma solidity =0.8.6;






// Based on: https://github.com/Synthetixio/Unipool/tree/master/contracts
/*
 * changelog:
 *      * Added SPDX-License-Identifier
 *      * Update to solidity ^0.8.0
 *      * Update openzeppelin imports
 *      * IRewardDistributionRecipient integrated in Unipool and removed
 *      * Added virtual and override to stake and withdraw methods
 *      * Added constructors to LPTokenWrapper and Unipool
 *      * Change transfer to allocate (TokenVesting)
 *      * Added `stakeWithPermit` function for NODE and the BridgeToken
 */
contract LPTokenWrapper is Initializable {
    using SafeMathUpgradeable for uint256;

    uint256 private _totalSupply;
    mapping(address => uint256) internal _balances;

    function __LPTokenWrapper_initialize() public initializer {}

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function stake(address user, uint256 amount) internal virtual {
        _totalSupply = _totalSupply.add(amount);
        _balances[user] = _balances[user].add(amount);
    }

    function withdraw(address user, uint256 amount) internal virtual {
        _totalSupply = _totalSupply.sub(amount);
        _balances[user] = _balances[user].sub(amount);
    }
}

contract GardenUnipoolTokenDistributor is
    LPTokenWrapper,
    TokenManagerHook,
    OwnableUpgradeable
{
    using SafeMathUpgradeable for uint256;

    IDistro public tokenDistro;
    uint256 public duration;

    address public rewardDistribution;
    uint256 public periodFinish;
    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    modifier onlyRewardDistribution() {
        require(
            _msgSender() == rewardDistribution,
            "Caller is not reward distribution"
        );
        _;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = claimableStream(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function initialize(
        IDistro _tokenDistribution,
        uint256 _duration,
        address tokenManager
    ) public initializer {
        __Ownable_init();
        __LPTokenWrapper_initialize();
        __TokenManagerHook_initialize(tokenManager);
        tokenDistro = _tokenDistribution;
        duration = _duration;
        periodFinish = 0;
        rewardRate = 0;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return MathUpgradeable.min(getTimestamp(), periodFinish);
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalSupply() == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored.add(
                lastTimeRewardApplicable()
                    .sub(lastUpdateTime)
                    .mul(rewardRate)
                    .mul(1e18)
                    .div(totalSupply())
            );
    }

    /**
     * Function to get the current timestamp from the block
     */
    function getTimestamp() public view virtual returns (uint256) {
        return block.timestamp;
    }

    /**
     * Function to get the amount of tokens is transferred in the claim tx
     * @notice The difference between what this returns and what the claimableStream function returns
     *  will be locked in TokenDistro to be streamed and released gradually
     */
    function earned(address account) external view returns (uint256) {
        uint256 _totalEarned = claimableStream(account);
        uint256 _tokenDistroReleasedTokens = tokenDistro.globallyClaimableAt(
            getTimestamp()
        );
        uint256 _tokenDistroTotalTokens = tokenDistro.totalTokens();

        return
            (_totalEarned * _tokenDistroReleasedTokens) /
            _tokenDistroTotalTokens;
    }

    // @dev This does the same thing the earned function of UnipoolTokenDistributor contract does.
    // Returns the exact amount will be allocated on TokenDistro
    function claimableStream(address account) public view returns (uint256) {
        return
            balanceOf(account)
                .mul(rewardPerToken().sub(userRewardPerTokenPaid[account]))
                .div(1e18)
                .add(rewards[account]);
    }

    function stake(address user, uint256 amount)
        internal
        override
        updateReward(user)
    {
        require(amount > 0, "Cannot stake 0");
        super.stake(user, amount);
        emit Staked(user, amount);
    }

    function withdraw(address user, uint256 amount)
        internal
        override
        updateReward(user)
    {
        require(amount > 0, "Cannot withdraw 0");
        super.withdraw(user, amount);
        if (_balances[user] == 0) {
            _getReward(user);
        }
        emit Withdrawn(user, amount);
    }

    function getReward() public updateReward(msg.sender) {
        _getReward(msg.sender);
    }

    function _getReward(address user) internal {
        uint256 reward = claimableStream(user);
        if (reward > 0) {
            rewards[user] = 0;
            //token.safeTransfer(msg.sender, reward);
            tokenDistro.allocate(user, reward, true);
            emit RewardPaid(user, reward);
        }
    }

    function notifyRewardAmount(uint256 reward)
        external
        onlyRewardDistribution
        updateReward(address(0))
    {
        uint256 _timestamp = getTimestamp();
        if (_timestamp >= periodFinish) {
            rewardRate = reward.div(duration);
        } else {
            uint256 remaining = periodFinish.sub(_timestamp);
            uint256 leftover = remaining.mul(rewardRate);
            rewardRate = reward.add(leftover).div(duration);
        }
        lastUpdateTime = _timestamp;
        periodFinish = _timestamp.add(duration);
        emit RewardAdded(reward);
    }

    function setRewardDistribution(address _rewardDistribution)
        external
        onlyOwner
    {
        rewardDistribution = _rewardDistribution;
    }

    /**
     * @dev Overrides TokenManagerHook's `_onTransfer`
     * @notice this function is a complete copy/paste from
     * https://github.com/1Hive/unipool/blob/master/contracts/Unipool.sol
     */
    function _onTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal override returns (bool) {
        if (_from == address(0)) {
            // Token mintings (wrapping tokens)
            stake(_to, _amount);
            return true;
        } else if (_to == address(0)) {
            // Token burning (unwrapping tokens)
            withdraw(_from, _amount);
            return true;
        } else {
            // Standard transfer
            withdraw(_from, _amount);
            stake(_to, _amount);
            return true;
        }
    }
}
