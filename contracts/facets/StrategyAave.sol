// StrategyAave.sol
// Contract implementing the strategy for ETH Aave

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IStrategy.sol";
import "../interfaces/IPool.sol";
import "../interfaces/IERC4626.sol";
import "../TokenX.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";


contract StrategyAave is IStrategy, AccessControl {
    
    event Deposited(uint256 amount);
    event Withdraw(uint256 amount);

    IPool pool;
    address public vaultToken;
    IERC20 tokenX;

    constructor(
        address _poolAddress,
        address _vaultToken,
        address _tokenX
        ) {
            pool = IPool(_poolAddress);
            vaultToken = _vaultToken;
            tokenX = IERC20(_tokenX);
    }

    function deposit(address user) external payable {
        pool.depositETH{ value: msg.value }(address(pool), address(this), 0);
        tokenX.approve(address(vaultToken) , msg.value);
        IERC4626(vaultToken).deposit(msg.value, user);
        emit Deposited(msg.value);
    }

    function withdraw(address user, uint256 amount) external {
        IERC4626(vaultToken).withdraw(amount, address(this), user);
        tokenX.approve(address(pool), amount);
        pool.withdrawETH(address(pool), amount, user);
        emit Withdraw(amount);
    }

    function balance(address user) external view override returns (uint256 _balance) {
        _balance = IERC4626(vaultToken).maxWithdraw(user);
        return _balance;
    }

    fallback() external payable {}
    receive() external payable {}
}
