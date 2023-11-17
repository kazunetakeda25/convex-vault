// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBooster {
    struct PoolInfo {
        address lptoken;
        address token;
        address gauge;
        address crvRewards;
        address stash;
        bool shutdown;
    }

    function deposit(
        uint256 _pid,
        uint256 _amount,
        bool _stake
    ) external returns (bool);

    function withdraw(
        uint256 _pid,
        uint256 _amount
    ) external returns (bool);

    function poolInfo(uint256) external view returns (PoolInfo memory);
}
