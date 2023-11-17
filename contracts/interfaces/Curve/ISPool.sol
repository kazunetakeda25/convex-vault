// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISPool {
    function coins(int128 arg) external view returns (address);

    function add_liquidity(
        uint256[4] calldata amounts,
        uint256 min_mint_amount
    ) external;

    function remove_liquidity(
        uint256 amount,
        uint256[4] calldata mint_amounts
    ) external;
}
