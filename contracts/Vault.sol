// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Openzeppelin
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// Curve Interfaces
import "./interfaces/Curve/ISPool.sol";
// Convex Interfaces
import "./interfaces/Convex/IBaseRewardPool.sol";
import "./interfaces/Convex/IBooster.sol";
import "./interfaces/Convex/ICVX.sol";
// Uniswap Interfaces
import "./interfaces/Uniswap/ISwapRouter.sol";
// Test - Hardhat Console
import "hardhat/console.sol";

/**
 * @title Vault Contract
 * @dev A contract managing deposits, withdrawals, and rewards for a specific pool.
 */
contract Vault is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using SafeERC20 for ICVX;

    // Structs

    struct RewardIndex {
        uint256 cvxIndex;
        uint256 crvIndex;
    }

    struct Reward {
        uint256 cvxEarned;
        uint256 crvEarned;
    }

    struct UserInfo {
        uint256 amount;
        Reward reward;
        RewardIndex rewardIndex;
    }

    // State variables

    IERC20 public immutable CRV;
    ICVX public immutable CVX;
    IBooster public immutable BOOSTER;
    ISwapRouter public immutable SWAP_ROUTER;
    ISPool public immutable CURVE_SWAP;
    IBaseRewardPool public immutable BASE_REWARD_POOL;
    IERC20 public immutable LP;
    uint256 public immutable PID;

    uint256 public depositAmountTotal;
    RewardIndex public rewardIndex;
    mapping(address => UserInfo) public userInfo;
    mapping(address => bool) public underlyingAssets;

    uint256 private constant MULTIPLIER = 1e18;
    IERC20 private constant WETH =
        IERC20(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    // Events

    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Claim(address indexed user, uint256 crvReward, uint256 cvxReward);
    event UnderlyingAssetsAdded(address indexed token);
    event UnderlyingAssetsRemoved(address indexed token);

    // Constructor

    /**
     * @dev Constructor to initialize the Vault with required parameters.
     */
    constructor(
        address _crv,
        address _cvx,
        address _booster,
        address _swapRouter,
        address _curveSwap,
        uint256 _pid
    ) {
        CRV = IERC20(_crv);
        CVX = ICVX(_cvx);
        BOOSTER = IBooster(_booster);
        SWAP_ROUTER = ISwapRouter(_swapRouter);
        CURVE_SWAP = ISPool(_curveSwap);
        BASE_REWARD_POOL = IBaseRewardPool(BOOSTER.poolInfo(_pid).crvRewards);
        LP = IERC20(BOOSTER.poolInfo(_pid).lptoken);
        PID = _pid;
    }

    // Modifiers

    modifier _updateRewards(address _user) {
        _getReward();

        UserInfo storage info = userInfo[_user];

        uint cvxReward = (info.amount *
            (rewardIndex.cvxIndex - info.rewardIndex.cvxIndex)) / MULTIPLIER;
        uint crvReward = (info.amount *
            (rewardIndex.crvIndex - info.rewardIndex.crvIndex)) / MULTIPLIER;

        info.reward.crvEarned += crvReward;
        info.reward.cvxEarned += cvxReward;

        info.rewardIndex = rewardIndex;

        _;
    }

    // External functions

    function addUnderlyingAsset(address _token) external onlyOwner {
        require(!underlyingAssets[_token], "Vault: Already added");

        underlyingAssets[_token] = true;

        emit UnderlyingAssetsAdded(_token);
    }

    function removeUnderlyingAsset(address _token) external onlyOwner {
        require(underlyingAssets[_token], "Vault: Already removed");

        delete underlyingAssets[_token];

        emit UnderlyingAssetsRemoved(_token);
    }

    function deposit(
        address _token,
        uint256 _amount
    ) external payable nonReentrant _updateRewards(msg.sender) {
        require(underlyingAssets[_token], "Vault: Invalid underlying asset");
        require(_amount != 0, "Vault: Invalid deposit amount");

        if (_token != address(0)) {
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        } else {
            require(_amount == msg.value, "Vault: Invalid deposit amount");
        }

        uint256 lpBalanceBeforeDeposit = LP.balanceOf(address(this));

        uint256[3] memory amounts;
        if (CURVE_SWAP.coins(0) == _token) {
            amounts = [_amount, 0, 0];
            IERC20(_token).safeApprove(address(CURVE_SWAP), _amount);
        } else if (CURVE_SWAP.coins(1) == _token) {
            amounts = [0, _amount, 0];
            IERC20(_token).safeApprove(address(CURVE_SWAP), _amount);
        } else if (CURVE_SWAP.coins(2) == _token) {
            amounts = [0, 0, _amount];
            IERC20(_token).safeApprove(address(CURVE_SWAP), _amount);
        } else {
            address tokenOut = CURVE_SWAP.coins(0);
            uint256 amountIn = _token == address(0) ? msg.value : _amount;
            uint256 token0Amount = _swapExactInputSingleHop(
                _token,
                tokenOut,
                3000,
                amountIn
            );
            require(token0Amount != 0, "Vault: Swap failed");

            amounts = [token0Amount, 0, 0];
            IERC20(tokenOut).safeApprove(address(CURVE_SWAP), token0Amount);
        }

        CURVE_SWAP.add_liquidity(amounts, 0);

        uint256 lpBalanceAfterDeposit = LP.balanceOf(address(this));

        uint256 lpBalance = lpBalanceAfterDeposit - lpBalanceBeforeDeposit;
        require(lpBalance != 0, "Vault: Curve deposit failed");

        UserInfo storage info = userInfo[msg.sender];

        // Increase deposit amount
        info.amount += lpBalance;

        depositAmountTotal = depositAmountTotal + lpBalance;

        LP.safeApprove(address(BOOSTER), lpBalance);

        BOOSTER.deposit(PID, lpBalance, true);

        emit Deposit(
            msg.sender,
            _token,
            _token == address(0) ? msg.value : _amount
        );
    }

    function withdraw(
        uint256 _amount,
        bool _swapRewards,
        address _swapToken
    ) external {
        require(_amount != 0, "Vault: Invalid withdraw amount");

        UserInfo storage info = userInfo[msg.sender];

        require(_amount <= info.amount, "Vault: Invalid withdraw amount");

        BASE_REWARD_POOL.withdraw(_amount, true);
        BOOSTER.withdraw(PID, _amount);

        claim(_swapRewards, _swapToken);

        uint256[3] memory tokenBalancesBefore;
        uint256[3] memory tokenBalancesAfter;
        for (uint256 i; i != 3; ++i) {
            address token = CURVE_SWAP.coins(i);
            tokenBalancesBefore[i] = IERC20(token).balanceOf(address(this));
        }

        CURVE_SWAP.remove_liquidity(_amount, [uint256(0), 0, 0]);

        for (uint256 i; i != 3; ++i) {
            address token = CURVE_SWAP.coins(i);
            tokenBalancesAfter[i] = IERC20(token).balanceOf(address(this));
            uint256 amount = tokenBalancesAfter[i] - tokenBalancesBefore[i];
            if (amount != 0) {
                IERC20(token).safeTransfer(msg.sender, amount);
            }
        }

        // Decrease withdraw amount
        info.amount -= _amount;

        depositAmountTotal = depositAmountTotal - _amount;

        emit Withdraw(msg.sender, _amount);
    }

    // External View Functions

    function getVaultReward(
        address _user
    ) external view returns (uint256 crvReward, uint256 cvxReward) {
        UserInfo memory info = userInfo[_user];

        uint256 pendingCrvReward = BASE_REWARD_POOL.earned(address(this));
        uint256 pendingCvxReward = _getCvxReward(pendingCrvReward);

        if (depositAmountTotal != 0) {
            uint256 newCvxIndex = rewardIndex.cvxIndex +
                (pendingCvxReward * MULTIPLIER) /
                depositAmountTotal;
            uint256 newCrvIndex = rewardIndex.crvIndex +
                (pendingCrvReward * MULTIPLIER) /
                depositAmountTotal;

            cvxReward =
                (info.amount * (newCvxIndex - info.rewardIndex.cvxIndex)) /
                MULTIPLIER;
            crvReward =
                (info.amount * (newCrvIndex - info.rewardIndex.crvIndex)) /
                MULTIPLIER;

            Reward memory rewardEarned = userInfo[_user].reward;

            crvReward = crvReward + rewardEarned.crvEarned;
            cvxReward = cvxReward + rewardEarned.cvxEarned;
        }
    }

    // Public functions

    function claim(
        bool _swapRewards,
        address _swapToken
    ) public nonReentrant _updateRewards(msg.sender) {
        UserInfo storage info = userInfo[msg.sender];

        uint256 crvReward = info.reward.crvEarned;
        uint256 cvxReward = info.reward.cvxEarned;

        if (crvReward != 0) {
            if (_swapRewards) {
                uint256 swapTokenAmount = _swapExactInputMultiHop(
                    address(CRV),
                    _swapToken,
                    3000,
                    crvReward
                );
                require(swapTokenAmount != 0, "Vault: Swap failed");
                IERC20(_swapToken).safeTransfer(msg.sender, swapTokenAmount);
            } else {
                CRV.safeTransfer(msg.sender, crvReward);
            }

            info.reward.crvEarned = 0;
        }

        if (cvxReward != 0) {
            if (_swapRewards) {
                uint256 swapTokenAmount = _swapExactInputMultiHop(
                    address(CVX),
                    _swapToken,
                    3000,
                    cvxReward
                );
                require(swapTokenAmount != 0, "Vault: Swap failed");
                IERC20(_swapToken).safeTransfer(msg.sender, swapTokenAmount);
            } else {
                CVX.safeTransfer(msg.sender, cvxReward);
            }

            info.reward.cvxEarned = 0;
        }

        emit Claim(msg.sender, crvReward, cvxReward);
    }

    // Private functions

    /**
     * @dev Internal function to get rewards and update share values.
     */
    function _getReward() private {
        uint256 crvBalance = CRV.balanceOf(address(this));
        uint256 cvxBalance = CVX.balanceOf(address(this));

        BASE_REWARD_POOL.getReward();

        uint256 updatedCrvBalance = CRV.balanceOf(address(this));
        uint256 updatedCvxBalance = CVX.balanceOf(address(this));

        if (updatedCrvBalance > crvBalance && depositAmountTotal != 0) {
            rewardIndex.crvIndex +=
                ((updatedCrvBalance - crvBalance) * MULTIPLIER) /
                depositAmountTotal;
        }

        if (updatedCvxBalance > cvxBalance && depositAmountTotal != 0) {
            rewardIndex.cvxIndex +=
                ((updatedCvxBalance - cvxBalance) * MULTIPLIER) /
                depositAmountTotal;
        }
    }

    function _getCvxReward(
        uint256 _crvAmount
    ) private view returns (uint256 cvxReward) {
        uint256 supply = CVX.totalSupply();
        uint256 reductionPerCliff = CVX.reductionPerCliff();
        uint256 totalCliffs = CVX.totalCliffs();
        //use current supply to gauge cliff
        //this will cause a bit of overflow into the next cliff range
        //but should be within reasonable levels.
        //requires a max supply check though
        uint256 cliff = supply / reductionPerCliff;
        uint256 maxSupply = CVX.maxSupply();
        //mint if below total cliffs
        if (cliff < totalCliffs) {
            //for reduction% take inverse of current cliff
            uint256 reduction = totalCliffs - cliff;
            //reduce
            cvxReward = (_crvAmount * reduction) / totalCliffs;

            //supply cap check
            uint256 amtTillMax = maxSupply - supply;
            if (cvxReward > amtTillMax) {
                cvxReward = amtTillMax;
            }
        }
    }

    function _swapExactInputSingleHop(
        address tokenIn,
        address tokenOut,
        uint24 poolFee,
        uint amountIn
    ) internal returns (uint256 amountOut) {
        if (tokenIn != address(0)) {
            IERC20(tokenIn).safeApprove(address(SWAP_ROUTER), 0);
            IERC20(tokenIn).safeApprove(address(SWAP_ROUTER), amountIn);
        }

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenIn == address(0) ? address(WETH) : tokenIn,
                tokenOut: tokenOut == address(0) ? address(WETH) : tokenOut,
                fee: uint24(poolFee),
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        amountOut = SWAP_ROUTER.exactInputSingle{
            value: tokenIn == address(0) ? amountIn : 0
        }(params);
    }

    function _swapExactInputMultiHop(
        address tokenIn,
        address tokenOut,
        uint24 poolFee,
        uint amountIn
    ) internal returns (uint256 amountOut) {
        if (tokenIn != address(0)) {
            IERC20(tokenIn).safeApprove(address(SWAP_ROUTER), 0);
            IERC20(tokenIn).safeApprove(address(SWAP_ROUTER), amountIn);
        }

        if (
            tokenIn == address(0) ||
            tokenIn == address(WETH) ||
            tokenOut == address(0) ||
            tokenOut == address(WETH)
        ) {
            amountOut = _swapExactInputSingleHop(
                tokenIn,
                tokenOut,
                poolFee,
                amountIn
            );
        } else {
            bytes memory path = abi.encodePacked(
                tokenIn,
                uint24(poolFee),
                WETH,
                uint24(poolFee),
                tokenOut
            );

            ISwapRouter.ExactInputParams memory params = ISwapRouter
                .ExactInputParams({
                    path: path,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: amountIn,
                    amountOutMinimum: 0
                });

            amountOut = SWAP_ROUTER.exactInput(params);
        }
    }
}
