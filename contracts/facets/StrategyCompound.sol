// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/ICompoundPool.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract StrategyCompound is ERC4626, AccessControl {
    ICompoundPool pool;
    address public cWETH;
    address public weth;

    bytes32 public constant STRATEGY_MANAGER_ROLE =
        keccak256("STRATEGY_MANAGER_ROLE");

    constructor(
        address _poolAddress,
        address _cWETH,
        address _weth,
        address _strategyManager
    ) ERC4626(IERC20(_cWETH)) ERC20("Compound Strategy Token", "cSTK") {
        pool = ICompoundPool(_poolAddress);
        cWETH = _cWETH;
        weth = _weth;
        _grantRole(STRATEGY_MANAGER_ROLE, _strategyManager);
    }

    function deposit(
        uint256 amount,
        address user
    ) public override onlyRole(STRATEGY_MANAGER_ROLE) returns (uint256) {
        uint256 iniBal = IERC20(cWETH).balanceOf(address(this));
        require(amount > 0, "Deposit amount must be greater than zero");
        uint256 maxAssets = maxDeposit(user);
        if (amount > maxAssets) {
            revert ERC4626ExceededMaxDeposit(user, amount, maxAssets);
        }
        if (IERC20(weth).allowance(address(this), address(pool)) < amount) {
            IERC20(weth).approve(address(pool), type(uint256).max);
        }
        pool.supply(weth, amount);
        uint256 finBal = IERC20(cWETH).balanceOf(address(this));
        uint256 cWETHshares = finBal - iniBal;
        uint256 shares = previewDeposit(cWETHshares);
        if (shares == 0) {
            shares = amount;
        }
        _mint(user, shares);
        return shares;
    }

    function withdraw(
        address user,
        uint256 amount
    ) external onlyRole(STRATEGY_MANAGER_ROLE) {
        uint256 maxAssets = maxWithdraw(user);
        if (amount > maxAssets) {
            revert ERC4626ExceededMaxWithdraw(user, amount, maxAssets);
        }
        uint256 shares = previewWithdraw(amount);
        _burn(user, shares);
        pool.withdrawTo(user, weth, amount);
    }

    fallback() external payable {}

    receive() external payable {}
}
