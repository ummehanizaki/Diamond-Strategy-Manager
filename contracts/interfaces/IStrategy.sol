// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interface for the strategy contracts

interface IStrategy {
    function deposit(uint256 amount, address user) external;
    function withdraw(address user, uint256 amount) external;
    function balance(address user) external view returns (uint256);
    function vaultToken() external view returns (address);
    function asset() external view returns (address);

}
