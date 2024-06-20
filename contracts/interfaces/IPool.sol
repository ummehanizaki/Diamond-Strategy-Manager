pragma solidity ^0.8.0;

interface IPool {
    function depositETH(address asset, address onBehalfOf, uint16 referralCode) external payable;

    function withdrawETH(address asset, uint256 amount, address to) external;

    function balanceOf(address owner) external view returns (uint256);
}
