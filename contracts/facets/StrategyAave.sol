// StrategyAave.sol
// Contract implementing the strategy for ETH Aave

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IStrategy.sol";
import "../interfaces/IAavePool.sol";
import "../interfaces/IERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract StrategyAave is IStrategy, AccessControl {
    event Deposited(uint256 amount);
    event Withdraw(uint256 amount);

    IAavePool pool;
    address public vaultToken;
    address public aWETH;
    address public weth;

    bytes32 public constant STRATEGY_MANAGER_ROLE =
        keccak256("STRATEGY_MANAGER_ROLE");

    constructor(
        address _poolAddress,
        address _vaultToken,
        address _aWETH,
        address _weth,
        address _strategyManager
    ) {
        pool = IAavePool(_poolAddress);
        vaultToken = _vaultToken;
        aWETH = _aWETH;
        weth = address(_weth);
        _grantRole(STRATEGY_MANAGER_ROLE, _strategyManager);
    }

    function deposit(
        uint256 amount,
        address user
    ) external onlyRole(STRATEGY_MANAGER_ROLE) {
        IERC20(weth).approve(address(pool), amount);
        pool.supply(weth, amount, address(this), 0);
        IERC20(aWETH).approve(address(vaultToken), amount);
        IERC4626(vaultToken).deposit(amount, user);
        emit Deposited(amount);
    }

    function withdraw(
        address user,
        uint256 amount
    ) external onlyRole(STRATEGY_MANAGER_ROLE) {
        IERC4626(vaultToken).withdraw(amount, address(this), user);
        IERC20(aWETH).approve(address(pool), amount);
        pool.withdraw(weth, amount, user);
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
