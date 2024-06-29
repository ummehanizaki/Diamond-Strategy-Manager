// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IDiamondCut} from "../interfaces/IDiamondCut.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";
import "../interfaces/IStrategy.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StrategyManager is ReentrancyGuard {
    mapping(string => address) public strategies;

    event StrategyAdded(string indexed strategyName, address indexed strategy);
    event StrategyRemoved(string indexed strategyName);
    event Deposit(
        string indexed strategyName,
        address indexed user,
        uint256 amount,
        uint256 shares
    );
    event Withdraw(
        string indexed strategyName,
        address indexed user,
        uint256 amount
    );

    modifier onlyOwner() {
        require(
            msg.sender == LibDiamond.contractOwner(),
            "Caller is not the owner"
        );
        _;
    }

    modifier validStrategy(string memory _strategyName) {
        require(
            strategies[_strategyName] != address(0),
            "Strategy does not exist"
        );
        _;
    }

    function addStrategy(
        string memory _strategyName,
        address _strategyAddress
    ) external onlyOwner {
        require(
            strategies[_strategyName] == address(0),
            "Strategy already exists"
        );
        strategies[_strategyName] = _strategyAddress;
        emit StrategyAdded(_strategyName, _strategyAddress);
    }

    function removeStrategy(
        string memory _strategyName
    ) external onlyOwner validStrategy(_strategyName) {
        strategies[_strategyName] = address(0);
        emit StrategyRemoved(_strategyName);
    }

    function deposit(
        string memory _strategyName,
        uint256 amount
    )
        external
        nonReentrant
        validStrategy(_strategyName)
        returns (uint256 shares)
    {
        require(amount > 0, "Deposit amount must be greater than zero");

        address strategy = strategies[_strategyName];
        IStrategy strategyContract = IStrategy(strategy);
        IERC20(strategyContract.weth()).transferFrom(
            msg.sender,
            strategy,
            amount
        );
        shares = strategyContract.deposit(amount, msg.sender);
        emit Deposit(_strategyName, msg.sender, amount, shares);
    }

    function withdraw(
        string memory _strategyName,
        uint256 amount
    ) external nonReentrant validStrategy(_strategyName) {
        require(amount > 0, "Withdraw amount must be greater than zero");

        address strategy = strategies[_strategyName];
        IStrategy(strategy).withdraw(msg.sender, amount);
        emit Withdraw(_strategyName, msg.sender, amount);
    }

    function balance(
        string memory _strategyName,
        address user
    ) external view validStrategy(_strategyName) returns (uint256) {
        address strategy = strategies[_strategyName];
        return IStrategy(strategy).balanceOf(user);
    }
}
