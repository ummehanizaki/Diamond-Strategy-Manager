// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interface for the strategy contracts

interface IStrategy {
    function deposit(address user) external payable;
    function withdraw(address user, uint256 amount) external;
    function balance(address user) external view returns (uint256);
}
