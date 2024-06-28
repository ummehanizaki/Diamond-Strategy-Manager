// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IDiamondCut} from "../interfaces/IDiamondCut.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";
import "../interfaces/IStrategy.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StrategyManager is ReentrancyGuard {
    // Mapping to store the addresses of strategy contracts
    mapping(string => address) public strategies;

    // Event emitted when a strategy is added
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

    // Modifier to restrict access to only the owner (diamond contract)
    modifier onlyOwner() {
        require(
            msg.sender == LibDiamond.contractOwner(),
            "Caller is not the owner"
        );
        _;
    }

    // Function to add a new strategy contract
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

    function removeStrategy(string memory _strategyName) external onlyOwner {
        require(
            strategies[_strategyName] != address(0),
            "Strategy does not exist"
        );
        strategies[_strategyName] = address(0);
        emit StrategyRemoved(_strategyName);
    }

    // Function to deposit funds into a strategy
    function deposit(
        string memory _strategyName,
        uint256 amount
    ) external nonReentrant onlyOwner {
        address strategy = _getStrategyAddress(_strategyName);
        IStrategy strategyContract = IStrategy(strategy);
        IERC20(strategyContract.weth()).transferFrom(
            msg.sender,
            strategy,
            amount
        );
        uint256 shares = strategyContract.deposit(amount, msg.sender);
        emit Deposit(_strategyName, msg.sender, amount, shares);
    }

    // Function to withdraw funds from a strategy
    function withdraw(
        string memory _strategyName,
        uint256 amount
    ) external nonReentrant onlyOwner {
        address strategy = _getStrategyAddress(_strategyName);
        IStrategy(strategy).withdraw(msg.sender, amount);
        emit Withdraw(_strategyName, msg.sender, amount);
    }

    // Function to check the balance of a user in a strategy
    function balance(
        string memory _strategyName,
        address user
    ) external view returns (uint256 _balance) {
        address strategy = _getStrategyAddress(_strategyName);
        _balance = IStrategy(strategy).balanceOf(user);
    }

    function _getStrategyAddress(
        string memory _strategyName
    ) private view returns (address) {
        address strategyAddress = strategies[_strategyName];
        require(strategyAddress != address(0), "Strategy does not exist");
        return strategyAddress;
    }
}
