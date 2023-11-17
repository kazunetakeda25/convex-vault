// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Openzeppelin
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
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
    // Structs

    struct Reward {
        uint256 share;
        uint256 pending;
    }

    struct UserInfo {
        uint256 amount;
        Reward crv;
        Reward cvx;
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
    uint256 public crvAmountPerShare;
    uint256 public cvxAmountPerShare;
    mapping(address => UserInfo) public userInfo;
    mapping(address => bool) public underlyingAssets;

    uint256 private constant MULTIPLIER = 1e18;

    // Events

    event Deposit(address indexed user, uint256 amount);
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

    // External functions

    function addUnderlyingAsset(address _token) external onlyOwner {
        require(!underlyingAssets[_token], "Vault: Invalid underlying asset");

        underlyingAssets[_token] = true;

        emit UnderlyingAssetsAdded(_token);
    }

    function removeUnderlyingAsset(address _token) external onlyOwner {
        require(underlyingAssets[_token], "Vault: Invalid underlying asset");

        delete underlyingAssets[_token];

        emit UnderlyingAssetsRemoved(_token);
    }

    function _swapExactInputSingleHop(
        address tokenIn,
        address tokenOut,
        uint24 poolFee,
        uint amountIn
    ) private returns (uint amountOut) {
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).approve(address(SWAP_ROUTER), amountIn);

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: poolFee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        amountOut = SWAP_ROUTER.exactInputSingle(params);
    }

    function deposit(address _token, uint256 _amount) external nonReentrant {
        require(underlyingAssets[_token], "Vault: Invalid underlying asset");
        require(_amount > 0, "Vault: Invalid deposit amount");

        IERC20(_token).transferFrom(msg.sender, address(this), _amount);

        uint256 lpBalanceBeforeDeposit = LP.balanceOf(address(this));

        uint256[4] memory amounts;
        if (CURVE_SWAP.coins(0) == _token) {
            amounts = [_amount, 0, 0, 0];
            IERC20(_token).approve(address(CURVE_SWAP), _amount);
        } else if (CURVE_SWAP.coins(1) == _token) {
            amounts = [0, _amount, 0, 0];
            IERC20(_token).approve(address(CURVE_SWAP), _amount);
        } else if (CURVE_SWAP.coins(2) == _token) {
            amounts = [0, 0, _amount, 0];
            IERC20(_token).approve(address(CURVE_SWAP), _amount);
        } else if (CURVE_SWAP.coins(3) == _token) {
            amounts = [0, 0, 0, _amount];
            IERC20(_token).approve(address(CURVE_SWAP), _amount);
        } else {
            address tokenOut = CURVE_SWAP.coins(0);
            uint256 token0Amount = _swapExactInputSingleHop(
                _token,
                tokenOut,
                3000,
                _amount
            );
            require(token0Amount > 0, "Vault: Swap failed");

            amounts = [token0Amount, 0, 0, 0];
            IERC20(tokenOut).approve(address(CURVE_SWAP), token0Amount);
        }

        CURVE_SWAP.add_liquidity(amounts, 0);

        uint256 lpBalanceAfterDeposit = LP.balanceOf(address(this));

        uint256 lpBalance = lpBalanceAfterDeposit - lpBalanceBeforeDeposit;
        require(lpBalance > 0, "Vault: Curve deposit failed");

        _getReward();

        UserInfo storage info = userInfo[msg.sender];

        if (crvAmountPerShare > info.crv.share) {
            // Update share & pending reward
            info.crv.share = crvAmountPerShare;
            info.crv.pending +=
                (info.amount * (crvAmountPerShare - info.crv.share)) /
                MULTIPLIER;
        }

        if (cvxAmountPerShare > info.cvx.share) {
            // Update share & pending reward
            info.cvx.share = cvxAmountPerShare;
            info.cvx.pending +=
                (info.amount * (cvxAmountPerShare - info.cvx.share)) /
                MULTIPLIER;
        }
        // Increase deposit amount
        info.amount += _amount;

        depositAmountTotal = depositAmountTotal + _amount;

        LP.approve(address(BOOSTER), _amount);

        BOOSTER.deposit(PID, _amount, true);

        emit Deposit(msg.sender, _amount);
    }

    function withdraw(
        uint256 _amount,
        bool _swapRewards,
        address _swapToken
    ) external nonReentrant {
        require(_amount > 0, "Vault: Invalid deposit amount");

        UserInfo storage info = userInfo[msg.sender];

        require(_amount <= info.amount, "Vault: Invalid withdraw amount");

        uint256[4] memory tokenBalancesBefore;
        uint256[4] memory tokenBalancesAfter;
        for (uint256 i; i != 4; ++i) {
            address token = CURVE_SWAP.coins(_convertUint256ToInt128(i));
            tokenBalancesBefore[i] = IERC20(token).balanceOf(address(this));
        }

        CURVE_SWAP.remove_liquidity(_amount, [uint256(0), 0, 0, 0]);

        for (uint256 i; i != 4; ++i) {
            address token = CURVE_SWAP.coins(_convertUint256ToInt128(i));
            tokenBalancesAfter[i] = IERC20(token).balanceOf(address(this));
            uint256 amount = tokenBalancesAfter[i] - tokenBalancesBefore[i];
            if (amount > 0) {
                IERC20(token).transfer(msg.sender, amount);
            }
        }

        _withdrawAndUnwrap(_amount);

        (uint256 crvPending, uint256 cvxPending) = getVaultRewards(info);

        if (_amount == info.amount) {
            delete userInfo[msg.sender];
        } else {
            // Update share & pending reward
            info.crv.share = crvAmountPerShare;
            info.crv.pending = 0;
            // Update share & pending reward
            info.cvx.share = cvxAmountPerShare;
            info.cvx.pending = 0;
            // Decrease withdraw amount
            info.amount -= _amount;
        }

        depositAmountTotal = depositAmountTotal - _amount;

        if (crvPending > 0) {
            if (_swapRewards) {
                uint256 swapTokenAmount = _swapExactInputSingleHop(
                    address(CRV),
                    _swapToken,
                    3000,
                    crvPending
                );
                require(swapTokenAmount > 0, "Vault: Swap failed");
                IERC20(_swapToken).transfer(msg.sender, swapTokenAmount);
            } else {
                CRV.transfer(msg.sender, crvPending);
            }
        }

        if (cvxPending > 0) {
            if (_swapRewards) {
                uint256 swapTokenAmount = _swapExactInputSingleHop(
                    address(CVX),
                    _swapToken,
                    3000,
                    cvxPending
                );
                require(swapTokenAmount > 0, "Vault: Swap failed");
                IERC20(_swapToken).transfer(msg.sender, swapTokenAmount);
            } else {
                CVX.transfer(msg.sender, cvxPending);
            }
        }

        emit Withdraw(msg.sender, _amount);
    }

    /**
     * @notice Allows users to claim pending rewards.
     */
    function claim(
        bool _swapRewards,
        address _swapToken
    ) external nonReentrant {
        _getReward();

        UserInfo storage info = userInfo[msg.sender];

        (uint256 crvPending, uint256 cvxPending) = getVaultRewards(info);
        // Update share & pending reward
        info.crv.share = crvAmountPerShare;
        info.crv.pending = 0;
        // Update share & pending reward
        info.cvx.share = cvxAmountPerShare;
        info.cvx.pending = 0;

        if (crvPending > 0) {
            if (_swapRewards) {
                uint256 swapTokenAmount = _swapExactInputSingleHop(
                    address(CRV),
                    _swapToken,
                    3000,
                    crvPending
                );
                require(swapTokenAmount > 0, "Vault: Swap failed");
                IERC20(_swapToken).transfer(msg.sender, swapTokenAmount);
            } else {
                CRV.transfer(msg.sender, crvPending);
            }
        }

        if (cvxPending > 0) {
            if (_swapRewards) {
                uint256 swapTokenAmount = _swapExactInputSingleHop(
                    address(CVX),
                    _swapToken,
                    3000,
                    cvxPending
                );
                require(swapTokenAmount > 0, "Vault: Swap failed");
                IERC20(_swapToken).transfer(msg.sender, swapTokenAmount);
            } else {
                CVX.transfer(msg.sender, cvxPending);
            }
        }

        emit Claim(msg.sender, crvPending, cvxPending);
    }

    // External View Functions

    function getPendingRewards(
        address _user
    ) external view returns (uint256 crvPending, uint256 cvxPending) {
        if (depositAmountTotal == 0) {
            crvPending = 0;
            cvxPending = 0;
        } else {
            UserInfo memory info = userInfo[_user];

            uint256 crvEarned = BASE_REWARD_POOL.earned(address(this));

            uint256 amountPerShare;
            if (crvEarned == 0) {
                amountPerShare = crvAmountPerShare;
            } else {
                amountPerShare =
                    crvAmountPerShare +
                    ((crvEarned * MULTIPLIER) / depositAmountTotal);
            }

            crvPending =
                info.crv.pending +
                (info.amount * (amountPerShare - info.crv.share)) /
                MULTIPLIER;

            uint256 cvxEarned = crvEarned;
            uint256 supply = CVX.totalSupply();
            uint256 reductionPerCliff = CVX.reductionPerCliff();
            uint256 totalCliffs = CVX.totalCliffs();
            uint256 maxSupply = 100 * 1000000 * 1e18; //100mil
            //use current supply to gauge cliff
            //this will cause a bit of overflow into the next cliff range
            //but should be within reasonable levels.
            //requires a max supply check though
            uint256 cliff = supply / reductionPerCliff;
            //mint if below total cliffs
            if (cliff < totalCliffs) {
                //for reduction% take inverse of current cliff
                uint256 reduction = totalCliffs - cliff;
                //reduce
                cvxEarned = (cvxEarned * reduction) / totalCliffs;

                //supply cap check
                uint256 amtTillMax = maxSupply - supply;
                if (cvxEarned > amtTillMax) {
                    cvxEarned = amtTillMax;
                }
            }

            uint256 updatedCvxShare;
            if (cvxEarned == 0) {
                updatedCvxShare = cvxAmountPerShare;
            } else {
                updatedCvxShare =
                    cvxAmountPerShare +
                    ((cvxEarned * MULTIPLIER) / depositAmountTotal);
            }

            cvxPending =
                info.cvx.pending +
                (info.amount * (updatedCvxShare - info.cvx.share)) /
                MULTIPLIER;
        }
    }

    // Public functions

    /**
     * @notice Get pending rewards for a user.
     * @param info User's information
     * @return crvPending CRV pending rewards
     * @return cvxPending CVX pending rewards
     */
    function getVaultRewards(
        UserInfo memory info
    ) public view returns (uint256 crvPending, uint256 cvxPending) {
        crvPending = info.crv.pending;
        if (crvAmountPerShare > info.crv.share) {
            crvPending =
                crvPending +
                (info.amount * (crvAmountPerShare - info.crv.share)) /
                MULTIPLIER;
        }

        cvxPending = info.cvx.pending;
        if (cvxAmountPerShare > info.cvx.share) {
            cvxPending =
                cvxPending +
                (info.amount * (cvxAmountPerShare - info.cvx.share)) /
                MULTIPLIER;
        }
    }

    // Private functions

    function _convertUint256ToInt128(
        uint256 value
    ) private pure returns (int128) {
        // Ensure the sign bit is correctly interpreted
        int128 result = int128(int256(value));

        // Use bitwise operations to set the sign bit
        if (value & (1 << 255) != 0) {
            result |= int128(1) << 127;
        }

        return result;
    }

    /**
     * @dev Internal function to get rewards and update share values.
     */
    function _getReward() private {
        // Divide by zero check
        if (depositAmountTotal == 0) {
            return;
        }

        uint256 crvBalance = CRV.balanceOf(address(this));
        uint256 cvxBalance = CVX.balanceOf(address(this));

        BASE_REWARD_POOL.getReward();

        crvBalance = CRV.balanceOf(address(this)) - crvBalance;
        if (crvBalance > 0) {
            crvAmountPerShare =
                crvAmountPerShare +
                (crvBalance * MULTIPLIER) /
                depositAmountTotal;
        }

        cvxBalance = CVX.balanceOf(address(this)) - cvxBalance;
        if (cvxBalance > 0) {
            cvxAmountPerShare =
                cvxAmountPerShare +
                (cvxBalance * MULTIPLIER) /
                depositAmountTotal;
        }
    }

    /**
     * @dev Internal function to withdraw and update share values.
     * @param _amount The amount to withdraw
     */
    function _withdrawAndUnwrap(uint256 _amount) private {
        // Divide by zero check
        if (depositAmountTotal == 0) {
            return;
        }

        uint256 crvBalance = CRV.balanceOf(address(this));
        uint256 cvxBalance = CVX.balanceOf(address(this));

        BASE_REWARD_POOL.withdrawAndUnwrap(_amount, true);

        crvBalance = CRV.balanceOf(address(this)) - crvBalance;
        if (crvBalance > 0) {
            crvAmountPerShare =
                crvAmountPerShare +
                (crvBalance * MULTIPLIER) /
                depositAmountTotal;
        }

        cvxBalance = CVX.balanceOf(address(this)) - cvxBalance;
        if (cvxBalance > 0) {
            cvxAmountPerShare =
                cvxAmountPerShare +
                (cvxBalance * MULTIPLIER) /
                depositAmountTotal;
        }
    }
}
