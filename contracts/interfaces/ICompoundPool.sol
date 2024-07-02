// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface ICompoundPool {
    function supply(address asset, uint256 amount) external;

    function withdrawTo(address user, address asset, uint256 amount) external;

    function balanceOf(address owner) external view returns (uint256);

    function approve(
        address user,
        uint256 amount
    ) external view returns (uint256);

    function allow(address user, bool amount) external;
}
