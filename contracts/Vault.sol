// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Openzeppelin
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// Convex Interfaces
import "./interfaces/IBaseRewardPool.sol";
import "./interfaces/IBooster.sol";
import "./interfaces/ICVX.sol";
// Test - Hardhat Console
import "hardhat/console.sol";

/**
 * @title Vault Contract
 * @dev A contract managing deposits, withdrawals, and rewards for a specific pool.
 */
contract Vault is ReentrancyGuard {
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
    IBaseRewardPool public immutable BASE_REWARD_POOL;
    IERC20 public LP;
    uint256 public immutable PID;

    uint256 public depositAmountTotal;
    uint256 public crvAmountPerShare;
    uint256 public cvxAmountPerShare;
    mapping(address => UserInfo) public userInfo;

    uint256 private constant MULTIPLIER = 1e18;

    // Events

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Claim(address indexed user, uint256 crvReward, uint256 cvxReward);

    // Constructor

    /**
     * @dev Constructor to initialize the Vault with required parameters.
     * @param _crv Address of the CRV token
     * @param _cvx Address of the CVX token
     * @param _booster Address of the Booster contract
     * @param _lp Address of the LP token
     * @param _pid Pool ID
     */
    constructor(
        address _crv,
        address _cvx,
        address _booster,
        address _lp,
        uint256 _pid
    ) {
        CRV = IERC20(_crv);
        CVX = ICVX(_cvx);
        BOOSTER = IBooster(_booster);
        LP = IERC20(_lp);
        PID = _pid;
        BASE_REWARD_POOL = IBaseRewardPool(BOOSTER.poolInfo(_pid).crvRewards);
    }

    // External functions

    /**
     * @notice Allows users to deposit LP tokens into the vault.
     * @param _amount The amount of LP tokens to deposit
     */
    function deposit(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Vault: Invalid deposit amount");

        _getReward();

        UserInfo storage info = userInfo[msg.sender];
        // Increase deposit amount
        info.amount += _amount;

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

        depositAmountTotal = depositAmountTotal + _amount;

        LP.transferFrom(msg.sender, address(this), _amount);

        LP.approve(address(BOOSTER), _amount);

        BOOSTER.deposit(PID, _amount, true);

        emit Deposit(msg.sender, _amount);
    }

    /**
     * @notice Allows users to withdraw deposited LP tokens from the vault.
     * @param _amount The amount of LP tokens to withdraw
     */
    function withdraw(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Vault: Invalid withdraw amount");

        UserInfo storage info = userInfo[msg.sender];

        require(_amount <= info.amount, "Vault: Invalid withdraw amount");

        _withdrawAndUnwrap(_amount);

        (uint256 crvPending, uint256 cvxPending) = getVaultRewards(info);

        if (_amount == info.amount) {
            delete userInfo[msg.sender];
        } else {
            // Decrease withdraw amount
            info.amount -= _amount;
            // Update share & pending reward
            info.crv.share = crvAmountPerShare;
            info.crv.pending = 0;
            // Update share & pending reward
            info.cvx.share = cvxAmountPerShare;
            info.cvx.pending = 0;
        }

        depositAmountTotal = depositAmountTotal - _amount;

        if (crvPending > 0) {
            CRV.transfer(msg.sender, crvPending);
        }

        if (cvxPending > 0) {
            CVX.transfer(msg.sender, cvxPending);
        }

        LP.transfer(msg.sender, _amount);

        emit Withdraw(msg.sender, _amount);
    }

    /**
     * @notice Allows users to claim pending rewards.
     */
    function claim() external nonReentrant {
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
            CRV.transfer(msg.sender, crvPending);
        }

        if (cvxPending > 0) {
            CVX.transfer(msg.sender, cvxPending);
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
                cvxEarned = cvxEarned * reduction / totalCliffs;

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
     * @notice Get user information.
     * @param user Address of the user to retrieve information for
     * @return UserInfo User's information
     */
    function getUserInfo(address user) public view returns (UserInfo memory) {
        return userInfo[user];
    }

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
