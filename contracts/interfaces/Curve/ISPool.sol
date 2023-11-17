// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISPool {
    function coins(uint256 arg0) external view returns (address);

    function add_liquidity(
        uint256[3] calldata amounts,
        uint256 min_mint_amount
    ) external;

    function remove_liquidity(
        uint256 amount,
        uint256[3] calldata mint_amounts
    ) external;
}
