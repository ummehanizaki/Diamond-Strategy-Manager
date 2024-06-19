pragma solidity ^0.8.0;


interface ICompoundPool {

    function supply(
        address asset,
        uint256 amount
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external;

    function balanceOf(address owner) external view returns (uint256);
    function approve(address user, uint256 amount) external view returns (uint256);

}