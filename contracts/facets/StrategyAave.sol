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
    event Balance(uint256 amount, address u);

    IPool pool;
    IERC4626 vaultToken;
    IERC20 tokenX;

    constructor(
        address _poolAddress,
        address _vaultToken,
        address _tokenX
        ) {
            pool = IPool(_poolAddress);
            vaultToken = IERC4626(_vaultToken);
            tokenX = IERC20(_tokenX);
    }

    function deposit(address user) external payable {
        pool.depositETH{ value: msg.value }(address(pool), user, 0);
        // tokenX._mint(user, msg.value);
        // vaultToken.deposit(msg.value, user);
        emit Deposited(msg.value);
    }

    function withdraw(address user, uint256 amount) external {
        // Implement withdraw logic from Aave protocol using aaveDataProviderAddress and aaveDepositVaultAddress
        // Redeem shares from Aave deposit vault and transfer ETH to user
        pool.withdrawETH(address(pool), amount, user);
        emit Withdraw(amount);
    }

    function balance(address user) external view override returns (uint256 _balance) {
        _balance = vaultToken.balanceOf(user);
        return _balance;
    }
}
