// StrategyAave.sol
// Contract implementing the strategy for ETH Aave

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IStrategy.sol";
import "../interfaces/ICompoundPool.sol";
import "../interfaces/IERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract StrategyCompound is IStrategy, AccessControl {
    event Deposited(uint256 amount);
    event Withdraw(uint256 amount);

    ICompoundPool pool;
    address public vaultToken;
    address public aWETH;
    address public weth;

    constructor(
        address _poolAddress,
        address _vaultToken,
        address _aWETH,
        address _weth
    ) {
        pool = ICompoundPool(_poolAddress);
        vaultToken = _vaultToken;
        aWETH = _aWETH;
        weth = address(_weth);
    }

    function deposit(uint256 amount, address user) external {
        IERC20(weth).approve(address(pool), amount);
        pool.supply(weth, amount);
        ICompoundPool(aWETH).allow(address(vaultToken), true);
        uint256 balanceToken = IERC20(aWETH).balanceOf(address(this));
        IERC4626(vaultToken).deposit(balanceToken, user);
        emit Deposited(amount);
    }

    function withdraw(address user, uint256 amount) external {
        IERC4626(vaultToken).approve(address(this), amount);
        IERC4626(vaultToken).withdraw(amount - 100, address(this), user);
        ICompoundPool(aWETH).allow(address(pool), true);

        pool.withdrawTo(user, weth, amount - 1000);
        emit Withdraw(amount);
    }

    function balance(
        address user
    ) external view override returns (uint256 _balance) {
        _balance = IERC4626(vaultToken).maxWithdraw(user);
        return _balance;
    }

    fallback() external payable {}

    receive() external payable {}
}
